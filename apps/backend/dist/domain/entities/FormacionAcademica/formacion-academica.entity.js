"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademicaEntity = void 0;
class FormacionAcademicaEntity {
    idFormacionAcademica;
    titulo;
    institucion;
    añoComienzo;
    añoFin;
    nivel;
    constructor(idFormacionAcademica = null, titulo, institucion, añoComienzo, añoFin, nivel) {
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