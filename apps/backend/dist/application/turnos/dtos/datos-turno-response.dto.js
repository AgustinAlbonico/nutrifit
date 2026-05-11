"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FichaSalud = exports.SocioTurnoResponseDto = exports.ObservacionClinicaDto = exports.DatosTurnoResponseDto = void 0;
class DatosTurnoResponseDto {
    idTurno;
    fechaTurno;
    horaTurno;
    estadoTurno;
    consultaFinalizadaAt;
    socio;
    fichaSalud;
    observacionClinica;
}
exports.DatosTurnoResponseDto = DatosTurnoResponseDto;
class ObservacionClinicaDto {
    comentario;
    sugerencias;
    habitosSocio;
    objetivosSocio;
    esPublica;
}
exports.ObservacionClinicaDto = ObservacionClinicaDto;
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