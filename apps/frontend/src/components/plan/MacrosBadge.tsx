/**
 * Badge visual que representa el desvío de macros de un plan respecto al
 * objetivo nutricional. Tres bandas: verde (cumple ±5%), amarillo (desvío
 * menor ±10%) y rojo (fuera de rango >10%).
 *
 * Mejora v2 (ver `iteracion 1/errores/plan-alimentacion-validacion-playwright.md`):
 * - El porcentaje (`±X.X%`) se muestra SIEMPRE y de forma explícita.
 *   Antes era opcional y aparecía con opacidad reducida.
 * - Si el backend provee `detalle` (calorías/proteínas/carbs/grasas), se
 *   muestra tooltip con desglose. Tooltip aparece en hover y es
 *   navegable por teclado (Radix).
 * - Variant `compact` reduce tamaño para grids con muchos chips.
 *
 * Accesibilidad:
 * - `aria-label` describe banda + porcentaje
 * - role="status" indica estado al lector de pantalla
 * - tooltip navegable por teclado (Radix)
 */

import { cn } from '@/lib/utils';
import { PALETA_PLAN } from '@/components/plan/paleta';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BandaMacro } from '@/types/ia';

export interface DetalleMacroBadge {
  real: number;
  objetivo: number;
}

interface DetalleMacrosCompleto {
  calorias?: DetalleMacroBadge;
  proteinas?: DetalleMacroBadge;
  carbohidratos?: DetalleMacroBadge;
  grasas?: DetalleMacroBadge;
}

interface PropiedadesMacrosBadge {
  banda: BandaMacro;
  desvioPorcentaje: number;
  /** Detalle para tooltip (versión corta, solo principal). */
  detalle?: DetalleMacroBadge;
  /**
   * Detalle completo por macro. Si está presente, se muestra desglose
   * en tooltip. Útil para NUT que quieren ver por qué falla.
   */
  detallePorMacro?: DetalleMacrosCompleto;
  /** Variant compacto reduce tamaño del chip y oculta texto. */
  compact?: boolean;
  className?: string;
}

const ETIQUETAS_BANDA: Record<BandaMacro, string> = {
  VERDE: 'Cumple',
  AMARILLO: 'Aceptable',
  ROJO: 'Fuera de rango',
};

const CLASES_BANDA: Record<BandaMacro, string> = {
  VERDE:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
  AMARILLO:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
  ROJO: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 hover:bg-red-500/20',
};

const PUNTO_BANDA: Record<BandaMacro, string> = {
  VERDE: 'bg-emerald-500',
  AMARILLO: 'bg-amber-500',
  ROJO: 'bg-red-500',
};

function formatearDesvio(desvio: number): string {
  const signo = desvio > 0 ? '+' : '';
  return `${signo}${desvio.toFixed(1)}%`;
}

function formatearKcal(real: number): string {
  return `${Math.round(real)} kcal`;
}

function formatearGramos(real: number): string {
  return `${Math.round(real)} g`;
}

function construirTooltip(
  desvio: number,
  detalle?: DetalleMacroBadge,
  detallePorMacro?: DetalleMacrosCompleto,
): React.ReactNode {
  const lineas: { etiqueta: string; valor: string }[] = [];

  if (detallePorMacro?.calorias) {
    lineas.push({
      etiqueta: 'Calorías',
      valor: `${formatearKcal(detallePorMacro.calorias.real)} / ${formatearKcal(detallePorMacro.calorias.objetivo)}`,
    });
  } else if (detalle) {
    lineas.push({
      etiqueta: 'Calorías',
      valor: `${formatearKcal(detalle.real)} / ${formatearKcal(detalle.objetivo)}`,
    });
  }

  if (detallePorMacro?.proteinas) {
    lineas.push({
      etiqueta: 'Proteínas',
      valor: `${formatearGramos(detallePorMacro.proteinas.real)} / ${formatearGramos(detallePorMacro.proteinas.objetivo)}`,
    });
  }
  if (detallePorMacro?.carbohidratos) {
    lineas.push({
      etiqueta: 'Carbohidratos',
      valor: `${formatearGramos(detallePorMacro.carbohidratos.real)} / ${formatearGramos(detallePorMacro.carbohidratos.objetivo)}`,
    });
  }
  if (detallePorMacro?.grasas) {
    lineas.push({
      etiqueta: 'Grasas',
      valor: `${formatearGramos(detallePorMacro.grasas.real)} / ${formatearGramos(detallePorMacro.grasas.objetivo)}`,
    });
  }

  if (lineas.length === 0) return null;

  return (
    <div className="space-y-1 text-left">
      <p className="font-semibold">Desvío {formatearDesvio(desvio)}</p>
      <div className="space-y-0.5 text-xs opacity-90">
        {lineas.map((linea) => (
          <div
            key={linea.etiqueta}
            className="flex items-center justify-between gap-3"
          >
            <span className="opacity-70">{linea.etiqueta}</span>
            <span className="tabular-nums">{linea.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MacrosBadge({
  banda,
  desvioPorcentaje,
  detalle,
  detallePorMacro,
  compact = false,
  className,
}: PropiedadesMacrosBadge) {
  const etiqueta = ETIQUETAS_BANDA[banda] ?? 'Verde';
  const ariaLabel = `Macros ${etiqueta.toLowerCase()} con desvío de ${formatearDesvio(desvioPorcentaje)}`;

  const badge = (
    <span
      role="status"
      aria-label={ariaLabel}
      data-testid="macros-badge"
      data-banda={banda}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tabular-nums transition-colors',
        compact ? 'h-5 px-2 text-[10px]' : 'h-6 px-2.5 text-xs',
        CLASES_BANDA[banda],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          PUNTO_BANDA[banda],
        )}
      />
      <span>{formatearDesvio(desvioPorcentaje)}</span>
      {!compact && (
        <span className="opacity-80 font-medium">{etiqueta}</span>
      )}
    </span>
  );

  const tooltip = construirTooltip(
    desvioPorcentaje,
    detalle,
    detallePorMacro,
  );
  if (!tooltip) return badge;

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Color de chip genérico para reutilizar en otras vistas (e.g. sidebar
 * versiones). Útil para mantener coherencia del módulo.
 */
export const MACROS_BADGE_PUNTO = PALETA_PLAN.puntoAcento;
