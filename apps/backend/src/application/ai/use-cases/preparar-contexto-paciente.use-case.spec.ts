import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

describe('PrepararContextoPacienteUseCase - Multi-Tenant Isolation', () => {
  let useCase: PrepararContextoPacienteUseCase;
  let socioRepo: any;
  let tenantContext: TenantContextService;
  let logger: any;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepararContextoPacienteUseCase,
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: {},
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: mockLogger,
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<PrepararContextoPacienteUseCase>(
      PrepararContextoPacienteUseCase,
    );
    socioRepo = module.get(getRepositoryToken(SocioOrmEntity));
    tenantContext = module.get<TenantContextService>(TenantContextService);
    logger = module.get(APP_LOGGER_SERVICE);
  });

  it('debe filtrar socio por gimnasioId del TenantContext', async () => {
    const mockSocio = {
      idPersona: 1,
      gimnasioId: 1,
      fichaSalud: {
        peso: 75,
        altura: 175,
        objetivoPersonal: 'Perder peso',
        nivelActividadFisica: 'Moderado' as const,
        alergias: [],
        patologias: [],
        restriccionesAlimentarias: null,
        frecuenciaComidas: '3 comidas' as const,
        consumoAguaDiario: 2000,
        consumoAlcohol: 'Nunca' as const,
        fumaTabaco: false,
        horasSueno: 7,
        medicacionActual: null,
        suplementosActuales: null,
        cirugiasPrevias: null,
        antecedentesFamiliares: null,
      },
    };

    socioRepo.findOne.mockResolvedValueOnce(mockSocio);

    await useCase.execute(1);

    expect(socioRepo.findOne).toHaveBeenCalledWith({
      where: {
        idPersona: 1,
        gimnasioId: 1,
      },
      relations: {
        fichaSalud: {
          alergias: true,
          patologias: true,
        },
      },
    });
  });

  it('debe lanzar NotFoundError cuando el socio no existe', async () => {
    socioRepo.findOne.mockResolvedValueOnce(null);

    await expect(useCase.execute(999)).rejects.toThrow('Socio');
  });

  it('debe lanzar NotFoundError cuando el socio pertenece a otro gimnasio', async () => {
    socioRepo.findOne.mockResolvedValueOnce(null);

    await expect(useCase.execute(1)).rejects.toThrow('Socio');
  });

  it('debe lanzar BadRequestError cuando el socio no tiene ficha de salud', async () => {
    const mockSocioSinFicha = {
      idPersona: 1,
      gimnasioId: 1,
      fichaSalud: null,
    };

    socioRepo.findOne.mockResolvedValueOnce(mockSocioSinFicha);

    await expect(useCase.execute(1)).rejects.toThrow(BadRequestError);
  });
});
