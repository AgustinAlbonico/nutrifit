import { FileWarning } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SocioConFicha } from '@/types/asignar-turno';

interface WarningFichaIncompletaProps {
  socio: SocioConFicha;
  className?: string;
}

/**
 * Banner ambar que se muestra al seleccionar un socio sin ficha
 * medica completa, en flujos de RECEPCION y ADMIN.
 *
 * El componente NO se renderiza si `socio.tieneFichaSalud === true`.
 * Para NUTRICIONISTA el bloqueo vive en `BuscadorSocio` (item
 * `disabled`) — este warning es solo no-bloqueante para los otros
 * roles.
 *
 * Accesibilidad:
 *  - `role="status"` + `aria-live="polite"` para que los screen
 *    readers anuncien el mensaje sin interrumpir.
 */
export function WarningFichaIncompleta({ socio, className }: WarningFichaIncompletaProps) {
  if (socio.tieneFichaSalud) {
    return null;
  }

  const nombre =
    socio.nombreCompleto ??
    `${socio.nombre} ${socio.apellido}`.trim();

  return (
    <Alert
      className={`border-amber-300 bg-amber-50/60 ${className ?? ''}`}
      role="status"
      aria-live="polite"
      data-testid="warning-ficha-incompleta"
    >
      <FileWarning className="h-5 w-5 text-amber-600" />
      <AlertTitle>Ficha medica incompleta</AlertTitle>
      <AlertDescription>
        El socio seleccionado ({nombre}) no tiene su ficha medica
        completa. Puede continuar con la reserva, pero recuerdele al
        paciente completarla antes de su consulta.
      </AlertDescription>
    </Alert>
  );
}
