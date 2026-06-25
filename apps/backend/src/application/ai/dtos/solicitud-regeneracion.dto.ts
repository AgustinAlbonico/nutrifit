/**
 * SolicitudRegeneracionHttpDTO
 * ============================
 *
 * DTO de entrada para `POST /ia/plan-semanal/regenerar`.
 *
 * Scopes soportados:
 *  - PLAN:        regenera el plan entero. No requiere campos extra.
 *  - DIA:         regenera un único día. Requiere `dia`.
 *  - ALTERNATIVA: regenera una sola alternativa. Requiere `dia`, `comidaSlot`,
 *                 `alternativaIndex`.
 *
 * `confirmarPerdidaEdicionManual` es opt-in: si la versión actual tiene
 * motivoCambio='edicion_manual', el use-case rechaza la regeneración
 * salvo que el cliente envíe este flag en true (UX safeguard contra
 * pérdida accidental de trabajo manual del nutricionista).
 */

import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export enum ScopeRegeneracionValores {
  PLAN = 'PLAN',
  DIA = 'DIA',
  ALTERNATIVA = 'ALTERNATIVA',
}

export class SolicitudRegeneracionHttpDTO {
  @IsInt()
  @Min(1)
  planAlimentacionVersionId!: number;

  @IsEnum(ScopeRegeneracionValores, {
    message: 'scope debe ser uno de: PLAN, DIA, ALTERNATIVA',
  })
  scope!: ScopeRegeneracionValores;

  @IsOptional()
  @IsEnum(DiaSemana, {
    message: 'dia debe ser un día válido (LUNES, MARTES, etc.)',
  })
  dia?: DiaSemana;

  @IsOptional()
  @IsEnum(TipoComida, {
    message: 'comidaSlot debe ser un tipo válido (DESAYUNO, ALMUERZO, etc.)',
  })
  comidaSlot?: TipoComida;

  @IsOptional()
  @IsInt()
  @Min(0)
  alternativaIndex?: number;

  /**
   * Si la versión actual fue editada manualmente (motivoCambio='edicion_manual'),
   * el cliente debe enviar `true` para confirmar que acepta perder esos cambios.
   * Por defecto false → 409 Conflict si la versión es edicion_manual.
   */
  @IsOptional()
  @IsBoolean()
  confirmarPerdidaEdicionManual?: boolean;
}