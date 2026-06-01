"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatologiaEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class PatologiaEntity extends auditable_entity_1.AuditableEntity {
    idPatologia;
    nombre;
    constructor(idPatologia = null, nombre, fechaBaja = null) {
        super(fechaBaja);
        this.idPatologia = idPatologia;
        this.nombre = nombre;
    }
}
exports.PatologiaEntity = PatologiaEntity;
//# sourceMappingURL=patologia.entity.js.map