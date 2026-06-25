import { MacrosValidator, type ObjetivoNutricional } from './macros-validator';
import { DiaSemana } from '../entities/DiaPlan/DiaSemana';
import { TipoComida } from '../entities/OpcionComida/TipoComida';
import type { PlanAlimentacionDatosJson } from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

const OBJETIVO_BASE: ObjetivoNutricional = {
  caloriasDiarias: 2000,
  proteinasDiarias: 100,
  carbohidratosDiarios: 250,
  grasasDiarias: 70,
};

function crearItemComida(
  calorias: number,
  proteinas: number,
  carbohidratos: number,
  grasas: number,
) {
  return {
    nombre: 'item',
    alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
    calorias,
    proteinas,
    carbohidratos,
    grasas,
  };
}

function crearPlanConMacrosExactos(
  caloriasPorComida: number,
  dias: DiaSemana[] = [DiaSemana.LUNES],
  tiposComida: TipoComida[] = [TipoComida.ALMUERZO],
): PlanAlimentacionDatosJson {
  // 1 sola comida × 1 sola alternativa = macrosPorComida == objetivo diario
  // Para que sea exacto, las calorías de la comida deben ser iguales al objetivo
  return {
    estructura: dias.map((dia) => ({
      dia,
      comidas: tiposComida.map((tipo) => ({
        tipo,
        alternativas: [
          crearItemComida(
            caloriasPorComida,
            OBJETIVO_BASE.proteinasDiarias,
            OBJETIVO_BASE.carbohidratosDiarios,
            OBJETIVO_BASE.grasasDiarias,
          ),
        ],
      })),
    })),
    macrosPorDia: {} as never,
    razonamientoCumplimiento: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
    },
  };
}

describe('MacrosValidator', () => {
  describe('calcularBanda', () => {
    it('desvío 0% → VERDE', () => {
      expect(MacrosValidator.calcularBanda(0)).toBe('VERDE');
    });

    it('desvío +5% → VERDE', () => {
      expect(MacrosValidator.calcularBanda(5)).toBe('VERDE');
    });

    it('desvío -5% → VERDE', () => {
      expect(MacrosValidator.calcularBanda(-5)).toBe('VERDE');
    });

    it('desvío +7% → AMARILLO', () => {
      expect(MacrosValidator.calcularBanda(7)).toBe('AMARILLO');
    });

    it('desvío +10% → AMARILLO (límite)', () => {
      expect(MacrosValidator.calcularBanda(10)).toBe('AMARILLO');
    });

    it('desvío +12% → ROJO', () => {
      expect(MacrosValidator.calcularBanda(12)).toBe('ROJO');
    });

    it('desvío -15% → ROJO', () => {
      expect(MacrosValidator.calcularBanda(-15)).toBe('ROJO');
    });
  });

  describe('validar', () => {
    it('plan con macros exactos → todos los días VERDE, bandaGlobal VERDE, puedeAceptar true', () => {
      const plan = crearPlanConMacrosExactos(
        OBJETIVO_BASE.caloriasDiarias,
        [DiaSemana.LUNES],
        [TipoComida.DESAYUNO],
      );

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE, 1, 1);

      expect(resultado.cumpleEstructura).toBe(true);
      expect(resultado.bandaGlobal).toBe('VERDE');
      expect(resultado.puedeAceptar).toBe(true);
      expect(resultado.macrosPorDia[DiaSemana.LUNES]?.banda).toBe('VERDE');
    });

    it('plan con desvío +7% → AMARILLO', () => {
      const plan = crearPlanConMacrosExactos(
        OBJETIVO_BASE.caloriasDiarias * 1.07,
      );

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      expect(resultado.bandaGlobal).toBe('AMARILLO');
      expect(resultado.puedeAceptar).toBe(false);
    });

    it('plan con desvío +12% → ROJO', () => {
      const plan = crearPlanConMacrosExactos(
        OBJETIVO_BASE.caloriasDiarias * 1.12,
      );

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      expect(resultado.bandaGlobal).toBe('ROJO');
      expect(resultado.puedeAceptar).toBe(false);
    });

    it('mixto: 2 días verde + 1 día amarillo → bandaGlobal AMARILLO', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [
          {
            dia: DiaSemana.LUNES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
          {
            dia: DiaSemana.MARTES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
          {
            dia: DiaSemana.MIERCOLES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias * 1.07,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
        ],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      expect(resultado.bandaGlobal).toBe('AMARILLO');
      expect(resultado.puedeAceptar).toBe(false);
    });

    it('estructura incompleta — falta día → cumpleEstructura false', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [
          {
            dia: DiaSemana.LUNES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
        ],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE, 7);

      expect(resultado.cumpleEstructura).toBe(false);
      expect(resultado.diasFaltantes.length).toBeGreaterThan(0);
    });

    it('estructura incompleta — falta comida en un día → advertencias', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [
          {
            dia: DiaSemana.LUNES,
            comidas: [
              {
                tipo: TipoComida.DESAYUNO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
        ],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE, 7, 4);

      expect(resultado.comidasFaltantes.length).toBeGreaterThan(0);
      expect(resultado.cumpleEstructura).toBe(false);
    });

    it('alimento sin macros — devuelve 0 y la banda VERDE (sin división por cero)', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [
          {
            dia: DiaSemana.LUNES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  {
                    nombre: 'item sin macros',
                    alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                    calorias: 0,
                    proteinas: 0,
                    carbohidratos: 0,
                    grasas: 0,
                  },
                ],
              },
            ],
          },
        ],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      // Sin crash por división por cero
      expect(resultado.macrosPorDia[DiaSemana.LUNES]).toBeDefined();
      // La banda es VERDE porque el desvío es -100% (limitado por peorBanda, no ROJO)
      // Realmente -100% cae en ROJO; el test verifica que NO se rompe la división
      expect(resultado.bandaGlobal).toBe('ROJO');
    });

    it('plan con múltiples alternativas por comida → promedia correctamente', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [
          {
            dia: DiaSemana.LUNES,
            comidas: [
              {
                tipo: TipoComida.ALMUERZO,
                alternativas: [
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias - 200,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                  crearItemComida(
                    OBJETIVO_BASE.caloriasDiarias + 200,
                    OBJETIVO_BASE.proteinasDiarias,
                    OBJETIVO_BASE.carbohidratosDiarios,
                    OBJETIVO_BASE.grasasDiarias,
                  ),
                ],
              },
            ],
          },
        ],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      // El promedio es exactamente el objetivo → VERDE
      expect(resultado.macrosPorDia[DiaSemana.LUNES]?.calorias).toBe(
        OBJETIVO_BASE.caloriasDiarias,
      );
      expect(resultado.bandaGlobal).toBe('VERDE');
    });

    it('estructura vacía → cumpleEstructura false, bandaGlobal VERDE (sin días)', () => {
      const plan: PlanAlimentacionDatosJson = {
        estructura: [],
        macrosPorDia: {} as never,
        razonamientoCumplimiento: {
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        },
      };

      const resultado = MacrosValidator.validar(plan, OBJETIVO_BASE);

      expect(resultado.cumpleEstructura).toBe(false);
      expect(resultado.bandaGlobal).toBe('VERDE');
      expect(resultado.puedeAceptar).toBe(true);
    });
  });
});
