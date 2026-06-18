import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { HistorialTurnoPacienteResponseDto } from 'src/application/turnos/dtos/historial-turno-paciente-response.dto';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import {
  FotoProgresoOrmEntity,
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class GetHistorialTurnosPacienteUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(FotoProgresoOrmEntity)
    private readonly fotoProgresoOrmRepository: Repository<FotoProgresoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    socioId: number,
  ): Promise<HistorialTurnoPacienteResponseDto[]> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const hasVinculo = await this.hasTurnoVinculo(nutricionistaId, socioId);

    if (!hasVinculo) {
      throw new ForbiddenError(
        'Solo puede acceder al historial de socios con turnos asignados o historicos.',
      );
    }

    const turnos = await this.turnoRepository.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        socio: {
          idPersona: socioId,
        },
      },
      relations: {
        mediciones: true,
        adjuntos: true,
      },
      order: {
        fechaTurno: 'DESC',
        horaTurno: 'DESC',
      },
    });

    const fotosPorTurno = await this.contarFotosPorTurno(
      turnos.map((t) => t.idTurno),
    );

    this.logger.log(
      `Historial de turnos consultado. Profesional=${nutricionistaId}, socio=${socioId}, resultados=${turnos.length}.`,
    );

    return turnos.map((turno) => {
      const dto = new HistorialTurnoPacienteResponseDto();
      dto.idTurno = turno.idTurno;
      dto.fechaTurno = formatArgentinaDate(turno.fechaTurno);
      dto.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
      dto.estadoTurno = turno.estadoTurno;
      dto.tieneMedicion = (turno.mediciones?.length ?? 0) > 0;
      dto.tieneObservacion = !!turno.observacionClinica;
      dto.cantidadAdjuntos = turno.adjuntos?.length ?? 0;
      dto.cantidadFotos = fotosPorTurno.get(turno.idTurno) ?? 0;
      return dto;
    });
  }

  private async hasTurnoVinculo(
    nutricionistaId: number,
    socioId: number,
  ): Promise<boolean> {
    const totalTurnos = await this.turnoRepository.count({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        socio: {
          idPersona: socioId,
        },
      },
    });

    return totalTurnos > 0;
  }

  private async contarFotosPorTurno(
    turnoIds: number[],
  ): Promise<Map<number, number>> {
    if (turnoIds.length === 0) {
      return new Map();
    }

    const gimnasioId = this.tenantContext.gimnasioId;
    const fotos = await this.fotoProgresoOrmRepository.find({
      where: {
        turno: { idTurno: In(turnoIds) },
        socio: { gimnasioId },
      },
      relations: { turno: true },
    });

    const conteo = new Map<number, number>();
    for (const foto of fotos) {
      const id = foto.turno?.idTurno;
      if (id == null) continue;
      conteo.set(id, (conteo.get(id) ?? 0) + 1);
    }
    return conteo;
  }
}
