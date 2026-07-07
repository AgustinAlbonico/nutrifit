/**
 * ResumenMacrosPorDia — Sustituye al anterior widget "Total del plan".
 *
 * Muestra 7 chips (LUN→DOM), cada uno con:
 *  - Label del día abreviado.
 *  - Calorías totales (kcal) — número principal.
 *  - Mini P/C/G debajo.
 *
 * Diseño compacto: fila horizontal con scroll-x en mobile, grid en desktop.
 * Cada chip es independiente → el nutricionista ve rápidamente qué días
 * están bien cargados y cuáles están vacíos o pasados de kcal.
 */

import { Beef, Droplet, Flame, Wheat } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMacrosPorDia, MACROS_VACIOS, ORDEN_DIAS, type MacrosAcumuladas } from '@/hooks/useMacrosPorDia';
import type { EstructuraDiaFE } from '@/types/ia';

interface ResumenMacrosPorDiaProps {
  estructura: EstructuraDiaFE[];
  /** Objetivo de calorías para resaltar días por encima/por debajo. */
  caloriasObjetivo?: number;
  className?: string;
}

const ABREVIACION_DIA: Record<string, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

function formatoKcal(valor: number): string {
  if (valor >= 1000) return `${(valor / 1000).toFixed(1).replace('.0', '')}k`;
  if (valor === 0) return '0';
  return String(valor);
}

/**
 * Banda visual según desvío vs objetivo:
 * - vacío (0 kcal) → "muted" (sin datos)
 * - ±10% objetivo → "ok" (verde)
 * - fuera de ±10% pero dentro ±25% → "warn" (ámbar)
 * - fuera de ±25% → "alert" (rojo)
 */
function obtenerBanda(macros: MacrosAcumuladas, objetivo?: number): 'muted' | 'ok' | 'warn' | 'alert' {
  if (macros.calorias === 0) return 'muted';
  if (!objetivo || objetivo <= 0) return 'ok';
  const desvio = Math.abs(macros.calorias - objetivo) / objetivo;
  if (desvio <= 0.1) return 'ok';
  if (desvio <= 0.25) return 'warn';
  return 'alert';
}

const ESTILOS_BANDA: Record<ReturnType<typeof obtenerBanda>, string> = {
  muted: 'border-border/50 bg-muted/30 text-muted-foreground',
  ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  alert: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

const ESTILOS_LLAMA: Record<ReturnType<typeof obtenerBanda>, string> = {
  muted: 'text-muted-foreground/60',
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  alert: 'text-rose-600 dark:text-rose-400',
};

export function ResumenMacrosPorDia({
  estructura,
  caloriasObjetivo,
  className,
}: ResumenMacrosPorDiaProps) {
  const macrosPorDia = useMacrosPorDia(estructura);

  return (
    <section
      data-testid="resumen-macros-por-dia"
      aria-label="Resumen de macros por día"
      className={cn(
        'rounded-xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Macros por día
        </h3>
        {caloriasObjetivo ? (
          <span className="text-[10px] font-medium text-muted-foreground">
            Objetivo: {caloriasObjetivo} kcal
          </span>
        ) : null}
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {ORDEN_DIAS.map((dia) => {
          const macros = macrosPorDia[dia] ?? MACROS_VACIOS;
          const banda = obtenerBanda(macros, caloriasObjetivo);
          const esVacio = macros.calorias === 0;

          return (
            <article
              key={dia}
              data-testid={`chip-dia-${dia}`}
              className={cn(
                'flex min-w-[88px] flex-col gap-1 rounded-lg border px-2.5 py-2 transition-colors',
                ESTILOS_BANDA[banda],
              )}
            >
              <header className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {ABREVIACION_DIA[dia] ?? dia.slice(0, 3)}
                </span>
                <Flame
                  className={cn('size-3', ESTILOS_LLAMA[banda])}
                  aria-hidden="true"
                />
              </header>

              <div className="flex flex-col">
                <span className="text-base font-bold leading-none tabular-nums">
                  {esVacio ? '—' : formatoKcal(macros.calorias)}
                </span>
                <span className="text-[9px] uppercase tracking-wide opacity-70">
                  kcal
                </span>
              </div>

              <ul className="mt-0.5 flex flex-col gap-0.5 text-[9px] tabular-nums opacity-90">
                <li className="flex items-center gap-1">
                  <Beef className="size-2.5 shrink-0 text-rose-500" aria-hidden="true" />
                  <span className="font-medium">{Math.round(macros.proteinas)}g</span>
                </li>
                <li className="flex items-center gap-1">
                  <Wheat className="size-2.5 shrink-0 text-amber-500" aria-hidden="true" />
                  <span className="font-medium">{Math.round(macros.carbohidratos)}g</span>
                </li>
                <li className="flex items-center gap-1">
                  <Droplet className="size-2.5 shrink-0 text-sky-500" aria-hidden="true" />
                  <span className="font-medium">{Math.round(macros.grasas)}g</span>
                </li>
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
