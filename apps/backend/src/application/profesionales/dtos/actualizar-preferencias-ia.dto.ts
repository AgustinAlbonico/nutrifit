import { IsString, MaxLength } from 'class-validator';

/**
 * DTO para `PUT /profesional/mi-perfil/preferencias-ia`.
 *
 * El cuerpo es un objeto `{ preferencias: string }` con sanitización y
 * validación max 2000 aplicadas en el use-case (lógica pura testeable).
 * Este DTO solo aplica la primera barrera (estructura + longitud máxima
 * via class-validator) antes de llegar al use-case.
 */
export class ActualizarPreferenciasIaDto {
  @IsString()
  @MaxLength(2000, {
    message: 'Las preferencias no pueden superar 2000 caracteres',
  })
  preferencias: string;
}