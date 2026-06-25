import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO para crear o editar el feedback de una versión de plan.
 *
 * Reglas:
 * - voto: requerido (POSITIVO o NEGATIVO).
 * - comentario: opcional, máximo 500 caracteres (límite de columna).
 */
export const VotoPlanValores = ['POSITIVO', 'NEGATIVO'] as const;
export type VotoPlanDto = (typeof VotoPlanValores)[number];

export class CrearFeedbackPlanDto {
  @IsEnum(VotoPlanValores, {
    message: 'voto debe ser POSITIVO o NEGATIVO',
  })
  voto: VotoPlanDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
