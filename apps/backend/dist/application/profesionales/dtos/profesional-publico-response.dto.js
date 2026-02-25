"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilProfesionalPublicoResponseDto = exports.ProfesionalPublicoResponseDto = exports.HorarioProfesionalPublicoDto = void 0;
class HorarioProfesionalPublicoDto {
    dia;
    horaInicio;
    horaFin;
    duracionTurno;
}
exports.HorarioProfesionalPublicoDto = HorarioProfesionalPublicoDto;
class ProfesionalPublicoResponseDto {
    idPersona;
    nombre;
    apellido;
    especialidad;
    ciudad;
    provincia;
    añosExperiencia;
    tarifaSesion;
}
exports.ProfesionalPublicoResponseDto = ProfesionalPublicoResponseDto;
class PerfilProfesionalPublicoResponseDto extends ProfesionalPublicoResponseDto {
    matricula;
    email;
    telefono;
    direccion;
    genero;
    biografia;
    calificacionPromedio;
    totalOpiniones;
    horarios;
}
exports.PerfilProfesionalPublicoResponseDto = PerfilProfesionalPublicoResponseDto;
//# sourceMappingURL=profesional-publico-response.dto.js.map