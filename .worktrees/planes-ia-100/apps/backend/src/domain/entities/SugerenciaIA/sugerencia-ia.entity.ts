import { PropuestaIA } from '@nutrifit/shared';

export enum SugerenciaEstado {
  GENERADA = 'GENERADA',
  DESCARTADA = 'DESCARTADA',
  INCORPORADA = 'INCORPORADA',
  ERROR = 'ERROR',
}

export interface SugerenciaIAEntityProps {
  idSugerencia: number | null;
  socioId: number;
  objetivo: string;
  restricciones: string[] | null;
  infoExtra: string;
  propuesta: PropuestaIA | null;
  estado: SugerenciaEstado;
  creadaEn: Date;
  usadaEn: Date | null;
}

export class SugerenciaIAEntity {
  idSugerencia: number | null;
  socioId: number;
  objetivo: string;
  restricciones: string[] | null;
  infoExtra: string;
  propuesta: PropuestaIA | null;
  estado: SugerenciaEstado;
  creadaEn: Date;
  usadaEn: Date | null;

  constructor(props: SugerenciaIAEntityProps) {
    this.idSugerencia = props.idSugerencia;
    this.socioId = props.socioId;
    this.objetivo = props.objetivo;
    this.restricciones = props.restricciones;
    this.infoExtra = props.infoExtra;
    this.propuesta = props.propuesta;
    this.estado = props.estado;
    this.creadaEn = props.creadaEn;
    this.usadaEn = props.usadaEn;
  }
}
