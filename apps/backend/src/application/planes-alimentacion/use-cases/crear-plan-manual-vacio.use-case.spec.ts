import { CrearPlanManualVacioUseCase } from './crear-plan-manual-vacio.use-case';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

function crearDatosJsonVacio() {
  return {
    estructura: Object.values(DiaSemana).map((dia) => ({
      dia,
      comidas: Object.values(TipoComida).map((tipo) => ({
        tipo,
        alternativas: [],
      })),
    })),
    macrosPorDia: {},
    razonamientoCumplimiento: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
    },
  };
}

function crearSut() {
  const planRepo = {
    find: jest.fn(),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue({ idPlanAlimentacion: 55 }),
  };
  const socioRepo = {
    findOne: jest.fn().mockResolvedValue({ idPersona: 273, gimnasioId: 1 }),
  };
  const nutricionistaRepo = {
    findOne: jest.fn().mockResolvedValue({ idPersona: 5, gimnasioId: 1 }),
  };
  const usuarioRepo = {
    findOne: jest.fn().mockResolvedValue({ idUsuario: 5, rol: Rol.NUTRICIONISTA }),
  };
  const version = {
    idPlanAlimentacionVersion: 101,
    idPlanAlimentacion: 55,
    numeroVersion: 1,
    datosJson: crearDatosJsonVacio(),
    motivoCambio: 'creacion_inicial',
    activa: true,
    createdAt: new Date('2026-06-29T12:00:00.000Z'),
    createdBy: 5,
  };
  const planVersionRepo = {
    crear: jest.fn().mockResolvedValue(version),
    obtenerActiva: jest.fn().mockResolvedValue(version),
    listarPorPlan: jest.fn().mockResolvedValue([version]),
    obtenerPorId: jest.fn(),
    marcarActiva: jest.fn(),
  };
  const tenantContext = { gimnasioId: 1 };

  const sut = new CrearPlanManualVacioUseCase(
    planRepo as never,
    socioRepo as never,
    nutricionistaRepo as never,
    usuarioRepo as never,
    planVersionRepo as never,
    tenantContext as never,
  );

  return {
    sut,
    planRepo,
    planVersionRepo,
  };
}

describe('CrearPlanManualVacioUseCase', () => {
  it('reutiliza el último plan editable del socio y nutricionista en vez de duplicarlo', async () => {
    const { sut, planRepo, planVersionRepo } = crearSut();
    planRepo.find.mockResolvedValue([
      {
        idPlanAlimentacion: 88,
        estado: 'BORRADOR',
        eliminadoEn: null,
      },
    ]);
    const versionExistente = {
      idPlanAlimentacionVersion: 188,
      idPlanAlimentacion: 88,
      numeroVersion: 3,
      datosJson: crearDatosJsonVacio(),
      motivoCambio: 'edicion_manual',
      activa: true,
      createdAt: new Date('2026-06-29T12:00:00.000Z'),
      createdBy: 5,
    };
    planVersionRepo.obtenerActiva.mockResolvedValue(versionExistente);

    const resultado = await sut.execute(5, 273);

    expect(resultado.planAlimentacionId).toBe(88);
    expect(resultado.versionId).toBe(188);
    expect(planRepo.save).not.toHaveBeenCalled();
    expect(planVersionRepo.crear).not.toHaveBeenCalled();
  });

  it('crea una estructura inicial 7x5 incluyendo COLACION', async () => {
    const { sut, planRepo, planVersionRepo } = crearSut();
    planRepo.find.mockResolvedValue([]);

    await sut.execute(5, 273);

    const input = planVersionRepo.crear.mock.calls[0][0];
    expect(input.datosJson.estructura).toHaveLength(7);
    expect(input.datosJson.estructura[0].comidas).toHaveLength(5);
    expect(input.datosJson.estructura[0].comidas).toEqual(
      expect.arrayContaining([expect.objectContaining({ tipo: TipoComida.COLACION })]),
    );
  });
});
