export class PatologiaEntity {
  idPatologia: number | null;
  nombre: string;

  constructor(idPatologia: number | null = null, nombre: string) {
    this.idPatologia = idPatologia;
    this.nombre = nombre;
  }
}
