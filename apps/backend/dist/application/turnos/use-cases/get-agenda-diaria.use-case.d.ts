import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AgendaSlotDto } from 'src/application/turnos/dtos/agenda-slot.dto';
import { GetAgendaDiariaQueryDto } from 'src/application/turnos/dtos/get-agenda-diaria-query.dto';
import { AgendaOrmEntity, TurnoOrmEntity, NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class GetAgendaDiariaUseCase implements BaseUseCase {
    private readonly agendaRepository;
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    constructor(agendaRepository: Repository<AgendaOrmEntity>, turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: Repository<NutricionistaOrmEntity>);
    execute(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    private mapDateToDiaSemana;
}
