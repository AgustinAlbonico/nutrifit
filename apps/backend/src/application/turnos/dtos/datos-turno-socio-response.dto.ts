export class NutricionistaTurnoSocioDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  fotoPerfilUrl: string | null;
}

export class SocioTurnoConfirmadoDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  email: string;
  telefono: string | null;
}

export class DatosTurnoSocioResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socio: SocioTurnoConfirmadoDto;
  nutricionista: NutricionistaTurnoSocioDto;
}
