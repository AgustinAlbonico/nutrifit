import { RestriccionesValidator } from './restricciones-validator.service';

describe('RestriccionesValidator.validarAlternativa', () => {
  let sut: RestriccionesValidator;

  beforeEach(() => {
    sut = new RestriccionesValidator({} as never);
  });

  it('rechaza alternativa con alergia (critico)', () => {
    const ficha = {
      alergias: ['Mani'],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Almendras garrapiñadas',
      alimentos: [
        { alimentoId: 1, cantidad: 30, unidad: 'g', alimentoNombre: 'Mani' },
      ],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(resultado.criticas.length).toBeGreaterThan(0);
    expect(resultado.criticas[0]).toMatchObject({
      tipo: 'alergia',
      ingrediente: 'Mani',
    });
    expect(resultado.warnings).toHaveLength(0);
  });

  it('rechaza alternativa no vegana cuando restriccion es vegana', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: 'vegano',
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Omelette',
      alimentos: [
        { alimentoId: 1, cantidad: 100, unidad: 'g', alimentoNombre: 'Huevo' },
      ],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(resultado.criticas[0]).toMatchObject({ tipo: 'restriccion-dura' });
  });

  it('devuelve warning (no critico) para interaccion medicacion-alimento', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: 'warfarina',
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Ensalada de espinaca',
      alimentos: [
        {
          alimentoId: 5,
          cantidad: 100,
          unidad: 'g',
          alimentoNombre: 'Espinaca',
        },
      ],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(resultado.criticas).toHaveLength(0);
    expect(resultado.warnings.length).toBeGreaterThan(0);
    expect(resultado.warnings[0]).toMatch(/Vitamina K/);
  });

  it('devuelve 0 criticas y 0 warnings con ficha vacia', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Manzana',
      alimentos: [
        {
          alimentoId: 1,
          cantidad: 1,
          unidad: 'unidad',
          alimentoNombre: 'Manzana',
        },
      ],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(resultado.criticas).toHaveLength(0);
    expect(resultado.warnings).toHaveLength(0);
  });

  it('rechaza alternativa con gluten cuando restriccion es sin TACC (celiaco)', () => {
    const ficha = {
      alergias: [],
      restriccionesAlimentarias: 'celiaco',
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as never;
    const alternativa = {
      nombre: 'Tostadas',
      alimentos: [
        { alimentoId: 2, cantidad: 50, unidad: 'g', alimentoNombre: 'Trigo' },
      ],
    };

    const resultado = sut.validarAlternativa(ficha, alternativa);

    expect(resultado.criticas).toHaveLength(1);
    expect(resultado.criticas[0]).toMatchObject({
      tipo: 'restriccion-dura',
      ingrediente: 'Trigo',
    });
    expect(resultado.warnings).toHaveLength(0);
  });
});

describe('RestriccionesValidator', () => {
  it('detecta incidencias por restricciones y patologias con heuristicas normalizadas', async () => {
    const fichaSaludRepo = {
      findOne: jest.fn().mockResolvedValue({
        alergias: [{ nombre: 'Lactosa' }],
        restriccionesAlimentarias:
          'Vegetariana, No consume cerdo por preferencia',
        patologias: [{ nombre: 'Diabetes Tipo 2' }],
      }),
    };

    const validator = new RestriccionesValidator(fichaSaludRepo as never);

    const incidencias = await validator.generarIncidencias(
      [
        {
          dia: 'LUNES',
          comida: 'DESAYUNO',
          item: '1.1',
          alimentoId: 1,
          alimentoNombre: 'Yogur natural',
        },
        {
          dia: 'LUNES',
          comida: 'ALMUERZO',
          item: '2.1',
          alimentoId: 2,
          alimentoNombre: 'Pechuga de pollo grillada',
        },
        {
          dia: 'LUNES',
          comida: 'MERIENDA',
          item: '3.1',
          alimentoId: 3,
          alimentoNombre: 'Pan con miel',
        },
      ],
      20,
    );

    expect(incidencias).toHaveLength(3);
    expect(incidencias[0].tipoRestriccion).toBe('ALERGIA');
    expect(incidencias[1].tipoRestriccion).toBe('RESTRICCION');
    expect(incidencias[2].tipoRestriccion).toBe('PATOLOGIA');
  });

  it('evita falsos positivos cuando el alimento declara que esta libre del termino restringido', async () => {
    const fichaSaludRepo = {
      findOne: jest.fn().mockResolvedValue({
        alergias: [{ nombre: 'Gluten' }],
        restriccionesAlimentarias: null,
        patologias: [],
      }),
    };

    const validator = new RestriccionesValidator(fichaSaludRepo as never);

    const incidencias = await validator.generarIncidencias(
      [
        {
          dia: 'MARTES',
          comida: 'DESAYUNO',
          item: '1.1',
          alimentoId: 4,
          alimentoNombre: 'Pan sin gluten',
        },
      ],
      30,
    );

    expect(incidencias).toHaveLength(0);
  });
});
