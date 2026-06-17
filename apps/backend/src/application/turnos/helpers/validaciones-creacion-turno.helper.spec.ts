import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidacionesCreacionTurno } from './validaciones-creacion-turno.helper';
import {
  AgendaOrmEntity,
  NutricionistaOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  BadRequestError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';

describe('ValidacionesCreacionTurno', () => {
  let helper: ValidacionesCreacionTurno;
  let agendaRepository: jest.Mocked<Repository<AgendaOrmEntity>>;
  let nutricionistaRepository: jest.Mocked<Repository<NutricionistaOrmEntity>>;
  let turnoRepository: jest.Mocked<Repository<TurnoOrmEntity>>;

  const mockAgenda = [
    {
      idAgenda: 1,
      dia: DiaSemana.LUNES,
      horaInicio: '08:00',
      horaFin: '18:00',
      duracionTurno: 30,
      nutricionista: { idPersona: 10, gimnasioId: 1 },
    },
  ] as AgendaOrmEntity[];

  const future = new Date();
  future.setDate(future.getDate() + ((8 - future.getDay()) % 7 || 7));
  future.setHours(0, 0, 0, 0);
  const past = new Date(2000, 0, 1);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidacionesCreacionTurno,
        {
          provide: getRepositoryToken(AgendaOrmEntity),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        { provide: TenantContextService, useValue: { gimnasioId: 1 } },
      ],
    }).compile();

    helper = module.get(ValidacionesCreacionTurno);
    agendaRepository = module.get(getRepositoryToken(AgendaOrmEntity));
    nutricionistaRepository = module.get(
      getRepositoryToken(NutricionistaOrmEntity),
    );
    turnoRepository = module.get(getRepositoryToken(TurnoOrmEntity));
    jest.mocked(nutricionistaRepository.findOne).mockResolvedValue({
      idPersona: 10,
      duracionTurnoMin: 60,
    } as NutricionistaOrmEntity);
  });

  afterEach(() => jest.clearAllMocks());

  describe('validarFechaHoraNoPasado', () => {
    it('acepta fecha futura', async () => {
      await expect(
        helper.validarFechaHoraNoPasado(future, '10:00'),
      ).resolves.toBeUndefined();
    });

    it('rechaza fecha pasada', async () => {
      await expect(
        helper.validarFechaHoraNoPasado(past, '10:00'),
      ).rejects.toThrow(BadRequestError);
    });

    it('rechaza hoy con hora a menos de 1h', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await expect(
        helper.validarFechaHoraNoPasado(today, '00:00'),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('validarFechaNoPasadoSimple', () => {
    it('acepta hoy (sin chequeo de 1h)', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await expect(
        helper.validarFechaNoPasadoSimple(today),
      ).resolves.toBeUndefined();
    });

    it('acepta fecha futura', async () => {
      await expect(
        helper.validarFechaNoPasadoSimple(future),
      ).resolves.toBeUndefined();
    });

    it('rechaza fecha pasada', async () => {
      await expect(helper.validarFechaNoPasadoSimple(past)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  describe('validarAgendaDisponible', () => {
    it('acepta slot dentro de la agenda y filtra por gimnasio del TenantContext', async () => {
      jest.mocked(agendaRepository.find).mockResolvedValue(mockAgenda);
      await expect(
        helper.validarAgendaDisponible(10, future, '10:00'),
      ).resolves.toBeUndefined();
      expect(agendaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nutricionista: expect.objectContaining({ gimnasioId: 1 }),
            dia: DiaSemana.LUNES,
          }),
        }),
      );
    });

    it('rechaza si no hay agenda ese dia', async () => {
      jest.mocked(agendaRepository.find).mockResolvedValue([]);
      await expect(
        helper.validarAgendaDisponible(10, future, '10:00'),
      ).rejects.toThrow(BadRequestError);
    });

    it('rechaza si el slot no calza con la grilla global de 60min', async () => {
      jest.mocked(agendaRepository.find).mockResolvedValue(mockAgenda);
      await expect(
        helper.validarAgendaDisponible(10, future, '10:30'),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('validarNoConflictoSlot', () => {
    it('acepta slot libre y filtra por gimnasio del TenantContext', async () => {
      jest.mocked(turnoRepository.findOne).mockResolvedValue(null);
      await expect(
        helper.validarNoConflictoSlot(10, future, '10:00'),
      ).resolves.toBeUndefined();
      expect(turnoRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nutricionista: expect.objectContaining({ gimnasioId: 1 }),
            estadoTurno: expect.anything(),
          }),
        }),
      );
    });

    it('rechaza si hay un turno activo en el slot', async () => {
      jest.mocked(turnoRepository.findOne).mockResolvedValue({
        idTurno: 99,
        estadoTurno: EstadoTurno.CONFIRMADO,
      } as TurnoOrmEntity);
      await expect(
        helper.validarNoConflictoSlot(10, future, '10:00'),
      ).rejects.toThrow(ConflictError);
    });
  });
});
