import { Inject, Injectable } from '@nestjs/common';

import { ListarExcepcionesDisponibilidadQueryDto } from 'src/application/agenda/dtos/listar-excepciones-disponibilidad-query.dto';
import { ExcepcionDisponibilidadResponseDto } from 'src/application/agenda/dtos/excepcion-disponibilidad-response.dto';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { ExcepcionDisponibilidadEntity } from 'src/domain/entities/Agenda/excepcion-disponibilidad.entity';
import {
  EXCEPCION_DISPONIBILIDAD_REPOSITORY,
  ExcepcionDisponibilidadRepository,
} from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
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
import { getArgentinaNow } from 'src/common/utils/argentina-datetime.util';

const VENTANA_MAXIMA_DIAS = 60;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable()
export class ListarExcepcionesDisponibilidadUseCase implements BaseUseCase {
  constructor(
    @Inject(EXCEPCION_DISPONIBILIDAD_REPOSITORY)
    private readonly excepcionRepository: ExcepcionDisponibilidadRepository,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    query: ListarExcepcionesDisponibilidadQueryDto,
  ): Promise<ExcepcionDisponibilidadResponseDto[]> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const ahora = getArgentinaNow();
    const fechaDesde = query.fechaDesde ? new Date(query.fechaDesde) : ahora;
    const fechaHasta = query.fechaHasta
      ? new Date(query.fechaHasta)
      : new Date(ahora.getTime() + VENTANA_MAXIMA_DIAS * MS_POR_DIA);

    this.validateVentana(fechaDesde, fechaHasta);

    const entidades = await this.excepcionRepository.findVigentesEnVentana(
      nutricionistaId,
      fechaDesde,
      fechaHasta,
    );

    this.logger.log(
      `Listado de ${entidades.length} excepciones de disponibilidad para profesional ${nutricionistaId} (${fechaDesde.toISOString()} -> ${fechaHasta.toISOString()}).`,
    );

    return entidades.map((e) => this.toResponse(e));
  }

  private validateVentana(fechaDesde: Date, fechaHasta: Date): void {
    if (
      Number.isNaN(fechaDesde.getTime()) ||
      Number.isNaN(fechaHasta.getTime())
    ) {
      throw new BadRequestError('Fechas invalidas en la consulta.');
    }

    if (fechaDesde.getTime() >= fechaHasta.getTime()) {
      throw new BadRequestError('fechaDesde debe ser anterior a fechaHasta.');
    }

    const limiteSuperiorMs =
      getArgentinaNow().getTime() + VENTANA_MAXIMA_DIAS * MS_POR_DIA;
    if (fechaHasta.getTime() > limiteSuperiorMs) {
      throw new BadRequestError(
        `La ventana de consulta no puede superar los ${VENTANA_MAXIMA_DIAS} dias desde hoy.`,
      );
    }
  }

  private toResponse(
    entity: ExcepcionDisponibilidadEntity,
  ): ExcepcionDisponibilidadResponseDto {
    return {
      idExcepcion: entity.idExcepcion!,
      fechaInicio: entity.fechaInicio.toISOString(),
      fechaFin: entity.fechaFin.toISOString(),
      motivo: entity.motivo,
    };
  }
}
