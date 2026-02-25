"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NutricionistaEntity = void 0;
const persona_entity_1 = require("../persona.entity");
class NutricionistaEntity extends persona_entity_1.PersonaEntity {
    matricula;
    tarifaSesion;
    añosExperiencia;
    agendas;
    formacionAcademica;
    turnos;
    fechaBaja;
    fotoPerfilKey;
    constructor(idPersona = null, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni, experiencia, tarifaSesion, agendas = [], formacionAcademica = [], turnos = [], fechaBaja = null, email = '') {
        super(idPersona, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni, email);
        this.tarifaSesion = tarifaSesion;
        this.añosExperiencia = experiencia;
        this.agendas = agendas;
        this.formacionAcademica = formacionAcademica;
        this.turnos = turnos;
        this.fechaBaja = fechaBaja;
        this.fotoPerfilKey = null;
    }
}
exports.NutricionistaEntity = NutricionistaEntity;
//# sourceMappingURL=nutricionista.entity.js.map