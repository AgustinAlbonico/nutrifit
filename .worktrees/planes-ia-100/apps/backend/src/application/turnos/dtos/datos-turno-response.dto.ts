export class DatosTurnoResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  consultaFinalizadaAt: string | null;
  socio: SocioTurnoResponseDto;
  fichaSalud: FichaSalud | null;
  observacionClinica: ObservacionClinicaDto | null;
}

export class ObservacionClinicaDto {
  comentario: string;
  sugerencias: string | null;
  habitosSocio: string | null;
  objetivosSocio: string | null;
  esPublica: boolean;
}

export class SocioTurnoResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string | null;
}

export class FichaSalud {
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: 'Sedentario' | 'Moderado' | 'Intenso';
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string | null;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  frecuenciaComidas: string | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  consumoAlcohol: string | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}
