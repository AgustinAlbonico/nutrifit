import { BaseUseCase } from 'src/application/shared/use-case.base';
import { DatosTurnoResponseDto } from 'src/application/turnos/dtos/datos-turno-response.dto';
import { TurnoOrmEntity, NutricionistaOrmEntity, FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
export declare class GetTurnoByIdUseCase implements BaseUseCase {
    private readonly turnoRepository;
    private readonly nutricionistaRepository;
    private readonly fichaSaludRepository;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, nutricionistaRepository: Repository<NutricionistaOrmEntity>, fichaSaludRepository: Repository<FichaSaludOrmEntity>);
    execute(turnoId: number, nutricionistaId: number): Promise<DatosTurnoResponseDto>;
    private mapNivelActividad;
    private mapFrecuenciaComidas;
    private mapConsumoAlcohol;
    private formatDate;
}
