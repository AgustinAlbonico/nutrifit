import { AgendaSlotDto, AsignarTurnoManualDto, BloquearTurnoDto, DatosTurnoResponseDto, FichaSaludPacienteResponseDto, FichaSaludSocioResponseDto, GetTurnosDelDiaQueryDto, GetAgendaDiariaQueryDto, GuardarMedicionesDto, GuardarObservacionesDto, HistorialConsultaPacienteResponseDto, ListMisTurnosQueryDto, ListPacientesProfesionalQueryDto, MiTurnoResponseDto, PacienteProfesionalResponseDto, RecepcionTurnoResponseDto, ReprogramarTurnoSocioDto, RegistrarAsistenciaTurnoDto, ReservarTurnoSocioDto, TurnoDelDiaResponseDto, TurnoOperacionResponseDto, UpsertFichaSaludSocioDto } from 'src/application/turnos/dtos';
import { AsignarTurnoManualUseCase, BloquearTurnoUseCase, CancelarTurnoSocioUseCase, CheckInTurnoUseCase, ConfirmarTurnoSocioUseCase, DesbloquearTurnoUseCase, FinalizarConsultaUseCase, GetAgendaDiariaUseCase, GetFichaSaludPacienteUseCase, GetFichaSaludSocioUseCase, GetHistorialConsultasPacienteUseCase, GetTurnoByIdUseCase, GetTurnosDelDiaUseCase, GetTurnosRecepcionDiaUseCase, GetHistorialMedicionesUseCase, GetResumenProgresoUseCase, GuardarMedicionesUseCase, GuardarObservacionesUseCase, IniciarConsultaUseCase, ListMisTurnosUseCase, ListPacientesProfesionalUseCase, ReprogramarTurnoSocioUseCase, RegistrarAsistenciaTurnoUseCase, ReservarTurnoSocioUseCase, UpsertFichaSaludSocioUseCase } from 'src/application/turnos/use-cases';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { Request } from 'express';
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
    private readonly logger;
    constructor(getTurnosDelDiaUseCase: GetTurnosDelDiaUseCase, getAgendaDiariaUseCase: GetAgendaDiariaUseCase, getTurnosRecepcionDiaUseCase: GetTurnosRecepcionDiaUseCase, asignarTurnoManualUseCase: AsignarTurnoManualUseCase, bloquearTurnoUseCase: BloquearTurnoUseCase, desbloquearTurnoUseCase: DesbloquearTurnoUseCase, cancelarTurnoSocioUseCase: CancelarTurnoSocioUseCase, checkInTurnoUseCase: CheckInTurnoUseCase, confirmarTurnoSocioUseCase: ConfirmarTurnoSocioUseCase, finalizarConsultaUseCase: FinalizarConsultaUseCase, getFichaSaludPacienteUseCase: GetFichaSaludPacienteUseCase, getFichaSaludSocioUseCase: GetFichaSaludSocioUseCase, getHistorialConsultasPacienteUseCase: GetHistorialConsultasPacienteUseCase, getHistorialMedicionesUseCase: GetHistorialMedicionesUseCase, getResumenProgresoUseCase: GetResumenProgresoUseCase, getTurnoByIdUseCase: GetTurnoByIdUseCase, guardarMedicionesUseCase: GuardarMedicionesUseCase, guardarObservacionesUseCase: GuardarObservacionesUseCase, iniciarConsultaUseCase: IniciarConsultaUseCase, listMisTurnosUseCase: ListMisTurnosUseCase, listPacientesProfesionalUseCase: ListPacientesProfesionalUseCase, reprogramarTurnoSocioUseCase: ReprogramarTurnoSocioUseCase, registrarAsistenciaTurnoUseCase: RegistrarAsistenciaTurnoUseCase, reservarTurnoSocioUseCase: ReservarTurnoSocioUseCase, upsertFichaSaludSocioUseCase: UpsertFichaSaludSocioUseCase, logger: IAppLoggerService);
    getTurnosDelDia(nutricionistaId: number, query: GetTurnosDelDiaQueryDto): Promise<TurnoDelDiaResponseDto[]>;
    getTurnoById(turnoId: number, req: Request): Promise<DatosTurnoResponseDto>;
    getAgendaDiaria(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    asignarTurnoManual(nutricionistaId: number, payload: AsignarTurnoManualDto): Promise<TurnoOperacionResponseDto>;
    bloquearTurno(nutricionistaId: number, payload: BloquearTurnoDto): Promise<TurnoOperacionResponseDto>;
    desbloquearTurno(nutricionistaId: number, turnoId: number): Promise<TurnoOperacionResponseDto>;
    registrarAsistencia(nutricionistaId: number, turnoId: number, payload: RegistrarAsistenciaTurnoDto): Promise<TurnoOperacionResponseDto>;
    getFichaSaludPaciente(nutricionistaId: number, socioId: number): Promise<FichaSaludPacienteResponseDto>;
    getHistorialConsultasPaciente(nutricionistaId: number, socioId: number): Promise<HistorialConsultaPacienteResponseDto[]>;
    listPacientesProfesional(nutricionistaId: number, query: ListPacientesProfesionalQueryDto): Promise<PacienteProfesionalResponseDto[]>;
    upsertFichaSaludSocio(req: Request, payload: UpsertFichaSaludSocioDto): Promise<FichaSaludSocioResponseDto>;
    getFichaSaludSocio(req: Request): Promise<FichaSaludSocioResponseDto | null>;
    getDisponibilidadProfesionalParaSocio(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    getDisponibilidadProfesionalParaAdmin(nutricionistaId: number, query: GetAgendaDiariaQueryDto): Promise<AgendaSlotDto[]>;
    reservarTurnoSocio(req: Request, payload: ReservarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    listMisTurnos(req: Request, query: ListMisTurnosQueryDto): Promise<MiTurnoResponseDto[]>;
    reprogramarTurnoSocio(req: Request, turnoId: number, payload: ReprogramarTurnoSocioDto): Promise<TurnoOperacionResponseDto>;
    cancelarTurnoSocio(req: Request, turnoId: number): Promise<TurnoOperacionResponseDto>;
    confirmarTurnoSocio(req: Request, turnoId: number): Promise<TurnoOperacionResponseDto>;
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
    getMiProgreso(req: Request): Promise<import("src/application/turnos/use-cases").ResumenProgresoResponse>;
    getMiHistorialMediciones(req: Request): Promise<import("src/application/turnos/use-cases").HistorialMedicionesResponse>;
}
