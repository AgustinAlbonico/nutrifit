/**
 * PromptPlanSemanalBuilder
 * ========================
 *
 * Construye los prompts (system + user) para que la IA genere un plan
 * semanal. Combina:
 *  - Ficha clínica del socio (alergias, restricciones, patologías,
 *    objetivo nutricional).
 *  - Preferencias IA persistentes del nutricionista (`preferencias_ia`).
 *  - Notas puntuales del nutricionista para esta generación
 *    (`notas_generacion`).
 *  - 1-3 ejemplos de memoria IA (positivos/negativos) para aprendizaje
 *    few-shot.
 *  - Estructura esperada del JSON de respuesta.
 *
 * Por qué separado del use-case: el prompt es lógica de aplicación que
 * puede evolucionar independientemente de la orquestación (Groq retries,
 * validación, persistencia).
 */

import { Injectable } from '@nestjs/common';
import { DiaSemana } from '../../../domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from '../../../domain/entities/OpcionComida/TipoComida';

export interface FichaClinicaParaPrompt {
  /** Lista de alergias explícitas */
  alergias: string[];
  /** Texto libre con restricciones alimentarias (ej: "vegano, sin gluten") */
  restriccionesAlimentarias: string | null;
  /** Lista de patologías del socio */
  patologias: string[];
  /** Objetivo nutricional textual del socio */
  objetivoPersonal: string | null;
}

export interface EjemploMemoria {
  tipoEjemplo: 'POSITIVO' | 'NEGATIVO';
  comentario: string;
}

export interface ContextoPromptPlanSemanal {
  fichaClinica: FichaClinicaParaPrompt;
  nutricionista: {
    preferenciasIa: string | null;
  };
  notasGeneracion: string | null;
  ejemplosMemoria: EjemploMemoria[];
  diasAGenerar: number;
  diasEspecificos?: DiaSemana[];
  comidasPorDia: number;
  tiposComidaEspecificos?: TipoComida[];
  alternativasPorComida: number;
  fechaInicio: Date;
  /** Nombres de las 26 categorías de grupo alimenticio (para que la IA elija categoriaNombre válido). */
  categoriasGruposAlimenticios?: string[];
  caloriasLimite?: number;
  proteinasEstimadas?: number;
  carbohidratosEstimados?: number;
  grasasEstimados?: number;
  alimentosPreferidos?: string[];
  alimentosEvitados?: string[];
  /**
   * Proteína principal que la IA DEBE usar como fuente proteica de la
   * alternativa #1. La asigna RotadorProteinasService para forzar
   * rotación entre comidas. Si está ausente, la IA decide libremente.
   */
  proteinaPrincipalAsignada?: string;
  /**
   * Proteínas ya usadas en el plan (para que la IA tenga contexto de
   * qué se generó antes). Es una guía suave, no una restricción dura.
   */
  proteinasUsadasEnPlan?: string[];
}

export interface PromptResultado {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class PromptPlanSemanalBuilder {
  construir(contexto: ContextoPromptPlanSemanal): PromptResultado {
    const systemPrompt = this.construirSystemPrompt(contexto);
    const userPrompt = this.construirUserPrompt(contexto);
    return { systemPrompt, userPrompt };
  }

