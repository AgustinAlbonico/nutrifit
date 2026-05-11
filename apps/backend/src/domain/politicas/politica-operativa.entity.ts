export class PoliticaOperativaEntity {
  id: number | null;
  gimnasioId: number;
  plazoCancelacionHoras: number;
  plazoReprogramacionHoras: number;
  umbralAusenteMinutos: number;

  constructor(
    id: number | null = null,
    gimnasioId: number,
    plazoCancelacionHoras: number = 24,
    plazoReprogramacionHoras: number = 24,
    umbralAusenteMinutos: number = 15,
  ) {
    this.id = id;
    this.gimnasioId = gimnasioId;
    this.plazoCancelacionHoras = plazoCancelacionHoras;
    this.plazoReprogramacionHoras = plazoReprogramacionHoras;
    this.umbralAusenteMinutos = umbralAusenteMinutos;
  }
}
