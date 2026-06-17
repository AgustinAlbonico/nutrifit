import { AuditableEntity } from '../../shared/auditable.entity';
import { NivelFormacion } from '../Certificacion/nivel-formacion';

export class FormacionAcademicaEntity extends AuditableEntity {
  idFormacionAcademica: number | null;
  titulo: string;
  institucion: string;
  añoComienzo: number;
  añoFin: number | null;
  nivel: NivelFormacion;

  constructor(
    idFormacionAcademica: number | null = null,
    titulo: string,
    institucion: string,
    añoComienzo: number,
    añoFin: number | null,
    nivel: NivelFormacion,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idFormacionAcademica = idFormacionAcademica;
    this.titulo = titulo;
    this.institucion = institucion;
    this.añoComienzo = añoComienzo;
    this.añoFin = añoFin;
    this.nivel = nivel;
  }
}
