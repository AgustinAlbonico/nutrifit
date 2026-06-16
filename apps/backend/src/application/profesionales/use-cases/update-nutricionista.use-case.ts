import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UpdateNutricionistaDto } from '../dtos/update-nutricionista.dto';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import {
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

@Injectable()
export class UpdateNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    id: number,
    payload: UpdateNutricionistaDto,
    fotoPerfilKey?: string,
    eliminarFoto: boolean = false,
    usuarioEditorId?: number,
    diplomaKey?: string,
    eliminarDiploma: boolean = false,
  ): Promise<NutricionistaEntity> {
    // Find existing nutricionista
    const nutricionista = await this.nutricionistaRepository.findById(id);
    if (!nutricionista) {
      this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
      throw new NotFoundError('Nutricionista no encontrado.');
    }

    // Find associated usuario
    if (!nutricionista.idPersona) {
      this.logger.error(
        `Nutricionista ${id} encontrado sin idPersona. Estado inconsistente.`,
      );
      throw new NotFoundError('Nutricionista no encontrado.');
    }
    const usuario = await this.usuarioRepository.findByPersonaId(
      nutricionista.idPersona,
    );
    const currentEmail = usuario?.email;

    // Validate email uniqueness (if changed)
    if (payload.email && currentEmail && payload.email !== currentEmail) {
      const foundByEmail = await this.usuarioRepository.findByEmail(
        payload.email,
      );
      if (foundByEmail) {
        this.logger.warn(`El email ${payload.email} ya está registrado.`);
        throw new ConflictError('El email ya está registrado.');
      }
    }

    // Validate DNI uniqueness (if changed)
    if (payload.dni && payload.dni !== nutricionista.dni) {
      const foundByDni = await this.nutricionistaRepository.findByDni(
        payload.dni,
      );
      if (foundByDni) {
        this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
        throw new ConflictError('El DNI ya está registrado.');
      }
    }

    // Validate Matrícula uniqueness (if changed)
    if (payload.matricula && payload.matricula !== nutricionista.matricula) {
      const foundByMatricula =
        await this.nutricionistaRepository.findByMatricula(payload.matricula);
      if (foundByMatricula) {
        this.logger.warn(
          `La matrícula ${payload.matricula} ya está registrada.`,
        );
        throw new ConflictError('La matrícula ya está registrada.');
      }
    }

    // Update nutricionista fields
    if (payload.nombre) nutricionista.nombre = payload.nombre;
    if (payload.apellido) nutricionista.apellido = payload.apellido;
    if (payload.fechaNacimiento)
      nutricionista.fechaNacimiento = new Date(payload.fechaNacimiento);
    if (payload.telefono) nutricionista.telefono = payload.telefono;
    if (payload.genero) nutricionista.genero = payload.genero;
    if (payload.direccion) nutricionista.direccion = payload.direccion;
    if (payload.ciudad) nutricionista.ciudad = payload.ciudad;
    if (payload.provincia) nutricionista.provincia = payload.provincia;
    if (payload.dni) nutricionista.dni = payload.dni;
    if (payload.matricula) nutricionista.matricula = payload.matricula;
    if (payload.tarifaSesion !== undefined)
      nutricionista.tarifaSesion = payload.tarifaSesion;
    if (payload.aniosExperiencia !== undefined)
      nutricionista.aniosExperiencia = payload.aniosExperiencia;
    if (payload.duracionTurnoMin !== undefined)
      nutricionista.duracionTurnoMin = payload.duracionTurnoMin;
    if (payload.presentacion !== undefined)
      nutricionista.presentacion = payload.presentacion;

    // Update foto de perfil if provided
    if (fotoPerfilKey) {
      if (nutricionista.fotoPerfilKey) {
        await this.eliminarArchivoAnterior(nutricionista.fotoPerfilKey);
      }
      nutricionista.fotoPerfilKey = fotoPerfilKey;
    } else if (eliminarFoto && nutricionista.fotoPerfilKey) {
      await this.eliminarArchivoAnterior(nutricionista.fotoPerfilKey);
      nutricionista.fotoPerfilKey = null;
    }

    // Update diploma/matricula if provided
    if (diplomaKey) {
      if (nutricionista.matriculaDocumentoKey) {
        await this.eliminarArchivoAnterior(
          nutricionista.matriculaDocumentoKey,
        );
      }
      nutricionista.matriculaDocumentoKey = diplomaKey;
    } else if (
      eliminarDiploma &&
      nutricionista.matriculaDocumentoKey
    ) {
      await this.eliminarArchivoAnterior(
        nutricionista.matriculaDocumentoKey,
      );
      nutricionista.matriculaDocumentoKey = null;
    }

    // Update nutricionista
    const nutricionistaActualizado = await this.nutricionistaRepository.update(
      id,
      nutricionista,
    );

    // Update usuario email if provided.
    // El cambio de contraseña de un nutricionista ya creado se hace por
    // el endpoint /auth/cambiar-contrasena o un reset-password dedicado,
    // NO en este flujo de edición.
    if (usuario && payload.email) {
      usuario.email = payload.email;
      await this.usuarioRepository.update(usuario.idUsuario!, usuario);
    }

    this.logger.log(
      `Nutricionista ${id} actualizado: ${nutricionistaActualizado.nombre}`,
    );

    await this.auditoriaService.registrar({
      usuarioId: usuarioEditorId ?? null,
      accion: AccionAuditoria.PERFIL_NUTRICIONISTA_ACTUALIZADO,
      entidad: 'Nutricionista',
      entidadId: nutricionistaActualizado.idPersona,
      metadata: {
        camposModificados: Object.keys(payload).filter(
          (k) => (payload as Record<string, unknown>)[k] !== undefined,
        ),
      },
    });

    return nutricionistaActualizado;
  }

  private async eliminarArchivoAnterior(objectKey: string): Promise<void> {
    try {
      await this.objectStorage.eliminarArchivo(objectKey);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar el archivo anterior ${objectKey} del bucket: ${error}`,
      );
    }
  }
}
