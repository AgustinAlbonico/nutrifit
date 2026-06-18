export class PoliticaOperativaEntity {
  id: number | null;
  gimnasioId: number;
  plazoCancelacionHoras: number;
  plazoReprogramacionHoras: number;
  umbralAusenteMinutos: number;
  umbralCierreConsultaMin: number | null;
  preavisoCierreConsultaMin: number | null;

  constructor(
    id: number | null = null,
    gimnasioId: number,
    plazoCancelacionHoras: number = 24,
    plazoReprogramacionHoras: number = 24,
    umbralAusenteMinutos: number = 15,
    umbralCierreConsultaMin: number | null = null,
    preavisoCierreConsultaMin: number | null = null,
  ) {
    this.id = id;
    this.gimnasioId = gimnasioId;
    this.plazoCancelacionHoras = plazoCancelacionHoras;
    this.plazoReprogramacionHoras = plazoReprogramacionHoras;
    this.umbralAusenteMinutos = umbralAusenteMinutos;
    this.umbralCierreConsultaMin = umbralCierreConsultaMin;
    this.preavisoCierreConsultaMin = preavisoCierreConsultaMin;
  }
}
