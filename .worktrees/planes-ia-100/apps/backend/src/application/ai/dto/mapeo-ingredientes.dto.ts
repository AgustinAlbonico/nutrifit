/**
 * Resumen de alimento para uso en DTOs de mapeo.
 * Evita filtrar el ORM entity completo hacia la capa de presentación.
 */
export interface AlimentoResumen {
  idAlimento: number;
  nombre: string;
}

/**
 * Resultado exitoso de mapeo exacto de un ingrediente IA.
 */
export interface MapeoIngredienteExacto {
  tipo: 'exacto';
  ingredienteOriginal: string;
  alimento: AlimentoResumen;
}

/**
 * Razón por la cual el mapeo de un ingrediente falló o es ambiguo.
 */
export type RazonConflicto = 'NO_ENCONTRADO' | 'AMBIGUO';

/**
 * Resultado de conflicto en el mapeo de un ingrediente IA.
 * Surfacea explícitamente el problema para que el profesional decida.
 */
export interface MapeoIngredienteConflicto {
  tipo: 'conflicto';
  ingredienteOriginal: string;
  razon: RazonConflicto;
  /**
   * Candidatos en caso de conflicto AMBIGUO.
   * Undefined para NO_ENCONTRADO.
   */
  candidatos?: AlimentoResumen[];
  /**
   * Mensaje legible describing the conflict.
   */
  mensaje: string;
}

/**
 * Resultado individual del mapeo de un ingrediente.
 */
export type ResultadoMapeoIngrediente =
  | MapeoIngredienteExacto
  | MapeoIngredienteConflicto;

/**
 * Resultado agregado del mapeo de múltiples ingredientes IA.
 */
export interface ResultadoMapearIngredientes {
  /**
   * Resultados individuales en el mismo orden que los ingredientes de entrada.
   */
  mapeos: ResultadoMapeoIngrediente[];

  /**
   * true si al menos un ingrediente tiene conflicto.
   */
  tieneConflictos: boolean;

  /**
   * Lista de conflictos para revisión explícita.
   */
  conflictos: MapeoIngredienteConflicto[];

  /**
   * Cantidad de mapeos exitosos.
   */
  exitosos: number;

  /**
   * Cantidad de conflictos.
   */
  totalConflictos: number;
}

/**
 * Input para el caso de uso de mapeo de ingredientes.
 */
export interface EntradaMapearIngredientes {
  /**
   * Lista de nombres de ingredientes generados por IA.
   * Ejemplo: ['avena', 'leche', 'pollo']
   */
  ingredientes: string[];
}
