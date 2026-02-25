"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FichaSalud = exports.SocioTurnoResponseDto = exports.DatosTurnoResponseDto = void 0;
class DatosTurnoResponseDto {
    idTurno;
    fechaTurno;
    horaTurno;
    estadoTurno;
    socio;
    fichaSalud;
}
exports.DatosTurnoResponseDto = DatosTurnoResponseDto;
class SocioTurnoResponseDto {
    idPersona;
    nombre;
    apellido;
    dni;
    email;
    telefono;
}
exports.SocioTurnoResponseDto = SocioTurnoResponseDto;
class FichaSalud {
    fichaSaludId;
    altura;
    peso;
    nivelActividadFisica;
    alergias;
    patologias;
    objetivoPersonal;
    medicacionActual;
    suplementosActuales;
    cirugiasPrevias;
    antecedentesFamiliares;
    frecuenciaComidas;
    consumoAguaDiario;
    restriccionesAlimentarias;
    consumoAlcohol;
    fumaTabaco;
    horasSueno;
    contactoEmergenciaNombre;
    contactoEmergenciaTelefono;
}
exports.FichaSalud = FichaSalud;
//# sourceMappingURL=datos-turno-response.dto.js.map