"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendaEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class AgendaEntity extends auditable_entity_1.AuditableEntity {
    idAgenda;
    dia;
    horaInicio;
    horaFin;
    duracionTurno;
    constructor(idAgenda, dia, horaInicio, horaFin, duracionTurno, fechaBaja = null) {
        super(fechaBaja);
        this.idAgenda = idAgenda;
        this.dia = dia;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.duracionTurno = duracionTurno;
    }
}
exports.AgendaEntity = AgendaEntity;
//# sourceMappingURL=agenda.entity.js.map