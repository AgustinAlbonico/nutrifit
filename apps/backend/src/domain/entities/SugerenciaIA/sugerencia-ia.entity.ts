import { PropuestaIA } from '@nutrifit/shared';
import { AuditableEntity } from '../../shared/auditable.entity';

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

export class SugerenciaIAEntity extends AuditableEntity {
  idSugerencia: number | null;
  socioId: number;
  objetivo: string;
  restricciones: string[] | null;
  infoExtra: string;
  propuesta: PropuestaIA | null;
  estado: SugerenciaEstado;
  creadaEn: Date;
  usadaEn: Date | null;

  constructor(props: SugerenciaIAEntityProps, fechaBaja: Date | null = null) {
    super(fechaBaja);
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
