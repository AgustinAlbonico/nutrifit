import { Test, TestingModule } from '@nestjs/testing';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { EliminarMemoriaUseCase } from './eliminar-memoria.use-case';
import { NutricionistaIAMemoriaEntity } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

describe('EliminarMemoriaUseCase', () => {
  let useCase: EliminarMemoriaUseCase;
  let memoriaRepo: any;
  let auditoriaService: any;

  const makeEntry = (
    id: number,
    idNutricionista: number,
  ): NutricionistaIAMemoriaEntity =>
    ({
      idNutricionistaIaMemoria: id,
      idNutricionista,
      tipoEjemplo: 'POSITIVO',
      comentario: 'comentario',
      idPlanAlimentacionVersion: null,
      archivada: false,
      createdAt: new Date(),
    }) as NutricionistaIAMemoriaEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EliminarMemoriaUseCase,
        {
          provide: NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
          useValue: {
            obtenerPorId: jest.fn(),
            marcarArchivada: jest.fn(),
          },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    useCase = module.get<EliminarMemoriaUseCase>(EliminarMemoriaUseCase);
    memoriaRepo = module.get(NUTRICIONISTA_IA_MEMORIA_REPOSITORY);
    auditoriaService = module.get(AuditoriaService);
  });

  it('lanza NotFoundError si la memoria no existe', async () => {
    memoriaRepo.obtenerPorId.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        memoriaId: 999,
        user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('lanza ForbiddenError si NUTRICIONISTA no es dueño', async () => {
    memoriaRepo.obtenerPorId.mockResolvedValueOnce(makeEntry(1, 5));

    await expect(
      useCase.execute({
        memoriaId: 1,
        user: { id: 99, rol: Rol.NUTRICIONISTA, personaId: 99, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('lanza ForbiddenError si el rol no es NUTRICIONISTA', async () => {
    memoriaRepo.obtenerPorId.mockResolvedValueOnce(makeEntry(1, 5));

    await expect(
      useCase.execute({
        memoriaId: 1,
        user: { id: 1, rol: Rol.ADMIN, personaId: null, gimnasioId: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('marca archivada y registra auditoría si es dueño', async () => {
    memoriaRepo.obtenerPorId.mockResolvedValueOnce(makeEntry(1, 5));

    await useCase.execute({
      memoriaId: 1,
      user: { id: 5, rol: Rol.NUTRICIONISTA, personaId: 5, gimnasioId: 1 },
    });

    expect(memoriaRepo.marcarArchivada).toHaveBeenCalledWith(1);
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'MEMORIA_IA_ARCHIVADA' }),
    );
  });
});