  construirComida(contexto: ContextoPromptPlanSemanal): PromptResultado {
    const diasSolicitados = this.obtenerDiasSolicitados(contexto);
    const tiposComidaSolicitados = this.obtenerTiposComidaSolicitados(contexto);
    const dia = diasSolicitados[0];
    const tipoComida = tiposComidaSolicitados[0];
    const notasConsolidadas = this.consolidarNotas(
      contexto.nutricionista.preferenciasIa,
      contexto.notasGeneracion,
    );

    const systemPrompt = [
      'Eres un nutricionista profesional argentino.',
      'Tu tarea es generar SOLO una comida puntual para un plan alimentario.',
      '',
      'REGLAS DURAS:',
      `1. Respondé una única comida de tipo ${tipoComida}.`,
      `2. La comida debe tener EXACTAMENTE ${contexto.alternativasPorComida} alternativas.`,
      '3. No devuelvas estructura semanal, macrosPorDia ni razonamiento global del plan.',
      '4. NUNCA incluyas ingredientes que estén en alergias, restricciones o exclusiones del socio.',
      '5. Cada alternativa debe tener nombre, alimentos, calorías, proteínas, carbohidratos y grasas.',
      '6. Cada alimento debe usar alimentoNombre, cantidad y unidad.',
      '7. Si inventás alimentos, declará un resumen mínimo en alimentosNuevos; si no, devolvé alimentosNuevos como array vacío.',
      contexto.proteinaPrincipalAsignada
        ? `8. La alternativa #1 debe tener como fuente proteica principal: "${contexto.proteinaPrincipalAsignada}". Las alternativas #2 y #3 son libres (distintas de la #1 y entre sí).`
        : null,
      '',
      'JSON DE SALIDA EXACTO:',
      this.construirEsquemaJsonComida(tipoComida),
      '',
      'IMPORTANTE: Respondé ÚNICAMENTE con el JSON solicitado, sin markdown, sin explicaciones, sin texto adicional.',
    ]
      .filter((linea): linea is string => linea !== null)
      .join('\n');

    const lineasUsuario: string[] = [];
    lineasUsuario.push('CONTEXTO DEL SOCIO:');
    lineasUsuario.push(
      `- Objetivo nutricional: ${contexto.fichaClinica.objetivoPersonal ?? 'No especificado'}`,
    );
    lineasUsuario.push(
      `- Alergias: ${contexto.fichaClinica.alergias.length > 0 ? contexto.fichaClinica.alergias.join(', ') : 'Ninguna'}`,
    );
    lineasUsuario.push(
      `- Restricciones alimentarias: ${contexto.fichaClinica.restriccionesAlimentarias ?? 'Ninguna'}`,
    );
    lineasUsuario.push(
      `- Patologías: ${contexto.fichaClinica.patologias.length > 0 ? contexto.fichaClinica.patologias.join(', ') : 'Ninguna'}`,
    );

    if (
      contexto.caloriasLimite ||
      contexto.proteinasEstimadas ||
      contexto.carbohidratosEstimados ||
      contexto.grasasEstimados
    ) {
      lineasUsuario.push('');
      lineasUsuario.push('OBJETIVO APROXIMADO PARA ESTA COMIDA:');
      if (contexto.caloriasLimite) {
        lineasUsuario.push(`- Calorías: ${contexto.caloriasLimite} kcal`);
      }
      if (contexto.proteinasEstimadas) {
        lineasUsuario.push(`- Proteínas: ${contexto.proteinasEstimadas} g`);
      }
      if (contexto.carbohidratosEstimados) {
        lineasUsuario.push(
          `- Carbohidratos: ${contexto.carbohidratosEstimados} g`,
        );
      }
      if (contexto.grasasEstimados) {
        lineasUsuario.push(`- Grasas: ${contexto.grasasEstimados} g`);
      }
    }

    if (
      contexto.alimentosPreferidos &&
      contexto.alimentosPreferidos.length > 0
    ) {
      lineasUsuario.push('');
      lineasUsuario.push(
        `Alimentos a priorizar si encajan: ${contexto.alimentosPreferidos.join(', ')}`,
      );
    }

    if (contexto.alimentosEvitados && contexto.alimentosEvitados.length > 0) {
      lineasUsuario.push('');
      lineasUsuario.push(
        `Alimentos a excluir absolutamente: ${contexto.alimentosEvitados.join(', ')}`,
      );
    }

    if (notasConsolidadas.length > 0) {
      lineasUsuario.push('');
      lineasUsuario.push('INSTRUCCIONES DEL NUTRICIONISTA:');
      lineasUsuario.push(notasConsolidadas);
    }

    if (contexto.ejemplosMemoria.length > 0) {
      lineasUsuario.push('');
      lineasUsuario.push('FEEDBACK PASADO A CONSIDERAR:');
      lineasUsuario.push(this.formatearEjemplos(contexto.ejemplosMemoria));
    }

    if (contexto.proteinaPrincipalAsignada) {
      lineasUsuario.push('');
      lineasUsuario.push('PROTEÍNA ASIGNADA PARA ESTA COMIDA (REGLA DURA):');
      lineasUsuario.push(
        `- La alternativa #1 debe usar "${contexto.proteinaPrincipalAsignada}" como fuente proteica principal.`,
      );
      lineasUsuario.push(
        '- Nombrá el plato de forma descriptiva incluyendo la proteína y la guarnición (no repitas el nombre literal de la proteína).',
      );
      if (
        contexto.proteinasUsadasEnPlan &&
        contexto.proteinasUsadasEnPlan.length > 0
      ) {
        lineasUsuario.push(
          `- Para variar, estas son proteínas ya usadas en otras comidas del plan: ${contexto.proteinasUsadasEnPlan.join(', ')}.`,
        );
      }
    }

    lineasUsuario.push('');
    lineasUsuario.push('PARÁMETROS EXACTOS:');
    lineasUsuario.push(`- Día: ${dia}`);
    lineasUsuario.push(`- Tipo de comida: ${tipoComida}`);
    lineasUsuario.push(`- Alternativas: ${contexto.alternativasPorComida}`);
    lineasUsuario.push(
      `- Fecha de inicio del plan: ${contexto.fechaInicio.toISOString().split('T')[0]}`,
    );

    return {
      systemPrompt,
      userPrompt: lineasUsuario.join('\n'),
    };
  }

