export class DatosTurnoResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  consultaFinalizadaAt: string | null;
  socio: SocioTurnoResponseDto;
  fichaSalud: FichaSalud | null;
  observacionClinica: ObservacionClinicaDto | null;
  /**
   * RB15: `true` si la ficha de salud del socio fue actualizada
   * despues de la ultima consulta del par (nutricionista, socio).
   */
  fichaActualizada: boolean;
  /**
   * Id de la observacion clinica del turno (si existe). Permite al
   * frontend enlazar el form de consulta sin pedirlo por separado.
   */
  consultaId: number | null;

  /**
   * Indica si la consulta fue cerrada automaticamente por inactividad.
   */
  cierreAutomatico: boolean;

  /**
   * Motivo del cierre automatico (si aplica).
   */
  motivoCierreAutomatico: string | null;

  /**
   * Indica si la consulta fue reabierta tras un cierre automatico.
   */
  reabiertaPorCierreAuto: boolean;
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
