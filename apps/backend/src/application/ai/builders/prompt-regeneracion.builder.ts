/**
 * PromptRegeneracionBuilder
 * =========================
 *
 * Construye los prompts (system + user) para REGENERAR un subconjunto de
 * un plan de alimentación ya generado/editado. A diferencia del
 * `PromptPlanSemanalBuilder` (que parte de cero), este builder preserva
 * el contexto existente para mantener variedad y consistencia.
 *
 * Tres scopes soportados:
 *  - `PLAN`:        regenera el plan entero pero conserva las notas del NUT.
 *  - `DIA`:         regenera un único día preservando los otros 6.
 *  - `ALTERNATIVA`: regenera una sola alternativa preservando las demás.
 *
 * El preserved context se pasa como `versionActual` con la estructura
 * del JSON snapshot. El builder extrae las comidas de los días que NO se
 * regeneran y las inyecta al prompt como referencia de variedad.
 *
 * Por qué separado del PromptPlanSemanalBuilder: el contexto preservado
 * es lógica de aplicación que evoluciona independientemente. Mantener
 * builders separados facilita tests focalizados.
 */

import { Injectable } from '@nestjs/common';
import { DiaSemana } from '../../../domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from '../../../domain/entities/OpcionComida/TipoComida';
import type {
  PlanAlimentacionDatosJson,
  ItemComidaSnapshot,
} from '../../../domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

export type ScopeRegeneracion = 'PLAN' | 'DIA' | 'ALTERNATIVA';

export interface FichaClinicaParaPromptRegen {
  alergias: string[];
  restriccionesAlimentarias: string | null;
  patologias: string[];
  objetivoPersonal: string | null;
}

export interface EjemploMemoriaRegen {
  tipoEjemplo: 'POSITIVO' | 'NEGATIVO';
  comentario: string;
}

export interface ContextoPromptRegeneracion {
  /** Datos clínicos del socio (mismo shape que el builder de plan semanal) */
  fichaClinica: FichaClinicaParaPromptRegen;
  nutricionista: {
    preferenciasIa: string | null;
  };
  notasGeneracion: string | null;
  ejemplosMemoria: EjemploMemoriaRegen[];
  /** Snapshot de la versión actual que se está regenerando */
  versionActual: PlanAlimentacionDatosJson;
  /** Scope de la regeneración */
  scope: ScopeRegeneracion;
  /** Día a regenerar (requerido si scope=DIA o ALTERNATIVA) */
  dia?: DiaSemana;
  /** Tipo de comida a regenerar (requerido si scope=ALTERNATIVA) */
  comidaSlot?: TipoComida;
  /** Índice de la alternativa a regenerar (requerido si scope=ALTERNATIVA) */
  alternativaIndex?: number;
  /** Nombres de las 26 categorías de grupo alimenticio (para que la IA elija categoriaNombre válido). */
  categoriasGruposAlimenticios?: string[];
}

export interface PromptRegeneracionResultado {
  systemPrompt: string;
  userPrompt: string;
}

@Injectable()
export class PromptRegeneracionBuilder {
  construir(contexto: ContextoPromptRegeneracion): PromptRegeneracionResultado {
    this.validarContexto(contexto);
    const systemPrompt = this.construirSystemPrompt(contexto);
    const userPrompt = this.construirUserPrompt(contexto);
    return { systemPrompt, userPrompt };
  }

  private validarContexto(ctx: ContextoPromptRegeneracion): void {
    if (ctx.scope === 'DIA' && !ctx.dia) {
      throw new Error('PromptRegeneracionBuilder: scope=DIA requiere `dia`');
    }
    if (ctx.scope === 'ALTERNATIVA') {
      if (!ctx.dia) {
        throw new Error(
          'PromptRegeneracionBuilder: scope=ALTERNATIVA requiere `dia`',
        );
      }
      if (!ctx.comidaSlot) {
        throw new Error(
          'PromptRegeneracionBuilder: scope=ALTERNATIVA requiere `comidaSlot`',
        );
      }
      if (
        ctx.alternativaIndex === undefined ||
        ctx.alternativaIndex === null ||
        ctx.alternativaIndex < 0
      ) {
        throw new Error(
          'PromptRegeneracionBuilder: scope=ALTERNATIVA requiere `alternativaIndex >= 0`',
        );
      }
    }
  }

