/**
 * Badge visual que representa el desvío de macros de un plan respecto al
 * objetivo nutricional. Tres bandas: verde (cumple ±5%), amarillo (desvío
 * menor ±10%) y rojo (fuera de rango >10%).
 *
 * Al hacer hover muestra un tooltip con el detalle (real vs objetivo).
 *
 * Accesibilidad:
 * - aria-label describe la banda + el porcentaje
 * - role="status" indica estado al lector de pantalla
 * - tooltip navegable por teclado (Radix)
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { BandaMacro } from '@/types/ia';

export interface DetalleMacroBadge {
  real: number;
  objetivo: number;
}

interface PropiedadesMacrosBadge {
  banda: BandaMacro;
  desvioPorcentaje: number;
  detalle?: DetalleMacroBadge;
  className?: string;
}

const ETIQUETAS_BANDA: Record<BandaMacro, string> = {
  VERDE: 'Cumple',
  AMARILLO: 'Desvío menor',
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

export function MacrosBadge({
  banda,
  desvioPorcentaje,
  detalle,
  className,
}: PropiedadesMacrosBadge) {
  const etiqueta = ETIQUETAS_BANDA[banda];
  const ariaLabel = `Macros ${etiqueta.toLowerCase()} con desvío de ${formatearDesvio(desvioPorcentaje)}`;

  const badgeBadge = (
    <Badge
      role="status"
      aria-label={ariaLabel}
      data-testid="macros-badge"
      data-banda={banda}
      className={cn(
        'cursor-default gap-1.5 border font-semibold tabular-nums transition-colors',
        CLASES_BANDA[banda],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-full', PUNTO_BANDA[banda])}
      />
      <span>{etiqueta}</span>
      <span className="opacity-80">({formatearDesvio(desvioPorcentaje)})</span>
    </Badge>
  );

  if (!detalle) {
    return badgeBadge;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeBadge}</TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-medium">{etiqueta}</p>
          <p className="text-xs opacity-80">
            Real: {detalle.real} · Objetivo: {detalle.objetivo}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}