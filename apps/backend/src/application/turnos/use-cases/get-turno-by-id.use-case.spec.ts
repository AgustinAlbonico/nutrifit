import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTurnoByIdUseCase } from './get-turno-by-id.use-case';
import {
  TurnoOrmEntity,
  NutricionistaOrmEntity,
  FichaSaludOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

describe('GetTurnoByIdUseCase - Multi-Tenant Isolation', () => {
  let useCase: GetTurnoByIdUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let nutricionistaRepository: jest.Mocked<Repository<NutricionistaOrmEntity>>;
  let fichaSaludRepository: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let tenantContext: TenantContextService;

  const mockNutricionista = {
    idPersona: 10,
    nombre: 'Dr.',
    apellido: 'Test',
    gimnasioId: 1,
  } as NutricionistaOrmEntity;

  const mockSocio = {
    idPersona: 20,
    nombre: 'Juan',
    apellido: 'Socio',
    dni: '12345678',
    telefono: '1234567890',
    gimnasioId: 1,
  };

  const mockTurno = {
    idTurno: 1,
    fechaTurno: new Date('2026-06-01'),
    horaTurno: '10:00',
    estadoTurno: EstadoTurno.CONFIRMADO,
    socio: mockSocio,
    nutricionista: mockNutricionista,
    observacionClinica: null,
  } as unknown as TurnoOrmEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTurnoByIdUseCase,
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<GetTurnoByIdUseCase>(GetTurnoByIdUseCase);
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    nutricionistaRepository = module.get(
      getRepositoryToken(NutricionistaOrmEntity),
    );
    fichaSaludRepository = module.get(getRepositoryToken(FichaSaludOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Tenant Isolation', () => {
    it('debe filtrar por gimnasioId del TenantContext al buscar turno', async () => {
      // Arrange
      turnoRepository.findOne.mockResolvedValue(mockTurno);
      fichaSaludRepository.findOne.mockResolvedValue(null);

      // Act
      await useCase.execute(1, 10);

      // Assert
      expect(turnoRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nutricionista: expect.objectContaining({
              gimnasioId: 1,
            }),
          }),
        }),
      );
    });

    it('debe lanzar NotFoundError cuando el turno no existe', async () => {
      // Arrange
      turnoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(999, 10)).rejects.toThrow(NotFoundError);
    });

    it('debe rechazar turno de otro gimnasio retornando null del findOne', async () => {
      // Arrange: Turno de gimnasio 2 - el findOne con gimnasioId:1 no lo encuentra
      const turnoOtroGimnasio = {
        ...mockTurno,
        idTurno: 2,
        nutricionista: { ...mockNutricionista, gimnasioId: 99 },
      };

      // Cuando el tenant es gimnasio 1, no encuentra turnos de gimnasio 99
      turnoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(2, 10)).rejects.toThrow(NotFoundError);
    });

    it('debe rechazar cuando el nutricionista del turno no corresponde al proporcionado', async () => {
      // Arrange: El turno existe para otro nutricionista
      const turnoOtroNutricionista = {
        ...mockTurno,
        nutricionista: { ...mockNutricionista, idPersona: 999 },
      };
      turnoRepository.findOne.mockResolvedValue(turnoOtroNutricionista);

      // Act & Assert
      await expect(useCase.execute(1, 10)).rejects.toThrow(BadRequestError);
    });
  });
});
