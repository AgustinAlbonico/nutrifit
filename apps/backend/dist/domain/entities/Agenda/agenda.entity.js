"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendaEntity = void 0;
class AgendaEntity {
    idAgenda;
    dia;
    horaInicio;
    horaFin;
    duracionTurno;
    constructor(idAgenda, dia, horaInicio, horaFin, duracionTurno) {
        this.idAgenda = idAgenda;
        this.dia = dia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.duracionTurno = duracionTurno;
    }
}
exports.AgendaEntity = AgendaEntity;
//# sourceMappingURL=agenda.entity.js.map