  private construirSystemPrompt(ctx: ContextoPromptPlanSemanal): string {
    const lineas: string[] = [];
    const diasSolicitados = this.obtenerDiasSolicitados(ctx);
    const cantidadDias = diasSolicitados.length;
    const tiposComidaSolicitados = this.obtenerTiposComidaSolicitados(ctx);
    const cantidadComidas = tiposComidaSolicitados.length;

    lineas.push(
      'Eres un nutricionista profesional argentino. Tu tarea es generar un plan de alimentación semanal detallado para un socio.',
    );
    lineas.push('');

    lineas.push('REGLAS DURAS (no negociables):');
    lineas.push(`1. El plan debe tener EXACTAMENTE ${cantidadDias} días.`);
    lineas.push(
      `2. Cada día debe tener EXACTAMENTE ${cantidadComidas} comidas.`,
    );
    lineas.push(
      `3. Cada comida debe tener EXACTAMENTE ${ctx.alternativasPorComida} alternativas.`,
    );
    lineas.push(
      '4. NUNCA incluyas ingredientes que estén en las alergias del socio.',
    );
    lineas.push(
      '5. NUNCA incluyas alimentos prohibidos por las restricciones alimentarias.',
    );
    lineas.push(
      '6. Considera las patologías (ej: diabetes → evitar azúcares).',
    );
    lineas.push(
      '7. Distribuí los macronutrientes de forma equilibrada entre las comidas.',
    );
    lineas.push(
      '8. Si en el contexto del socio se definen metas de calorías o macronutrientes, ajustá estrictamente el tamaño de las porciones de los alimentos para que el promedio diario cumpla con estos objetivos (con un margen de ±5%).',
    );
    lineas.push(
      '9. Si en el contexto se especifican alimentos/ingredientes preferidos a priorizar, hacé lo posible por incluirlos en las recetas del plan. Si se definen alimentos/ingredientes a evitar, excluílos de forma absoluta de todas las recetas.',
    );
    lineas.push(
      '10. Variá los alimentos entre días y entre alternativas para evitar monotonía.',
    );
    lineas.push(
      '11. Los alimentos deben estar referenciados por su nombre común en español.',
    );
    lineas.push(
      '12. Si un alimento no existe en el catálogo, declarálo en el array alimentosNuevos con macros aproximados y categoría correcta.',
    );
    lineas.push('');
    lineas.push('ESTRUCTURA DEL JSON DE SALIDA:');
    lineas.push(this.construirEsquemaJson(ctx));
    lineas.push('');

    lineas.push('CONTROL DE COMPLETITUD OBLIGATORIO:');
    lineas.push(
      `- Debe haber ${cantidadDias} objetos dentro de estructura, uno por cada día solicitado.`,
    );
    lineas.push(
      `- Cada día debe tener ${cantidadComidas} comidas y cada comida ${ctx.alternativasPorComida} alternativas.`,
    );
    lineas.push(
      `- Debe haber ${cantidadDias * cantidadComidas * ctx.alternativasPorComida} alternativas en total.`,
    );
    lineas.push(
      '- No resumas, no uses puntos suspensivos y no omitas días aunque el JSON sea largo.',
    );
    lineas.push('');

    // Concatenar preferencias IA + notas de generación
    const notasConsolidadas = this.consolidarNotas(
      ctx.nutricionista.preferenciasIa,
      ctx.notasGeneracion,
    );
    if (notasConsolidadas.length > 0) {
      lineas.push('INSTRUCCIONES DEL NUTRICIONISTA (privadas, soft):');
      lineas.push(notasConsolidadas);
      lineas.push('');
    }

    if (ctx.ejemplosMemoria.length > 0) {
      lineas.push('EJEMPLOS DE FEEDBACK PASADO DEL NUTRICIONISTA:');
      lineas.push(this.formatearEjemplos(ctx.ejemplosMemoria));
      lineas.push('');
    }

    lineas.push(
      'IMPORTANTE: Respondé ÚNICAMENTE con el JSON solicitado, sin markdown, sin explicaciones, sin texto adicional.',
    );

    return lineas.join('\n');
  }

