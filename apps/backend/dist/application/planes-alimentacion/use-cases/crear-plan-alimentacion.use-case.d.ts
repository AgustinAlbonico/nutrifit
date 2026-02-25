import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AlimentoOrmEntity, DiaPlanOrmEntity, FichaSaludOrmEntity, NutricionistaOrmEntity, OpcionComidaOrmEntity, PlanAlimentacionOrmEntity, SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { CrearPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
export declare class CrearPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly diaRepo;
    private readonly opcionRepo;
    private readonly alimentoRepo;
    private readonly socioRepo;
    private readonly nutricionistaRepo;
    private readonly fichaSaludRepo;
    private readonly usuarioRepo;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, diaRepo: Repository<DiaPlanOrmEntity>, opcionRepo: Repository<OpcionComidaOrmEntity>, alimentoRepo: Repository<AlimentoOrmEntity>, socioRepo: Repository<SocioOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, fichaSaludRepo: Repository<FichaSaludOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>);
    execute(nutricionistaUserId: number, payload: CrearPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
}
