import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PLAN_FEEDBACK_REPOSITORY } from 'src/domain/repositories/plan-feedback.repository';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import {
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { CrearFeedbackPlanUseCase } from './crear-feedback-plan.use-case';

describe('CrearFeedbackPlanUseCase', () => {
  let useCase: CrearFeedbackPlanUseCase;
  let feedbackRepo: any;
  let planVersionRepo: any;
  let memoriaRepo: any;
  let planRepo: any;
  let auditoriaService: any;

  const versionDummy = {
    idPlanAlimentacionVersion: 100,
    idPlanAlimentacion: 50,
    numeroVersion: 1,
    motivoCambio: 'creacion_inicial' as const,
    activa: true,
    createdAt: new Date('2026-06-25T00:00:00Z'),
    createdBy: 5,
    datosJson: {
      estructura: [],
      macrosPorDia: {},
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    },
  };

  const planDummy = {
    idPlanAlimentacion: 50,
    socio: { idPersona: 10, gimnasioId: 1 },
    nutricionista: { idPersona: 5 },
  };

  const feedbackCreado = {
    idPlanFeedback: 1,
    idPlanAlimentacionVersion: 100,
    idNutricionista: 5,
    voto: 'POSITIVO' as const,
    comentario: 'Buen plan',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearFeedbackPlanUseCase,
        {
          provide: PLAN_FEEDBACK_REPOSITORY,
          useValue: {
            crear: jest.fn(),
            obtenerPorVersion: jest.fn(),
          },
        },
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: {
            obtenerPorId: jest.fn(),
          },
        },
        {
          provide: NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
          useValue: {
            crear: jest.fn(),
            rotarSiExcede100: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {},
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    useCase = module.get<CrearFeedbackPlanUseCase>(CrearFeedbackPlanUseCase);
    feedbackRepo = module.get(PLAN_FEEDBACK_REPOSITORY);
    planVersionRepo = module.get(PLAN_ALIMENTACION_VERSION_REPOSITORY);
    memoriaRepo = module.get(NUTRICIONISTA_IA_MEMORIA_REPOSITORY);
    planRepo = module.get(getRepositoryToken(PlanAlimentacionOrmEntity));
    auditoriaService = module.get(AuditoriaService);
  });

  it('lanza NotFoundError si la versión no existe', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        versionId: 999,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza ForbiddenError si NUTRICIONISTA no es dueño', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        versionId: 100,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 99, rol: Rol.NUTRICIONISTA, personaId: 99, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza ConflictError si ya existe feedback (UNIQUE)', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.obtenerPorVersion.mockResolvedValueOnce(feedbackCreado);

    await expect(
      useCase.execute({
        versionId: 100,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('crea feedback POSITIVO sin comentario → NO crea memoria', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.obtenerPorVersion.mockResolvedValueOnce(null);
    feedbackRepo.crear.mockResolvedValueOnce({
      ...feedbackCreado,
      comentario: null,
    });

    await useCase.execute({
      versionId: 100,
      voto: 'POSITIVO',
      comentario: null,
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(feedbackRepo.crear).toHaveBeenCalled();
    expect(memoriaRepo.crear).not.toHaveBeenCalled();
    expect(memoriaRepo.rotarSiExcede100).not.toHaveBeenCalled();
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'FEEDBACK_CREADO' }),
    );
  });

  it('crea feedback NEGATIVO con comentario → crea memoria NEGATIVO y rota', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.obtenerPorVersion.mockResolvedValueOnce(null);
    feedbackRepo.crear.mockResolvedValueOnce({
      ...feedbackCreado,
      voto: 'NEGATIVO',
      comentario: 'mala comida',
    });

    await useCase.execute({
      versionId: 100,
      voto: 'NEGATIVO',
      comentario: 'mala comida',
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(feedbackRepo.crear).toHaveBeenCalled();
    expect(memoriaRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoEjemplo: 'NEGATIVO',
        comentario: 'mala comida',
      }),
    );
    expect(memoriaRepo.rotarSiExcede100).toHaveBeenCalledWith(5);
  });

  it('crea feedback POSITIVO con comentario → crea memoria POSITIVO', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.obtenerPorVersion.mockResolvedValueOnce(null);
    feedbackRepo.crear.mockResolvedValueOnce(feedbackCreado);

    await useCase.execute({
      versionId: 100,
      voto: 'POSITIVO',
      comentario: 'Excelente',
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(memoriaRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoEjemplo: 'POSITIVO',
        comentario: 'Excelente',
      }),
    );
    expect(memoriaRepo.rotarSiExcede100).toHaveBeenCalled();
  });

  it('normaliza comentario con whitespace a null', async () => {
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.obtenerPorVersion.mockResolvedValueOnce(null);
    feedbackRepo.crear.mockResolvedValueOnce({
      ...feedbackCreado,
      comentario: null,
    });

    await useCase.execute({
      versionId: 100,
      voto: 'POSITIVO',
      comentario: '   ',
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(feedbackRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ comentario: null }),
    );
    expect(memoriaRepo.crear).not.toHaveBeenCalled();
  });
});
