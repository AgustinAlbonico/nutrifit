/**
 * Constantes y labels compartidos para la ficha de salud.
 *
 * Centraliza los enums y etiquetas (en español) que tanto el backend
 * (NestJS) como el frontend (React) consumen, para evitar duplicación
 * y drift entre los dos lados.
 *
 * RBs relacionados: RB50 (versionado), RB44 (consentimiento), RB15 (UI).
 */

export type NivelActividadFisicaValue =
  | 'SEDENTARIO'
  | 'LIGERO'
  | 'MODERADO'
  | 'INTENSO'
  | 'MUY_INTENSO';

export interface OpcionCatalogo<T extends string> {
  value: T;
  label: string;
}

/**
 * Niveles de actividad física disponibles en el formulario de ficha
 * de salud. Mantener sincronizado con el enum TS `NivelActividadFisica`
 * del backend y con la migración del Task 1.2 (5 valores en upper-case).
 */
export const NIVELES_ACTIVIDAD_FISICA: ReadonlyArray<
  OpcionCatalogo<NivelActividadFisicaValue>
> = [
  { value: 'SEDENTARIO', label: 'Sedentario' },
  { value: 'LIGERO', label: 'Ligero' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'INTENSO', label: 'Intenso' },
  { value: 'MUY_INTENSO', label: 'Muy intenso' },
] as const;

export type FrecuenciaComidasValue =
  | '1-2 comidas'
  | '3 comidas'
  | '4-5 comidas'
  | '6 o más comidas';

/**
 * Frecuencia de comidas del socio. Los valores son strings libres
 * (coinciden con los valores del enum backend actual) — un refactor a
 * códigos está planeado para iteración 2+.
 */
export const FRECUENCIAS_COMIDAS: ReadonlyArray<
  OpcionCatalogo<FrecuenciaComidasValue>
> = [
  { value: '1-2 comidas', label: '1-2 comidas' },
  { value: '3 comidas', label: '3 comidas' },
  { value: '4-5 comidas', label: '4-5 comidas' },
  { value: '6 o más comidas', label: '6 o más comidas' },
] as const;
