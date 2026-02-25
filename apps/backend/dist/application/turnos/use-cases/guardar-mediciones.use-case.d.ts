import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { GuardarMedicionesDto } from '../dtos/guardar-mediciones.dto';
export interface GuardarMedicionesResponse {
    success: boolean;
    imc: number;
    idMedicion: number;
}
export declare class GuardarMedicionesUseCase {
    private readonly turnoRepository;
    private readonly medicionRepository;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, medicionRepository: Repository<MedicionOrmEntity>);
    execute(turnoId: number, dto: GuardarMedicionesDto): Promise<GuardarMedicionesResponse>;
}
