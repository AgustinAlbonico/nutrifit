import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IAiProviderService } from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import { PlanSemanalIA, RespuestaIA, SolicitudPlanSemanal } from '@nutrifit/shared';
export declare class GenerarPlanSemanalUseCase implements BaseUseCase {
    private readonly aiProvider;
    private readonly prepararContextoPaciente;
    private readonly logger;
    constructor(aiProvider: IAiProviderService, prepararContextoPaciente: PrepararContextoPacienteUseCase, logger: IAppLoggerService);
    execute(solicitud: SolicitudPlanSemanal): Promise<RespuestaIA<PlanSemanalIA>>;
    private calcularCaloriasObjetivo;
    private obtenerFactorActividad;
    private construirPrompt;
    private completarEstructuraPlanSemanal;
    private normalizarTipoComida;
    private clonarComida;
    private normalizarNumero;
    private crearComidaPlaceholder;
    private validarPlanSemanal;
}
