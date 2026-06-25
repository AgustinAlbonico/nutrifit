/**
 * Schema Zod para la solicitud de generación de plan semanal con IA v2.
 *
 * Espejo del DTO del backend (`SolicitudPlanSemanalHttpDTO`).
 * Usado en formularios de React Hook Form + Zod resolver.
 *
 * Restricciones:
 * - socioId: int positivo obligatorio
 * - diasAGenerar: 1-14 (default 7)
 * - comidasPorDia: 1-5 (default 4)
 * - alternativasPorComida: 1-5 (default 3)
 * - notasGeneracion: max 1000 chars opcional
 * - fechaInicio: ISO date (YYYY-MM-DD) opcional
 */

import { z } from 'zod';

export const solicitudPlanSemanalSchema = z.object({
  socioId: z
    .number({ message: 'El ID del socio es obligatorio' })
    .int('El ID del socio debe ser un número entero')
    .positive('El ID del socio debe ser positivo'),
  diasAGenerar: z
    .number()
    .int('Los días a generar deben ser un número entero')
    .min(1, 'Debe generar al menos 1 día')
    .max(14, 'No se pueden generar más de 14 días')
    .default(7),
  comidasPorDia: z
    .number()
    .int('Las comidas por día deben ser un número entero')
    .min(1, 'Debe incluir al menos 1 comida por día')
    .max(5, 'No se pueden incluir más de 5 comidas por día')
    .default(4),
  alternativasPorComida: z
    .number()
    .int('Las alternativas por comida deben ser un número entero')
    .min(1, 'Debe haber al menos 1 alternativa por comida')
    .max(5, 'No puede haber más de 5 alternativas por comida')
    .default(3),
  notasGeneracion: z
    .string()
    .max(1000, 'Las notas no pueden superar los 1000 caracteres')
    .optional(),
  fechaInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional(),
});

export type SolicitudPlanSemanalForm = z.infer<typeof solicitudPlanSemanalSchema>;