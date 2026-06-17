import { AuditableEntity } from '../../shared/auditable.entity';
import { NivelFormacion } from './nivel-formacion';

export class CertificacionEntity extends AuditableEntity {
  idCertificacion: number | null;
  nombre: string;
  entidad: string;
  anio: number | null;
  cargaHoraria: number | null;
  nivel: NivelFormacion | null;

  constructor(
    idCertificacion: number | null = null,
    nombre: string,
    entidad: string,
    anio: number | null = null,
    cargaHoraria: number | null = null,
    nivel: NivelFormacion | null = null,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idCertificacion = idCertificacion;
    this.nombre = nombre;
    this.entidad = entidad;
    this.anio = anio;
    this.cargaHoraria = cargaHoraria;
    this.nivel = nivel;
  }
}
