import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigureAgendaUseCase } from './configure-agenda.use-case';
import { AGENDA_REPOSITORY } from 'src/domain/entities/Agenda/agenda.repository';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

describe('ConfigureAgendaUseCase', () => {
  let useCase: ConfigureAgendaUseCase;
  let agendaRepository: {
    findByNutricionistaId: jest.Mock;
    replaceByNutricionistaId: jest.Mock;
  };
  let nutricionistaRepository: {
    findById: jest.Mock;
    update: jest.Mock;
  };
  let turnoRepository: {
    find: jest.Mock;
  };
  let slotComputationService: {
    contarSlotsProximos: jest.Mock;
  };

  beforeEach(async () => {
    agendaRepository = {
      findByNutricionistaId: jest.fn(),
      replaceByNutricionistaId: jest.fn(),
    };
    nutricionistaRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    turnoRepository = {
      find: jest.fn(),
    };
    slotComputationService = {
      contarSlotsProximos: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigureAgendaUseCase,
        {
          provide: AGENDA_REPOSITORY,
          useValue: agendaRepository,
        },
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: nutricionistaRepository,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: turnoRepository,
        },
        {
          provide: SlotComputationService,
          useValue: slotComputationService,
        },
      ],
    }).compile();

    useCase = module.get(ConfigureAgendaUseCase);
  });

  it('rechaza rangos que no generan slots completos con el mensaje del spec', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 10,
      fechaBaja: null,
    });
    agendaRepository.findByNutricionistaId.mockResolvedValue([]);
    turnoRepository.find.mockResolvedValue([]);

    await expect(
      useCase.execute(10, {
        duracionTurno: 60,
        agendas: [
          {
            dia: DiaSemana.LUNES,
            horaInicio: '09:00',
            horaFin: '09:30',
          },
        ],
      } as any),
    ).rejects.toMatchObject({
      constructor: BadRequestError,
      message:
        'Con esta duración y los rangos definidos, el rango del día Lunes no genera slots completos. Ajustá la duración o los rangos.',
    });
  });

  it('exige confirmacion si se eliminan bloques con turnos futuros reservados', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 10,
      fechaBaja: null,
    });
    agendaRepository.findByNutricionistaId.mockResolvedValue([
      {
        idAgenda: 1,
        dia: DiaSemana.LUNES,
        horaInicio: '09:00',
        horaFin: '12:00',
        duracionTurno: 30,
      },
    ]);
    turnoRepository.find.mockResolvedValue([
      {
        idTurno: 99,
        fechaTurno: new Date('2026-06-22T00:00:00-03:00'),
        horaTurno: '10:00:00',
        estadoTurno: EstadoTurno.CONFIRMADO,
        socio: { idPersona: 55 },
      },
    ]);

    await expect(
      useCase.execute(10, {
        duracionTurno: 30,
        agendas: [
          {
            dia: DiaSemana.MARTES,
            horaInicio: '09:00',
            horaFin: '12:00',
          },
        ],
      } as any),
    ).rejects.toMatchObject({
      constructor: ConflictError,
      context: {
        requiereConfirmacion: true,
        turnosFueraDeAgenda: 1,
        turnosConDuracionActual: 0,
      },
    });
  });

  it('exige confirmacion si cambia la duracion y hay turnos futuros reservados', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 10,
      fechaBaja: null,
    });
    agendaRepository.findByNutricionistaId.mockResolvedValue([
      {
        idAgenda: 1,
        dia: DiaSemana.LUNES,
        horaInicio: '09:00',
        horaFin: '12:00',
        duracionTurno: 30,
      },
    ]);
    turnoRepository.find.mockResolvedValue([
      {
        idTurno: 100,
        fechaTurno: new Date('2026-06-22T00:00:00-03:00'),
        horaTurno: '09:30:00',
        estadoTurno: EstadoTurno.CONFIRMADO,
        socio: { idPersona: 77 },
      },
      {
        idTurno: 101,
        fechaTurno: new Date('2026-06-29T00:00:00-03:00'),
        horaTurno: '10:00:00',
        estadoTurno: EstadoTurno.CONFIRMADO,
        socio: { idPersona: 78 },
      },
    ]);

    await expect(
      useCase.execute(10, {
        duracionTurno: 45,
        agendas: [
          {
            dia: DiaSemana.LUNES,
            horaInicio: '09:00',
            horaFin: '12:00',
          },
        ],
      } as any),
    ).rejects.toMatchObject({
      constructor: ConflictError,
      context: {
        requiereConfirmacion: true,
        turnosFueraDeAgenda: 0,
        turnosConDuracionActual: 2,
      },
    });
  });

  it('persiste la agenda confirmada y devuelve slots disponibles para 60 dias', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 10,
      fechaBaja: null,
    });
    agendaRepository.findByNutricionistaId.mockResolvedValue([
      {
        idAgenda: 1,
        dia: DiaSemana.LUNES,
        horaInicio: '09:00',
        horaFin: '12:00',
        duracionTurno: 30,
      },
    ]);
    turnoRepository.find.mockResolvedValue([
      {
        idTurno: 100,
        fechaTurno: new Date('2026-06-22T00:00:00-03:00'),
        horaTurno: '09:30:00',
        estadoTurno: EstadoTurno.CONFIRMADO,
        socio: { idPersona: 77 },
      },
    ]);
    agendaRepository.replaceByNutricionistaId.mockResolvedValue([
      {
        idAgenda: 2,
        dia: DiaSemana.LUNES,
        horaInicio: '10:00',
        horaFin: '13:00',
        duracionTurno: 45,
      },
    ]);
    slotComputationService.contarSlotsProximos.mockResolvedValue(28);

    const resultado = await useCase.execute(10, {
      duracionTurno: 45,
      confirmarCambiosConTurnos: true,
      agendas: [
        {
          dia: DiaSemana.LUNES,
          horaInicio: '10:00',
          horaFin: '13:00',
        },
      ],
    } as any);

    expect(agendaRepository.replaceByNutricionistaId).toHaveBeenCalledWith(
      10,
      expect.arrayContaining([
        expect.objectContaining({
          dia: DiaSemana.LUNES,
          horaInicio: '10:00',
          horaFin: '13:00',
          duracionTurno: 45,
        }),
      ]),
    );
    expect(slotComputationService.contarSlotsProximos).toHaveBeenCalledWith(
      10,
      60,
    );
    expect(resultado).toMatchObject({
      slotsDisponiblesProximos60Dias: 28,
      agendas: [
        expect.objectContaining({
          dia: DiaSemana.LUNES,
          horaInicio: '10:00',
          horaFin: '13:00',
          duracionTurno: 45,
        }),
      ],
    });
  });
});
