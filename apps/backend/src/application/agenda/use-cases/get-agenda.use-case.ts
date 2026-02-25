import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import {
  AGENDA_REPOSITORY,
  IAgendaRepository,
} from 'src/domain/entities/Agenda/agenda.repository';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class GetAgendaUseCase implements BaseUseCase {
  constructor(
    @Inject(AGENDA_REPOSITORY)
    private readonly agendaRepository: IAgendaRepository,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
  ) {}

  async execute(nutricionistaId: number): Promise<AgendaEntity[]> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    return this.agendaRepository.findByNutricionistaId(nutricionistaId);
  }
}
