import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
  ActualizarGimnasioDto,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';
import {
  NotFoundError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ActualizarGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  async execute(
    id: number,
    dto: ActualizarGimnasioDto,
  ): Promise<GimnasioEntity> {
    // Verificar que el gimnasio existe
    const existente = await this.gimnasioRepository.findById(id);
    if (!existente) {
      throw new NotFoundError('Gimnasio', String(id));
    }

    // Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (dto.nombre && dto.nombre !== existente.nombre) {
      const conMismoNombre = await this.gimnasioRepository.findByNombre(
        dto.nombre,
      );
      if (conMismoNombre && conMismoNombre.id !== id) {
        throw new ConflictError(
          `Ya existe un gimnasio con el nombre "${dto.nombre}"`,
        );
      }
    }

    return this.gimnasioRepository.update(id, dto);
  }
}
