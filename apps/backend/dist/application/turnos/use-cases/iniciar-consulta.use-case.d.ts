import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class IniciarConsultaUseCase {
    private readonly turnoRepository;
    constructor(turnoRepository: Repository<TurnoOrmEntity>);
    execute(turnoId: number): Promise<{
        success: boolean;
        estado: EstadoTurno;
    }>;
}
