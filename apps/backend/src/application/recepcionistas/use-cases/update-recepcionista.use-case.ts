import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UpdateRecepcionistaDto } from '../dtos/update-recepcionista.dto';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

@Injectable()
export class UpdateRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(
    id: number,
    payload: UpdateRecepcionistaDto,
    fotoPerfilKey?: string,
    eliminarFoto: boolean = false,
  ): Promise<RecepcionistaEntity> {
    const existing = await this.recepcionistaRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Recepcionista con id ${id} no encontrado`);
    }

    if (payload.nombre) existing.nombre = payload.nombre;
    if (payload.apellido) existing.apellido = payload.apellido;
    if (payload.fechaNacimiento)
      existing.fechaNacimiento = new Date(payload.fechaNacimiento);
    if (payload.telefono) existing.telefono = payload.telefono;
    if (payload.genero) existing.genero = payload.genero;
    if (payload.direccion) existing.direccion = payload.direccion;
    if (payload.ciudad) existing.ciudad = payload.ciudad;
    if (payload.provincia) existing.provincia = payload.provincia;

    if (fotoPerfilKey) {
      if (existing.fotoPerfilKey) {
        await this.eliminarFotoAnterior(existing.fotoPerfilKey);
      }
      existing.fotoPerfilKey = fotoPerfilKey;
    } else if (eliminarFoto && existing.fotoPerfilKey) {
      await this.eliminarFotoAnterior(existing.fotoPerfilKey);
      existing.fotoPerfilKey = null;
    }

    const updated = await this.recepcionistaRepository.update(id, existing);

    this.logger.log(
      `Recepcionista ${id} actualizado correctamente: ${updated.nombre}`,
    );

    return updated;
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
