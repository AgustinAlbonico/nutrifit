import { CheckCircle2, Lock, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PALETA_ESTADO } from '@/components/plan/paleta';
import { cn } from '@/lib/utils';
import type { EstadoPlanVisual } from '@/components/plan/estado-plan.types';

interface PropiedadesEstadoPlanBadge {
  /** Estado computado del plan (derivar con `derivarEstadoPlan`). */
  estado: EstadoPlanVisual;
  /** Clases Tailwind adicionales para composición con contenedor padre. */
  className?: string;
}

const ICONO_POR_ESTADO: Record<
  EstadoPlanVisual,
  typeof CheckCircle2
> = {
  ACTIVO: CheckCircle2,
  BORRADOR: Sparkles,
  FINALIZADO: Lock,
};

const ETIQUETA_POR_ESTADO: Record<EstadoPlanVisual, string> = {
  ACTIVO: 'Activo',
  BORRADOR: 'Borrador',
  FINALIZADO: 'Finalizado',
};

export function EstadoPlanBadge({
  estado,
  className,
}: PropiedadesEstadoPlanBadge) {
  const paleta = PALETA_ESTADO[estado.toLowerCase() as keyof typeof PALETA_ESTADO];
  const Icono = ICONO_POR_ESTADO[estado];
  const etiqueta = ETIQUETA_POR_ESTADO[estado];

  return (
    <Badge
      role="status"
      aria-label={`Plan ${etiqueta.toLowerCase()}`}
      data-testid={`plan-estado-badge-${estado.toLowerCase()}`}
      className={cn(
        'gap-1 border font-medium',
        paleta.fondo,
        paleta.texto,
        paleta.borde,
        className,
      )}
    >
      <Icono className="size-3" aria-hidden="true" />
      {etiqueta}
    </Badge>
  );
}
