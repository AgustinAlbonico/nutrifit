/**
 * NutricionistaIAMemoriaRepository (puerto abstracto)
 * ===================================================
 *
 * Wrapper de dominio sobre `nutricionista_ia_memoria`. La memoria IA
 * guarda entradas POSITIVO/NEGATIVO de feedback del nutricionista que
 * se inyectan al prompt de generación para few-shot learning.
 *
 * Regla: solo se devuelven entradas NO archivadas para selección
 * automática. Las archivadas siguen en BD para auditoría.
 */

import type {
  NutricionistaIAMemoriaEntity,
  TipoEjemploIA,
} from '../entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

/**
 * Token de inyección para el repositorio de memoria IA. Sigue la
 * convención del proyecto (ver `NUTRICIONISTA_REPOSITORY`, etc.).
 */
export const NUTRICIONISTA_IA_MEMORIA_REPOSITORY = Symbol(
  'NutricionistaIAMemoriaRepository',
);

export interface CrearMemoriaIaInput {
  idNutricionista: number;
  tipoEjemplo: TipoEjemploIA;
  comentario: string;
  idPlanAlimentacionVersion: number | null;
}

export abstract class NutricionistaIAMemoriaRepository {
  abstract crear(
    input: CrearMemoriaIaInput,
  ): Promise<NutricionistaIAMemoriaEntity>;

  abstract obtenerPorId(
    id: number,
  ): Promise<NutricionistaIAMemoriaEntity | null>;

  /**
   * Lista memoria activa (no archivada) del nutricionista.
   * Si `incluirArchivadas=true`, incluye también archivadas.
   */
  abstract listarPorNutricionista(
    nutricionistaId: number,
    incluirArchivadas?: boolean,
  ): Promise<NutricionistaIAMemoriaEntity[]>;

  /**
   * Lista las primeras N entradas activas del nutricionista, ordenadas
   * por fecha de creación DESC. Usado para selección adaptativa (1-3).
   */
  abstract obtenerParaSeleccion(
    nutricionistaId: number,
    limite?: number,
  ): Promise<NutricionistaIAMemoriaEntity[]>;

  abstract contarActivas(nutricionistaId: number): Promise<number>;

  /**
   * Soft-archive (no delete físico).
   */
  abstract marcarArchivada(id: number): Promise<void>;
}
