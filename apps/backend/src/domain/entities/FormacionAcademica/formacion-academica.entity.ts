import { AuditableEntity } from '../../shared/auditable.entity';

export class FormacionAcademicaEntity extends AuditableEntity {
  idFormacionAcademica: number | null;
  titulo: string;
  institucion: string;
  añoComienzo: number;
  añoFin: number;
  nivel: string;

  constructor(
    idFormacionAcademica: number | null = null,
    titulo: string,
    institucion: string,
    añoComienzo: number,
    añoFin: number,
    nivel: string,
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