  private construirUserPrompt(ctx: ContextoPromptPlanSemanal): string {
    const lineas: string[] = [];
    const diasSolicitados = this.obtenerDiasSolicitados(ctx);
    const tiposComidaSolicitados = this.obtenerTiposComidaSolicitados(ctx);

    lineas.push('CONTEXTO DEL SOCIO:');
    lineas.push(
      `- Objetivo nutricional: ${ctx.fichaClinica.objetivoPersonal ?? 'No especificado'}`,
    );
    lineas.push(
      `- Alergias: ${ctx.fichaClinica.alergias.length > 0 ? ctx.fichaClinica.alergias.join(', ') : 'Ninguna'}`,
    );
    lineas.push(
      `- Restricciones alimentarias: ${ctx.fichaClinica.restriccionesAlimentarias ?? 'Ninguna'}`,
    );
    lineas.push(
      `- Patologías: ${ctx.fichaClinica.patologias.length > 0 ? ctx.fichaClinica.patologias.join(', ') : 'Ninguna'}`,
    );

    if (
      ctx.caloriasLimite ||
      ctx.proteinasEstimadas ||
      ctx.carbohidratosEstimados ||
      ctx.grasasEstimados
    ) {
      lineas.push('');
      lineas.push(
        'METAS DE MACRONUTRIENTES DIARIAS REQUERIDAS (Ajustar porciones para aproximarse a ellas):',
      );
      if (ctx.caloriasLimite)
        lineas.push(
          `- Límite Calórico Diario: EXACTAMENTE ${ctx.caloriasLimite} kcal (tolerancia ±5%)`,
        );
      if (ctx.proteinasEstimadas)
        lineas.push(`- Proteínas Diarias: ${ctx.proteinasEstimadas} g`);
      if (ctx.carbohidratosEstimados)
        lineas.push(`- Carbohidratos Diarios: ${ctx.carbohidratosEstimados} g`);
      if (ctx.grasasEstimados)
        lineas.push(`- Grasas Diarias: ${ctx.grasasEstimados} g`);
    }

    if (ctx.alimentosPreferidos && ctx.alimentosPreferidos.length > 0) {
      lineas.push('');
      lineas.push(
        `PREFERENCIAS DE ALIMENTOS DEL SOCIO (Priorizar su inclusión):`,
      );
      lineas.push(
        `- Ingredientes/Alimentos a priorizar: ${ctx.alimentosPreferidos.join(', ')}`,
      );
    }

    if (ctx.alimentosEvitados && ctx.alimentosEvitados.length > 0) {
      lineas.push('');
      lineas.push(
        `EXCLUSIONES DE ALIMENTOS DEL SOCIO (Excluir absolutamente):`,
      );
      lineas.push(
        `- Ingredientes/Alimentos a evitar: ${ctx.alimentosEvitados.join(', ')}`,
      );
    }
    lineas.push('');
    lineas.push('PARÁMETROS DEL PLAN:');
    lineas.push(`- Días a generar: ${diasSolicitados.length}`);
    lineas.push(`- Días exactos: ${diasSolicitados.join(', ')}`);
    lineas.push(`- Comidas por día: ${tiposComidaSolicitados.length}`);
    lineas.push(
      `- Tipos exactos de comida: ${tiposComidaSolicitados.join(', ')}`,
    );
    lineas.push(`- Alternativas por comida: ${ctx.alternativasPorComida}`);
    lineas.push(
      `- Fecha de inicio: ${ctx.fechaInicio.toISOString().split('T')[0]}`,
    );
    lineas.push('');
    lineas.push(
      'Generá el plan en formato JSON respetando la estructura indicada.',
    );

    return lineas.join('\n');
  }

