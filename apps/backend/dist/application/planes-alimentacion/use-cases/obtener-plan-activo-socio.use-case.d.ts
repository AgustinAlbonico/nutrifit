import { BaseUseCase } from 'src/application/shared/use-case.base';
import { PlanAlimentacionOrmEntity, SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
export declare class ObtenerPlanActivoSocioUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly socioRepo;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, socioRepo: Repository<SocioOrmEntity>);
    execute(socioId: number): Promise<PlanAlimentacionResponseDto>;
}
