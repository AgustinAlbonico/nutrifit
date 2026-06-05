import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { ActualizarSocioDto } from './dtos/actualizarSocio.dto';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  IPasswordEncrypterService,
  PASSWORD_ENCRYPTER_SERVICE,
} from 'src/domain/services/password-encrypter.service';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

@Injectable()
export class ActualizarSocioUseCase implements BaseUseCase {
  private readonly logger = new Logger(ActualizarSocioUseCase.name);

  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(
    id: number,
    payload: ActualizarSocioDto,
    fotoPerfilKey?: string,
    eliminarFoto: boolean = false,
  ): Promise<SocioEntity> {
    const socioExistente = await this.socioRepository.findById(id);
    if (!socioExistente) {
      throw new NotFoundException(`Socio con id ${id} no encontrado`);
    }

    const socioActualizado = new SocioEntity(
      id,
      payload.nombre ?? socioExistente.nombre,
      payload.apellido ?? socioExistente.apellido,
      payload.fechaNacimiento
        ? new Date(payload.fechaNacimiento)
        : socioExistente.fechaNacimiento,
      payload.telefono ?? socioExistente.telefono,
      payload.genero ?? socioExistente.genero,
      payload.direccion ?? socioExistente.direccion,
      payload.ciudad ?? socioExistente.ciudad,
      payload.provincia ?? socioExistente.provincia,
      payload.dni ?? socioExistente.dni,
      socioExistente.turnos,
      socioExistente.fichaSalud,
      socioExistente.planesAlimentacion,
    );

    if (fotoPerfilKey) {
      if (socioExistente.fotoPerfilKey) {
        await this.eliminarFotoAnterior(socioExistente.fotoPerfilKey);
      }
      socioActualizado.fotoPerfilKey = fotoPerfilKey;
    } else if (eliminarFoto && socioExistente.fotoPerfilKey) {
      await this.eliminarFotoAnterior(socioExistente.fotoPerfilKey);
      socioActualizado.fotoPerfilKey = null;
    } else if (socioExistente.fotoPerfilKey) {
      socioActualizado.fotoPerfilKey = socioExistente.fotoPerfilKey;
    }

    const result = await this.socioRepository.update(id, socioActualizado);

    if (payload.contrasena) {
      const usuario = await this.usuarioRepository.findByPersonaId(id);
      if (usuario) {
        const contrasenaEncriptada =
          await this.passwordEncrypter.encryptPassword(payload.contrasena);
        await this.usuarioRepository.update(usuario.idUsuario!, usuario);
      }
    }

    return result;
  }

  private async eliminarFotoAnterior(objectKey: string): Promise<void> {
    try {
      await this.objectStorage.eliminarArchivo(objectKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar la foto anterior ${objectKey} del bucket: ${error}`,
      );
    }
  }
}
