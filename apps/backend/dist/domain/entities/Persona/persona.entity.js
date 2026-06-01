"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaEntity = void 0;
class PersonaEntity {
    idPersona;
    idPersonaNullable = null;
    nombre;
    apellido;
    fechaNacimiento;
    genero;
    telefono;
    direccion;
    ciudad;
    provincia;
    dni;
    email;
    fechaBaja;
    fotoPerfilKey;
    gimnasioId;
    constructor(idPersona = null, nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni, email = '', fotoPerfilKey = null, gimnasioId = 1) {
        this.idPersona = idPersona;
        this.idPersonaNullable = idPersona;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fechaNacimiento = fechaNacimiento;
        this.telefono = telefono;
        this.genero = genero;
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.provincia = provincia;
        this.dni = dni;
        this.email = email;
        this.fechaBaja = null;
        this.fotoPerfilKey = fotoPerfilKey;
        this.gimnasioId = gimnasioId;
    }
}
exports.PersonaEntity = PersonaEntity;
//# sourceMappingURL=persona.entity.js.map