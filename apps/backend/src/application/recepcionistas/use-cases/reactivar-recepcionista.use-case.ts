import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';

@Injectable()
export class ReactivarRecepcionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  async execute(id: number): Promise<RecepcionistaEntity> {
    const existing = await this.recepcionistaRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(`Recepcionista con id ${id} no encontrado`);
    }

    existing.fechaBaja = null;

    const reactivado = await this.recepcionistaRepository.update(id, existing);

    this.logger.log(`Recepcionista ${id} reactivado`);

    return reactivado;
  }
}
