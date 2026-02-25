"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocioEntity = void 0;
const persona_entity_1 = require("../persona.entity");
class SocioEntity extends persona_entity_1.PersonaEntity {
    fechaAlta;
    turnos;
    fichaSalud;
    planesAlimentacion;
    fotoPerfilKey;
    constructor(idPersona = null, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni, turnos = [], fichaSalud = null, planesAlimentacion = []) {
        super(idPersona, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni);
        this.fechaAlta = new Date();
        this.turnos = turnos;
        this.fichaSalud = fichaSalud;
        this.planesAlimentacion = planesAlimentacion;
        this.fotoPerfilKey = null;
    }
}
exports.SocioEntity = SocioEntity;
//# sourceMappingURL=socio.entity.js.map