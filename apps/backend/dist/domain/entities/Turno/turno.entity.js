"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnoEntity = void 0;
class TurnoEntity {
    idTurno;
    fechaTurno;
    HoraTurno;
    estadoTurno;
    checkInAt;
    consultaIniciadaAt;
    consultaFinalizadaAt;
    ausenteAt;
    observacionClinica;
    constructor(idTurno = null, fechaTurno, HoraTurno, estadoTurno, checkInAt = null, consultaIniciadaAt = null, consultaFinalizadaAt = null, ausenteAt = null, observacionClinica = null) {
        this.idTurno = idTurno;
        this.fechaTurno = fechaTurno;
        this.HoraTurno = HoraTurno;
        this.estadoTurno = estadoTurno;
        this.checkInAt = checkInAt;
        this.consultaIniciadaAt = consultaIniciadaAt;
        this.consultaFinalizadaAt = consultaFinalizadaAt;
        this.ausenteAt = ausenteAt;
        this.observacionClinica = observacionClinica;
    }
}
exports.TurnoEntity = TurnoEntity;
//# sourceMappingURL=turno.entity.js.map