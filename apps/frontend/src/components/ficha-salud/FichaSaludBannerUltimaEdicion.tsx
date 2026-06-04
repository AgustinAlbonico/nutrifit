/**
 * Banner que muestra cuándo fue la última edición de la ficha de salud.
 * Solo se renderiza en modo edición (cuando la ficha ya está completada).
 *
 * Accesibilidad:
 * - `role="status"` y `aria-live="polite"` para que los lectores de pantalla
 *   anuncien el cambio sin interrumpir.
 * - `aria-label` redundante para describir el banner en una sola lectura.
 * - Contraste de color ámbar suave verificado para AA.
 *
 * RBs: RB15, RB42.
 */

import { CalendarClock } from 'lucide-react';

import { formatFechaCorta } from '@/lib/fechas';
import { cn } from '@/lib/utils';

interface PropiedadesBannerUltimaEdicion {
  fecha: Date | string | null;
  className?: string;
}

export function FichaSaludBannerUltimaEdicion({
  fecha,
  className,
}: PropiedadesBannerUltimaEdicion) {
  const fechaFormateada = formatFechaCorta(fecha);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Fecha de la última edición: ${fechaFormateada}`}
      className={cn(
        'flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-800',
        className,
      )}
    >
      <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium">Última edición:</span>{' '}
        <span data-testid="fecha-ultima-edicion">{fechaFormateada}</span>
      </p>
    </div>
  );
}
