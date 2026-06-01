import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RecepcionistaResponseDto } from '../dtos/recepcionista-response.dto';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';

@Injectable()
export class ListRecepcionistasUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
  ) {}

  async execute(): Promise<RecepcionistaResponseDto[]> {
    const recepcionistas = await this.recepcionistaRepository.findAll();
    return recepcionistas.map((rec) =>
      RecepcionistaResponseDto.fromEntity(rec),
    );
  }
}
