import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class SocioTurnoDelDiaResponseDto {
    idPersona: number;
    nombreCompleto: string;
    dni: string;
    objetivo: string | null;
}
export declare class TurnoDelDiaResponseDto {
    idTurno: number;
    fechaTurno: string;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    tipoConsulta: string;
    socio: SocioTurnoDelDiaResponseDto;
}
