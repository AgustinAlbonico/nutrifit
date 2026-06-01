"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionPermisoEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class AccionPermisoEntity extends auditable_entity_1.AuditableEntity {
    id;
    clave;
    nombre;
    descripcion;
    constructor(id, clave, nombre, descripcion = null, fechaBaja = null) {
        super(fechaBaja);
        this.id = id;
        this.clave = clave;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}
exports.AccionPermisoEntity = AccionPermisoEntity;
//# sourceMappingURL=accion-permiso.entity.js.map