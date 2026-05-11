import { ObservacionClinicaEntity } from '../ObservacionClinica/observacion-clinica.entity';
import { EstadoTurno } from './EstadoTurno';
export declare class TurnoEntity {
    idTurno: number | null;
    fechaTurno: Date;
    horaTurno: string;
    estadoTurno: EstadoTurno;
    checkInAt: Date | null;
    consultaIniciadaAt: Date | null;
    consultaFinalizadaAt: Date | null;
    ausenteAt: Date | null;
    observacionClinica: ObservacionClinicaEntity | null;
    motivoCancelacion: string | null;
    fechaOriginal: Date | null;
    gimnasioId: number | null;
    constructor(idTurno: number | null | undefined, fechaTurno: Date, horaTurno: string, estadoTurno: EstadoTurno, checkInAt?: Date | null, consultaIniciadaAt?: Date | null, consultaFinalizadaAt?: Date | null, ausenteAt?: Date | null, observacionClinica?: ObservacionClinicaEntity | null, motivoCancelacion?: string | null, fechaOriginal?: Date | null, gimnasioId?: number | null);
}
