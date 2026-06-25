/**
 * Sidebar/lista de versiones inmutables de un plan de alimentación.
 *
 * Usa `useVersionesPlan(planId)` para cargar la lista (ordenada DESC por
 * numeroVersion en el backend). Click en una versión invoca `onSelect`
 * para que el padre cambie la versión mostrada en pantalla.
 *
 * La versión activa se marca con badge verde distintivo.
 *
 * Accesibilidad:
 * - Lista como `<ul>` con items clickeables que tienen aria-label descriptivo
 * - Badge "Activa" tiene aria-label explícito
 * - Estado de carga y vacío comunicados al lector de pantalla
 */

import {
  CheckCircle2,
  Edit3,
  Loader2,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVersionesPlan } from '@/hooks/useVersionesPlan';
import { cn } from '@/lib/utils';
import type { MotivoCambio, VersionPlanFE } from '@/types/ia';

interface PropiedadesVersionHistory {
  planId: number;
  onSelect?: (versionId: number) => void;
  versionSeleccionadaId?: number | null;
}

const ICONOS_MOTIVO: Record<MotivoCambio, LucideIcon> = {
  creacion_inicial: Sparkles,
  regeneracion_completa: RefreshCw,
  regeneracion_dia: RefreshCw,
  regeneracion_alternativa: RefreshCw,
  edicion_manual: Edit3,
  creacion_inicial_backfill: Sparkles,
};

const ETIQUETAS_MOTIVO: Record<MotivoCambio, string> = {
  creacion_inicial: 'Creación inicial',
  regeneracion_completa: 'Regeneración completa',
  regeneracion_dia: 'Regeneración de día',
  regeneracion_alternativa: 'Regeneración de alternativa',
  edicion_manual: 'Edición manual',
  creacion_inicial_backfill: 'Creación inicial (backfill)',
};

function formatearFecha(iso: string): string {
  try {
    const fecha = new Date(iso);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  } catch {
    return iso;
  }
}

export function VersionHistory({
  planId,
  onSelect,
  versionSeleccionadaId,
}: PropiedadesVersionHistory) {
  const { data: versiones, isLoading, isError, error } = useVersionesPlan(planId);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-6 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando versiones…
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        No se pudieron cargar las versiones:{' '}
        {error instanceof Error ? error.message : 'error desconocido'}
      </div>
    );
  }

  if (!versiones || versiones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Este plan todavía no tiene versiones registradas.
      </div>
    );
  }

  return (
    <nav aria-label="Historial de versiones del plan">
      <ol className="flex flex-col gap-2">
        {versiones.map((version) => (
          <VersionItem
            key={version.idPlanAlimentacionVersion}
            version={version}
            seleccionada={
              versionSeleccionadaId === version.idPlanAlimentacionVersion
            }
            onSelect={onSelect}
          />
        ))}
      </ol>
    </nav>
  );
}

interface PropiedadesVersionItem {
  version: VersionPlanFE;
  seleccionada: boolean;
  onSelect?: (versionId: number) => void;
}

function VersionItem({ version, seleccionada, onSelect }: PropiedadesVersionItem) {
  const Icono =
    version.motivoCambio !== null
      ? ICONOS_MOTIVO[version.motivoCambio]
      : RefreshCw;
  const motivoLabel =
    version.motivoCambio !== null
      ? ETIQUETAS_MOTIVO[version.motivoCambio]
      : 'Sin motivo registrado';

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onSelect?.(version.idPlanAlimentacionVersion)}
        aria-label={`Versión ${version.numeroVersion}: ${motivoLabel}`}
        aria-current={seleccionada ? 'true' : undefined}
        data-testid="version-item"
        data-version-id={version.idPlanAlimentacionVersion}
        data-activa={version.activa}
        className={cn(
          'h-auto w-full justify-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
          seleccionada
            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
            : 'border-border/40 bg-card hover:border-border hover:bg-muted/40',
        )}
      >
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md',
            version.activa
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
          aria-hidden="true"
        >
          <Icono className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">
              v{version.numeroVersion}
            </span>
            {version.activa && (
              <Badge
                aria-label="Versión activa"
                variant="secondary"
                className="gap-1 bg-emerald-500/15 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <CheckCircle2
                  className="size-3"
                  aria-hidden="true"
                />
                Activa
              </Badge>
            )}
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {motivoLabel}
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground/80">
            {formatearFecha(version.createdAt)}
          </span>
        </div>
      </Button>
    </li>
  );
}