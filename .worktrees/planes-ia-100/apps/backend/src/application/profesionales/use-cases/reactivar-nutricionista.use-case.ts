import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReactivarNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
  ) {}

  async execute(id: number): Promise<void> {
    // Find existing nutricionista
    const nutricionista = await this.nutricionistaRepository.findById(id);
    if (!nutricionista) {
      this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
      throw new NotFoundError('Nutricionista no encontrado.');
    }

    // Reactivar: quitar fecha de baja
    await this.nutricionistaOrmRepository.update(id, {
      fechaBaja: null,
    });

    this.logger.log(`Nutricionista ${id} reactivado exitosamente.`);
  }
}
