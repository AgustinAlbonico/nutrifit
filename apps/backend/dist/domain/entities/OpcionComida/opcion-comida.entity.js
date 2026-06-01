"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpcionComidaEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class OpcionComidaEntity extends auditable_entity_1.AuditableEntity {
    idOpcionComida;
    tipoComida;
    descripcion;
    alimentos;
    constructor(idOpcionComida = null, tipoComida, descripcion = null, alimentos = [], fechaBaja = null) {
        super(fechaBaja);
        this.idOpcionComida = idOpcionComida;
        this.tipoComida = tipoComida;
        this.descripcion = descripcion;
        this.alimentos = alimentos;
    }
}
exports.OpcionComidaEntity = OpcionComidaEntity;
//# sourceMappingURL=opcion-comida.entity.js.map