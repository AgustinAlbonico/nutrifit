import { ObservacionClinicaEntity } from '../ObservacionClinica/observacion-clinica.entity';
import { EstadoTurno } from './EstadoTurno';
import { AuditableEntity } from '../../shared/auditable.entity';
export declare class TurnoEntity extends AuditableEntity {
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
    constructor(idTurno: number | null | undefined, fechaTurno: Date, horaTurno: string, estadoTurno: EstadoTurno, checkInAt?: Date | null, consultaIniciadaAt?: Date | null, consultaFinalizadaAt?: Date | null, ausenteAt?: Date | null, observacionClinica?: ObservacionClinicaEntity | null, motivoCancelacion?: string | null, fechaOriginal?: Date | null, gimnasioId?: number | null, fechaBaja?: Date | null);
}
