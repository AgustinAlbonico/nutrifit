"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlergiaEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class AlergiaEntity extends auditable_entity_1.AuditableEntity {
    idAlergia;
    nombre;
    constructor(idAlergia = null, nombre, fechaBaja = null) {
        super(fechaBaja);
        this.idAlergia = idAlergia;
        this.nombre = nombre;
    }
}
exports.AlergiaEntity = AlergiaEntity;
//# sourceMappingURL=alergia.entity.js.map