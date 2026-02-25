import { GenerarRecomendacionDto, GenerarPlanSemanalDto, SugerirSustitucionDto, AnalizarPlanDto } from 'src/application/ai/dto';
import { GenerarRecomendacionComidaUseCase, GenerarPlanSemanalUseCase, SugerirSustitucionUseCase, AnalizarPlanNutricionalUseCase } from 'src/application/ai/use-cases';
export declare class AiController {
    private readonly generarRecomendacionUseCase;
    private readonly generarPlanSemanalUseCase;
    private readonly sugerirSustitucionUseCase;
    private readonly analizarPlanNutricionalUseCase;
    constructor(generarRecomendacionUseCase: GenerarRecomendacionComidaUseCase, generarPlanSemanalUseCase: GenerarPlanSemanalUseCase, sugerirSustitucionUseCase: SugerirSustitucionUseCase, analizarPlanNutricionalUseCase: AnalizarPlanNutricionalUseCase);
    generarRecomendacion(dto: GenerarRecomendacionDto): Promise<import("@nutrifit/shared").RespuestaIA<import("@nutrifit/shared").RecomendacionComida[]>>;
    generarPlanSemanal(dto: GenerarPlanSemanalDto): Promise<import("@nutrifit/shared").RespuestaIA<import("@nutrifit/shared").PlanSemanalIA>>;
    sugerirSustitucion(dto: SugerirSustitucionDto): Promise<import("@nutrifit/shared").RespuestaIA<import("@nutrifit/shared").SustitucionAlimento>>;
    analizarPlan(dto: AnalizarPlanDto): Promise<import("@nutrifit/shared").RespuestaIA<import("@nutrifit/shared").AnalisisNutricional>>;
}
