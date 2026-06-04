/**
 * Schema Zod para validación del formulario de ficha de salud del socio.
 *
 * Reglas (alineadas con `apps/backend/src/application/turnos/dtos/upsert-ficha-salud-socio.dto.ts`):
 * - altura: 100..250 cm (backend; 1.00..2.50 m equivalente)
 * - peso: 20..300 kg (frontend, más estricto que backend que acepta hasta 500 — ver nota)
 * - nivelActividadFisica: enum centralizado en `@nutrifit/shared`
 * - objetivoPersonal: 1..500 chars
 *
 * Nota: el rango de peso en backend es 20..500 kg. El spec RB15/RB42 pide 20..300 en
 * cliente. Esta discrepancia es intencional (decisión del design §10): el cliente bloquea
 * valores > 300 para alinearse con UX, pero el backend sigue aceptando 301..500 para
 * compatibilidad con datos preexistentes.
 */

import { z } from 'zod';

import { NIVELES_ACTIVIDAD_FISICA } from '@nutrifit/shared';

const MENSAJE_ALTURA = 'La altura debe estar entre 1.00 y 2.50 m';
const MENSAJE_PESO = 'El peso debe estar entre 20 y 300 kg';

const valoresNivelActividad = NIVELES_ACTIVIDAD_FISICA.map(
  (opcion) => opcion.value,
) as [string, ...string[]];

export const fichaSaludSchema = z.object({
  altura: z.coerce
    .number({ message: 'La altura es obligatoria' })
    .int('La altura debe ser un número entero en centímetros')
    .min(100, MENSAJE_ALTURA)
    .max(250, MENSAJE_ALTURA),
  peso: z.coerce
    .number({ message: 'El peso es obligatorio' })
    .min(20, MENSAJE_PESO)
    .max(300, MENSAJE_PESO),
  nivelActividadFisica: z.enum(
    valoresNivelActividad as [
      'SEDENTARIO',
      'LIGERO',
      'MODERADO',
      'INTENSO',
      'MUY_INTENSO',
    ],
    { message: 'Seleccioná un nivel de actividad física válido' },
  ),
  objetivoPersonal: z
    .string({ message: 'El objetivo personal es obligatorio' })
    .trim()
    .min(1, 'Indicá tu objetivo personal')
    .max(500, 'El objetivo personal no puede superar los 500 caracteres'),
  consentimiento: z.boolean().optional(),
});

export type FichaSaludFormData = z.infer<typeof fichaSaludSchema>;

/**
 * Valida el formulario y devuelve un mapa de errores por campo.
 * Si el formulario es válido devuelve `null`.
 *
 * Usado en la página `FichaSaludSocio` para mostrar errores inline en español.
 */
export function validarFormularioFichaSalud(
  datos: unknown,
):
  | { exito: true; datos: FichaSaludFormData }
  | { exito: false; errores: Record<string, string> } {
  const resultado = fichaSaludSchema.safeParse(datos);

  if (resultado.success) {
    return { exito: true, datos: resultado.data };
  }

  const errores: Record<string, string> = {};

  for (const issue of resultado.error.issues) {
    const campo = issue.path[0]?.toString();
    if (campo && !errores[campo]) {
      errores[campo] = issue.message;
    }
  }

  return { exito: false, errores };
}
