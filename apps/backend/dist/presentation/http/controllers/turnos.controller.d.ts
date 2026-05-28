import { AgendaSlotDto, AsignarTurnoManualDto, BloquearTurnoDto, CancelarTurnoSocioDto, DatosTurnoResponseDto, FichaSaludPacienteResponseDto, FichaSaludSocioResponseDto, GetTurnosDelDiaQueryDto, GetAgendaDiariaQueryDto, GuardarMedicionesDto, GuardarObservacionesDto, HistorialConsultaPacienteResponseDto, ListMisTurnosQueryDto, ListPacientesProfesionalQueryDto, MiTurnoResponseDto, PacienteProfesionalResponseDto, RecepcionTurnoResponseDto, ReprogramarTurnoSocioDto, ConfirmarTurnoTokenDto, RegistrarAsistenciaTurnoDto, ReservarTurnoSocioDto, TurnoDelDiaResponseDto, TurnoOperacionResponseDto, UpsertFichaSaludSocioDto } from 'src/application/turnos/dtos';
import { AsignarTurnoManualUseCase, BloquearTurnoUseCase, CancelarTurnoSocioUseCase, CheckInTurnoUseCase, ConfirmarTurnoSocioUseCase, DesbloquearTurnoUseCase, FinalizarConsultaUseCase, GetAgendaDiariaUseCase, GetFichaSaludPacienteUseCase, GetFichaSaludSocioUseCase, GetHistorialConsultasPacienteUseCase, GetTurnoByIdUseCase, GetTurnosDelDiaUseCase, GetTurnosRecepcionDiaUseCase, GetHistorialMedicionesUseCase, GetResumenProgresoUseCase, GuardarMedicionesUseCase, GuardarObservacionesUseCase, IniciarConsultaUseCase, ListMisTurnosUseCase, ListPacientesProfesionalUseCase, ReprogramarTurnoSocioUseCase, RegistrarAsistenciaTurnoUseCase, ReservarTurnoSocioUseCase, UpsertFichaSaludSocioUseCase } from 'src/application/turnos/use-cases';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { AdjuntoClinicoService } from 'src/infrastructure/services/adjunto-clinico/adjunto-clinico.service';
export declare class TurnosController {
    private readonly getTurnosDelDiaUseCase;
    private readonly getAgendaDiariaUseCase;
    private readonly getTurnosRecepcionDiaUseCase;
    private readonly asignarTurnoManualUseCase;
    private readonly bloquearTurnoUseCase;
    private readonly desbloquearTurnoUseCase;
    private readonly cancelarTurnoSocioUseCase;
    private readonly checkInTurnoUseCase;
    private readonly confirmarTurnoSocioUseCase;
    private readonly finalizarConsultaUseCase;
    private readonly getFichaSaludPacienteUseCase;
    private readonly getFichaSaludSocioUseCase;
    private readonly getHistorialConsultasPacienteUseCase;
    private readonly getHistorialMedicionesUseCase;
    private readonly getResumenProgresoUseCase;
    private readonly getTurnoByIdUseCase;
    private readonly guardarMedicionesUseCase;
    private readonly guardarObservacionesUseCase;
    private readonly iniciarConsultaUseCase;
    private readonly listMisTurnosUseCase;
    private readonly listPacientesProfesionalUseCase;
    private readonly reprogramarTurnoSocioUseCase;
    private readonly registrarAsistenciaTurnoUseCase;
    private readonly reservarTurnoSocioUseCase;
    private readonly upsertFichaSaludSocioUseCase;
    private readonly adjuntoClinicoService;
    private readonly logger;
    constructor(getTurnosDelDiaUseCase: GetTurnosDelDiaUseCase, getAgendaDiariaUseCase: GetAgendaDiariaUseCase, getTurnosRecepcionDiaUseCase: GetTurnosRecepcionDiaUseCase, asignarTurnoManualUseCase: AsignarTurnoManualUseCase, bloquearTurnoUseCase: BloquearTurnoUseCase, desbloquearTurnoUseCase: DesbloquearTurnoUseCase, cancelarTurnoSocioUseCase: CancelarTurnoSocioUseCase, checkInTurnoUseCase: CheckInTurnoUseCase, confirmarTurnoSocioUseCase: ConfirmarTurnoSocioUseCase, finalizarConsultaUseCase: FinalizarConsultaUseCase, getFichaSaludPacienteUseCase: GetFichaSaludPacienteUseCase, getFichaSaludSocioUseCase: GetFichaSaludSocioUseCase, getHistorialConsultasPacienteUseCase: GetHistorialConsultasPacienteUseCase, getHistorialMedicionesUseCase: GetHistorialMedicionesUseCase, getResumenProgresoUseCase: GetResumenProgresoUseCase, getTurnoByIdUseCase: GetTurnoByIdUseCase, guardarMedicionesUseCase: GuardarMedicionesUseCase, guardarObservacionesUseCase: GuardarObservacionesUseCase, iniciarConsultaUseCase: IniciarConsultaUseCase, listMisTurnosUseCase: ListMisTurnosUseCase, listPacientesProfesionalUseCase: ListPacientesProfesionalUseCase, reprogramarTurnoSocioUseCase: ReprogramarTurnoSocioUseCase, registrarAsistenciaTurnoUseCase: RegistrarAsistenciaTurnoUseCase, reservarTurnoSocioUseCase: ReservarTurnoSocioUseCase, upsertFichaSaludSocioUseCase: UpsertFichaSaludSocioUseCase, adjuntoClinicoService: AdjuntoClinicoService, logger: IAppLoggerService);
    getTurnosDelDia(nutricionistaId: number, query: GetTurnosDelDiaQueryDto): Promise<TurnoDelDiaResponseDto[]>;
    getTurnoById(turnoId: number, access: Express.ResourceAccessContext): Promise<DatosTurnoResponseDto>;
    getAgendaDiaria(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    asignarTurnoManual(nutricionistaId: number, payload: AsignarTurnoManualDto): Promise<TurnoOperacionResponseDto>;
    bloquearTurno(nutricionistaId: number, payload: BloquearTurnoDto): Promise<TurnoOperacionResponseDto>;
    desbloquearTurno(nutricionistaId: number, turnoId: number): Promise<TurnoOperacionResponseDto>;
    registrarAsistencia(nutricionistaId: number, turnoId: number, payload: RegistrarAsistenciaTurnoDto): Promise<TurnoOperacionResponseDto>;
    getFichaSaludPaciente(nutricionistaId: number, socioId: number): Promise<FichaSaludPacienteResponseDto>;
    getHistorialConsultasPaciente(nutricionistaId: number, socioId: number): Promise<HistorialConsultaPacienteResponseDto[]>;
    listPacientesProfesional(nutricionistaId: number, query: ListPacientesProfesionalQueryDto): Promise<PacienteProfesionalResponseDto[]>;
    upsertFichaSaludSocio(userId: number, payload: UpsertFichaSaludSocioDto): Promise<FichaSaludSocioResponseDto>;
    getFichaSaludSocio(userId: number): Promise<FichaSaludSocioResponseDto | null>;
    getDisponibilidadProfesionalParaSocio(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    getDisponibilidadProfesionalParaAdmin(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    reservarTurnoSocio(userId: number, payload: ReservarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    listMisTurnos(userId: number, query: ListMisTurnosQueryDto): Promise<MiTurnoResponseDto[]>;
    reprogramarTurnoSocio(userId: number, turnoId: number, payload: ReprogramarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    cancelarTurnoSocio(userId: number, turnoId: number, dto: CancelarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    cancelarTurnoPorToken(turnoId: number, query: ConfirmarTurnoTokenDto, dto: CancelarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    confirmarTurnoSocio(userId: number, turnoId: number): Promise<TurnoOperacionResponseDto>;
    confirmarTurnoPorToken(turnoId: number, query: ConfirmarTurnoTokenDto): Promise<TurnoOperacionResponseDto>;
    checkInTurno(turnoId: number): Promise<{
        success: boolean;
        estado: string;
    }>;
    getTurnosRecepcionDia(fecha?: string): Promise<RecepcionTurnoResponseDto[]>;
    iniciarConsulta(turnoId: number): Promise<{
        success: boolean;
        estado: string;
    }>;
    finalizarConsulta(turnoId: number): Promise<{
        success: boolean;
        estado: string;
    }>;
    guardarMediciones(turnoId: number, payload: GuardarMedicionesDto): Promise<{
        success: boolean;
        imc: number;
    }>;
    guardarObservaciones(turnoId: number, payload: GuardarObservacionesDto): Promise<{
        success: boolean;
    }>;
    getHistorialMedicionesPaciente(nutricionistaId: number, socioId: number): Promise<import("src/application/turnos/use-cases").HistorialMedicionesResponse>;
    getResumenProgresoPaciente(nutricionistaId: number, socioId: number): Promise<import("src/application/turnos/use-cases").ResumenProgresoResponse>;
    getMiProgreso(access: Express.ResourceAccessContext): Promise<import("src/application/turnos/use-cases").ResumenProgresoResponse>;
    getMiHistorialMediciones(access: Express.ResourceAccessContext): Promise<import("src/application/turnos/use-cases").HistorialMedicionesResponse>;
    subirAdjunto(turnoId: number, archivo: Express.Multer.File, usuarioId: number): Promise<{
        id: number;
        nombreOriginal: string;
        urlFirmada: string;
        esPostCierre: boolean;
    }>;
    listarAdjuntos(turnoId: number): Promise<import("src/infrastructure/services/adjunto-clinico/adjunto-clinico.service").ListarAdjuntosResponse[]>;
    obtenerUrlAdjunto(turnoId: number, adjuntoId: number): Promise<{
        url: string;
    }>;
    eliminarAdjunto(turnoId: number, adjuntoId: number, user: Express.AuthenticatedUserPayload): Promise<{
        success: boolean;
    }>;
}
