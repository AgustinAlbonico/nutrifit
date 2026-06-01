import { ValidadorPlanSemanalUseCase } from './validador-plan-semanal.use-case';
import { PlanSemanalIA, ContextoPaciente, TipoComida } from '@nutrifit/shared';

describe('ValidadorPlanSemanalUseCase — Validaciones estrictas', () => {
  let validador: ValidadorPlanSemanalUseCase;

  const contextoBase: ContextoPaciente = {
    socioId: 1,
    objetivoPersonal: 'Bajar de peso',
    nivelActividadFisica: 'MODERADO',
    peso: 80,
    altura: 175,
    alergias: [],
    patologias: [],
    restriccionesAlimentarias: null,
    frecuenciaComidas: '4',
    consumoAguaDiario: 2000,
    medicamentosActuales: null,
    suplementosActuales: null,
    consumoAlcohol: null,
    fumaTabaco: false,
    horasSueno: 7,
    cirugiasPrevias: null,
    antecedentesFamiliares: null,
  };

  const crearComidaValida = (
    tipo: TipoComida,
    override: Partial<{
      nombre: string;
      descripcion: string;
      ingredientes: string[];
      caloriasEstimadas: number;
      proteinas: number;
      carbohidratos: number;
      grasas: number;
    }> = {},
  ): Parameters<
    (typeof ValidadorPlanSemanalUseCase.prototype)['validar']
  >[0]['dias'][0]['comidas'][0] => ({
    nombre: 'Comida test',
    descripcion: 'Descripción test',
    ingredientes: ['arroz', 'pollo'],
    caloriasEstimadas: 400,
    proteinas: 30,
    carbohidratos: 45,
    grasas: 12,
    tipoComida: tipo,
    ...override,
  });

  const crearDiaValido = (
    numero: number,
    comidas: Parameters<
      (typeof ValidadorPlanSemanalUseCase.prototype)['validar']
    >[0]['dias'][0]['comidas'],
  ) => ({
    dia: numero,
    comidas,
  });

  const crearPlanValido = (dias = 7): PlanSemanalIA => ({
    dias: Array.from({ length: dias }, (_, i) =>
      crearDiaValido(i + 1, [
        crearComidaValida('DESAYUNO'),
        crearComidaValida('ALMUERZO'),
        crearComidaValida('MERIENDA'),
        crearComidaValida('CENA'),
        crearComidaValida('COLACION'),
      ]),
    ),
    caloriasTotalesDiarias: 2000,
    disclaimer: '',
  });

  beforeEach(() => {
    validador = new ValidadorPlanSemanalUseCase();
  });

  // ─────────────────────────────────────────────────────
  // GAP 1: Validar macros (proteinas, carbohidratos, grasas)
  // ─────────────────────────────────────────────────────

  describe('Validación de macros (proteinas, carbohidratos, grasas)', () => {
    it('debe rechazar comida con proteinas negativas', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        proteinas: -5,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('proteinas'))).toBe(true);
    });

    it('debe rechazar comida con carbohidratos negativos', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        carbohidratos: -10,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('carbohidratos'))).toBe(
        true,
      );
    });

    it('debe rechazar comida con grasas negativas', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', { grasas: -8 });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('grasas'))).toBe(true);
    });

    it('debe rechazar comida sin propiedad proteinas (undefined)', () => {
      const comida = crearComidaValida('DESAYUNO');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { proteinas: _, ...sinProteinas } = comida;

      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = sinProteinas as typeof comida;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('proteinas'))).toBe(true);
    });

    it('debe rechazar comida sin propiedad carbohidratos', () => {
      const comida = crearComidaValida('DESAYUNO');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { carbohidratos: _, ...sinCarbohidratos } = comida;

      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = sinCarbohidratos as typeof comida;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('carbohidratos'))).toBe(
        true,
      );
    });

    it('debe rechazar comida sin propiedad grasas', () => {
      const comida = crearComidaValida('DESAYUNO');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { grasas: _, ...sinGrasas } = comida;

      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = sinGrasas as typeof comida;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(resultado.errores.some((e) => e.includes('grasas'))).toBe(true);
    });

    it('debe aceptar comida con macros válidos (cero o positivo)', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        proteinas: 0,
        carbohidratos: 0,
        grasas: 0,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // GAP 2: Rechazar calorías negativas explícitamente
  // ─────────────────────────────────────────────────────

  describe('Rechazo explícito de calorías negativas', () => {
    it('debe rechazar comida con caloriasEstimadas negativo', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        caloriasEstimadas: -100,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(
        resultado.errores.some(
          (e) => e.includes('negativa') || e.includes('calorías'),
        ),
      ).toBe(true);
    });

    it('debe rechazar comida con caloriasEstimadas igual a cero', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        caloriasEstimadas: 0,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
    });

    it('debe rechazar comida sin propiedad caloriasEstimadas', () => {
      const comida = crearComidaValida('DESAYUNO');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { caloriasEstimadas: _, ...sinCalorias } = comida;

      const plan = crearPlanValido(1);
      plan.dias[0].comidas[0] = sinCalorias as typeof comida;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
    });

    it('debe aceptar comida con caloriasEstimadas positivo', () => {
      const plan = crearPlanValido(1);
      // Use 390 instead of 400 so sum (390+400+400+400+400=1990) stays within 100 margin of 2000
      plan.dias[0].comidas[0] = crearComidaValida('DESAYUNO', {
        caloriasEstimadas: 390,
      });

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // GAP 3: Exactamente 5 comidas por día
  // ─────────────────────────────────────────────────────

  describe('Exactamente 5 comidas por día', () => {
    it('debe rechazar día con más de 5 comidas', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas.push(crearComidaValida('COLACION'));

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(
        resultado.errores.some(
          (e) => e.includes('5 comidas') || e.includes('exacto'),
        ),
      ).toBe(true);
    });

    it('debe rechazar día con menos de 5 comidas', () => {
      const plan = crearPlanValido(1);
      plan.dias[0].comidas = plan.dias[0].comidas.slice(0, 4); // solo 4

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(
        resultado.errores.some(
          (e) => e.includes('5 comidas') || e.includes('exacto'),
        ),
      ).toBe(true);
    });

    it('debe rechazar día con exactamente 5 comidas pero tipo duplicado', () => {
      const plan = crearPlanValido(1);
      // Reemplazo una COLACION valida por otro DESAYUNO (duplicado de tipo)
      plan.dias[0].comidas[4] = crearComidaValida('DESAYUNO');

      const resultado = validador.validar(plan, contextoBase, 1);

      // Debe fallar o bien por tipo duplicado o bien porque falta COLACION
      expect(resultado.valido).toBe(false);
    });

    it('debe aceptar día con exactamente 5 comidas distintas válidas', () => {
      const plan = crearPlanValido(1);

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────
  // GAP 4: Suma de calorías de comidas vs caloriasTotalesDiarias con margen
  // ─────────────────────────────────────────────────────

  describe('Suma de calorías de comidas vs caloriasTotalesDiarias', () => {
    it('debe rechazar cuando la suma de calorías excede el margen permitido', () => {
      const plan = crearPlanValido(1);
      // Seteo cada comida con calorías que sumen mucho más que 2000
      plan.dias[0].comidas.forEach((c) => {
        c.caloriasEstimadas = 600; // 5 × 600 = 3000, excede 2000 por 1000
      });
      plan.caloriasTotalesDiarias = 2000;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(
        resultado.errores.some(
          (e) =>
            e.includes('suma de calorías') ||
            e.includes('calorías totales') ||
            e.includes('margen'),
        ),
      ).toBe(true);
    });

    it('debe rechazar cuando la suma de calorías es significativamente menor al total', () => {
      const plan = crearPlanValido(1);
      // Seteo cada comida con calorías muy bajas
      plan.dias[0].comidas.forEach((c) => {
        c.caloriasEstimadas = 50; // 5 × 50 = 250 vs 2000
      });
      plan.caloriasTotalesDiarias = 2000;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(false);
      expect(
        resultado.errores.some(
          (e) =>
            e.includes('suma de calorías') ||
            e.includes('calorías totales') ||
            e.includes('margen'),
        ),
      ).toBe(true);
    });

    it('debe aceptar cuando la suma de calorías está dentro del margen', () => {
      const plan = crearPlanValido(1);
      // 5 comidas × 400 = 2000 exactas
      plan.dias[0].comidas.forEach((c) => {
        c.caloriasEstimadas = 400;
      });
      plan.caloriasTotalesDiarias = 2000;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(true);
    });

    it('debe aceptar cuando la suma de calorías está dentro del margen (caso con decimales)', () => {
      const plan = crearPlanValido(1);
      // 5 comidas: 350 + 550 + 200 + 450 + 430 = 1980, dentro de margen de 2000
      const calories = [350, 550, 200, 450, 430];
      plan.dias[0].comidas.forEach((c, i) => {
        c.caloriasEstimadas = calories[i];
      });
      plan.caloriasTotalesDiarias = 2000;

      const resultado = validador.validar(plan, contextoBase, 1);

      expect(resultado.valido).toBe(true);
    });
  });
});
