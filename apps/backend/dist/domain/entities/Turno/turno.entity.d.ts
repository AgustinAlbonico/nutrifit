import { ObservacionClinicaEntity } from '../ObservacionClinica/observacion-clinica.entity';
import { EstadoTurno } from './EstadoTurno';
export declare class TurnoEntity {
    idTurno: number | null;
    fechaTurno: Date;
    HoraTurno: string;
    estadoTurno: EstadoTurno;
    checkInAt: Date | null;
    consultaIniciadaAt: Date | null;
    consultaFinalizadaAt: Date | null;
    ausenteAt: Date | null;
    observacionClinica: ObservacionClinicaEntity | null;
    constructor(idTurno: number | null | undefined, fechaTurno: Date, HoraTurno: string, estadoTurno: EstadoTurno, checkInAt?: Date | null, consultaIniciadaAt?: Date | null, consultaFinalizadaAt?: Date | null, ausenteAt?: Date | null, observacionClinica?: ObservacionClinicaEntity | null);
}
