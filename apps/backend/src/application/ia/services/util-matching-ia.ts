import { normalizarTexto } from 'src/common/utils/text.util';
export { normalizarTexto };

/**
 * Obtiene claves de búsqueda para un alimento, incluyendo singularización
 * y sinónimos conocidos. Sigue la misma lógica que Pipeline B.
 */
export function obtenerClavesBusquedaAlimento(nombre: string): string[] {
  const normalizado = normalizarTexto(nombre);
  if (!normalizado) return [];

  const sinonimos: Record<string, string> = {
    platano: 'banana',
    platanos: 'banana',
  };

  const claves: string[] = [normalizado];
  const sinonimo = sinonimos[normalizado];
  if (sinonimo) claves.push(sinonimo);
  if (normalizado.endsWith('es')) claves.push(normalizado.slice(0, -2));
  if (normalizado.endsWith('s')) claves.push(normalizado.slice(0, -1));

  return [...new Set(claves)];
}

/**
 * Calcula el coeficiente de Dice entre dos strings basados en tokens word-wise.
 * Retorna valor entre 0 y 1 (1 = idénticos en tokens).
 * Sensible al orden pero normalizado en mayúsculas.
 */
export function coincidenciaFuzzy(nombreA: string, nombreB: string): number {
  const normalizadoA = normalizarTexto(nombreA);
  const normalizadoB = normalizarTexto(nombreB);

  if (!normalizadoA || !normalizadoB) return 0;

  const tokensA = new Set(normalizadoA.split(/\s+/).filter(Boolean));
  const tokensB = new Set(normalizadoB.split(/\s+/).filter(Boolean));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let interseccion = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) interseccion++;
  }

  const dice = (2 * interseccion) / (tokensA.size + tokensB.size);
  return dice;
}
