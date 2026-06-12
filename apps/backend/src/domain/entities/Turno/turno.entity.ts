import { ObservacionClinicaEntity } from '../ObservacionClinica/observacion-clinica.entity';
import { EstadoTurno } from './EstadoTurno';
import { CreadoPor } from './creado-por.enum';
import { AuditableEntity } from '../../shared/auditable.entity';

export class TurnoEntity extends AuditableEntity {
  idTurno: number | null;
  fechaTurno: Date;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  checkInAt: Date | null;
  consultaIniciadaAt: Date | null;
  consultaFinalizadaAt: Date | null;
  ausenteAt: Date | null;
  ausenteMotivo: string | null;
  llegadaTardeMin: number | null;
  observacionClinica: ObservacionClinicaEntity | null;
  motivoCancelacion: string | null;
  fechaOriginal: Date | null;
  gimnasioId: number | null;

  /**
   * Origen del turno (RB33 — trazabilidad del origen). Se asigna
   * siempre en el constructor a `CreadoPor.SOCIO` para que los
   * call-sites existentes que no lo setean explicitamente reciban
   * un valor consistente con el `DEFAULT 'SOCIO'` de la columna
   * `turno.creado_por` (backfill implicito de filas pre-existentes).
   *
   * El use-case que crea el turno (CU-11, AsignarTurnoManual o el
   * futuro CrearTurnoEnNombreDeSocio) sobreescribe este valor antes
   * de persistir.
   */
  creadoPor: CreadoPor;

  constructor(
    idTurno: number | null = null,
    fechaTurno: Date,
    horaTurno: string,
    estadoTurno: EstadoTurno,
    checkInAt: Date | null = null,
    consultaIniciadaAt: Date | null = null,
    consultaFinalizadaAt: Date | null = null,
    ausenteAt: Date | null = null,
    ausenteMotivo: string | null = null,
    llegadaTardeMin: number | null = null,
    observacionClinica: ObservacionClinicaEntity | null = null,
    motivoCancelacion: string | null = null,
    fechaOriginal: Date | null = null,
    gimnasioId: number | null = null,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idTurno = idTurno;
    this.fechaTurno = fechaTurno;
    this.horaTurno = horaTurno;
    this.estadoTurno = estadoTurno;
    this.checkInAt = checkInAt;
    this.consultaIniciadaAt = consultaIniciadaAt;
    this.consultaFinalizadaAt = consultaFinalizadaAt;
    this.ausenteAt = ausenteAt;
    this.ausenteMotivo = ausenteMotivo;
    this.llegadaTardeMin = llegadaTardeMin;
    this.observacionClinica = observacionClinica;
    this.motivoCancelacion = motivoCancelacion;
    this.fechaOriginal = fechaOriginal;
    this.gimnasioId = gimnasioId;
    this.creadoPor = CreadoPor.SOCIO;
  }
}
