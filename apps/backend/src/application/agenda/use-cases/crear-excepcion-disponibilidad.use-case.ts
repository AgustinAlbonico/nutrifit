import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CrearExcepcionDisponibilidadDto } from 'src/application/agenda/dtos/crear-excepcion-disponibilidad.dto';
import {
  ExcepcionDisponibilidadResponseDto,
  TurnoAfectadoResumenDto,
} from 'src/application/agenda/dtos/excepcion-disponibilidad-response.dto';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ExcepcionDisponibilidadEntity } from 'src/domain/entities/Agenda/excepcion-disponibilidad.entity';
import {
  EXCEPCION_DISPONIBILIDAD_REPOSITORY,
  ExcepcionDisponibilidadRepository,
} from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  formatArgentinaDate,
  getArgentinaNow,
} from 'src/common/utils/argentina-datetime.util';

const VENTANA_MAXIMA_DIAS = 60;
const MOTIVO_MAX_LENGTH = 255;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable()
export class CrearExcepcionDisponibilidadUseCase implements BaseUseCase {
  constructor(
    @Inject(EXCEPCION_DISPONIBILIDAD_REPOSITORY)
    private readonly excepcionRepository: ExcepcionDisponibilidadRepository,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
    payload: CrearExcepcionDisponibilidadDto,
  ): Promise<ExcepcionDisponibilidadResponseDto> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const fechaInicio = new Date(payload.fechaInicio);
    const fechaFin = new Date(payload.fechaFin);
    this.validateRango(fechaInicio, fechaFin, payload.motivo);

    const turnosAfectados = await this.buscarTurnosReservadosEnRango(
      nutricionistaId,
      fechaInicio,
      fechaFin,
    );

    if (turnosAfectados.length > 0 && !payload.confirmarConTurnosOcupados) {
      throw new ConflictError(
        'La excepcion afecta turnos reservados. Confirme para crearla de todos modos.',
        {
          requiereConfirmacion: true,
          turnosAfectados: turnosAfectados.map((t) => this.toTurnoResumen(t)),
        },
      );
    }

    const entity = new ExcepcionDisponibilidadEntity(
      nutricionista,
      fechaInicio,
      fechaFin,
      payload.motivo ?? null,
    );

    const persistida = await this.excepcionRepository.save(entity);

    this.logger.log(
      `Excepcion de disponibilidad ${persistida.idExcepcion} creada para profesional ${nutricionistaId}. Motivo=${payload.motivo ?? 'n/a'}, turnosAfectados=${turnosAfectados.length}.`,
    );

    return {
      idExcepcion: persistida.idExcepcion!,
      fechaInicio: persistida.fechaInicio.toISOString(),
      fechaFin: persistida.fechaFin.toISOString(),
      motivo: persistida.motivo,
      turnosAfectados:
        turnosAfectados.length > 0
          ? turnosAfectados.map((t) => this.toTurnoResumen(t))
          : undefined,
    };
  }

  private validateRango(
    fechaInicio: Date,
    fechaFin: Date,
    motivo: string | null | undefined,
  ): void {
    if (
      Number.isNaN(fechaInicio.getTime()) ||
      Number.isNaN(fechaFin.getTime())
    ) {
      throw new BadRequestError('Fechas invalidas.');
    }

    const ahora = getArgentinaNow();

    if (fechaInicio.getTime() < ahora.getTime()) {
      throw new BadRequestError(
        'No se puede crear una excepcion en una fecha pasada.',
      );
    }

    if (fechaFin.getTime() <= fechaInicio.getTime()) {
      throw new BadRequestError(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    const limiteSuperiorMs = ahora.getTime() + VENTANA_MAXIMA_DIAS * MS_POR_DIA;
    if (fechaFin.getTime() > limiteSuperiorMs) {
      throw new BadRequestError(
        `La excepcion excede el limite de ${VENTANA_MAXIMA_DIAS} dias desde hoy.`,
      );
    }

    if (motivo && motivo.length > MOTIVO_MAX_LENGTH) {
      throw new BadRequestError(
        `El motivo no puede superar los ${MOTIVO_MAX_LENGTH} caracteres.`,
      );
    }
  }

  private async buscarTurnosReservadosEnRango(
    nutricionistaId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<TurnoOrmEntity[]> {
    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.nutricionista', 'nutri')
      .leftJoin('turno.socio', 'socio')
      .where('nutri.idPersona = :nutriId', { nutriId: nutricionistaId })
      .andWhere('nutri.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      })
      .andWhere('turno.socio IS NOT NULL')
      .andWhere('turno.estadoTurno != :cancelado', {
        cancelado: EstadoTurno.CANCELADO,
      })
      .andWhere('turno.fechaTurno >= :desde', { desde: fechaInicio })
      .andWhere('turno.fechaTurno <= :hasta', { hasta: fechaFin })
      .getMany();

    return turnos;
  }

  private toTurnoResumen(turno: TurnoOrmEntity): TurnoAfectadoResumenDto {
    return {
      idTurno: turno.idTurno,
      fechaTurno: formatArgentinaDate(turno.fechaTurno),
      horaTurno: turno.horaTurno,
      estadoTurno: turno.estadoTurno,
      socioId: turno.socio?.idPersona ?? null,
      socioNombre: turno.socio
        ? `${turno.socio.nombre ?? ''} ${turno.socio.apellido ?? ''}`.trim() ||
          null
        : null,
    };
  }
}
