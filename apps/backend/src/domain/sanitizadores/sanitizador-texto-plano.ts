/**
 * Resultado de sanitizar texto plano. El flag `huboCambios` permite a los
 * use-cases registrar auditoría con metadata útil (por ejemplo, si el input
 * contenía HTML/scripts).
 */
export interface ResultadoSanitizacion {
  texto: string;
  huboCambios: boolean;
}

/**
 * Sanitiza texto plano para almacenamiento seguro.
 *
 * Reglas (en orden):
 * 1. Trim de espacios al inicio y al final.
 * 2. Collapse de saltos de línea múltiples (3 o más → 2).
 * 3. Remoción de tags HTML/scripts (cualquier `<...>`).
 * 4. Remoción de markdown inyectable (`` ` ``, `**`, `~~`).
 * 5. Trim final para limpiar espacios residuales.
 *
 * NO valida longitud: eso queda a cargo del use-case que lo invoca (porque
 * el límite depende del contexto: 2000 para preferencias IA, 1000 para
 * notas de generación, etc.).
 *
 * Es función pura sin dependencias: testeable sin mocks.
 */
export function sanitizarTextoPlano(texto: string): ResultadoSanitizacion {
  const original = texto ?? '';

  let limpio = original;

  // 1) Trim inicial
  limpio = limpio.trim();

  // 2) Collapse de saltos de línea múltiples (3+ → 2)
  limpio = limpio.replace(/\n{3,}/g, '\n\n');

  // 3) Remover tags HTML/scripts (cualquier <...>)
  // Captura tanto tags simples como con atributos y cierra el matcheo con
  // el cierre correspondiente. Si no hay cierre, captura greedy hasta el >.
  limpio = limpio.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // 4) Remover markdown inyectable: code inline, bold, italic, strikethrough
  limpio = limpio.replace(/`/g, '');
  limpio = limpio.replace(/\*\*/g, '');
  limpio = limpio.replace(/~~/g, '');

  // 5) Trim final
  limpio = limpio.trim();

  return {
    texto: limpio,
    huboCambios: limpio !== original,
  };
}