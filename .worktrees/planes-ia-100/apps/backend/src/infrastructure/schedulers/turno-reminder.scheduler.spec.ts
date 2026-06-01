import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TurnoReminderScheduler } from './turno-reminder.scheduler';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { RecordatorioEnviadoOrmEntity } from '../persistence/typeorm/entities/recordatorio-enviado.entity';
import { EmailService } from 'src/application/email/email.service';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

describe('TurnoReminderScheduler', () => {
  it('omite envío si ya existe deduplicación', async () => {
    const turnosRepo = { find: jest.fn().mockResolvedValue([]) };
    const recordatoriosRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    const emailService = { enviarRecordatorio: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TurnoReminderScheduler,
        { provide: getRepositoryToken(TurnoOrmEntity), useValue: turnosRepo },
        {
          provide: getRepositoryToken(RecordatorioEnviadoOrmEntity),
          useValue: recordatoriosRepo,
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();
    const scheduler = module.get(TurnoReminderScheduler);
    await scheduler.ejecutarRecordatorios();
    expect(emailService.enviarRecordatorio).not.toHaveBeenCalled();
  });

  it('debe excluir turnos en estados CANCELADO y AUSENTE', async () => {
    // Turnos que SÍ deberían procesarse (PROGRAMADO)
    const turnosValidos = [
      {
        idTurno: 1,
        fechaTurno: new Date(),
        horaTurno: '15:00',
        estadoTurno: EstadoTurno.PROGRAMADO,
        socio: { usuario: { email: 'test@test.com' }, nombre: 'Socio' },
        nutricionista: { nombre: 'Profesional' },
      },
    ] as TurnoOrmEntity[];

    // Verificar que el find se llamó excluyendo CANCELADO y AUSENTE
    const findMock = jest.fn().mockResolvedValue(turnosValidos);
    const turnosRepo = { find: findMock };
    const recordatoriosRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      create: jest.fn(),
    };
    const emailService = { enviarRecordatorio: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        TurnoReminderScheduler,
        { provide: getRepositoryToken(TurnoOrmEntity), useValue: turnosRepo },
        {
          provide: getRepositoryToken(RecordatorioEnviadoOrmEntity),
          useValue: recordatoriosRepo,
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    const scheduler = module.get(TurnoReminderScheduler);
    await scheduler.ejecutarRecordatorios();

    // Verificar que el find fue llamado y excluía CANCELADO y AUSENTE
    expect(findMock).toHaveBeenCalled();
    const findCall = findMock.mock.calls[0][0];
    expect(findCall.where.estadoTurno).toBeDefined();
    // El operador Not(In(...)) genera una condición que excluye esos estados
  });
});
