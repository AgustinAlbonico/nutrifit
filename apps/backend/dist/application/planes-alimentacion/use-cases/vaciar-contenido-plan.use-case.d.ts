import { BaseUseCase } from 'src/application/shared/use-case.base';
import { UsuarioOrmEntity, NutricionistaOrmEntity, PlanAlimentacionOrmEntity, DiaPlanOrmEntity, OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository, DataSource } from 'typeorm';
export declare class VaciarContenidoPlanDto {
    planId: number;
}
export declare class VaciarContenidoPlanResponseDto {
    mensaje: string;
    planId: number;
    diasEliminados: number;
    opcionesEliminadas: number;
    vaciadoEn: Date;
}
export declare class VaciarContenidoPlanUseCase implements BaseUseCase {
    private readonly planRepo;
    private readonly nutricionistaRepo;
    private readonly usuarioRepo;
    private readonly diaPlanRepo;
    private readonly opcionComidaRepo;
    private readonly dataSource;
    constructor(planRepo: Repository<PlanAlimentacionOrmEntity>, nutricionistaRepo: Repository<NutricionistaOrmEntity>, usuarioRepo: Repository<UsuarioOrmEntity>, diaPlanRepo: Repository<DiaPlanOrmEntity>, opcionComidaRepo: Repository<OpcionComidaOrmEntity>, dataSource: DataSource);
    execute(nutricionistaUserId: number, payload: VaciarContenidoPlanDto): Promise<VaciarContenidoPlanResponseDto>;
}
