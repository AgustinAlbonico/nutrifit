import { UpdateRecepcionistaUseCase } from './update-recepcionista.use-case';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { RecepcionistaRepository } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { Genero } from 'src/domain/entities/Persona/Genero';

describe('UpdateRecepcionistaUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const recepcionistaRepository: jest.Mocked<RecepcionistaRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
      findByDni: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<RecepcionistaRepository>;

    const logger: jest.Mocked<IAppLoggerService> = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<IAppLoggerService>;

    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as unknown as jest.Mocked<IObjectStorageService>;

    const useCase = new UpdateRecepcionistaUseCase(
      recepcionistaRepository,
      logger,
      objectStorage,
    );

    return { useCase, recepcionistaRepository, objectStorage };
  };

  const buildRecepcionista = (fotoPerfilKey: string | null): RecepcionistaEntity => {
    const recepcionista = new RecepcionistaEntity(
      1,
      'María',
      'López',
      new Date('1992-03-10'),
      '1144556677',
      Genero.Femenino,
      'Calle 456',
      'CABA',
      'Buenos Aires',
      '45678901',
    );
    recepcionista.fotoPerfilKey = fotoPerfilKey;
    return recepcionista;
  };

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    const recepcionistaExistente = buildRecepcionista('perfiles/recepcionistas/vieja.png');
    recepcionistaRepository.findById.mockResolvedValue(recepcionistaExistente);
    recepcionistaRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(
      1,
      { nombre: 'María' } as any,
      'perfiles/recepcionistas/nueva.png',
      false,
    );

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith(
      'perfiles/recepcionistas/vieja.png',
    );
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    const recepcionistaExistente = buildRecepcionista('perfiles/recepcionistas/vieja.png');
    recepcionistaRepository.findById.mockResolvedValue(recepcionistaExistente);
    recepcionistaRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith(
      'perfiles/recepcionistas/vieja.png',
    );
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    const recepcionistaExistente = buildRecepcionista(null);
    recepcionistaRepository.findById.mockResolvedValue(recepcionistaExistente);
    recepcionistaRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    const recepcionistaExistente = buildRecepcionista('perfiles/recepcionistas/vieja.png');
    recepcionistaRepository.findById.mockResolvedValue(recepcionistaExistente);
    recepcionistaRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, false);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, recepcionistaRepository, objectStorage } = buildUseCase();
    const recepcionistaExistente = buildRecepcionista('perfiles/recepcionistas/vieja.png');
    recepcionistaRepository.findById.mockResolvedValue(recepcionistaExistente);
    recepcionistaRepository.update.mockImplementation(async (_id, entity) => entity);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(1, {} as any, 'perfiles/recepcionistas/nueva.png', false),
    ).resolves.toBeDefined();
    expect(recepcionistaRepository.update).toHaveBeenCalled();
  });
});