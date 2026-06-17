import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  DIPLOMA_REPOSITORY,
  DiplomaRepository,
} from 'src/domain/entities/Diploma/diploma.repository';
import { DiplomaEntity } from 'src/domain/entities/Diploma/diploma.entity';

@Injectable()
export class ListarDiplomasUseCase implements BaseUseCase {
  constructor(
    @Inject(DIPLOMA_REPOSITORY)
    private readonly diplomaRepository: DiplomaRepository,
  ) {}

  async execute(idNutricionista: number): Promise<DiplomaEntity[]> {
    return this.diplomaRepository.findByIdNutricionista(idNutricionista);
  }
}
