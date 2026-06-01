import { ObservacionClinicaEntity } from '../ObservacionClinica/observacion-clinica.entity';
import { EstadoTurno } from './EstadoTurno';

export class TurnoEntity {
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

  constructor(
    idTurno: number | null = null,
    fechaTurno: Date,
    horaTurno: string,
    estadoTurno: EstadoTurno,
    checkInAt: Date | null = null,
    consultaIniciadaAt: Date | null = null,
    consultaFinalizadaAt: Date | null = null,
    ausenteAt: Date | null = null,
    observacionClinica: ObservacionClinicaEntity | null = null,
    motivoCancelacion: string | null = null,
    fechaOriginal: Date | null = null,
    gimnasioId: number | null = null,
  ) {
    this.idTurno = idTurno;
    this.fechaTurno = fechaTurno;
    this.horaTurno = horaTurno;
    this.estadoTurno = estadoTurno;
    this.checkInAt = checkInAt;
    this.consultaIniciadaAt = consultaIniciadaAt;
    this.consultaFinalizadaAt = consultaFinalizadaAt;
    this.ausenteAt = ausenteAt;
    this.observacionClinica = observacionClinica;
    this.motivoCancelacion = motivoCancelacion;
    this.fechaOriginal = fechaOriginal;
    this.gimnasioId = gimnasioId;
  }
}
