import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ObtenerGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  async execute(id: number): Promise<GimnasioEntity> {
    const gimnasio = await this.gimnasioRepository.findById(id);
    if (!gimnasio) {
      throw new NotFoundError('Gimnasio', String(id));
    }
    return gimnasio;
  }
}