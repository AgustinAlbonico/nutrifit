"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpcionComidaEntity = void 0;
class OpcionComidaEntity {
    idOpcionComida;
    tipoComida;
    descripcion;
    alimentos;
    constructor(idOpcionComida = null, tipoComida, descripcion = null, alimentos = []) {
        this.idOpcionComida = idOpcionComida;
        this.tipoComida = tipoComida;
        this.descripcion = descripcion;
        this.alimentos = alimentos;
    }
}
exports.OpcionComidaEntity = OpcionComidaEntity;
//# sourceMappingURL=opcion-comida.entity.js.map