/**
 * Resultado de {@link AbrirFichaDesdeTurnoUseCase}.
 *
 * - `fichaId`: id de la ficha de salud del socio si existe; `null` si el
 *   socio no tiene ficha registrada.
 * - `revisada`: `true` si la ficha fue marcada como revisada en este
 *   llamado; `false` si no hay ficha o si el socio no pertence al gym.
 * - `revisadaAt`: timestamp con el que se actualizo `revisadaPorNutricionistaAt`.
 */
export class AbrirFichaDesdeTurnoResponseDto {
  fichaId: number | null;
  revisada: boolean;
  revisadaAt: Date | null;
}
