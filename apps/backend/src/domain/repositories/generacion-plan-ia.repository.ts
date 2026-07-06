import type {
  EstadoGeneracionPlanIa,
  GeneracionPlanIaEntity,
} from '../entities/GeneracionPlanIa/generacion-plan-ia.entity';

export const GENERACION_PLAN_IA_REPOSITORY = Symbol(
  'GeneracionPlanIaRepository',
);

export interface CrearGeneracionPlanIaInput {
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  planAlimentacionId: number | null;
  solicitudJson: unknown;
  mensajeEstado?: string | null;
}

export interface BuscarGeneracionActivaInput {
  socioId: number;
  gimnasioId: number;
  planAlimentacionId?: number | null;
}

export interface ActualizarGeneracionPlanIaInput {
  estado: EstadoGeneracionPlanIa;
  proveedorActual?: string | null;
  mensajeEstado?: string | null;
  errorMensaje?: string | null;
  respuestaJson?: unknown | null;
  planAlimentacionId?: number | null;
  iniciadoEn?: Date | null;
  finalizadoEn?: Date | null;
}

export abstract class GeneracionPlanIaRepository {
  abstract crear(
    input: CrearGeneracionPlanIaInput,
  ): Promise<GeneracionPlanIaEntity>;

  abstract obtenerPorId(id: number): Promise<GeneracionPlanIaEntity | null>;

  abstract obtenerActiva(
    input: BuscarGeneracionActivaInput,
  ): Promise<GeneracionPlanIaEntity | null>;

  abstract actualizar(
    id: number,
    input: ActualizarGeneracionPlanIaInput,
  ): Promise<GeneracionPlanIaEntity>;
}