  private construirEsquemaJson(ctx: ContextoPromptPlanSemanal): string {
    const diasEsperados = this.obtenerDiasSolicitados(ctx);
    const tiposEsperados = this.obtenerTiposComidaSolicitados(ctx);
    const ejemploDia = diasEsperados[0];
    const ejemploTipo = tiposEsperados[0];
    const categoriasTexto = ctx.categoriasGruposAlimenticios
      ? `\nCategorías válidas para alimentos nuevos: ${ctx.categoriasGruposAlimenticios.join(', ')}.\n`
      : '';

    return `{
  "estructura": [
    {
      "dia": "${ejemploDia}",
      "comidas": [
        {
          "tipo": "${ejemploTipo}",
          "alternativas": [
            {
              "nombre": "string (nombre descriptivo del plato, formato: '[Proteína principal] con [guarnición]', ej: 'Merluza al horno con batata')",
              "alimentos": [
                {
                  "alimentoNombre": "string (nombre exacto del alimento en español)",
                  "cantidad": 0,
                  "unidad": "string (ej: 'g', 'ml', 'unidad')"
                }
              ],
              "calorias": 0,
              "proteinas": 0,
              "carbohidratos": 0,
              "grasas": 0
            }
          ]
        }
      ]
    }
  ],
  "alimentosNuevos": [
    {
      "nombre": "string (nombre del alimento nuevo, ej: 'Quinoa')",
      "categoriaNombre": "string (una de las categorías válidas listadas abajo)",
      "cantidadBase": 100,
      "unidadBase": "g",
      "calorias": 0,
      "proteinas": 0,
      "carbohidratos": 0,
      "grasas": 0
    }
  ],
  "macrosPorDia": {
    "${ejemploDia}": {
      "calorias": 0,
      "proteinas": 0,
      "carbohidratos": 0,
      "grasas": 0
    }
  },
  "razonamientoCumplimiento": {
    "restriccionesCumplidas": [
      { "restriccion": "string", "detalle": "string" }
    ],
    "restriccionesNoCumplidas": [
      {
        "restriccion": "string",
        "detalle": "string",
        "comida": "string (opcional)",
        "alternativa": 0,
        "alimento": "string (opcional)"
      }
    ]
  }
}
${categoriasTexto}Los días deben ser exactamente: ${diasEsperados.join(', ')}.
Las comidas deben ser exactamente: ${tiposEsperados.join(', ')}.
Si inventás un alimento que no existe en el catálogo, declarálo en alimentosNuevos con sus macros aproximados y la categoría correcta.`;
  }

  private construirEsquemaJsonComida(tipoComida: TipoComida): string {
    return `{
  "comida": {
    "tipo": "${tipoComida}",
    "alternativas": [
      {
        "nombre": "string (nombre descriptivo del plato, formato: '[Proteína principal] con [guarnición]', ej: 'Merluza al horno con batata')",
        "alimentos": [
          {
            "alimentoNombre": "string (nombre exacto del alimento en español)",
            "cantidad": 0,
            "unidad": "string (ej: 'g', 'ml', 'unidad')"
          }
        ],
        "calorias": 0,
        "proteinas": 0,
        "carbohidratos": 0,
        "grasas": 0
      }
    ]
  },
  "alimentosNuevos": []
}`;
  }

  private obtenerDiasSolicitados(ctx: ContextoPromptPlanSemanal): DiaSemana[] {
    if (ctx.diasEspecificos && ctx.diasEspecificos.length > 0) {
      return ctx.diasEspecificos;
    }
    return TODOS_LOS_DIAS.slice(0, ctx.diasAGenerar);
  }

  private obtenerTiposComidaSolicitados(
    ctx: ContextoPromptPlanSemanal,
  ): TipoComida[] {
    if (ctx.tiposComidaEspecificos && ctx.tiposComidaEspecificos.length > 0) {
      return ctx.tiposComidaEspecificos;
    }
    return TODOS_TIPOS_COMIDA.slice(0, ctx.comidasPorDia);
  }

  private consolidarNotas(
    preferenciasIa: string | null,
    notasGeneracion: string | null,
  ): string {
    const partes: string[] = [];
    if (preferenciasIa && preferenciasIa.trim().length > 0) {
      partes.push(`- Preferencias persistentes: ${preferenciasIa.trim()}`);
    }
    if (notasGeneracion && notasGeneracion.trim().length > 0) {
      partes.push(`- Notas para esta generación: ${notasGeneracion.trim()}`);
    }
    return partes.join('\n');
  }

  private formatearEjemplos(ejemplos: EjemploMemoria[]): string {
    return ejemplos
      .map((ej, idx) => {
        const marca = ej.tipoEjemplo === 'POSITIVO' ? '✓' : '✗';
        return `${idx + 1}. [${marca}] ${ej.tipoEjemplo}: ${ej.comentario}`;
      })
      .join('\n');
  }
}

const TODOS_LOS_DIAS: DiaSemana[] = [
  DiaSemana.LUNES,
  DiaSemana.MARTES,
  DiaSemana.MIERCOLES,
  DiaSemana.JUEVES,
  DiaSemana.VIERNES,
  DiaSemana.SABADO,
  DiaSemana.DOMINGO,
];

const TODOS_TIPOS_COMIDA: TipoComida[] = [
  TipoComida.DESAYUNO,
  TipoComida.ALMUERZO,
  TipoComida.MERIENDA,
  TipoComida.CENA,
  TipoComida.COLACION,
];
