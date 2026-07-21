/**
 * Helpers SQL para busqueda accent-insensitive (sin tildes) en MySQL.
 *
 * El proyecto usa collation `utf8mb4_unicode_ci` en la conexion (ver
 * `infrastructure/config/typeorm/typeorm.config.ts`) que SI es
 * accent-insensitive, pero aplicar `LOWER()` sobre la columna rompe
 * esa garantia porque la comparacion pasa a ser sobre la forma
 * binaria/byte-a-byte. Por eso necesitamos normalizar acentos
 * explicitamente en la query para que un termino como "jose"
 * coincida con "José" guardado en la DB.
 *
 * Estrategia: cadena de `REPLACE()` que mapea los caracteres con
 * tilde/diacriticos mas comunes del espanol a su base ASCII. Esto
 * funciona en MySQL 5.7+ y 8+ sin requerir stored functions ni
 * cambios de esquema.
 *
 * Uso tipico en un query builder:
 *
 *   const termino = normalizarTexto(input);
 *   qb.andWhere(
 *     `${stripAccentsLowerSql('LOWER(socio.nombre)')} LIKE :termino`,
 *     { termino: `%${termino}%` },
 *   );
 */

const CARACTERES_LOWER_CON_TILDE: Array<readonly [string, string]> = [
  ['á', 'a'],
  ['é', 'e'],
  ['í', 'i'],
  ['ó', 'o'],
  ['ú', 'u'],
  ['ü', 'u'],
  ['ñ', 'n'],
];

/**
 * Devuelve una expresion SQL (fragmento) que recibe una columna/expresion
 * ya en `LOWER(...)` y le remueve los diacriticos mas comunes del espanol.
 *
 * Asume que la entrada esta en lowercase (por eso no mapeamos mayusculas).
 * Si la columna NO esta envuelta en `LOWER()`, usar primero esa funcion
 * para mantener consistencia.
 */
export function stripAccentsLowerSql(column: string): string {
  return CARACTERES_LOWER_CON_TILDE.reduce<string>(
    (expr, [conTilde, sinTilde]) =>
      `REPLACE(${expr}, '${conTilde}', '${sinTilde}')`,
    column,
  );
}
