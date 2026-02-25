import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
export declare class AgendaSlotDto {
    horaInicio: string;
    horaFin: string;
    estado: 'LIBRE' | 'OCUPADO' | EstadoTurno;
    turnoId?: number;
    socio?: {
        nombre: string;
        dni: string;
    };
}
