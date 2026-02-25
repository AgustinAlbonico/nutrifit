import { CrearPlanAlimentacionDto, EditarPlanAlimentacionDto, EliminarPlanAlimentacionDto, PlanAlimentacionResponseDto } from 'src/application/planes-alimentacion/dtos';
import { CrearPlanAlimentacionUseCase, EditarPlanAlimentacionUseCase, EliminarPlanAlimentacionUseCase, EliminarPlanAlimentacionResponseDto, ListarPlanesSocioUseCase, ListarPlanesNutricionistaUseCase, ObtenerPlanActivoSocioUseCase, ObtenerPlanPorIdUseCase, VaciarContenidoPlanUseCase, VaciarContenidoPlanResponseDto } from 'src/application/planes-alimentacion/use-cases';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { Request } from 'express';
export declare class PlanAlimentacionController {
    private readonly crearPlanAlimentacionUseCase;
    private readonly editarPlanAlimentacionUseCase;
    private readonly eliminarPlanAlimentacionUseCase;
    private readonly obtenerPlanActivoSocioUseCase;
    private readonly obtenerPlanPorIdUseCase;
    private readonly listarPlanesSocioUseCase;
    private readonly listarPlanesNutricionistaUseCase;
    private readonly vaciarContenidoPlanUseCase;
    private readonly logger;
    constructor(crearPlanAlimentacionUseCase: CrearPlanAlimentacionUseCase, editarPlanAlimentacionUseCase: EditarPlanAlimentacionUseCase, eliminarPlanAlimentacionUseCase: EliminarPlanAlimentacionUseCase, obtenerPlanActivoSocioUseCase: ObtenerPlanActivoSocioUseCase, obtenerPlanPorIdUseCase: ObtenerPlanPorIdUseCase, listarPlanesSocioUseCase: ListarPlanesSocioUseCase, listarPlanesNutricionistaUseCase: ListarPlanesNutricionistaUseCase, vaciarContenidoPlanUseCase: VaciarContenidoPlanUseCase, logger: IAppLoggerService);
    crearPlan(req: Request, payload: CrearPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
    listarPlanesNutricionista(nutricionistaId: number): Promise<PlanAlimentacionResponseDto[]>;
    obtenerPlanActivoSocio(socioId: number): Promise<PlanAlimentacionResponseDto>;
    listarPlanesSocio(socioId: number): Promise<PlanAlimentacionResponseDto[]>;
    obtenerPlanPorId(id: number): Promise<PlanAlimentacionResponseDto>;
    editarPlan(req: Request, id: number, payload: EditarPlanAlimentacionDto): Promise<PlanAlimentacionResponseDto>;
    eliminarPlan(req: Request, id: number, payload: EliminarPlanAlimentacionDto): Promise<EliminarPlanAlimentacionResponseDto>;
    vaciarContenidoPlan(req: Request, id: number): Promise<VaciarContenidoPlanResponseDto>;
}
