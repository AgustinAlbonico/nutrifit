import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { GetTurnosDelDiaQueryDto } from 'src/application/turnos/dtos/get-turnos-del-dia-query.dto';
import {
  SocioTurnoDelDiaResponseDto,
  TurnoDelDiaResponseDto,
} from 'src/application/turnos/dtos/turno-del-dia-response.dto';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  getArgentinaTodayDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class GetTurnosDelDiaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(ObservacionClinicaOrmEntity)
    private readonly observacionRepository: Repository<ObservacionClinicaOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
    query: GetTurnosDelDiaQueryDto,
  ): Promise<TurnoDelDiaResponseDto[]> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    this.validateTimeRange(query.horaDesde, query.horaHasta);

    const today = getArgentinaTodayDate();

    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .innerJoinAndSelect('turno.socio', 'socio')
      .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
      .andWhere('nutricionista.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      })
      .andWhere('nutricionista.idPersona = :nutricionistaId', {
        nutricionistaId,
      })
      .andWhere('turno.fechaTurno = :today', { today })
      .orderBy('turno.horaTurno', 'ASC');

    this.applyFilters(queryBuilder, query);

    const turnos = await queryBuilder.getMany();

    // RB15 (fichaActualizada): una sola query agregada para todos los socios
    // del dia, evitando N+1. Usamos MAX(t.fechaTurno) como proxy de
    // "ultima consulta" (la entidad observacion_clinica no tiene created_at
    // propio en este momento; ver TODO en apply-progress para PR #2).
    const maxConsultasBySocio =
      turnos.length > 0
        ? await this.fetchMaxConsultaBySocio(
            nutricionistaId,
            turnos
              .map((t) => t.socio?.idPersona)
              .filter((id): id is number => typeof id === 'number'),
          )
        : new Map<number, Date>();

    this.logger.log(
      `Turnos del dia consultados para profesional ${nutricionistaId}: ${turnos.length} resultados.`,
    );

    return turnos.map((turno) => {
      const socio = new SocioTurnoDelDiaResponseDto();
      socio.idPersona = turno.socio.idPersona ?? 0;
      socio.nombreCompleto =
        `${turno.socio.nombre} ${turno.socio.apellido}`.trim();
      socio.dni = turno.socio.dni ?? '';
      socio.objetivo = turno.socio.fichaSalud?.objetivoPersonal ?? null;

      const fichaActualizada = this.computeFichaActualizada(
        turno.socio.fichaSalud?.actualizadaAt ?? null,
        maxConsultasBySocio.get(turno.socio.idPersona ?? -1) ?? null,
      );

      const response = new TurnoDelDiaResponseDto();
      response.idTurno = turno.idTurno;
      response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
      response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
      response.estadoTurno = turno.estadoTurno;
      response.tipoConsulta = 'Consulta nutricional';
      response.socio = socio;
      response.fichaActualizada = fichaActualizada;
      response.consultaId = turno.observacionClinica?.idObservacion ?? null;

      return response;
    });
  }

  private async fetchMaxConsultaBySocio(
    nutricionistaId: number,
    socioIds: number[],
  ): Promise<Map<number, Date>> {
    const raw = await this.observacionRepository
      .createQueryBuilder('oc')
      .innerJoin('oc.turno', 't')
      .innerJoin('t.nutricionista', 'nutri')
      .innerJoin('t.socio', 'socio')
      .select('socio.idPersona', 'socioId')
      .addSelect('MAX(t.fechaTurno)', 'maxFechaTurno')
      .where('nutri.idPersona = :nutricionistaId', { nutricionistaId })
      .andWhere('socio.idPersona IN (:...socioIds)', { socioIds })
      .groupBy('socio.idPersona')
      .getRawMany<{ socioId: number; maxFechaTurno: Date | string }>();

    const map = new Map<number, Date>();
    for (const row of raw) {
      map.set(Number(row.socioId), new Date(row.maxFechaTurno));
    }
    return map;
  }

  private computeFichaActualizada(
    fichaActualizadaAt: Date | null,
    maxConsultaAt: Date | null,
  ): boolean {
    if (fichaActualizadaAt == null) {
      return false;
    }
    if (maxConsultaAt == null) {
      return true;
    }
    return fichaActualizadaAt.getTime() > maxConsultaAt.getTime();
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<TurnoOrmEntity>,
    query: GetTurnosDelDiaQueryDto,
  ): void {
    if (query.socio?.trim()) {
      const searchTerm = query.socio.trim();
      queryBuilder.andWhere(
        '(LOWER(socio.nombre) LIKE :socioTerm OR LOWER(socio.apellido) LIKE :socioTerm OR socio.dni LIKE :dniTerm)',
        {
          socioTerm: `%${searchTerm.toLowerCase()}%`,
          dniTerm: `%${searchTerm}%`,
        },
      );
    }

    if (query.objetivo?.trim()) {
      queryBuilder.andWhere(
        'LOWER(fichaSalud.objetivoPersonal) LIKE :objetivo',
        {
          objetivo: `%${query.objetivo.trim().toLowerCase()}%`,
        },
      );
    }

    if (query.horaDesde) {
      queryBuilder.andWhere('turno.horaTurno >= :horaDesde', {
        horaDesde: query.horaDesde,
      });
    }

    if (query.horaHasta) {
      queryBuilder.andWhere('turno.horaTurno <= :horaHasta', {
        horaHasta: query.horaHasta,
      });
    }
  }

  private validateTimeRange(horaDesde?: string, horaHasta?: string): void {
    if (!horaDesde || !horaHasta) {
      return;
    }

    if (this.timeToMinutes(horaDesde) > this.timeToMinutes(horaHasta)) {
      throw new BadRequestError(
        'El rango horario es invalido: horaDesde no puede ser mayor a horaHasta.',
      );
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }
}
