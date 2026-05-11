"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnoEntity = void 0;
class TurnoEntity {
    idTurno;
    fechaTurno;
    horaTurno;
    estadoTurno;
    checkInAt;
    consultaIniciadaAt;
    consultaFinalizadaAt;
    ausenteAt;
    observacionClinica;
    motivoCancelacion;
    fechaOriginal;
    gimnasioId;
    constructor(idTurno = null, fechaTurno, horaTurno, estadoTurno, checkInAt = null, consultaIniciadaAt = null, consultaFinalizadaAt = null, ausenteAt = null, observacionClinica = null, motivoCancelacion = null, fechaOriginal = null, gimnasioId = null) {
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
exports.TurnoEntity = TurnoEntity;
//# sourceMappingURL=turno.entity.js.map