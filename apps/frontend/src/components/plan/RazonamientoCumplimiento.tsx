/**
 * Panel colapsable que muestra el razonamiento de cumplimiento de restricciones
 * de un plan generado por IA.
 *
 * Props:
 * - razonamiento: { restriccionesCumplidas, restriccionesNoCumplidas }
 *
 * Modo readOnly: oculta interactividad (por ejemplo, en `MiPlanPage` del socio).
 *
 * Accesibilidad:
 * - CollapsibleTrigger es un botón real (no div con onClick)
 * - restriccionesNoCumplidas se anuncian con role="alert" en cada item
 * - Listas semánticas con `<ul>` / `<li>`
 * - Contraste cumple WCAG AA (verde / rojo con suficiente contraste)
 */

import { Check, ChevronDown, X } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { RazonamientoCumplimientoFE } from '@/types/ia';

interface PropiedadesRazonamientoCumplimiento {
  razonamiento: RazonamientoCumplimientoFE;
  readOnly?: boolean;
  /** Default: abierto (true). Útil para "expandido por defecto" en vista NUT. */
  defaultOpen?: boolean;
}

export function RazonamientoCumplimiento({
  razonamiento,
  readOnly = false,
  defaultOpen = true,
}: PropiedadesRazonamientoCumplimiento) {
  const cumplidas = razonamiento.restriccionesCumplidas;
  const noCumplidas = razonamiento.restriccionesNoCumplidas;
  const total = cumplidas.length + noCumplidas.length;

  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        No se evaluaron restricciones para este plan.
      </div>
    );
  }

  return (
    <Collapsible
      defaultOpen={defaultOpen}
      disabled={readOnly}
      className="rounded-lg border border-border/50 bg-card"
    >
      <CollapsibleTrigger
        className={cn(
          'px-4 py-3',
          readOnly && 'cursor-default hover:bg-transparent',
        )}
        aria-label={`Razonamiento de cumplimiento: ${cumplidas.length} cumplidas, ${noCumplidas.length} no cumplidas`}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
              <Check
                className="size-4"
                aria-hidden="true"
              />
              {cumplidas.length} cumplidas
            </span>
            {noCumplidas.length > 0 && (
              <span className="flex items-center gap-1.5 font-semibold text-red-700 dark:text-red-300">
                <X className="size-4" aria-hidden="true" />
                {noCumplidas.length} no cumplidas
              </span>
            )}
          </div>
          {!readOnly && (
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200"
              aria-hidden="true"
            />
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col gap-4 border-t border-border/40 px-4 py-3">
          {cumplidas.length > 0 && (
            <section aria-labelledby="razonamiento-cumplidas-titulo">
              <h4
                id="razonamiento-cumplidas-titulo"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
              >
                <Check className="size-3.5" aria-hidden="true" />
                Restricciones cumplidas
              </h4>
              <ul className="flex flex-col gap-2">
                {cumplidas.map((item, idx) => (
                  <li
                    key={`${item.restriccion}-${idx}`}
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-emerald-900 dark:text-emerald-100">
                      {item.restriccion}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      {item.detalle}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {noCumplidas.length > 0 && (
            <section aria-labelledby="razonamiento-nocumplidas-titulo">
              <h4
                id="razonamiento-nocumplidas-titulo"
                className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300"
              >
                <X className="size-3.5" aria-hidden="true" />
                Restricciones no cumplidas
              </h4>
              <ul className="flex flex-col gap-2">
                {noCumplidas.map((item, idx) => (
                  <li
                    key={`${item.restriccion}-${idx}`}
                    role="alert"
                    className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-red-900 dark:text-red-100">
                      {item.restriccion}
                      {item.comida && (
                        <span className="ml-1 text-xs font-normal text-red-700/80 dark:text-red-300/80">
                          en {item.comida}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-red-800/80 dark:text-red-200/80">
                      {item.detalle}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}