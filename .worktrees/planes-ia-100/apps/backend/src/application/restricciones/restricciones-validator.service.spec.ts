import { RestriccionesValidator } from './restricciones-validator.service';

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
