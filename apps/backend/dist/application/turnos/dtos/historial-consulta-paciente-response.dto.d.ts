import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class HistorialConsultaPacienteResponseDto {
    idTurno: number;
    fechaTurno: string;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    tipoConsulta: string;
    notasProfesional: string | null;
    sugerencias: string | null;
    archivosAdjuntos: string[];
}
