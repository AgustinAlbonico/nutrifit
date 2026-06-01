"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FotoProgresoEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class FotoProgresoEntity extends auditable_entity_1.AuditableEntity {
    idFoto;
    socioId;
    tipoFoto;
    fecha;
    objectKey;
    notas;
    createdAt;
    constructor(idFoto = null, socioId, tipoFoto, fecha, objectKey, notas = null, createdAt = new Date(), fechaBaja = null) {
        super(fechaBaja);
        this.idFoto = idFoto;
        this.socioId = socioId;
        this.tipoFoto = tipoFoto;
        this.fecha = fecha;
        this.objectKey = objectKey;
        this.notas = notas;
        this.createdAt = createdAt;
    }
}
exports.FotoProgresoEntity = FotoProgresoEntity;
//# sourceMappingURL=foto-progreso.entity.js.map