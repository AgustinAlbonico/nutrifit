export class DiplomaEntity {
  idDiploma: number;
  idNutricionista: number;
  documentKey: string;
  nombreOriginal: string | null;
  mimeType: string | null;
  creadoEn: Date;

  constructor(
    idDiploma: number,
    idNutricionista: number,
    documentKey: string,
    nombreOriginal: string | null = null,
    mimeType: string | null = null,
    creadoEn: Date = new Date(),
  ) {
    this.idDiploma = idDiploma;
    this.idNutricionista = idNutricionista;
    this.documentKey = documentKey;
    this.nombreOriginal = nombreOriginal;
    this.mimeType = mimeType;
    this.creadoEn = creadoEn;
  }
}
