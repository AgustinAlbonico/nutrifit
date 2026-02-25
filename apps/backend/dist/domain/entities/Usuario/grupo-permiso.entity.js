"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrupoPermisoEntity = void 0;
class GrupoPermisoEntity {
    id;
    clave;
    nombre;
    descripcion;
    acciones;
    hijos;
    constructor(id, clave, nombre, descripcion = null, acciones = [], hijos = []) {
        this.id = id;
        this.clave = clave;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.acciones = acciones;
        this.hijos = hijos;
    }
}
exports.GrupoPermisoEntity = GrupoPermisoEntity;
//# sourceMappingURL=grupo-permiso.entity.js.map