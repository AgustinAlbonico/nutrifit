import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IAiProviderService } from 'src/domain/services/ai-provider.service';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { AnalisisNutricional, RespuestaIA, SolicitudAnalisis } from '@nutrifit/shared';
export declare class AnalizarPlanNutricionalUseCase implements BaseUseCase {
    private readonly aiProvider;
    private readonly planRepository;
    private readonly logger;
    constructor(aiProvider: IAiProviderService, planRepository: Repository<PlanAlimentacionOrmEntity>, logger: IAppLoggerService);
    execute(solicitud: SolicitudAnalisis): Promise<RespuestaIA<AnalisisNutricional>>;
    private extraerResumenPlan;
    private construirPrompt;
    private validarAnalisis;
}
