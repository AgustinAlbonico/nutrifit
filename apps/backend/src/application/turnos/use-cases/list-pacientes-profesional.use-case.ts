import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PaginatedData } from '@nutrifit/shared';
import { calcularMeta } from 'src/common/helpers/paginacion.helper';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ListPacientesProfesionalQueryDto,
  PacienteProfesionalResponseDto,
} from 'src/application/turnos/dtos';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  combineArgentinaDateAndTime,
  formatArgentinaDate,
  formatArgentinaDateTime,
  getArgentinaNow,
} from 'src/common/utils/argentina-datetime.util';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ListPacientesProfesionalUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
    query: ListPacientesProfesionalQueryDto,
  ): Promise<PaginatedData<PacienteProfesionalResponseDto>> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .innerJoinAndSelect('turno.socio', 'socio')
      .leftJoinAndSelect('socio.usuario', 'usuario')
      .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
      .andWhere('nutricionista.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      })
      .andWhere('nutricionista.idPersona = :nutricionistaId', {
        nutricionistaId,
      })
      .orderBy('turno.fechaTurno', 'DESC')
      .addOrderBy('turno.horaTurno', 'DESC');

    if (query.nombre?.trim()) {
      const term = `%${query.nombre.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(socio.nombre) LIKE :term OR LOWER(socio.apellido) LIKE :term OR socio.dni LIKE :dniTerm)',
        {
          term,
          dniTerm: `%${query.nombre.trim()}%`,
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

    const turnos = await queryBuilder.getMany();
    const ahora = getArgentinaNow();
    const ultimoTurnoMap = new Map<number, Date>();
    const proximoTurnoMap = new Map<number, Date>();

    const pacientesMap = new Map<number, PacienteProfesionalResponseDto>();

    for (const turno of turnos) {
      const socioId = turno.socio.idPersona ?? 0;
      if (!pacientesMap.has(socioId)) {
        const paciente = new PacienteProfesionalResponseDto();
        paciente.socioId = socioId;
        paciente.nombreCompleto =
          `${turno.socio.nombre} ${turno.socio.apellido}`.trim();
        paciente.dni = turno.socio.dni ?? '';
        paciente.email = turno.socio.usuario?.email ?? null;
        paciente.telefono = turno.socio.telefono ?? null;
        paciente.fechaNacimiento = turno.socio.fechaNacimiento
          ? formatArgentinaDate(turno.socio.fechaNacimiento)
          : null;
        paciente.genero = turno.socio.genero ?? null;
        paciente.direccion = turno.socio.direccion ?? null;
        paciente.ciudad = turno.socio.ciudad ?? null;
        paciente.provincia = turno.socio.provincia ?? null;
        paciente.objetivo = turno.socio.fichaSalud?.objetivoPersonal ?? null;
        paciente.ultimoTurno = null;
        paciente.proximoTurno = null;
        paciente.fotoPerfilUrl = turno.socio.fotoPerfilKey
          ? `/socio/${socioId}/foto?v=${encodeURIComponent(turno.socio.fotoPerfilKey)}`
          : null;
        pacientesMap.set(socioId, paciente);
      }

      const paciente = pacientesMap.get(socioId)!;
      const turnoDateTime = combineArgentinaDateAndTime(
        turno.fechaTurno,
        turno.horaTurno,
      );

      if (turnoDateTime.getTime() <= ahora.getTime()) {
        const ultimoTurno = ultimoTurnoMap.get(socioId);
        if (!ultimoTurno || turnoDateTime > ultimoTurno) {
          ultimoTurnoMap.set(socioId, turnoDateTime);
        }
      } else {
        const proximoTurno = proximoTurnoMap.get(socioId);
        if (!proximoTurno || turnoDateTime < proximoTurno) {
          proximoTurnoMap.set(socioId, turnoDateTime);
        }
      }

      paciente.ultimoTurno = ultimoTurnoMap.get(socioId)
        ? formatArgentinaDateTime(ultimoTurnoMap.get(socioId)!)
        : null;
      paciente.proximoTurno = proximoTurnoMap.get(socioId)
        ? formatArgentinaDateTime(proximoTurnoMap.get(socioId)!)
        : null;
    }

    const pacientes = Array.from(pacientesMap.values()).sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto),
    );

    const total = pacientes.length;
    const pagina = query.page ?? 1;
    const limite = query.limit ?? 20;
    const inicio = (pagina - 1) * limite;
    const pacientesPagina = pacientes.slice(inicio, inicio + limite);

    this.logger.log(
      `Pacientes recuperados para profesional ${nutricionistaId}: ${total} total, devolviendo ${pacientesPagina.length}.`,
    );

    return {
      data: pacientesPagina,
      pagination: calcularMeta(total, pagina, limite),
    };
  }
}
