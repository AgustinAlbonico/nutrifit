"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoAlimenticio = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class GrupoAlimenticio extends auditable_entity_1.AuditableEntity {
    idGrupoAlimenticio;
    descripcion;
    constructor(idGrupoAlimenticio = null, descripcion, fechaBaja = null) {
        super(fechaBaja);
        this.idGrupoAlimenticio = idGrupoAlimenticio;
        this.descripcion = descripcion;
    }
}
exports.GrupoAlimenticio = GrupoAlimenticio;
//# sourceMappingURL=grupo-alimenticio.entity.js.map