/**
 * DTO de entrada para {@link AbrirFichaDesdeTurnoUseCase}.
 *
 * Centraliza los identificadores necesarios para registrar la revision
 * de la ficha de salud al abrirla desde un turno (RB45).
 */
export class AbrirFichaDesdeTurnoDto {
  turnoId: number;
  nutricionistaId: number;
  socioId: number;
}
