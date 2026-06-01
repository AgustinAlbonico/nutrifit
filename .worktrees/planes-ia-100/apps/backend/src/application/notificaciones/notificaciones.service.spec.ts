import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/notificacion.entity';
import { EstadoNotificacion } from 'src/domain/entities/Notificacion/estado-notificacion.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: getRepositoryToken(NotificacionOrmEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(NotificacionesService);
    jest.clearAllMocks();
  });

  it('crea notificación en NO_LEIDA', async () => {
    repo.create.mockReturnValue({});
    repo.save.mockResolvedValue({
      idNotificacion: 1,
      estado: EstadoNotificacion.NO_LEIDA,
    });
    const res = await service.crear({
      destinatarioId: 1,
      tipo: TipoNotificacion.CHECK_IN,
      titulo: 't',
      mensaje: 'm',
    });
    expect(repo.create).toHaveBeenCalled();
    expect(res.idNotificacion).toBe(1);
  });
});
