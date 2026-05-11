import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AlimentoOrmEntity, DiaPlanOrmEntity, NutricionistaOrmEntity, OpcionComidaOrmEntity, PlanAlimentacionOrmEntity, SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { CrearPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';
export declare class CrearPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly diaRepo;
    private readonly opcionRepo;
    private readonly alimentoRepo;
    private readonly socioRepo;
    private readonly nutricionistaRepo;
    private readonly usuarioRepo;
    private readonly notificacionesService;
    private readonly restriccionesValidator;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, diaRepo: Repository<DiaPlanOrmEntity>, opcionRepo: Repository<OpcionComidaOrmEntity>, alimentoRepo: Repository<AlimentoOrmEntity>, socioRepo: Repository<SocioOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>, notificacionesService: NotificacionesService, restriccionesValidator: RestriccionesValidator);
    execute(nutricionistaUserId: number, payload: CrearPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
}
