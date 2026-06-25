/**
 * PromptRestriccionesInstructionBuilder
 * ======================================
 *
 * Genera una instrucción correctiva en español para inyectar al prompt de
 * IA cuando el `RestriccionesValidatorV2` detectó violaciones. La idea:
 * si la IA generó un plan con pollo para un vegano, le devolvemos un bloque
 * tipo "EXCLUIR: pollo. Generá alternativa con..." para que reintente.
 *
 * Lógica PURA (sin DI). Estática porque no necesita estado.
 */

import type { RestriccionNoCumplida } from '../../../domain/validators/restricciones-validator-v2';

export class PromptRestriccionesInstructionBuilder {
  /**
   * Genera la instrucción correctiva. Si no hay violaciones, retorna string vacío.
   *
   * Formato:
   *   "EXCLUIR: [alimentos]. Restricciones violadas: [...]. Generá
   *   alternativas que respeten estrictamente estas restricciones. Mantené
   *   la estructura JSON y los macros aproximados al objetivo."
   */
  static generar(violaciones: RestriccionNoCumplida[]): string {
    if (!violaciones || violaciones.length === 0) {
      return '';
    }

    const alimentosExcluir = Array.from(
      new Set(
        violaciones
          .map((v) => v.alimento)
          .filter((a): a is string => typeof a === 'string' && a.length > 0),
      ),
    );

    const restriccionesAfectadas = Array.from(
      new Set(violaciones.map((v) => v.restriccion)),
    );

    const lineas: string[] = [];
    lineas.push(
      `EXCLUIR los siguientes alimentos del plan: ${alimentosExcluir.join(', ')}.`,
    );
    lineas.push(
      `Restricciones violadas: ${restriccionesAfectadas.join('; ')}.`,
    );
    lineas.push(
      'Generá alternativas que respeten estrictamente estas restricciones. Mantené la estructura JSON y los macros aproximados al objetivo.',
    );

    return lineas.join(' ');
  }
}
