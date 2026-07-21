import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CrearPreparacionUseCase } from './crear-preparacion.use-case';
import {
  AlimentoOrmEntity,
  PreparacionOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

describe('CrearPreparacionUseCase', () => {
  let sut: CrearPreparacionUseCase;
  let preparacionRepo: jest.Mocked<any>;
  let alimentoRepo: jest.Mocked<any>;
  let tenantContext: jest.Mocked<any>;

  beforeEach(async () => {
    preparacionRepo = {
      create: jest.fn().mockImplementation((val) => val),
      save: jest
        .fn()
        .mockImplementation(async (val) => ({ idPreparacion: 123, ...val })),
      findOne: jest.fn().mockImplementation(async () => ({
        idPreparacion: 123,
        nombre: 'Pollo con Puré',
        gimnasioId: 1,
        creadoPorId: 5,
        items: [
          {
            idPreparacionItem: 1,
            alimentoId: 1,
            cantidadDefault: 200,
            unidadDefault: UnidadMedida.GRAMO,
            alimento: {
              idAlimento: 1,
              nombre: 'Pechuga de Pollo',
              cantidad: 100,
              calorias: 165,
              proteinas: 31,
              carbohidratos: 0,
              grasas: 3.6,
            },
          },
        ],
      })),
    };

    alimentoRepo = {
      findBy: jest.fn().mockResolvedValue([
        {
          idAlimento: 1,
          nombre: 'Pechuga de Pollo',
          cantidad: 100,
          calorias: 165,
          proteinas: 31,
          carbohidratos: 0,
          grasas: 3.6,
        },
      ]),
    };

    tenantContext = {
      gimnasioId: 1,
      personaId: 5,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrearPreparacionUseCase,
        {
          provide: getRepositoryToken(PreparacionOrmEntity),
          useValue: preparacionRepo,
        },
        {
          provide: getRepositoryToken(AlimentoOrmEntity),
          useValue: alimentoRepo,
        },
        {
          provide: TenantContextService,
          useValue: tenantContext,
        },
      ],
    }).compile();

    sut = module.get(CrearPreparacionUseCase);
  });

  it('debe crear una preparacion con exito', async () => {
    const res = await sut.execute({
      nombre: 'Pollo con Puré',
      items: [
        {
          alimentoId: 1,
          cantidadDefault: 200,
          unidadDefault: UnidadMedida.GRAMO,
        },
      ],
    });

    expect(res.nombre).toBe('Pollo con Puré');
    expect(res.totalCalorias).toBe(330); // 165 * 2
    expect(res.totalProteinas).toBe(62); // 31 * 2
    expect(res.totalCarbohidratos).toBe(0);
    expect(res.totalGrasas).toBe(7.2); // 3.6 * 2
    expect(preparacionRepo.save).toHaveBeenCalled();
  });

  it('debe fallar si el nombre esta vacio', async () => {
    await expect(
      sut.execute({
        nombre: '',
        items: [
          {
            alimentoId: 1,
            cantidadDefault: 100,
            unidadDefault: UnidadMedida.GRAMO,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('debe fallar si no tiene items', async () => {
    await expect(
      sut.execute({
        nombre: 'Pollo',
        items: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('debe fallar si el alimento no existe', async () => {
    alimentoRepo.findBy.mockResolvedValue([]); // vacio
    await expect(
      sut.execute({
        nombre: 'Pollo',
        items: [
          {
            alimentoId: 999,
            cantidadDefault: 100,
            unidadDefault: UnidadMedida.GRAMO,
          },
        ],
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
