/**
 * Tipo de ejemplo que la memoria IA guarda sobre un feedback.
 *
 * - POSITIVO: ejemplo de plan bien generado (para reforzar patrones buenos).
 * - NEGATIVO: ejemplo de plan mal generado (para evitar repetir errores).
 *
 * La selección adaptativa prefiere positivos; si no hay suficientes,
 * complementa con negativos. Ver `SeleccionarEjemplosMemoriaUseCase`
 * (Packet 3).
 */
export type TipoEjemploIA = 'POSITIVO' | 'NEGATIVO';

/**
 * Entrada de la memoria IA del nutricionista.
 *
 * Se crea automáticamente cuando un feedback tiene comentario no vacío.
 * La lógica de rotación FIFO a 100 activas por nutricionista vive en
 * `NutricionistaIAMemoriaRepository.rotarSiExcede100(...)` (Packet 3).
 *
 * Campo `archivada`: soft-archive. Una vez archivada, no se incluye en la
 * selección para prompts. NO se borra físicamente para preservar auditoría.
 */
export class NutricionistaIAMemoriaEntity {
  constructor(
    public readonly idNutricionistaIaMemoria: number,
    public readonly idNutricionista: number,
    public readonly tipoEjemplo: TipoEjemploIA,
    public readonly comentario: string,
    public readonly idPlanAlimentacionVersion: number | null,
    public readonly archivada: boolean,
    public readonly createdAt: Date,
  ) {}
}
