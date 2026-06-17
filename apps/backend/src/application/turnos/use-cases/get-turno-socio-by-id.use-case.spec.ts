import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTurnoSocioByIdUseCase } from './get-turno-socio-by-id.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';

describe('GetTurnoSocioByIdUseCase', () => {
  let useCase: GetTurnoSocioByIdUseCase;
  let usuarioRepository: jest.Mocked<Repository<UsuarioOrmEntity>>;
  let socioRepository: jest.Mocked<Repository<SocioOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let tenantContext: { gimnasioId: number; isInitialized: boolean };

  const mockSocioPersona = { idPersona: 20 } as SocioOrmEntity;
  const mockOtroSocio = { idPersona: 99 } as SocioOrmEntity;
  const mockNutricionista = {
    idPersona: 10,
    nombre: 'Ana',
    apellido: 'García',
    matricula: 'MN1234',
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    fotoPerfilKey: null,
  } as unknown as SocioOrmEntity;

  const buildTurno = (
    overrides: Partial<TurnoOrmEntity> = {},
  ): TurnoOrmEntity =>
    ({
      idTurno: 1,
      fechaTurno: new Date('2026-06-15T00:00:00.000Z'),
      horaTurno: '10:00',
      estadoTurno: EstadoTurno.CONFIRMADO,
      socio: mockSocioPersona,
      nutricionista: mockNutricionista,
      ...overrides,
    }) as TurnoOrmEntity;

  beforeEach(async () => {
    tenantContext = { gimnasioId: 1, isInitialized: true };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTurnoSocioByIdUseCase,
        {
          provide: getRepositoryToken(UsuarioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: tenantContext,
        },
      ],
    }).compile();

    useCase = module.get(GetTurnoSocioByIdUseCase);
    usuarioRepository = module.get(getRepositoryToken(UsuarioOrmEntity));
    socioRepository = module.get(getRepositoryToken(SocioOrmEntity));
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
  });

  it('devuelve los datos del turno cuando le pertenece al socio', async () => {
    usuarioRepository.findOne.mockResolvedValue({
      idUsuario: 100,
      persona: { idPersona: 20 } as SocioOrmEntity,
    } as unknown as UsuarioOrmEntity);
    socioRepository.findOne.mockResolvedValue(mockSocioPersona);
    turnoRepository.findOne.mockResolvedValue(buildTurno());

    const result = await useCase.execute(100, 1);

    expect(result.idTurno).toBe(1);
    expect(result.socio.idPersona).toBe(20);
    expect(result.nutricionista.nombre).toBe('Ana');
    expect(result.nutricionista.fotoPerfilUrl).toBeNull();
  });

  it('lanza NotFoundError cuando el turno no existe', async () => {
    usuarioRepository.findOne.mockResolvedValue({
      idUsuario: 100,
      persona: { idPersona: 20 } as SocioOrmEntity,
    } as unknown as UsuarioOrmEntity);
    socioRepository.findOne.mockResolvedValue(mockSocioPersona);
    turnoRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(100, 999)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('lanza ForbiddenError cuando el turno es de otro socio', async () => {
    usuarioRepository.findOne.mockResolvedValue({
      idUsuario: 100,
      persona: { idPersona: 20 } as SocioOrmEntity,
    } as unknown as UsuarioOrmEntity);
    socioRepository.findOne.mockResolvedValue(mockSocioPersona);
    turnoRepository.findOne.mockResolvedValue(
      buildTurno({ socio: mockOtroSocio }),
    );

    await expect(useCase.execute(100, 1)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('lanza ForbiddenError cuando el turno está cancelado', async () => {
    usuarioRepository.findOne.mockResolvedValue({
      idUsuario: 100,
      persona: { idPersona: 20 } as SocioOrmEntity,
    } as unknown as UsuarioOrmEntity);
    socioRepository.findOne.mockResolvedValue(mockSocioPersona);
    turnoRepository.findOne.mockResolvedValue(
      buildTurno({ estadoTurno: EstadoTurno.CANCELADO }),
    );

    await expect(useCase.execute(100, 1)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
