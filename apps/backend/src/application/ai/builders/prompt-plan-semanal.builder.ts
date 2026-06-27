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
  alternativasPorComida: number;
  fechaInicio: Date;
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

  private construirSystemPrompt(ctx: ContextoPromptPlanSemanal): string {
    const lineas: string[] = [];
    const diasSolicitados = this.obtenerDiasSolicitados(ctx);
    const cantidadDias = diasSolicitados.length;

    lineas.push(
      'Eres un nutricionista profesional argentino. Tu tarea es generar un plan de alimentación semanal detallado para un socio.',
    );
    lineas.push('');

    lineas.push('REGLAS DURAS (no negociables):');
    lineas.push(`1. El plan debe tener EXACTAMENTE ${cantidadDias} días.`);
    lineas.push(
      `2. Cada día debe tener EXACTAMENTE ${ctx.comidasPorDia} comidas.`,
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
      '8. Variá los alimentos entre días y entre alternativas para evitar monotonía.',
    );
    lineas.push(
      '9. Los alimentos deben estar referenciados por su nombre común en español.',
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
      `- Cada día debe tener ${ctx.comidasPorDia} comidas y cada comida ${ctx.alternativasPorComida} alternativas.`,
    );
    lineas.push(
      `- Debe haber ${cantidadDias * ctx.comidasPorDia * ctx.alternativasPorComida} alternativas en total.`,
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
    lineas.push('');
    lineas.push('PARÁMETROS DEL PLAN:');
    lineas.push(`- Días a generar: ${diasSolicitados.length}`);
    lineas.push(`- Días exactos: ${diasSolicitados.join(', ')}`);
    lineas.push(`- Comidas por día: ${ctx.comidasPorDia}`);
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
    // Lista de días esperados
    const diasEsperados = this.obtenerDiasSolicitados(ctx);
    const tiposEsperados = TODOS_TIPOS_COMIDA.slice(0, ctx.comidasPorDia);

    const ejemploDia = diasEsperados[0];
    const ejemploTipo = tiposEsperados[0];

    return `{
  "estructura": [
    {
      "dia": "${ejemploDia}",
      "comidas": [
        {
          "tipo": "${ejemploTipo}",
          "alternativas": [
            {
              "nombre": "string (ej: 'Pollo grillado con quinoa')",
              "alimentos": [
                {
                  "alimentoId": 0,
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

Los días deben ser exactamente: ${diasEsperados.join(', ')}.
Las comidas deben ser exactamente: ${tiposEsperados.join(', ')}.`;
  }

  private obtenerDiasSolicitados(ctx: ContextoPromptPlanSemanal): DiaSemana[] {
    if (ctx.diasEspecificos && ctx.diasEspecificos.length > 0) {
      return ctx.diasEspecificos;
    }
    return TODOS_LOS_DIAS.slice(0, ctx.diasAGenerar);
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
