import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity, NutricionistaOrmEntity, PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { EliminarPlanAlimentacionDto } from '../dtos';
export declare class EliminarPlanAlimentacionResponseDto {
    mensaje: string;
    planId: number;
    eliminadoEn: Date;
}
export declare class EliminarPlanAlimentacionUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly nutricionistaRepo;
    private readonly usuarioRepo;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>);
    execute(nutricionistaUserId: number, payload: EliminarPlanAlimentacionDto): Promise<EliminarPlanAlimentacionResponseDto>;
}
