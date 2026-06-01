export class FormacionAcademicaEntity {
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
  ) {
    this.idFormacionAcademica = idFormacionAcademica;
    this.titulo = titulo;
    this.institucion = institucion;
    this.añoComienzo = añoComienzo;
    this.añoFin = añoFin;
    this.nivel = nivel;
  }
}
