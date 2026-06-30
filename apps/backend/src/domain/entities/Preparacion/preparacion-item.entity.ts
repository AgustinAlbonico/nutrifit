import { UnidadMedida } from '../Alimento/UnidadMedida';

export class PreparacionItemEntity {
  idPreparacionItem: number | null;
  preparacionId: number;
  alimentoId: number;
  cantidadDefault: number;
  unidadDefault: UnidadMedida;

  constructor(
    idPreparacionItem: number | null = null,
    preparacionId: number,
    alimentoId: number,
    cantidadDefault: number,
    unidadDefault: UnidadMedida,
  ) {
    this.idPreparacionItem = idPreparacionItem;
    this.preparacionId = preparacionId;
    this.alimentoId = alimentoId;
    this.cantidadDefault = cantidadDefault;
    this.unidadDefault = unidadDefault;
  }
}
