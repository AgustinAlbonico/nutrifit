import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SlotComputationService } from './slot-computation.service';
import {
  AgendaOrmEntity,
  TurnoOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { EXCEPCION_DISPONIBILIDAD_REPOSITORY } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import {
  getArgentinaNow,
  combineArgentinaDateAndTime,
  formatArgentinaDate,
} from 'src/common/utils/argentina-datetime.util';

describe('SlotComputationService', () => {
  let service: SlotComputationService;
  let agendaRepo: { find: jest.Mock };
  let turnoRepo: { find: jest.Mock };
  let nutriRepo: { findOne: jest.Mock };
  let excepcionRepo: { findVigentesEnVentana: jest.Mock };
  let tenantContext: { gimnasioId: number; isInitialized: boolean };

  beforeEach(async () => {
    agendaRepo = { find: jest.fn() };
    turnoRepo = { find: jest.fn() };
    nutriRepo = { findOne: jest.fn() };
    excepcionRepo = { findVigentesEnVentana: jest.fn() };
    tenantContext = { gimnasioId: 1, isInitialized: true };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotComputationService,
        { provide: getRepositoryToken(AgendaOrmEntity), useValue: agendaRepo },
        { provide: getRepositoryToken(TurnoOrmEntity), useValue: turnoRepo },
        {
          provide: getRepositoryToken(NutricionistaOrmEntity),
          useValue: nutriRepo,
        },
        {
          provide: EXCEPCION_DISPONIBILIDAD_REPOSITORY,
          useValue: excepcionRepo,
        },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    }).compile();

    service = module.get<SlotComputationService>(SlotComputationService);
  });

  it('retorna duracionMin 0 y slots vacíos si el nutricionista no tiene bloques semanales', async () => {
    nutriRepo.findOne.mockResolvedValue({ idPersona: 10, duracionTurnoMin: 30 });
    agendaRepo.find.mockResolvedValue([]);
    excepcionRepo.findVigentesEnVentana.mockResolvedValue([]);
    turnoRepo.find.mockResolvedValue([]);

    const result = await service.calcularSlotsDisponibles(10);

    expect(result.duracionMin).toBe(0);
    expect(result.slots).toEqual([]);
  });

  it('lanza BadRequestError si fechaDesde es anterior a now+2h', async () => {
    const hace1h = new Date(getArgentinaNow().getTime() - 60 * 60 * 1000);

    await expect(
      service.calcularSlotsDisponibles(10, hace1h),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lanza BadRequestError si fechaHasta supera now+60d', async () => {
    const en61dias = new Date(
      getArgentinaNow().getTime() + 61 * 24 * 60 * 60 * 1000,
    );
    const desde = getArgentinaNow();

    await expect(
      service.calcularSlotsDisponibles(10, desde, en61dias),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('calcula slots respetando bloques semanales y excluyendo los ocupados', async () => {
    const ahora = getArgentinaNow();
    // 2h30min en el futuro
    const limiteInf = new Date(ahora.getTime() + 2.5 * 60 * 60 * 1000);
    // 5 días en el futuro
    const limiteSup = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);

    nutriRepo.findOne.mockResolvedValue({ idPersona: 10, duracionTurnoMin: 30 });
    excepcionRepo.findVigentesEnVentana.mockResolvedValue([]);
    turnoRepo.find.mockResolvedValue([]);

    // Los bloques pueden traer duracion legacy distinta; la fuente real es el nutricionista.
    const dias = [
      DiaSemana.DOMINGO,
      DiaSemana.LUNES,
      DiaSemana.MARTES,
      DiaSemana.MIERCOLES,
      DiaSemana.JUEVES,
      DiaSemana.VIERNES,
      DiaSemana.SABADO,
    ];
    agendaRepo.find.mockResolvedValue(
      dias.map((dia) => ({
        idAgenda: 1,
        dia,
        horaInicio: '09:00:00',
        horaFin: '11:00:00',
        duracionTurno: 45,
      })),
    );

    const result = await service.calcularSlotsDisponibles(
      10,
      limiteInf,
      limiteSup,
    );

    expect(result.duracionMin).toBe(30);
    expect(result.slots.length).toBeGreaterThan(0);
    // Todos los slots deben estar >= 2h desde ahora
    for (const slot of result.slots) {
      const slotDate = new Date(slot.fechaHora);
      expect(slotDate.getTime()).toBeGreaterThanOrEqual(limiteInf.getTime());
    }
  });

  it('excluye slots que caen dentro de una ExcepcionDisponibilidad', async () => {
    const ahora = getArgentinaNow();
    const limiteInf = new Date(ahora.getTime() + 2.5 * 60 * 60 * 1000);
    const limiteSup = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);

    nutriRepo.findOne.mockResolvedValue({ idPersona: 10 });
    agendaRepo.find.mockResolvedValue([
      {
        idAgenda: 1,
        dia: DiaSemana.LUNES,
        horaInicio: '09:00:00',
        horaFin: '11:00:00',
        duracionTurno: 30,
      },
    ]);
    turnoRepo.find.mockResolvedValue([]);

    // Excepción que cubre hoy 09:00 a 11:30 (debería excluir los slots de hoy)
    const excepcionInicio = new Date(ahora.getTime());
    excepcionInicio.setHours(9, 0, 0, 0);
    const excepcionFin = new Date(ahora.getTime());
    excepcionFin.setHours(11, 30, 0, 0);
    excepcionRepo.findVigentesEnVentana.mockResolvedValue([
      {
        idExcepcion: 1,
        fechaInicio: excepcionInicio,
        fechaFin: excepcionFin,
        motivo: 'Capacitación',
        nutricionista: { idPersona: 10 },
      },
    ]);

    const result = await service.calcularSlotsDisponibles(
      10,
      limiteInf,
      limiteSup,
    );

    // Los slots de hoy (que caerían en 09:00-11:00) deben estar excluidos
    for (const slot of result.slots) {
      const slotDate = new Date(slot.fechaHora);
      const slotStart = slotDate.getTime();
      const slotEnd = slotStart + 30 * 60 * 1000;
      const isExcluido =
        slotStart < excepcionFin.getTime() &&
        slotEnd > excepcionInicio.getTime();
      expect(isExcluido).toBe(false);
    }
  });

  it('excluye slots que coinciden con turnos ocupados', async () => {
    const ahora = getArgentinaNow();
    const limiteInf = new Date(ahora.getTime() + 2.5 * 60 * 60 * 1000);
    const limiteSup = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);

    nutriRepo.findOne.mockResolvedValue({ idPersona: 10 });
    agendaRepo.find.mockResolvedValue([
      {
        idAgenda: 1,
        dia: DiaSemana.LUNES,
        horaInicio: '09:00:00',
        horaFin: '11:00:00',
        duracionTurno: 30,
      },
    ]);
    excepcionRepo.findVigentesEnVentana.mockResolvedValue([]);

    // Identificar el día con bloques LUNES que cae en la ventana
    // (el primer LUNES >= limiteInf)
    const fechaBloque = new Date(limiteInf);
    while (formatArgentinaDate(fechaBloque) <= formatArgentinaDate(limiteSup)) {
      const dayOfWeek = fechaBloque.getDay();
      // Ajustar a horario Argentina (UTC-3) — simplificamos usando el día local
      if (dayOfWeek === 1) {
        // lunes
        break;
      }
      fechaBloque.setDate(fechaBloque.getDate() + 1);
    }
    const fechaStr = formatArgentinaDate(fechaBloque);

    turnoRepo.find.mockResolvedValue([
      {
        idTurno: 99,
        fechaTurno: fechaBloque,
        horaTurno: '10:00:00',
        estadoTurno: EstadoTurno.CONFIRMADO,
      },
    ]);

    const result = await service.calcularSlotsDisponibles(
      10,
      limiteInf,
      limiteSup,
    );

    // Verificar que ningún slot devuelto coincide con 10:00 del día bloqueado
    for (const slot of result.slots) {
      const slotDate = new Date(slot.fechaHora);
      const slotFechaStr = formatArgentinaDate(slotDate);
      const slotHoraStr = slotDate.toTimeString().slice(0, 5);
      if (slotFechaStr === fechaStr) {
        expect(slotHoraStr).not.toBe('10:00');
      }
    }
  });
});
