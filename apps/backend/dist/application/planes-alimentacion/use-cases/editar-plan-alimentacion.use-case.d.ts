import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { AlimentoOrmEntity, DiaPlanOrmEntity, FichaSaludOrmEntity, NutricionistaOrmEntity, OpcionComidaOrmEntity, PlanAlimentacionOrmEntity, SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { DataSource, Repository } from 'typeorm';
import { EditarPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
export declare class EditarPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly diaRepo;
    private readonly opcionRepo;
    private readonly alimentoRepo;
    private readonly socioRepo;
    private readonly nutricionistaRepo;
    private readonly fichaSaludRepo;
    private readonly usuarioRepo;
    private readonly dataSource;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, diaRepo: Repository<DiaPlanOrmEntity>, opcionRepo: Repository<OpcionComidaOrmEntity>, alimentoRepo: Repository<AlimentoOrmEntity>, socioRepo: Repository<SocioOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, fichaSaludRepo: Repository<FichaSaludOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>, dataSource: DataSource);
    execute(nutricionistaUserId: number, payload: EditarPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
}
