import { BaseUseCase } from 'src/application/shared/use-case.base';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IAiProviderService } from 'src/domain/services/ai-provider.service';
import { PrepararContextoPacienteUseCase } from './preparar-contexto-paciente.use-case';
import { RecomendacionComida, RespuestaIA, SolicitudRecomendacion } from '@nutrifit/shared';
export declare const DISCLAIMER_IA = "Esta recomendaci\u00F3n es orientaci\u00F3n general y no sustituye consejo m\u00E9dico profesional. Consulte siempre con su nutricionista.";
export declare class GenerarRecomendacionComidaUseCase implements BaseUseCase {
    private readonly aiProvider;
    private readonly prepararContextoPaciente;
    private readonly logger;
    constructor(aiProvider: IAiProviderService, prepararContextoPaciente: PrepararContextoPacienteUseCase, logger: IAppLoggerService);
    execute(solicitud: SolicitudRecomendacion): Promise<RespuestaIA<RecomendacionComida[]>>;
    private validarContexto;
    private construirPrompt;
    private validarRecomendacion;
}
