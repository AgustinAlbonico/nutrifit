import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { sanitizarTextoPlano } from 'src/domain/sanitizadores/sanitizador-texto-plano';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

export const MAX_CARACTERES_PREFERENCIAS_IA = 2000;

export interface SolicitudActualizarPreferenciasIa {
  nutricionistaId: number;
  preferencias: string;
  /**
   * ID del usuario (no de la persona) que ejecuta la acción para auditoría.
   * Es el `idUsuario` que viene en el JWT.
   */
  usuarioId: number;
}

export interface RespuestaActualizarPreferenciasIa {
  preferencias: string;
}

/**
 * Actualiza las preferencias IA persistentes del nutricionista.
 *
 * Reglas:
 * 1. Sanitiza el input: trim + collapse + remoción HTML/scripts + markdown.
 * 2. Valida longitud máxima (2000 chars). Si excede, BadRequestError.
 * 3. Si tras sanitización queda vacío y el input original NO era vacío,
 *    se permite guardar vacío (caso "borrar mis notas").
 * 4. Persiste en `nutricionista_orm.preferencias_ia`.
 * 5. Registra auditoría `PREFERENCIAS_IA_EDITADAS`.
 *
 * NO regenera planes existentes. Las nuevas preferencias aplican SOLO a
 * futuras generaciones (ver spec RF-002 escenario 4).
 */
@Injectable()
export class ActualizarPreferenciasIaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    solicitud: SolicitudActualizarPreferenciasIa,
  ): Promise<RespuestaActualizarPreferenciasIa> {
    const { nutricionistaId, preferencias, usuarioId } = solicitud;

    this.logger.log(
      `[preferencias-ia] Actualizando preferencias para nutricionista ${nutricionistaId} (usuario ${usuarioId})`,
    );

    // 1) Sanitizar
    const sanitizado = sanitizarTextoPlano(preferencias ?? '');

    // 2) Validar longitud
    if (sanitizado.texto.length > MAX_CARACTERES_PREFERENCIAS_IA) {
      throw new BadRequestError(
        `Las preferencias no pueden superar ${MAX_CARACTERES_PREFERENCIAS_IA} caracteres`,
      );
    }

    // 3) Cargar nutricionista
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);
    if (!nutricionista) {
      throw new NotFoundError(
        'Nutricionista',
        String(nutricionistaId),
      );
    }

    const preferenciasAnteriores = nutricionista.preferenciasIa;

    // 4) Persistir (reusamos update con la entidad hidratada)
    nutricionista.preferenciasIa = sanitizado.texto;
    await this.nutricionistaRepository.update(nutricionistaId, nutricionista);

    // 5) Auditoría (no falla la operación si la auditoría falla, solo loggeamos)
    try {
      await this.auditoriaService.registrar({
        usuarioId,
        accion: AccionAuditoria.PREFERENCIAS_IA_EDITADAS,
        entidad: 'Nutricionista',
        entidadId: nutricionistaId,
        metadata: {
          longitud: sanitizado.texto.length,
          huboCambios: sanitizado.huboCambios,
          caracteresAnteriores: preferenciasAnteriores?.length ?? 0,
        },
      });
    } catch (error) {
      this.logger.warn(
        `[preferencias-ia] No se pudo registrar auditoría para nutricionista ${nutricionistaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      preferencias: sanitizado.texto,
    };
  }
}