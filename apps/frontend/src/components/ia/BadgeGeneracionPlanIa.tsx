/**
 * BadgeGeneracionPlanIa — Chip fijo, persistente, detalle en hover.
 *
 * REQUIERE: debe vivir DENTRO de GeneracionPlanIaProvider (consume del context).
 *
 * DISEÑO:
 *  - Posición: `fixed bottom-6 left-6 z-50` (no choca con BannerConsultaActiva
 *    que vive en `right-6`).
 *  - Estado collapsed (default): chip chico (~210px) con spinner/ícono +
 *    titulo corto. No ocupa espacio vertical relevante.
 *  - Estado hover/focus: expande panel detalle con descripcion, proveedor,
 *    estado, errorMensaje, y un CTA "Ir al plan" si hay socioId.
 *
 * ACCESIBILIDAD:
 *  - role="status" + aria-live="polite" para lectores de pantalla.
 *  - El panel detalle se abre tanto en :hover como en :focus-within
 *    (teclado usable).
 *  - El ícono tiene `aria-hidden`, la info está en texto.
 */

import { useNavigate } from '@tanstack/react-router';
import type { MouseEvent } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useGeneracionPlanIa } from '@/contexts/GeneracionPlanIaContext';
import { useIa } from '@/hooks/useIa';
import type { EstadoGeneracionPlanIaFE, GeneracionPlanIaFE } from '@/types/ia';

const ESTILOS_ESTADO: Record<EstadoGeneracionPlanIaFE, string> = {
  PENDIENTE: 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-200',
  GENERANDO: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200',
  COMPLETADO: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200',
  ERROR: 'border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-200',
  CANCELADO: 'border-slate-500/40 bg-slate-500/15 text-slate-700 dark:text-slate-200',
};

const ETIQUETA_ESTADO: Record<EstadoGeneracionPlanIaFE, string> = {
  PENDIENTE: 'En cola',
  GENERANDO: 'Generando',
  COMPLETADO: 'Listo',
  ERROR: 'Error',
  CANCELADO: 'Cancelado',
};

function obtenerTitulo(g: GeneracionPlanIaFE): string {
  switch (g.estado) {
    case 'PENDIENTE':
      return 'Plan IA en cola';
    case 'GENERANDO':
      return 'Generando plan IA';
    case 'ERROR':
      return 'Generación IA falló';
    case 'CANCELADO':
      return 'Generación cancelada';
    case 'COMPLETADO':
      return 'Plan IA listo';
    default:
      return 'Plan IA';
  }
}

function obtenerDescripcion(g: GeneracionPlanIaFE): string {
  switch (g.estado) {
    case 'PENDIENTE':
      return g.mensajeEstado ?? 'Queda en cola hasta que el proveedor arranque.';
    case 'GENERANDO':
      return g.mensajeEstado ?? 'El plan queda bloqueado durante la generación.';
    case 'ERROR':
      return g.errorMensaje ?? 'El editor vuelve a estar disponible. Intentá de nuevo.';
    case 'CANCELADO':
      return g.errorMensaje ?? 'La generación se canceló. El editor vuelve a estar disponible.';
    case 'COMPLETADO':
      return 'El editor se actualizó con la nueva versión del plan.';
    default:
      return '';
  }
}

export function BadgeGeneracionPlanIa() {
  const { generacionVisible, generacionPlanIa, planBloqueadoPorIa, limpiarGeneracionEspecifica } =
    useGeneracionPlanIa();
  const navigate = useNavigate();
  const { cancelarGeneracionPlanIa } = useIa();

  const generacion = generacionVisible;
  if (!generacion) return null;

  const estaProcesando = generacion.estado === 'PENDIENTE' || generacion.estado === 'GENERANDO';
  const esTerminal =
    generacion.estado === 'COMPLETADO' ||
    generacion.estado === 'ERROR' ||
    generacion.estado === 'CANCELADO';
  const cancelando = cancelarGeneracionPlanIa.isPending;
  const titulo = obtenerTitulo(generacion);
  const descripcion = obtenerDescripcion(generacion);

  const irAlPlan = () => {
    if (generacion.socioId) {
      void navigate({ to: `/profesional/plan/${generacion.socioId}/editar` });
    }
  };

  const manejarCancelar = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!estaProcesando || cancelando) return;

    cancelarGeneracionPlanIa.mutate({
      generacionId: generacion.id,
      socioId: generacion.socioId,
      planAlimentacionId: generacion.planAlimentacionId,
    });
  };

  const cerrar = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    limpiarGeneracionEspecifica();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="badge-generacion-plan-ia"
      className={cn(
        'group fixed bottom-6 left-6 z-50 flex w-[210px] flex-col gap-1.5 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md transition-all duration-200',
        'hover:w-[280px] hover:shadow-2xl focus-within:w-[280px] focus-within:shadow-2xl',
        ESTILOS_ESTADO[generacion.estado],
      )}
    >
      {/* Fila compacta (siempre visible) */}
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background/40">
          {estaProcesando ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : generacion.estado === 'ERROR' ? (
            <AlertCircle className="size-3.5" aria-hidden="true" />
          ) : generacion.estado === 'CANCELADO' ? (
            <XCircle className="size-3.5" aria-hidden="true" />
          ) : generacion.estado === 'COMPLETADO' ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3.5" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
          {titulo}
        </span>
        {estaProcesando ? (
          <button
            type="button"
            onClick={manejarCancelar}
            disabled={cancelando}
            aria-label="Cancelar generación IA"
            className="shrink-0 rounded-md border border-current/20 bg-background/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelando ? 'Cancelando' : 'Cancelar'}
          </button>
        ) : (
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-75">
            {ETIQUETA_ESTADO[generacion.estado]}
          </span>
        )}
        {esTerminal && (
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar aviso"
            className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Panel detalle (solo en hover/focus) */}
      <div
        className={cn(
          'max-h-0 overflow-hidden opacity-0 transition-all duration-200',
          'group-hover:max-h-48 group-hover:opacity-100',
          'group-focus-within:max-h-48 group-focus-within:opacity-100',
        )}
      >
        <p className="border-t border-current/15 pt-1.5 text-[11px] leading-snug opacity-90">
          {descripcion}
        </p>

        <dl className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] opacity-80">
          <dt className="font-semibold uppercase tracking-wide">Proveedor</dt>
          <dd className="truncate text-right">
            {generacion.proveedorActual ?? '—'}
          </dd>
          <dt className="font-semibold uppercase tracking-wide">Bloqueo</dt>
          <dd className="text-right">
            {planBloqueadoPorIa ? 'Editor bloqueado' : 'Editor libre'}
          </dd>
        </dl>

        <div className="mt-2 flex items-center justify-end gap-2">
          {generacion.socioId && (
            <button
              type="button"
              onClick={irAlPlan}
              className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1 text-[10px] font-semibold transition-colors hover:bg-background/90"
            >
              <span>Ir al plan</span>
              <ArrowUpRight className="size-2.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden flag for tests / debugging */}
      <span data-testid="generacion-id-oculto" className="sr-only">
        ID: {generacionPlanIa?.id ?? generacion.id} · socio: {generacion.socioId}
      </span>
    </div>
  );
}
