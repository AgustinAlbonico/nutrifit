/**
 * Helper puro para calcular el diff entre dos snapshots de ficha de
 * salud. Retorna los nombres de los campos modificados.
 *
 * Reglas:
 *  - Si antes o después son null/undefined, retorna [] (no hay con qué
 *    comparar — no se reporta nada).
 *  - Solo se reportan cambios reales. Para primitivos se usa ===. Para
 *    arrays (e.g. `alergias`, `patologias`) se compara por valor
 *    (JSON.stringify), ya que cada snapshot reconstruye referencias
 *    nuevas. Para objetos anidados, también se usa JSON.stringify.
 *  - No se reportan campos donde el valor en `despues` es null,
 *    undefined o string vacío (no se reportan "limpiezas" de campos
 *    opcionales como cambios sustantivos para la auditoría — el
 *    snapshot anterior sigue siendo la fuente de verdad clínica).
 *
 * Este helper es **puro** (sin imports de NestJS o TypeORM) para
 * facilitar el testing y reducir acoplamiento.
 *
 * RBs: RB33 (auditoría con shape seguro).
 */
export function calcularDiffFicha(
  antes: Record<string, unknown> | null | undefined,
  despues: Record<string, unknown> | null | undefined,
): string[] {
  if (!antes || !despues) {
    return [];
  }

  const camposModificados: string[] = [];

  for (const key of Object.keys(despues)) {
    const valorAntes = antes[key];
    const valorDespues = despues[key];

    if (sonIguales(valorAntes, valorDespues)) {
      continue;
    }

    if (
      valorDespues === null ||
      valorDespues === undefined ||
      valorDespues === ''
    ) {
      continue;
    }

    camposModificados.push(key);
  }

  return camposModificados;
}

function sonIguales(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  // Arrays: comparar por valor (mismos elementos en mismo orden).
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => item === b[index]);
  }

  // Objetos: comparar por JSON (un nivel es suficiente para la ficha).
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  return false;
}
