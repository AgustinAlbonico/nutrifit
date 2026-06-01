import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { GimnasioEntity } from 'src/domain/entities/Gimnasio/gimnasio.entity';

@Injectable()
export class ListarGimnasiosUseCase implements BaseUseCase {
  constructor(
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
  ) {}

  async execute(): Promise<GimnasioEntity[]> {
    return this.gimnasioRepository.findActivos();
  }
}