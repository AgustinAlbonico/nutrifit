/**
 * Normaliza un texto para comparacion sin distinguir tildes/acentos
 * y sin distinguir mayusculas/minusculas.
 *
 * Comportamiento:
 *   - Convierte a minusculas.
 *   - Aplica NFD (Canonical Decomposition) para separar un caracter
 *     con tilde de su diacritico (ej: "a" + combining acute = "á").
 *   - Remueve los diacriticos (rango Unicode U+0300..U+036F).
 *   - Recorta espacios al inicio/final.
 *
 * Es el espejo backend de `normalizarTexto` en `apps/frontend/src/lib/text.ts`
 * para mantener consistencia de busqueda entre cliente y servidor.
 *
 * Ejemplo:
 *   normalizarTexto('  José Pérez  ') === 'jose perez'
 *   normalizarTexto('MARIANA') === 'mariana'
 */
export function normalizarTexto(valor: string): string {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
