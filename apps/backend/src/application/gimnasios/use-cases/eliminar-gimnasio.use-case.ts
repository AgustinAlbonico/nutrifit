import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class EliminarGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  async execute(id: number): Promise<void> {
    // Verificar que existe
    const existente = await this.gimnasioRepository.findById(id);
    if (!existente) {
      throw new NotFoundError('Gimnasio', String(id));
    }

    await this.gimnasioRepository.delete(id);
  }
}