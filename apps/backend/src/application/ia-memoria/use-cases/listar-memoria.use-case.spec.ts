import { Test, TestingModule } from '@nestjs/testing';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { ListarMemoriaUseCase } from './listar-memoria.use-case';
import { NutricionistaIAMemoriaEntity } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

describe('ListarMemoriaUseCase', () => {
  let useCase: ListarMemoriaUseCase;
  let memoriaRepo: any;

  const makeEntry = (
    id: number,
    tipoEjemplo: 'POSITIVO' | 'NEGATIVO',
    archivada = false,
  ): NutricionistaIAMemoriaEntity =>
    ({
      idNutricionistaIaMemoria: id,
      idNutricionista: 1,
      tipoEjemplo,
      comentario: `comentario ${id}`,
      idPlanAlimentacionVersion: null,
      archivada,
      createdAt: new Date(),
    }) as NutricionistaIAMemoriaEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarMemoriaUseCase,
        {
          provide: NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
          useValue: {
            listarPorNutricionista: jest.fn(),
            contarActivas: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ListarMemoriaUseCase>(ListarMemoriaUseCase);
    memoriaRepo = module.get(NUTRICIONISTA_IA_MEMORIA_REPOSITORY);
  });

  it('separa memoria activa en positivos y negativos y cuenta archivadas', async () => {
    const activas = [
      makeEntry(1, 'POSITIVO'),
      makeEntry(2, 'POSITIVO'),
      makeEntry(3, 'NEGATIVO'),
    ];
    const archivadas = [
      makeEntry(10, 'POSITIVO', true),
      makeEntry(11, 'NEGATIVO', true),
      makeEntry(12, 'NEGATIVO', true),
    ];

    memoriaRepo.listarPorNutricionista
      .mockResolvedValueOnce(activas)
      .mockResolvedValueOnce(archivadas);
    memoriaRepo.contarActivas.mockResolvedValueOnce(3);

    const result = await useCase.execute({ nutricionistaId: 1 });

    expect(result.positivos).toHaveLength(2);
    expect(result.negativos).toHaveLength(1);
    expect(result.totalActivas).toBe(3);
    expect(result.archivadas).toBe(3);
  });

  it('devuelve vacío si no hay memoria', async () => {
    memoriaRepo.listarPorNutricionista
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    memoriaRepo.contarActivas.mockResolvedValueOnce(0);

    const result = await useCase.execute({ nutricionistaId: 99 });

    expect(result.positivos).toEqual([]);
    expect(result.negativos).toEqual([]);
    expect(result.totalActivas).toBe(0);
    expect(result.archivadas).toBe(0);
  });
});
