import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AlimentoOrmEntity, DiaPlanOrmEntity, NutricionistaOrmEntity, OpcionComidaOrmEntity, PlanAlimentacionOrmEntity, SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { DataSource, Repository } from 'typeorm';
import { EditarPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
export declare class EditarPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly diaRepo;
    private readonly opcionRepo;
    private readonly alimentoRepo;
    private readonly socioRepo;
    private readonly nutricionistaRepo;
    private readonly usuarioRepo;
    private readonly auditoriaService;
    private readonly dataSource;
    private readonly notificacionesService;
    private readonly restriccionesValidator;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, diaRepo: Repository<DiaPlanOrmEntity>, opcionRepo: Repository<OpcionComidaOrmEntity>, alimentoRepo: Repository<AlimentoOrmEntity>, socioRepo: Repository<SocioOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>, auditoriaService: AuditoriaService, dataSource: DataSource, notificacionesService: NotificacionesService, restriccionesValidator: RestriccionesValidator);
    execute(nutricionistaUserId: number, payload: EditarPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
}
