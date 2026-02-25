"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionPermisoEntity = void 0;
class AccionPermisoEntity {
    id;
    clave;
    nombre;
    descripcion;
    constructor(id, clave, nombre, descripcion = null) {
        this.id = id;
        this.clave = clave;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }
}
exports.AccionPermisoEntity = AccionPermisoEntity;
//# sourceMappingURL=accion-permiso.entity.js.map