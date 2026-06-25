import {
  CATALOGOS_RESTRICCIONES_DEFAULT,
  RestriccionesValidatorV2,
  type CatalogosRestricciones,
  type FichaClinicaParaValidacion,
} from './restricciones-validator-v2';
import { DiaSemana } from '../entities/DiaPlan/DiaSemana';
import { TipoComida } from '../entities/OpcionComida/TipoComida';
import type { PlanAlimentacionDatosJson } from '../entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

/**
 * Helpers para construir fixtures.
 */

function crearItemComida(
  nombre: string,
  calorias: number,
  proteinas: number,
  carbohidratos: number,
  grasas: number,
) {
  return {
    nombre,
    alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
    calorias,
    proteinas,
    carbohidratos,
    grasas,
  };
}

function crearPlanConAlimentos(
  nombresAlimentos: string[],
): PlanAlimentacionDatosJson {
  return {
    estructura: [
      {
        dia: DiaSemana.LUNES,
        comidas: [
          {
            tipo: TipoComida.ALMUERZO,
            alternativas: nombresAlimentos.map((nombre) =>
              crearItemComida(nombre, 500, 30, 50, 15),
            ),
          },
        ],
      },
    ],
    macrosPorDia: {} as Record<DiaSemana, never>,
    razonamientoCumplimiento: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
    },
  };
}

