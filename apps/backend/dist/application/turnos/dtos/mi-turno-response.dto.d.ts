import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class MiTurnoResponseDto {
    idTurno: number;
    fechaTurno: string;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    profesionalId: number;
    profesionalNombreCompleto: string;
    especialidad: string;
}
