import { AlertTriangle, CheckCircle2, Circle, CircleSlash, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EtapaConsulta, IdEtapaConsulta } from '@/types/consulta';

interface PropiedadesIndicadorEtapasConsulta {
  etapas: EtapaConsulta[];
  etapaActiva: IdEtapaConsulta;
  onCambiarEtapa: (etapa: IdEtapaConsulta) => void;
}

const iconosEstado = {
  completa: CheckCircle2,
  error: AlertTriangle,
  omitida: CircleSlash,
  bloqueada: Lock,
  pendiente: Circle,
};

export function IndicadorEtapasConsulta({
  etapas,
  etapaActiva,
  onCambiarEtapa,
}: PropiedadesIndicadorEtapasConsulta) {
  return (
    <nav
      aria-label="Etapas de consulta"
      className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm"
    >
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {etapas.map((etapa, indice) => {
          const Icono = iconosEstado[etapa.estado];
          const activa = etapa.id === etapaActiva;
          const bloqueada = etapa.estado === 'bloqueada';

          return (
            <li key={etapa.id}>
              <Button
                type="button"
                variant="ghost"
                disabled={bloqueada}
                aria-current={activa ? 'step' : undefined}
                onClick={() => onCambiarEtapa(etapa.id)}
                className={cn(
                  'h-auto w-full justify-start gap-3 rounded-xl border p-3 text-left transition-all',
                  activa
                    ? 'border-primary/40 bg-primary/10 shadow-sm'
                    : 'border-transparent hover:border-border hover:bg-muted/60',
                  etapa.estado === 'error' && 'border-destructive/30 bg-destructive/5',
                  bloqueada && 'opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    etapa.estado === 'completa' &&
                      'border-emerald-200 bg-emerald-50 text-emerald-700',
                    etapa.estado === 'error' &&
                      'border-destructive/30 bg-destructive/10 text-destructive',
                    etapa.estado === 'omitida' &&
                      'border-slate-200 bg-slate-50 text-slate-500',
                    etapa.estado === 'pendiente' &&
                      'border-amber-200 bg-amber-50 text-amber-700',
                    etapa.estado === 'bloqueada' &&
                      'border-muted bg-muted text-muted-foreground',
                  )}
                >
                  <Icono className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-sm font-semibold">
                    {indice + 1}. {etapa.titulo}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {etapa.descripcion}
                  </span>
                </span>
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
