export class AlergiaEntity {
  idAlergia: number | null;
  nombre: string;

  constructor(idAlergia: number | null = null, nombre: string) {
    this.idAlergia = idAlergia;
    this.nombre = nombre;
  }
}
