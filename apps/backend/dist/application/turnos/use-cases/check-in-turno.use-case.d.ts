import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
export declare class CheckInTurnoUseCase {
    private readonly turnoRepository;
    private readonly notificacionesService;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, notificacionesService: NotificacionesService);
    execute(turnoId: number): Promise<{
        success: boolean;
        estado: EstadoTurno;
    }>;
}
