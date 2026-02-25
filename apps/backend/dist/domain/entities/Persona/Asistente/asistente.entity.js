"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsistenteEntity = void 0;
const persona_entity_1 = require("../persona.entity");
class AsistenteEntity extends persona_entity_1.PersonaEntity {
    constructor(idPersona = null, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni) {
        super(idPersona, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni);
    }
}
exports.AsistenteEntity = AsistenteEntity;
//# sourceMappingURL=asistente.entity.js.map