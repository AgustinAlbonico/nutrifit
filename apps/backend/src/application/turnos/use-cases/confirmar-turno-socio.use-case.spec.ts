import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfirmarTurnoSocioUseCase } from './confirmar-turno-socio.use-case';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { TurnoConfirmacionTokenOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno-confirmacion-token.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { createHash } from 'crypto';

describe('ConfirmarTurnoSocioUseCase token flow', () => {
  let useCase: ConfirmarTurnoSocioUseCase;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;
  let tokenRepository: jest.Mocked<Repository<TurnoConfirmacionTokenOrmEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmarTurnoSocioUseCase,
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
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoConfirmacionTokenOrmEntity),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        { provide: NotificacionesService, useValue: { crear: jest.fn() } },
        { provide: APP_LOGGER_SERVICE, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ConfirmarTurnoSocioUseCase);
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    tokenRepository = module.get(
      getRepositoryToken(TurnoConfirmacionTokenOrmEntity),
    );
  });

  it('acepta token válido y marca token usado', async () => {
    const turno = {
      idTurno: 10,
      estadoTurno: EstadoTurno.PROGRAMADO,
      fechaTurno: new Date(),
      horaTurno: '23:59',
      socio: { idPersona: 20 },
      nutricionista: { idPersona: 30 },
    } as any;
    turnoRepository.findOne.mockResolvedValue(turno);

    const token = 'abc123';
    tokenRepository.findOne.mockResolvedValue({
      turnoId: 10,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiraEn: new Date(Date.now() + 3600 * 1000),
      usadoEn: null,
    } as any);
    turnoRepository.save.mockResolvedValue(turno);

    await useCase.execute(null, 10, token);
    expect(tokenRepository.save).toHaveBeenCalled();
  });

  it('rechaza token inválido', async () => {
    turnoRepository.findOne.mockResolvedValue({
      idTurno: 10,
      estadoTurno: EstadoTurno.PROGRAMADO,
      fechaTurno: new Date(),
      horaTurno: '23:59',
      socio: { idPersona: 20 },
      nutricionista: { idPersona: 30 },
    } as any);
    tokenRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(null, 10, 'bad')).rejects.toThrow(
      BadRequestError,
    );
  });

  it('rechaza token expirado', async () => {
    turnoRepository.findOne.mockResolvedValue({
      idTurno: 10,
      estadoTurno: EstadoTurno.PROGRAMADO,
      fechaTurno: new Date(),
      horaTurno: '23:59',
      socio: { idPersona: 20 },
      nutricionista: { idPersona: 30 },
    } as any);
    tokenRepository.findOne.mockResolvedValue({
      turnoId: 10,
      tokenHash: 'x',
      expiraEn: new Date(Date.now() - 1000),
      usadoEn: null,
    } as any);

    await expect(useCase.execute(null, 10, 'abc')).rejects.toThrow(
      BadRequestError,
    );
  });

  it('rechaza token ya usado', async () => {
    turnoRepository.findOne.mockResolvedValue({
      idTurno: 10,
      estadoTurno: EstadoTurno.PROGRAMADO,
      fechaTurno: new Date(),
      horaTurno: '23:59',
      socio: { idPersona: 20 },
      nutricionista: { idPersona: 30 },
    } as any);
    tokenRepository.findOne.mockResolvedValue({
      turnoId: 10,
      tokenHash: 'x',
      expiraEn: new Date(Date.now() + 1000),
      usadoEn: new Date(),
    } as any);

    await expect(useCase.execute(null, 10, 'abc')).rejects.toThrow(
      BadRequestError,
    );
  });
});
