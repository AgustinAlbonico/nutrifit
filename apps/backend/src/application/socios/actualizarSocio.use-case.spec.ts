import { ActualizarSocioUseCase } from './actualizarSocio.use-case';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { IPasswordEncrypterService } from 'src/domain/services/password-encrypter.service';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { Genero } from 'src/domain/entities/Persona/Genero';

describe('ActualizarSocioUseCase — limpieza de foto de perfil', () => {
  const buildUseCase = () => {
    const socioRepository: jest.Mocked<SocioRepository> = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<SocioRepository>;
    const usuarioRepository: jest.Mocked<UsuarioRepository> = {
      findByPersonaId: jest.fn(),
    } as unknown as jest.Mocked<UsuarioRepository>;
    const passwordEncrypter: jest.Mocked<IPasswordEncrypterService> = {
      encryptPassword: jest.fn(),
    } as unknown as jest.Mocked<IPasswordEncrypterService>;
    const objectStorage: jest.Mocked<IObjectStorageService> = {
      eliminarArchivo: jest.fn(),
      subirArchivo: jest.fn(),
      obtenerUrlFirmada: jest.fn(),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    } as unknown as jest.Mocked<IObjectStorageService>;

    const useCase = new ActualizarSocioUseCase(
      socioRepository,
      usuarioRepository,
      passwordEncrypter,
      objectStorage,
    );

    return { useCase, socioRepository, objectStorage };
  };

  const buildSocio = (fotoPerfilKey: string | null): SocioEntity => {
    const socio = new SocioEntity(
      1,
      'Juan',
      'Pérez',
      new Date('1990-01-01'),
      '1144556677',
      Genero.Masculino,
      'Calle 1',
      'CABA',
      'Buenos Aires',
      '12345678',
    );
    socio.fotoPerfilKey = fotoPerfilKey;
    return socio;
  };

  it('elimina la foto anterior de MinIO cuando llega una nueva', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(
      1,
      { nombre: 'Juan' } as any,
      'perfiles/socios/nueva.png',
      false,
    );

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/socios/vieja.png');
  });

  it('elimina la foto anterior cuando eliminarFoto=true aunque no llegue foto nueva', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).toHaveBeenCalledWith('perfiles/socios/vieja.png');
  });

  it('NO elimina si no hay foto previa y eliminarFoto=true (idempotente)', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio(null);
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, true);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO elimina si no hay foto nueva y eliminarFoto=false (caso edición normal)', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);

    await useCase.execute(1, {} as any, undefined, false);

    expect(objectStorage.eliminarArchivo).not.toHaveBeenCalled();
  });

  it('NO falla el update si la eliminación de la foto vieja falla en MinIO', async () => {
    const { useCase, socioRepository, objectStorage } = buildUseCase();
    const socioExistente = buildSocio('perfiles/socios/vieja.png');
    socioRepository.findById.mockResolvedValue(socioExistente);
    socioRepository.update.mockImplementation(async (_id, entity) => entity);
    objectStorage.eliminarArchivo.mockRejectedValue(new Error('MinIO down'));

    await expect(
      useCase.execute(1, {} as any, 'perfiles/socios/nueva.png', false),
    ).resolves.toBeDefined();
    expect(socioRepository.update).toHaveBeenCalled();
  });
});