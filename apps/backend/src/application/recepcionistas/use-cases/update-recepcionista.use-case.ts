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

@Injectable()
export class UpdateRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    id: number,
    payload: UpdateRecepcionistaDto,
    fotoPerfilKey?: string,
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
      existing.fotoPerfilKey = fotoPerfilKey;
    }

    const updated = await this.recepcionistaRepository.update(id, existing);

    this.logger.log(
      `Recepcionista ${id} actualizado correctamente: ${updated.nombre}`,
    );

    return updated;
  }
}
