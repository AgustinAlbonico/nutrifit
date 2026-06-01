import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RecepcionistaResponseDto } from '../dtos/recepcionista-response.dto';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class GetRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
  ) {}

  async execute(id: number): Promise<RecepcionistaResponseDto> {
    const recepcionista = await this.recepcionistaRepository.findById(id);

    if (!recepcionista) {
      throw new NotFoundError(`Recepcionista con id ${id} no encontrado`);
    }

    return RecepcionistaResponseDto.fromEntity(recepcionista);
  }
}
