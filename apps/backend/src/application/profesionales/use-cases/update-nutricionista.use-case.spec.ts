import { UpdateNutricionistaUseCase } from './update-nutricionista.use-case';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';

describe('UpdateNutricionistaUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const nutricionistaRepository: jest.Mocked<NutricionistaRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
      findByDni: jest.fn(),
      findByMatricula: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<NutricionistaRepository>;

    const usuarioRepository: jest.Mocked<UsuarioRepository> = {
      findByEmail: jest.fn(),
      update: jest.fn(),
      findByPersonaId: jest.fn(),
    } as unknown as jest.Mocked<UsuarioRepository>;

    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as unknown as jest.Mocked<IObjectStorageService>;

    const logger: jest.Mocked<IAppLoggerService> = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<IAppLoggerService>;

    const auditoriaService: jest.Mocked<AuditoriaService> = {
      registrar: jest.fn(),
      listarConFiltros: jest.fn(),
    } as unknown as jest.Mocked<AuditoriaService>;

    const useCase = new UpdateNutricionistaUseCase(
      nutricionistaRepository,
      usuarioRepository,
      logger,
      objectStorage,
      auditoriaService,
    );

    return { useCase, nutricionistaRepository, objectStorage };
  };

  const buildNutricionista = (
    fotoPerfilKey: string | null,
  ): NutricionistaEntity => {
    const nutricionista = new NutricionistaEntity(
      1,
      'Ana',
      'García',
      new Date('1985-05-15'),
      '1144556677',
      Genero.Femenino,
      'Calle 123',
      'CABA',
      'Buenos Aires',
      '98765432',
      10,
      500,
    );
    nutricionista.fotoPerfilKey = fotoPerfilKey;
    return nutricionista;
  };

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    const nutricionistaExistente = buildNutricionista(
      'perfiles/nutricionistas/vieja.png',
    );
    nutricionistaRepository.findById.mockResolvedValue(nutricionistaExistente);
    nutricionistaRepository.update.mockImplementation(
      async (_id, entity) => entity,
    );
    nutricionistaRepository.findByDni.mockResolvedValue(null);
    nutricionistaRepository.findByMatricula.mockResolvedValue(null);
    nutricionistaRepository.findAll.mockResolvedValue([]);

    await useCase.execute(
      1,
      { nombre: 'Ana' } as any,
      'perfiles/nutricionistas/nueva.png',
      false,
      undefined,
    );

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith(
      'perfiles/nutricionistas/vieja.png',
    );
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    const nutricionistaExistente = buildNutricionista(
      'perfiles/nutricionistas/vieja.png',
    );
    nutricionistaRepository.findById.mockResolvedValue(nutricionistaExistente);
    nutricionistaRepository.update.mockImplementation(
      async (_id, entity) => entity,
    );
    nutricionistaRepository.findByDni.mockResolvedValue(null);
    nutricionistaRepository.findByMatricula.mockResolvedValue(null);
    nutricionistaRepository.findAll.mockResolvedValue([]);

    await useCase.execute(1, {} as any, undefined, true, undefined);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith(
      'perfiles/nutricionistas/vieja.png',
    );
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    const nutricionistaExistente = buildNutricionista(null);
    nutricionistaRepository.findById.mockResolvedValue(nutricionistaExistente);
    nutricionistaRepository.update.mockImplementation(
      async (_id, entity) => entity,
    );
    nutricionistaRepository.findByDni.mockResolvedValue(null);
    nutricionistaRepository.findByMatricula.mockResolvedValue(null);
    nutricionistaRepository.findAll.mockResolvedValue([]);

    await useCase.execute(1, {} as any, undefined, true, undefined);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    const nutricionistaExistente = buildNutricionista(
      'perfiles/nutricionistas/vieja.png',
    );
    nutricionistaRepository.findById.mockResolvedValue(nutricionistaExistente);
    nutricionistaRepository.update.mockImplementation(
      async (_id, entity) => entity,
    );
    nutricionistaRepository.findByDni.mockResolvedValue(null);
    nutricionistaRepository.findByMatricula.mockResolvedValue(null);
    nutricionistaRepository.findAll.mockResolvedValue([]);

    await useCase.execute(1, {} as any, undefined, false, undefined);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, nutricionistaRepository, objectStorage } = buildUseCase();
    const nutricionistaExistente = buildNutricionista(
      'perfiles/nutricionistas/vieja.png',
    );
    nutricionistaRepository.findById.mockResolvedValue(nutricionistaExistente);
    nutricionistaRepository.update.mockImplementation(
      async (_id, entity) => entity,
    );
    nutricionistaRepository.findByDni.mockResolvedValue(null);
    nutricionistaRepository.findByMatricula.mockResolvedValue(null);
    nutricionistaRepository.findAll.mockResolvedValue([]);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(
        1,
        {} as any,
        'perfiles/nutricionistas/nueva.png',
        false,
        undefined,
      ),
    ).resolves.toBeDefined();
    expect(nutricionistaRepository.update).toHaveBeenCalled();
  });
});
