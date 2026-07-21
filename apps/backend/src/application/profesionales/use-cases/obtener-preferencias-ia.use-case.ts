import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

export interface SolicitudObtenerPreferenciasIa {
  nutricionistaId: number;
}

export interface RespuestaObtenerPreferenciasIa {
  preferencias: string;
}

/**
 * Devuelve las preferencias IA persistentes del nutricionista.
 *
 * Si el nutricionista no tiene notas guardadas (campo null en BD), retorna
 * string vacío para mantener contrato consistente con el frontend (que
 * siempre espera un string).
 */
@Injectable()
export class ObtenerPreferenciasIaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudObtenerPreferenciasIa,
  ): Promise<RespuestaObtenerPreferenciasIa> {
    this.logger.log(
      `[preferencias-ia] Obteniendo preferencias para nutricionista ${solicitud.nutricionistaId}`,
    );

    const nutricionista = await this.nutricionistaRepository.findById(
      solicitud.nutricionistaId,
    );

    if (!nutricionista) {
      throw new NotFoundError(
        'Nutricionista',
        String(solicitud.nutricionistaId),
      );
    }

    return {
      preferencias: nutricionista.preferenciasIa ?? '',
    };
  }
}
