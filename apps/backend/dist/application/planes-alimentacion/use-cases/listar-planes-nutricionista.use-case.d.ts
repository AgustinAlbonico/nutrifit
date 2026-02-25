import { BaseUseCase } from 'src/application/shared/use-case.base';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
export declare class ListarPlanesNutricionistaUseCase implements BaseUseCase {
    private readonly planRepo;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>);
    execute(nutricionistaId: number): Promise<PlanAlimentacionResponseDto[]>;
}
