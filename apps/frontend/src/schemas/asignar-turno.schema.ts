/**
 * Schema Zod para validacion del formulario de asignacion de turno
 * por staff (recepcion / admin / nutricionista).
 *
 * Coincide con `CrearTurnoEnNombreDeSocioDto` del backend
 * (`apps/backend/src/application/turnos/dtos/crear-turno-en-nombre-de-socio.dto.ts`).
 * La validacion final la hace `class-validator` en el backend; este
 * Zod es para feedback rapido en el form antes de enviar.
 */

import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const asignarTurnoSchema = z.object({
  socioId: z
    .number({ message: 'El socio es obligatorio' })
    .int('El socio es invalido')
    .positive('El socio es invalido'),
  nutricionistaId: z
    .number({ message: 'El profesional es obligatorio' })
    .int('El profesional es invalido')
    .positive('El profesional es invalido'),
  fechaTurno: z
    .string()
    .regex(DATE_REGEX, 'La fecha debe tener formato YYYY-MM-DD'),
  horaTurno: z
    .string()
    .regex(TIME_REGEX, 'La hora debe tener formato HH:mm'),
});

export type AsignarTurnoInput = z.infer<typeof asignarTurnoSchema>;
