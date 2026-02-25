"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocioResponseDto = void 0;
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
        this.fechaNacimiento = socio.fechaNacimiento?.toISOString?.()
            ? socio.fechaNacimiento.toISOString().split('T')[0]
            : socio.fechaNacimiento;
        this.telefono = socio.telefono;
        this.genero = socio.genero;
        this.direccion = socio.direccion;
        this.ciudad = socio.ciudad;
        this.provincia = socio.provincia;
        this.email = socio.email ?? '';
        this.fechaBaja = socio.fechaBaja
            ? (socio.fechaBaja.toISOString?.() ?? socio.fechaBaja)
            : null;
        this.activo = !socio.fechaBaja;
        this.fotoPerfilUrl = socio.fotoPerfilKey
            ? `/socio/${socio.idPersona}/foto?v=${encodeURIComponent(socio.fotoPerfilKey)}`
            : null;
    }
}
exports.SocioResponseDto = SocioResponseDto;
//# sourceMappingURL=socio-response.dto.js.map