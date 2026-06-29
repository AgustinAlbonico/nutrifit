/**
 * Tokens visuales del módulo Plan de Alimentación.
 *
 * El módulo Plan usa un acento **naranja → rosa** para diferenciarse del
 * resto de NutriFit (verde/médico). Centralizar acá evita drift entre
 * páginas y permite ajustes globales de marca en una sola edición.
 *
 * Los valores son clases Tailwind (no CSS-in-JS) y se consumen vía
 * `cn(...)` o directamente como strings.
 *
 * Si en el futuro migramos a CSS variables / OKLCH, este archivo es el
 * único punto a tocar.
 */

export const PALETA_PLAN = {
  /** Hero horizontal naranja → rosa translúcido (headers de MiPlan/Gestion). */
  gradienteHero: 'from-orange-500/10 via-rose-500/10 to-transparent',
  /** Borde sutil del hero. */
  bordeHero: 'border-orange-500/20',
  /** Título con texto-gradiente (h1 de pantallas principales). */
  textoGradiente:
    'bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent',
  /** Botón primary (CTA principal). */
  botonPrimario:
    'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white',
  /** Card hover tonal (listas, modales). */
  tarjetaAcento:
    'bg-orange-50 hover:bg-orange-50/80 hover:border-orange-200 border border-transparent',
  /** Foco de input (no usar gris, usar tono marca). */
  inputFoco: 'bg-white/50 border-orange-200 focus:border-orange-400',
  /** Punto/pill del icono principal (chip). */
  puntoAcento: 'bg-orange-500',
} as const;

/**
 * Tokens semánticos para zonas de plan. Mantienen el naranja como acento
 * pero introducen verde y rojo como funcionales (habilitar/deshabilitar).
 */
export const PALETA_ESTADO = {
  activo: {
    fondo: 'bg-emerald-500/15',
    texto: 'text-emerald-700 dark:text-emerald-300',
    borde: 'border-emerald-500/30',
    punto: 'bg-emerald-500',
  },
  borrador: {
    fondo: 'bg-slate-500/15',
    texto: 'text-slate-700 dark:text-slate-300',
    borde: 'border-slate-500/30',
    punto: 'bg-slate-500',
  },
  finalizado: {
    fondo: 'bg-amber-500/15',
    texto: 'text-amber-700 dark:text-amber-300',
    borde: 'border-amber-500/30',
    punto: 'bg-amber-500',
  },
} as const;
