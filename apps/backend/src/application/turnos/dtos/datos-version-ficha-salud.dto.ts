/**
 * DTO de respuesta para una versión específica de la ficha de salud.
 * Incluye el snapshot completo deserializado (`datos`) para que el
 * cliente pueda mostrar los valores de la versión consultada.
 *
 * RBs: RB50 (historial inmutable).
 */
export class DatosVersionFichaSaludDto {
  version: number;
  createdAt: Date;
  datos: Record<string, unknown>;
}
