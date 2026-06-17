import { randomInt } from 'crypto';

const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const NUMEROS = '23456789';
const SIMBOLOS = '!@#$%&*_-';
const TODOS = MAYUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;

/**
 * Genera una contraseña provisional criptográficamente segura.
 *
 * Spec RB32: 12 caracteres que garantizan al menos 1 mayúscula,
 * 1 minúscula, 1 número y 1 símbolo. Los 8 caracteres restantes
 * se eligen al azar del set completo para no debilitar la contraseña.
 */
export function generarContrasenaProvisional(longitud: number = 12): string {
  if (longitud < 4) {
    throw new Error(
      'La longitud mínima de la contraseña provisional es 4 caracteres.',
    );
  }

  const garantizados = [
    elegir(MAYUSCULAS),
    elegir(MINUSCULAS),
    elegir(NUMEROS),
    elegir(SIMBOLOS),
  ];

  const restantes: string[] = [];
  for (let i = garantizados.length; i < longitud; i += 1) {
    restantes.push(elegir(TODOS));
  }

  return mezclar([...garantizados, ...restantes]);
}

function elegir(set: string): string {
  return set.charAt(randomInt(0, set.length));
}

/**
 * Fisher-Yates con randomInt para no sesgar la distribución.
 */
function mezclar(caracteres: string[]): string {
  for (let i = caracteres.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}
