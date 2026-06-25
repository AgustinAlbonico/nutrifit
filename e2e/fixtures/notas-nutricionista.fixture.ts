/**
 * Fixture de notas del nutricionista para los flujos V2.
 *
 * Las notas se dividen en dos categorías según el diseño:
 * - `preferenciasIa`: notas PERSISTENTES que viven en `nutricionista_orm.preferencias_ia`.
 *   Se concatenan con las notas de generación en cada prompt enviado a la IA.
 * - `notasGeneracion`: notas POR GENERACIÓN que viven en `plan_alimentacion.notas_generacion`.
 *   Son específicas del plan que se está creando.
 *
 * Los comentarios de feedback (POSITIVO/NEGATIVO) terminan creando entradas
 * en `nutricionista_ia_memoria` que se usan como ejemplos adaptativos.
 */

/** Nota persistente — nutricionista deportológica */
export const notaDeportologica: string =
  'Soy nutricionista deportológica. Priorizar proteínas de alto valor biológico, predominio de fibra, evitar ultraprocesados. Distribución de macros: 30% proteína, 40% carbohidratos complejos, 30% grasas saludables.';

/** Nota persistente — nutricionista con pacientes veganos frecuentes */
export const notaVegano: string =
  'Mis pacientes suelen ser veganos. Evitar carne, lácteos, huevos y miel en todos los planes. Incluir legumbres como fuente principal de proteína. Suplementar B12 si el plan es 100% vegano.';

/** Nota persistente — enfoque balanceado estándar sin directrices especiales */
export const notaFlexible: string =
  'Sin directrices especiales, generar planes balanceados estándar. Mantener variedad de alimentos entre días.';

/** Nota persistente — predominio de fibra en todas las comidas */
export const notaPredominioFibra: string =
  'Predominio de fibra en todas las comidas. Verduras y cereales integrales en cada plato principal. Mínimo 25g de fibra por día.';

/** Notas de generación — específicas para un plan */
export const notasGeneracion = {
  planVeganoEstricto:
    'Plan vegano estricto. Sin derivados animales de ningún tipo. El socio está empezando esta dieta, preferir opciones sencillas y conocidas.',

  planDeportivo:
    'Plan para semana de competición. Aumentar carbohidratos complejos pre-entrenamiento. Reducir fibra en comidas previas al ejercicio.',

  planPerdidaPeso:
    'Plan orientado a pérdida de peso moderada. Déficit calórico controlado, mantener saciedad con volumen de verduras y proteínas.',

  sinNotas: null as string | null,
};

/** Comentarios de feedback que crean entradas en la memoria IA */
export const comentariosFeedback = {
  positivo: {
    estructura:
      'Excelente variedad de alternativas en cada comida. Buena distribución de macros a lo largo del día.',
    adherencia:
      'El socio reportó alta adherencia. Le gustaron especialmente las opciones de snacks.',
  },
  negativo: {
    monotonia:
      'El plan tiene demasiada repetición entre días. Necesita más variedad de cereales.',
   porcionGrandes:
      'Las porciones de cena son demasiado grandes. El socio se levanta pesado.',
    ingredientesCostosos:
      'Algunos ingredientes son muy difíciles de conseguir en la zona. Sugerir alternativas más accesibles.',
  },
};

/** Lista de notas persistentes para tests parametrizados */
export const TODAS_LAS_NOTAS_PERSISTENTES = {
  deportologica: notaDeportologica,
  vegano: notaVegano,
  flexible: notaFlexible,
  predominioFibra: notaPredominioFibra,
};