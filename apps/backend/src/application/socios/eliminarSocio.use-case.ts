import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';

@Injectable()
export class EliminarSocioUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const socioExistente = await this.socioRepository.findById(id);
    if (!socioExistente) {
      throw new NotFoundException(`Socio con id ${id} no encontrado`);
    }

    // Baja lógica - establecer fecha de baja
    await this.socioRepository.delete(id);
  }
}
