import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PLAN_FEEDBACK_REPOSITORY } from 'src/domain/repositories/plan-feedback.repository';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { EditarFeedbackPlanUseCase } from './editar-feedback-plan.use-case';

describe('EditarFeedbackPlanUseCase', () => {
  let useCase: EditarFeedbackPlanUseCase;
  let feedbackRepo: any;
  let planVersionRepo: any;
  let memoriaRepo: any;
  let planRepo: any;
  let auditoriaService: any;

  const versionDummy = {
    idPlanAlimentacionVersion: 100,
    idPlanAlimentacion: 50,
    numeroVersion: 1,
    activa: true,
    createdAt: new Date(),
    createdBy: 5,
    motivoCambio: null,
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

  const feedbackActual = {
    idPlanFeedback: 1,
    idPlanAlimentacionVersion: 100,
    idNutricionista: 5,
    voto: 'POSITIVO' as const,
    comentario: 'Comentario previo',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditarFeedbackPlanUseCase,
        {
          provide: PLAN_FEEDBACK_REPOSITORY,
          useValue: {
            obtenerPorId: jest.fn(),
            actualizar: jest.fn(),
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
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    useCase = module.get<EditarFeedbackPlanUseCase>(EditarFeedbackPlanUseCase);
    feedbackRepo = module.get(PLAN_FEEDBACK_REPOSITORY);
    planVersionRepo = module.get(PLAN_ALIMENTACION_VERSION_REPOSITORY);
    memoriaRepo = module.get(NUTRICIONISTA_IA_MEMORIA_REPOSITORY);
    planRepo = module.get(getRepositoryToken(PlanAlimentacionOrmEntity));
    auditoriaService = module.get(AuditoriaService);
  });

  it('lanza NotFoundError si el feedback no existe', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        feedbackId: 999,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza ForbiddenError si NUTRICIONISTA no es dueño', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(feedbackActual);
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        feedbackId: 1,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 99, rol: Rol.NUTRICIONISTA, personaId: 99, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza ForbiddenError si el rol no es NUTRICIONISTA', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(feedbackActual);
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);

    await expect(
      useCase.execute({
        feedbackId: 1,
        voto: 'POSITIVO',
        comentario: 'ok',
        user: { id: 1, rol: Rol.ADMIN, personaId: null, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('cambia voto y comentario → crea nueva memoria con tipo nuevo', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(feedbackActual);
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.actualizar.mockResolvedValueOnce({
      ...feedbackActual,
      voto: 'NEGATIVO',
      comentario: 'Comentario nuevo',
    });

    await useCase.execute({
      feedbackId: 1,
      voto: 'NEGATIVO',
      comentario: 'Comentario nuevo',
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(feedbackRepo.actualizar).toHaveBeenCalledWith(1, {
      voto: 'NEGATIVO',
      comentario: 'Comentario nuevo',
    });
    expect(memoriaRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        tipoEjemplo: 'NEGATIVO',
        comentario: 'Comentario nuevo',
      }),
    );
    expect(memoriaRepo.rotarSiExcede100).toHaveBeenCalledWith(5);
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'FEEDBACK_EDITADO' }),
    );
  });

  it('voto NO cambia → NO crea memoria', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(feedbackActual);
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.actualizar.mockResolvedValueOnce({
      ...feedbackActual,
      comentario: 'Solo cambio el comentario',
    });

    await useCase.execute({
      feedbackId: 1,
      voto: 'POSITIVO',
      comentario: 'Solo cambio el comentario',
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(feedbackRepo.actualizar).toHaveBeenCalled();
    expect(memoriaRepo.crear).not.toHaveBeenCalled();
    expect(memoriaRepo.rotarSiExcede100).not.toHaveBeenCalled();
  });

  it('comentario vacío → NO crea memoria aunque voto cambie', async () => {
    feedbackRepo.obtenerPorId.mockResolvedValueOnce(feedbackActual);
    planVersionRepo.obtenerPorId.mockResolvedValueOnce(versionDummy);
    planRepo.findOne.mockResolvedValueOnce(planDummy);
    feedbackRepo.actualizar.mockResolvedValueOnce({
      ...feedbackActual,
      voto: 'NEGATIVO',
      comentario: null,
    });

    await useCase.execute({
      feedbackId: 1,
      voto: 'NEGATIVO',
      comentario: null,
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(memoriaRepo.crear).not.toHaveBeenCalled();
  });
});
