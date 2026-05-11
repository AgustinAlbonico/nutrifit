import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
export declare class FinalizarConsultaUseCase {
    private readonly turnoRepository;
    private readonly notificacionesService;
    private readonly auditoriaService;
    constructor(turnoRepository: Repository<TurnoOrmEntity>, notificacionesService: NotificacionesService, auditoriaService: AuditoriaService);
    execute(turnoId: number): Promise<{
        success: boolean;
        estado: EstadoTurno;
    }>;
}
