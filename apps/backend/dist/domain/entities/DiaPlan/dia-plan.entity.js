"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaPlanEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class DiaPlanEntity extends auditable_entity_1.AuditableEntity {
    idDiaPlan;
    dia;
    orden;
    opcionesComida;
    constructor(idDiaPlan = null, dia, orden, opcionesComida = [], fechaBaja = null) {
        super(fechaBaja);
        this.idDiaPlan = idDiaPlan;
        this.dia = dia;
        this.orden = orden;
        this.opcionesComida = opcionesComida;
    }
}
exports.DiaPlanEntity = DiaPlanEntity;
//# sourceMappingURL=dia-plan.entity.js.map