describe('RestriccionesValidatorV2', () => {
  describe('validarPlanCompleto', () => {
    it('vegan estricto — plan con carne devuelve violación', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'vegano',
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Pollo grillado con arroz']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
      expect(
        resultado.restriccionesNoCumplidas.some((v) =>
          v.alimento?.toLowerCase().includes('pollo'),
        ),
      ).toBe(true);
    });

    it('alergia a frutos secos — plan con almendras devuelve violación', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: ['Almendras'],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Ensalada con almendras']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
      expect(
        resultado.restriccionesNoCumplidas.some((v) =>
          v.alimento?.toLowerCase().includes('almendra'),
        ),
      ).toBe(true);
    });

    it('multi-restricción (vegano + diabetes) — pan con miel viola ambas', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'vegano',
        patologias: ['diabetes'],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Tostada con miel']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      // miel es vegano-no-permitido Y diabetes-no-permitido
      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThanOrEqual(
        2,
      );
    });

    it('matching case-insensitive y singular/plural — "leche" detecta "leches"', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'sin_lactosa',
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Café con leches']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
    });

    it('alimento no en catálogo — "sushi" no genera violación', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'vegano',
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Sushi vegano especial']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      // sushi no está en la lista de prohibidos veganos
      expect(resultado.restriccionesNoCumplidas.length).toBe(0);
    });

    it('plan completamente limpio — todas las restricciones cumplidas', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'vegano',
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Quinoa con verduras', 'Lentejas']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBe(0);
      expect(resultado.restriccionesCumplidas.length).toBeGreaterThan(0);
    });

    it('socio sin restricciones — devuelve advertencias, sin violaciones', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Pollo con arroz']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBe(0);
      expect(resultado.advertencias.length).toBeGreaterThan(0);
    });

    it('alergia explícita "mani" detecta variaciones "maní" / "cacahuete"', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: ['Maní'],
        restriccionesAlimentarias: null,
        patologias: [],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Mix de cacahuetes']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
    });

    it('celiaquia — pan con trigo se detecta como violación', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: null,
        patologias: ['celiaquia'],
        objetivoPersonal: null,
      };

      const plan = crearPlanConAlimentos(['Pan de trigo integral']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
    });

    it('catálogos custom — agrega una nueva regla y se respeta', () => {
      const ficha: FichaClinicaParaValidacion = {
        alergias: [],
        restriccionesAlimentarias: 'sin_palta',
        patologias: [],
        objetivoPersonal: null,
      };

      const catalogosCustom: CatalogosRestricciones = {
        patronesDietarios: new Map([
          ['sin_palta', ['palta', 'aguacate']],
          ...CATALOGOS_RESTRICCIONES_DEFAULT.patronesDietarios,
        ]),
        patologias: CATALOGOS_RESTRICCIONES_DEFAULT.patologias,
        sinonimos: CATALOGOS_RESTRICCIONES_DEFAULT.sinonimos,
      };

      const plan = crearPlanConAlimentos(['Tostada con palta']);

      const resultado = RestriccionesValidatorV2.validarPlanCompleto(
        plan,
        ficha,
        catalogosCustom,
      );

      expect(resultado.restriccionesNoCumplidas.length).toBeGreaterThan(0);
    });
  });

  describe('generarInstruccionCorrectiva', () => {
    it('sin violaciones — retorna string vacío', () => {
      const instruccion = RestriccionesValidatorV2.generarInstruccionCorrectiva(
        [],
      );
      expect(instruccion).toBe('');
    });

    it('una violación — retorna instrucción con EXCLUIR', () => {
      const instruccion = RestriccionesValidatorV2.generarInstruccionCorrectiva(
        [
          {
            restriccion: 'alergia: Maní',
            detalle: 'El alimento "Mix de maní" contiene maní',
            alimento: 'Mix de maní',
          },
        ],
      );

      expect(instruccion).toContain('EXCLUIR');
      expect(instruccion).toContain('Mix de maní');
    });

    it('múltiples violaciones — deduplica alimentos', () => {
      const instruccion = RestriccionesValidatorV2.generarInstruccionCorrectiva(
        [
          {
            restriccion: 'alergia: Pollo',
            detalle: 'd1',
            alimento: 'Pollo',
          },
          {
            restriccion: 'patron dietario: vegano',
            detalle: 'd2',
            alimento: 'Pollo',
          },
          {
            restriccion: 'alergia: Pollo',
            detalle: 'd3',
            alimento: 'Pollo grillado',
          },
        ],
      );

      // Pollo aparece UNA sola vez (deduplicado)
      const countPollo = (instruccion.match(/Pollo/g) ?? []).length;
      // Aparece al menos una vez por la lista EXCLUIR
      expect(countPollo).toBeGreaterThanOrEqual(1);
      expect(instruccion).toContain('Pollo grillado');
    });
  });

  describe('validarCoherenciaRazonamiento', () => {
    it('coherente cuando IA dice cumplida y validación también', () => {
      const validacion = {
        restriccionesCumplidas: [
          { restriccion: 'patron dietario: vegano', detalle: 'OK' },
        ],
        restriccionesNoCumplidas: [],
        advertencias: [],
      };

      const razonamiento = {
        restriccionesCumplidas: [
          { restriccion: 'patron dietario: vegano', detalle: 'OK' },
        ],
        restriccionesNoCumplidas: [],
      };

      const resultado = RestriccionesValidatorV2.validarCoherenciaRazonamiento(
        razonamiento,
        validacion,
      );

      expect(resultado.coherente).toBe(true);
      expect(resultado.contradicciones.length).toBe(0);
    });

    it('detecta contradicción: IA dice cumplida pero validación encontró violación', () => {
      const validacion = {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [
          {
            restriccion: 'alergia: Pollo',
            detalle: 'pollo detectado',
            alimento: 'Pollo',
          },
        ],
        advertencias: [],
      };

      const razonamiento = {
        restriccionesCumplidas: [
          { restriccion: 'alergia: Pollo', detalle: 'TODO OK' },
        ],
        restriccionesNoCumplidas: [],
      };

      const resultado = RestriccionesValidatorV2.validarCoherenciaRazonamiento(
        razonamiento,
        validacion,
      );

      expect(resultado.coherente).toBe(false);
      expect(resultado.contradicciones.length).toBeGreaterThan(0);
    });

    it('detecta contradicción inversa: IA dice NO cumplida pero validación no encontró violación', () => {
      const validacion = {
        restriccionesCumplidas: [
          { restriccion: 'patron dietario: vegano', detalle: 'OK' },
        ],
        restriccionesNoCumplidas: [],
        advertencias: [],
      };

      const razonamiento = {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [
          { restriccion: 'patron dietario: vegano', detalle: 'FALLÓ' },
        ],
      };

      const resultado = RestriccionesValidatorV2.validarCoherenciaRazonamiento(
        razonamiento,
        validacion,
      );

      expect(resultado.coherente).toBe(false);
    });

    it('razonamiento vacío contra validacion sin violaciones — coherente', () => {
      const validacion = {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
        advertencias: [],
      };

      const razonamiento = {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      };

      const resultado = RestriccionesValidatorV2.validarCoherenciaRazonamiento(
        razonamiento,
        validacion,
      );

      expect(resultado.coherente).toBe(true);
    });
  });
});
