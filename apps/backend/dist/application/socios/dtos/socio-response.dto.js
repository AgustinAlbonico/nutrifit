"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocioResponseDto = void 0;
function formatearFecha(fecha) {
    if (fecha === null || fecha === undefined) {
        return null;
    }
    if (fecha instanceof Date) {
        return fecha.toISOString().split('T')[0] ?? null;
    }
    return fecha;
}
function formatearFechaBaja(fecha) {
    if (fecha === null || fecha === undefined) {
        return null;
    }
    if (fecha instanceof Date) {
        return fecha.toISOString();
    }
    return fecha;
}
class SocioResponseDto {
    idPersona;
    nombre;
    apellido;
    dni;
    fechaNacimiento;
    telefono;
    genero;
    direccion;
    ciudad;
    provincia;
    email;
    fechaBaja;
    activo;
    fotoPerfilUrl;
    constructor(socio) {
        this.idPersona = socio.idPersona;
        this.nombre = socio.nombre;
        this.apellido = socio.apellido;
        this.dni = socio.dni ?? '';
        this.fechaNacimiento = formatearFecha(socio.fechaNacimiento);
        this.telefono = socio.telefono;
        this.genero = socio.genero;
        this.direccion = socio.direccion;
        this.ciudad = socio.ciudad;
        this.provincia = socio.provincia;
        this.email = socio.email ?? '';
        this.fechaBaja = formatearFechaBaja(socio.fechaBaja);
        this.activo = !socio.fechaBaja;
        this.fotoPerfilUrl = socio.fotoPerfilKey
            ? `/socio/${socio.idPersona}/foto?v=${encodeURIComponent(socio.fotoPerfilKey)}`
            : null;
    }
}
exports.SocioResponseDto = SocioResponseDto;
//# sourceMappingURL=socio-response.dto.js.map