  private construirSystemPrompt(ctx: ContextoPromptRegeneracion): string {
    const lineas: string[] = [];

    lineas.push(
      'Eres un nutricionista profesional argentino. Tu tarea es REGENERAR un subconjunto específico de un plan de alimentación ya existente.',
    );
    lineas.push('');

    lineas.push('REGLAS DURAS (no negociables):');
    lineas.push(
      '1. NUNCA incluyas ingredientes que estén en las alergias del socio.',
    );
    lineas.push(
      '2. NUNCA incluyas alimentos prohibidos por las restricciones alimentarias.',
    );
    lineas.push(
      '3. Considera las patologías (ej: diabetes → evitar azúcares).',
    );
    lineas.push(
      '4. Variá los alimentos respecto al contexto preservado (no repitas exactamente las mismas preparaciones).',
    );
    lineas.push(
      '5. Mantené los macronutrientes aproximadamente similares al target diario (±10%).',
    );
    lineas.push(
      '6. Si un alimento no existe en el catálogo, declarálo en el array alimentosNuevos con macros aproximados y categoría correcta.',
    );
    lineas.push('');

    // Scope + target específico
    lineas.push('ALCANCE DE LA REGENERACIÓN:');
    if (ctx.scope === 'PLAN') {
      lineas.push(
        '- Regenerá el plan COMPLETO (todos los días y comidas). Mantené la estructura general pero variá los alimentos.',
      );
    } else if (ctx.scope === 'DIA') {
      lineas.push(
        `- Regenerá SOLO el día ${ctx.dia}. Los otros días deben quedar EXACTAMENTE iguales al contexto preservado.`,
      );
    } else {
      lineas.push(
        `- Regenerá SOLO la alternativa #${ctx.alternativaIndex} de la comida "${ctx.comidaSlot}" del día ${ctx.dia}. El resto de la estructura debe quedar EXACTAMENTE igual al contexto preservado.`,
      );
    }
    lineas.push('');

    // Contexto preservado (clave de la regeneración)
    const contextoPreservado = this.extraerContextoPreservado(ctx);
    if (contextoPreservado.length > 0) {
      lineas.push('CONTEXTO PRESERVADO (NO regenerar — solo referencia):');
      lineas.push(contextoPreservado);
      lineas.push('');
    }

    // Notas + memoria (mismo patrón que el builder del plan semanal)
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

    // Esquema esperado
    lineas.push('ESTRUCTURA DEL JSON DE SALIDA:');
    lineas.push(this.construirEsquemaJson(ctx));
    lineas.push('');

    lineas.push(
      'IMPORTANTE: Respondé ÚNICAMENTE con el JSON solicitado, sin markdown, sin explicaciones, sin texto adicional.',
    );

    return lineas.join('\n');
  }

  private construirUserPrompt(ctx: ContextoPromptRegeneracion): string {
    const lineas: string[] = [];

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
    lineas.push(
      'Generá el JSON respetando el alcance indicado y manteniendo variedad respecto al contexto preservado.',
    );

    return lineas.join('\n');
  }

  /**
   * Extrae el contexto preservado según el scope:
   *  - PLAN:        nada (se regenera todo)
   *  - DIA:         las comidas de los OTROS días (resumidas)
   *  - ALTERNATIVA: las demás alternativas de la misma comida + el resto
   */
  private extraerContextoPreservado(ctx: ContextoPromptRegeneracion): string {
    const lineas: string[] = [];

    if (ctx.scope === 'PLAN') {
      lineas.push(
        '(No hay contexto preservado — el plan entero se regenera. Mantené las preferencias y restricciones del socio.)',
      );
      return lineas.join('\n');
    }

    if (ctx.scope === 'DIA' && ctx.dia) {
      // Preservar todos los días EXCEPTO el que se regenera
      for (const diaCtx of ctx.versionActual.estructura) {
        if (diaCtx.dia === ctx.dia) continue;
        lineas.push(`- Día ${diaCtx.dia}:`);
        for (const comida of diaCtx.comidas) {
          const nombres = comida.alternativas
            .map((a) => a.nombre)
            .filter(Boolean)
            .join(' | ');
          lineas.push(`    ${comida.tipo}: ${nombres || '(sin nombre)'}`);
        }
      }
      return lineas.join('\n');
    }

    if (ctx.scope === 'ALTERNATIVA' && ctx.dia && ctx.comidaSlot) {
      // Preservar: las otras alternativas de la misma comida + estructura del mismo día + resto
      for (const diaCtx of ctx.versionActual.estructura) {
        if (diaCtx.dia !== ctx.dia) {
          lineas.push(`- Día ${diaCtx.dia}: (preservado completo)`);
          continue;
        }
        lineas.push(`- Día ${diaCtx.dia}:`);
        for (const comida of diaCtx.comidas) {
          if (comida.tipo !== ctx.comidaSlot) {
            const nombres = comida.alternativas
              .map((a) => a.nombre)
              .filter(Boolean)
              .join(' | ');
            lineas.push(`    ${comida.tipo}: ${nombres || '(sin nombre)'}`);
            continue;
          }
          // Misma comida: mostrar las alternativas que NO se regeneran
          for (let idx = 0; idx < comida.alternativas.length; idx++) {
            if (idx === ctx.alternativaIndex) continue;
            const alt = comida.alternativas[idx];
            lineas.push(
              `    ${comida.tipo} alt#${idx}: ${alt.nombre || '(sin nombre)'}`,
            );
          }
        }
      }
      return lineas.join('\n');
    }

    return lineas.join('\n');
  }

  private construirEsquemaJson(ctx: ContextoPromptRegeneracion): string {
    const categoriasTexto = ctx.categoriasGruposAlimenticios
      ? `\nCategorías válidas para alimentos nuevos: ${ctx.categoriasGruposAlimenticios.join(', ')}.\n`
      : '';

    return `{
  "estructura": [
    {
      "dia": "${ctx.dia ?? DiaSemana.LUNES}",
      "comidas": [
        {
          "tipo": "${ctx.comidaSlot ?? TipoComida.DESAYUNO}",
          "alternativas": [
            {
              "nombre": "string (ej: 'Pollo grillado con quinoa')",
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
    "${ctx.dia ?? DiaSemana.LUNES}": {
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
${categoriasTexto}Si inventás un alimento que no existe en el catálogo, declarálo en alimentosNuevos con sus macros aproximados y la categoría correcta.`;
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
      partes.push(`- Notas para esta regeneración: ${notasGeneracion.trim()}`);
    }
    return partes.join('\n');
  }

  private formatearEjemplos(ejemplos: EjemploMemoriaRegen[]): string {
    return ejemplos
      .map((ej, idx) => {
        const marca = ej.tipoEjemplo === 'POSITIVO' ? '✓' : '✗';
        return `${idx + 1}. [${marca}] ${ej.tipoEjemplo}: ${ej.comentario}`;
      })
      .join('\n');
  }
}

// Re-export para evitar warnings de tipos no usados
export type { ItemComidaSnapshot };
