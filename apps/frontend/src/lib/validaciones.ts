/**
 * Validadores de formulario
 */

/**
 * Regex para validar DNI argentino
 * Acepta exactamente 8 dígitos
 */
export const REGEX_DNI = /^\d{8}$/;

/**
 * Regex para validar email
 */
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Regex para validar teléfono
 * Acepta entre 8 y 20 caracteres (dígitos, espacios, paréntesis y guiones)
 */
export const REGEX_TELEFONO = /^[\d\s()+-]{8,20}$/;
