import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OBJECT_STORAGE_SERVICE } from 'src/domain/services/object-storage.service';
import { AdjuntoClinicoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { AdjuntoClinicoService } from './adjunto-clinico.service';

describe('AdjuntoClinicoService', () => {
  it('debe resolverse usando el token OBJECT_STORAGE_SERVICE', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdjuntoClinicoService,
        {
          provide: getRepositoryToken(AdjuntoClinicoOrmEntity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(TurnoOrmEntity),
          useValue: {},
        },
        {
          provide: OBJECT_STORAGE_SERVICE,
          useValue: {
            subirArchivo: jest.fn(),
            obtenerUrlFirmada: jest.fn(),
            eliminarArchivo: jest.fn(),
          },
        },
      ],
    }).compile();

    expect(moduleRef.get(AdjuntoClinicoService)).toBeInstanceOf(
      AdjuntoClinicoService,
    );
  });
});
