/**
 * Spec del PromptRegeneracionBuilder
 * ===================================
 *
 * Cobertura:
 *  - Scope PLAN: sin preserved context.
 *  - Scope DIA: preserved context de los OTROS días.
 *  - Scope ALTERNATIVA: preserved context de las otras alternativas y resto.
 *  - Validación: scope=DIA sin dia → throw; scope=ALTERNATIVA sin comidaSlot → throw.
 *  - Notas del NUT + memoria IA aparecen en el system prompt.
 */

import { PromptRegeneracionBuilder } from './prompt-regeneracion.builder';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import type { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

const planBase: PlanAlimentacionDatosJson = {
  estructura: [
    {
      dia: DiaSemana.LUNES,
      comidas: [
        {
          tipo: TipoComida.DESAYUNO,
          alternativas: [
            {
              nombre: 'Avena con frutas',
              alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 25,
              carbohidratos: 60,
              grasas: 12,
            },
            {
              nombre: 'Tostadas con huevo',
              alimentos: [{ alimentoId: 2, cantidad: 80, unidad: 'g' }],
              calorias: 480,
              proteinas: 28,
              carbohidratos: 55,
              grasas: 14,
            },
          ],
        },
      ],
    },
    {
      dia: DiaSemana.MARTES,
      comidas: [
        {
          tipo: TipoComida.DESAYUNO,
          alternativas: [
            {
              nombre: 'Yogur con granola',
              alimentos: [{ alimentoId: 3, cantidad: 150, unidad: 'g' }],
              calorias: 490,
              proteinas: 26,
              carbohidratos: 58,
              grasas: 13,
            },
          ],
        },
      ],
    },
  ],
  macrosPorDia: {
    [DiaSemana.LUNES]: {
      calorias: 2000,
      proteinas: 100,
      carbohidratos: 250,
      grasas: 70,
    },
    [DiaSemana.MARTES]: {
      calorias: 2000,
      proteinas: 100,
      carbohidratos: 250,
      grasas: 70,
    },
  } as Record<DiaSemana, never>,
  razonamientoCumplimiento: {
    restriccionesCumplidas: [],
    restriccionesNoCumplidas: [],
  },
};

describe('PromptRegeneracionBuilder', () => {
  let builder: PromptRegeneracionBuilder;

  beforeEach(() => {
    builder = new PromptRegeneracionBuilder();
  });

  it('construye prompt para scope PLAN sin preserved context', () => {
    const result = builder.construir({
      fichaClinica: {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: 'mantener peso',
      },
      nutricionista: { preferenciasIa: null },
      notasGeneracion: null,
      ejemplosMemoria: [],
      versionActual: planBase,
      scope: 'PLAN',
    });

    expect(result.systemPrompt).toContain('REGENERAR');
    expect(result.systemPrompt).toContain('ALCANCE DE LA REGENERACIÓN:');
    expect(result.systemPrompt).toContain(
      'Regenerá el plan COMPLETO (todos los días y comidas)',
    );
    expect(result.systemPrompt).toContain('No hay contexto preservado');
    expect(result.userPrompt).toContain('mantener peso');
  });

  it('construye prompt para scope DIA con preserved context de los OTROS días', () => {
    const result = builder.construir({
      fichaClinica: {
        alergias: ['maní'],
        restriccionesAlimentarias: 'vegano',
        patologias: [],
        objetivoPersonal: null,
      },
      nutricionista: { preferenciasIa: 'prefiero opciones simples' },
      notasGeneracion: 'evitar harinas',
      ejemplosMemoria: [
        { tipoEjemplo: 'POSITIVO', comentario: 'buen uso de legumbres' },
      ],
      versionActual: planBase,
      scope: 'DIA',
      dia: DiaSemana.LUNES,
    });

    expect(result.systemPrompt).toContain('Regenerá SOLO el día LUNES');
    expect(result.systemPrompt).toContain('CONTEXTO PRESERVADO');
    expect(result.systemPrompt).toContain('Día MARTES');
    expect(result.systemPrompt).toContain('INSTRUCCIONES DEL NUTRICIONISTA');
    expect(result.systemPrompt).toContain('prefiero opciones simples');
    expect(result.systemPrompt).toContain('evitar harinas');
    expect(result.systemPrompt).toContain('EJEMPLOS DE FEEDBACK');
    expect(result.systemPrompt).toContain(
      '[✓] POSITIVO: buen uso de legumbres',
    );
    expect(result.userPrompt).toContain('maní');
    expect(result.userPrompt).toContain('vegano');
  });

  it('construye prompt para scope ALTERNATIVA preservando las demás alternativas', () => {
    const result = builder.construir({
      fichaClinica: {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      },
      nutricionista: { preferenciasIa: null },
      notasGeneracion: null,
      ejemplosMemoria: [],
      versionActual: planBase,
      scope: 'ALTERNATIVA',
      dia: DiaSemana.LUNES,
      comidaSlot: TipoComida.DESAYUNO,
      alternativaIndex: 0,
    });

    expect(result.systemPrompt).toContain(
      'Regenerá SOLO la alternativa #0 de la comida "DESAYUNO"',
    );
    // Debe mostrar el resto de las alternativas como referencia
    expect(result.systemPrompt).toContain('DESAYUNO alt#1: Tostadas con huevo');
    // El día MARTES aparece como "preservado completo"
    expect(result.systemPrompt).toContain('Día MARTES: (preservado completo)');
  });

  it('throw si scope=DIA sin campo `dia`', () => {
    expect(() =>
      builder.construir({
        fichaClinica: {
          alergias: [],
          restriccionesAlimentarias: null,
          patologias: [],
          objetivoPersonal: null,
        },
        nutricionista: { preferenciasIa: null },
        notasGeneracion: null,
        ejemplosMemoria: [],
        versionActual: planBase,
        scope: 'DIA',
        // dia ausente
      }),
    ).toThrow(/scope=DIA requiere `dia`/);
  });

  it('throw si scope=ALTERNATIVA sin comidaSlot', () => {
    expect(() =>
      builder.construir({
        fichaClinica: {
          alergias: [],
          restriccionesAlimentarias: null,
          patologias: [],
          objetivoPersonal: null,
        },
        nutricionista: { preferenciasIa: null },
        notasGeneracion: null,
        ejemplosMemoria: [],
        versionActual: planBase,
        scope: 'ALTERNATIVA',
        dia: DiaSemana.LUNES,
        alternativaIndex: 0,
        // comidaSlot ausente
      }),
    ).toThrow(/scope=ALTERNATIVA requiere `comidaSlot`/);
  });

  it('throw si scope=ALTERNATIVA con alternativaIndex negativo', () => {
    expect(() =>
      builder.construir({
        fichaClinica: {
          alergias: [],
          restriccionesAlimentarias: null,
          patologias: [],
          objetivoPersonal: null,
        },
        nutricionista: { preferenciasIa: null },
        notasGeneracion: null,
        ejemplosMemoria: [],
        versionActual: planBase,
        scope: 'ALTERNATIVA',
        dia: DiaSemana.LUNES,
        comidaSlot: TipoComida.DESAYUNO,
        alternativaIndex: -1,
      }),
    ).toThrow(/alternativaIndex >= 0/);
  });

  it('omite sección INSTRUCCIONES si no hay preferencias ni notas', () => {
    const result = builder.construir({
      fichaClinica: {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      },
      nutricionista: { preferenciasIa: null },
      notasGeneracion: null,
      ejemplosMemoria: [],
      versionActual: planBase,
      scope: 'PLAN',
    });

    expect(result.systemPrompt).not.toContain(
      'INSTRUCCIONES DEL NUTRICIONISTA',
    );
  });
});
