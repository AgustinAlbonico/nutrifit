/**
 * DTO resumido para el listado de historial de versiones de la ficha
 * de salud del socio. NO incluye `datosJson` para no exponer el
 * payload masivo en cada item del resumen.
 *
 * RBs: RB50 (historial inmutable).
 */
export class HistorialFichaSaludItemDto {
  version: number;
  versionId: number;
  createdAt: Date;
  createdBy: number | null;
}
