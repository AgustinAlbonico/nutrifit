export type IdEtapaConsulta =
  | 'contexto'
  | 'evolucion'
  | 'mediciones'
  | 'observacion'
  | 'planObjetivos'
  | 'fotos'
  | 'adjuntos'
  | 'revision';

export type EstadoEtapaConsulta =
  | 'pendiente'
  | 'completa'
  | 'omitida'
  | 'error'
  | 'bloqueada';

export interface EtapaConsulta {
  id: IdEtapaConsulta;
  titulo: string;
  estado: EstadoEtapaConsulta;
  descripcion: string;
}

export interface EstadoDatosConsulta {
  cargoTurno: boolean;
  cargoEvolucion: boolean;
  hayMedicionBase: boolean;
  hayComentarioClinico: boolean;
  seModificoPlanObjetivos: boolean;
  cantidadFotosSesion: number;
  cantidadAdjuntos: number;
  errorEvolucion: boolean;
}

export interface HistorialConsultaPaciente {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  tipoConsulta?: string;
  notasProfesional?: string | null;
  sugerencias?: string | null;
  esPublica?: boolean;
  archivosAdjuntos?: string[];
}
