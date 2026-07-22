import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
  CrearGimnasioDto,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import {
  EstadoGimnasio,
  GimnasioEntity,
} from 'src/domain/entities/Gimnasio/gimnasio.entity';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class CrearGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  async execute(dto: CrearGimnasioDto): Promise<GimnasioEntity> {
    // Validar que el nombre no exista
    const existente = await this.gimnasioRepository.findByNombre(dto.nombre);
    if (existente) {
      throw new ConflictError(
        `Ya existe un gimnasio con el nombre "${dto.nombre}"`,
      );
    }

    // Crear la entidad
    const gimnasio = new GimnasioEntity({
      id: 0, // se asigna al guardar
      nombre: dto.nombre,
      direccion: dto.direccion,
      telefono: dto.telefono ?? null,
      email: dto.email ?? null,
      estado: EstadoGimnasio.ACTIVO,
      fechaAlta: new Date(),
      fechaBaja: null,
    });

    return this.gimnasioRepository.save(gimnasio);
  }
}
