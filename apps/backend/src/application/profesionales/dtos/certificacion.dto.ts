import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';

export class CertificacionDto {
  idCertificacion: number | null;
  nombre: string;
  entidad: string;
  anio: number | null;
  cargaHoraria: number | null;
  nivel: NivelFormacion | null;
}
