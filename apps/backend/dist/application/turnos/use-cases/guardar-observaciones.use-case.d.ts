import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
export interface GuardarObservacionesDto {
    comentario: string;
    sugerencias?: string;
    habitosSocio?: string;
    objetivosSocio?: string;
}
export declare class GuardarObservacionesUseCase {
    private readonly turnoRepository;
    private readonly observacionRepository;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, observacionRepository: Repository<ObservacionClinicaOrmEntity>);
    execute(turnoId: number, dto: GuardarObservacionesDto): Promise<{
        success: boolean;
    }>;
}
