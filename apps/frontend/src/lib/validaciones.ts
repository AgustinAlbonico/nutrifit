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

/**
 * Valida si un DNI es válido
 * @param dni - El DNI a validar
 * @returns true si el DNI es válido, false en caso contrario
 */
export function validarDni(dni: string): boolean {
  if (!dni) return false;
  const dniLimpio = dni.trim().replace(/[-\s]/g, '');
  return REGEX_DNI.test(dniLimpio);
}

/**
 * Obtiene el mensaje de error para el DNI
 * @param dni - El DNI a validar
 * @returns Mensaje de error o null si es válido
 */
export function obtenerErrorDni(dni: string): string | null {
  if (!dni) return null;
  const dniLimpio = dni.trim().replace(/[-\s]/g, '');

  if (!REGEX_DNI.test(dniLimpio)) {
    return 'El DNI debe tener exactamente 8 dígitos';
  }

  return null;
}

/**
 * Valida si un email es válido
 * @param email - El email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export function validarEmail(email: string): boolean {
  if (!email) return false;
  return REGEX_EMAIL.test(email.trim());
}

/**
 * Valida si un teléfono es válido
 * @param telefono - El teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export function validarTelefono(telefono: string): boolean {
  if (!telefono) return false;
  return REGEX_TELEFONO.test(telefono.trim());
}

/**
 * Obtiene los requisitos de una contraseña
 * @param contrasena - La contraseña a validar
 * @returns Array de objetos con la descripción del requisito y si se cumple
 */
export function obtenerRequisitosContrasenia(contrasena: string): {
  descripcion: string;
  cumple: boolean;
}[] {
  return [
    {
      descripcion: 'Al menos 8 caracteres',
      cumple: contrasena.length >= 8,
    },
    {
      descripcion: 'Una letra mayúscula',
      cumple: /[A-Z]/.test(contrasena),
    },
    {
      descripcion: 'Una letra minúscula',
      cumple: /[a-z]/.test(contrasena),
    },
    {
      descripcion: 'Un número',
      cumple: /\d/.test(contrasena),
    },
    {
      descripcion: 'Un símbolo especial',
      cumple: /[^A-Za-z0-9]/.test(contrasena),
    },
  ];
}

/**
 * Obtiene los errores de una contraseña
 * @param contrasena - La contraseña a validar
 * @returns Array de strings con los errores encontrados
 */
export function obtenerErroresContrasenia(contrasena: string): string[] {
  const errores: string[] = [];

  if (contrasena.length < 8) {
    errores.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(contrasena)) {
    errores.push('Debe contener al menos una letra mayúscula');
  }
  if (!/[a-z]/.test(contrasena)) {
    errores.push('Debe contener al menos una letra minúscula');
  }
  if (!/\d/.test(contrasena)) {
    errores.push('Debe contener al menos un número');
  }
  if (!/[^A-Za-z0-9]/.test(contrasena)) {
    errores.push('Debe contener al menos un símbolo especial');
  }

  return errores;
}
