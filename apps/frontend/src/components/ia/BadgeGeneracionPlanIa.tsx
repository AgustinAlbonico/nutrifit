import { AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { GeneracionPlanIaFE } from '@/types/ia';

interface BadgeGeneracionPlanIaProps {
  generacion: GeneracionPlanIaFE | null;
}

const ESTILOS_ESTADO: Record<GeneracionPlanIaFE['estado'], string> = {
  PENDIENTE: 'border-fuchsia-500/30 bg-fuchsia-950/90 text-fuchsia-50 shadow-fuchsia-950/20',
  GENERANDO: 'border-indigo-500/30 bg-indigo-950/90 text-indigo-50 shadow-indigo-950/20',
  COMPLETADO: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-50 shadow-emerald-950/20',
  ERROR: 'border-destructive/40 bg-destructive text-destructive-foreground shadow-destructive/20',
};

export function BadgeGeneracionPlanIa({ generacion }: BadgeGeneracionPlanIaProps) {
  if (!generacion) return null;

  const estaProcesando = generacion.estado === 'PENDIENTE' || generacion.estado === 'GENERANDO';
  const mensaje = obtenerMensaje(generacion);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="badge-generacion-plan-ia"
      className={cn(
        'fixed bottom-6 left-1/2 z-50 flex w-[min(calc(100vw-2rem),440px)] -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md',
        ESTILOS_ESTADO[generacion.estado],
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/12">
        {estaProcesando ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : generacion.estado === 'ERROR' ? (
          <AlertCircle className="size-4" aria-hidden="true" />
        ) : generacion.estado === 'COMPLETADO' ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{mensaje.titulo}</p>
        <p className="truncate text-xs opacity-85">{mensaje.descripcion}</p>
      </div>
    </div>
  );
}

function obtenerMensaje(generacion: GeneracionPlanIaFE): { titulo: string; descripcion: string } {
  if (generacion.estado === 'PENDIENTE') {
    return {
      titulo: 'Generación IA en cola',
      descripcion: generacion.mensajeEstado ?? 'El plan queda bloqueado hasta que empiece la generación.',
    };
  }

  if (generacion.estado === 'GENERANDO') {
    return {
      titulo: 'Generando plan de alimentación',
      descripcion: generacion.proveedorActual
        ? `${generacion.mensajeEstado ?? 'Procesando con IA'} · ${generacion.proveedorActual}`
        : generacion.mensajeEstado ?? 'Procesando con IA',
    };
  }

  if (generacion.estado === 'ERROR') {
    return {
      titulo: 'La generación falló',
      descripcion: generacion.errorMensaje ?? 'El editor vuelve a estar disponible.',
    };
  }

  return {
    titulo: 'Plan generado correctamente',
    descripcion: 'Actualizando el editor con la nueva versión.',
  };
}
