import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity, NutricionistaOrmEntity, PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { Repository } from 'typeorm';
import { EliminarPlanAlimentacionDto } from '../dtos';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
export declare class EliminarPlanAlimentacionResponseDto {
    mensaje: string;
    planId: number;
    eliminadoEn: Date;
}
export declare class EliminarPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly nutricionistaRepo;
    private readonly usuarioRepo;
    private readonly auditoriaService;
    private readonly notificacionesService;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>, auditoriaService: AuditoriaService, notificacionesService: NotificacionesService);
    execute(nutricionistaUserId: number, payload: EliminarPlanAlimentacionDto): Promise<EliminarPlanAlimentacionResponseDto>;
}
