"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademicaEntity = void 0;
const auditable_entity_1 = require("../../shared/auditable.entity");
class FormacionAcademicaEntity extends auditable_entity_1.AuditableEntity {
    idFormacionAcademica;
    titulo;
    institucion;
    añoComienzo;
    añoFin;
    nivel;
    constructor(idFormacionAcademica = null, titulo, institucion, añoComienzo, añoFin, nivel, fechaBaja = null) {
        super(fechaBaja);
        this.idFormacionAcademica = idFormacionAcademica;
        this.titulo = titulo;
        this.institucion = institucion;
        this.añoComienzo = añoComienzo;
        this.añoFin = añoFin;
        this.nivel = nivel;
    }
}
exports.FormacionAcademicaEntity = FormacionAcademicaEntity;
//# sourceMappingURL=formacion-academica.entity.js.map