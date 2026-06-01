import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ActualizarSocioUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(PASSWORD_ENCRYPTER_SERVICE)
    private readonly passwordEncrypter: IPasswordEncrypterService,
  ) {}

  async execute(
    id: number,
    payload: ActualizarSocioDto,
    fotoPerfilKey?: string,
  ): Promise<SocioEntity> {
    const socioExistente = await this.socioRepository.findById(id);
    if (!socioExistente) {
      throw new NotFoundException(`Socio con id ${id} no encontrado`);
    }

    // Actualizar datos del socio, usando valores existentes si no se proporcionan nuevos
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

    // Asignar foto de perfil si se proporcionó una nueva
    if (fotoPerfilKey) {
      socioActualizado.fotoPerfilKey = fotoPerfilKey;
    } else if (socioExistente.fotoPerfilKey) {
      // Mantener la foto existente si no se proporcionó una nueva
      socioActualizado.fotoPerfilKey = socioExistente.fotoPerfilKey;
    }

    const result = await this.socioRepository.update(id, socioActualizado);

    // Si se proporciona contraseña, actualizarla
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
}
