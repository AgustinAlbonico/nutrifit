/**
 * Modal de consentimiento RGPD para la ficha de salud.
 *
 * Contenido: 3 párrafos en lenguaje claro que explican:
 * 1. Qué información se almacena.
 * 2. Quién accede a ella (socio, nutricionistas con turno, NO RECEPCIONISTA).
 * 3. Cómo ejercer derechos ARCO.
 *
 * Accesibilidad:
 * - shadcn `<Dialog>` provee focus trap, `role="dialog"`, cierre con Esc.
 * - `aria-labelledby` apunta al título; `aria-describedby` al cuerpo.
 * - El botón "Aceptar" es el primario (autofocus para que Enter confirme).
 *
 * RBs: RB44.
 */

import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFechaCorta } from '@/lib/fechas';

interface PropiedadesModalConsentimiento {
  open: boolean;
  onClose: () => void;
  onAceptar: () => void;
  fechaConsentimiento?: Date | string | null;
}

export function FichaSaludConsentimientoModal({
  open,
  onClose,
  onAceptar,
  fechaConsentimiento,
}: PropiedadesModalConsentimiento) {
  const manejarAceptar = () => {
    onAceptar();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>
              Consentimiento para almacenar tu ficha de salud
            </span>
          </DialogTitle>
          <DialogDescription>
            Tu información de salud es confidencial. Por favor, leé los
            siguientes puntos antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground/90">
          <p>
            Almacenamos los datos que cargás en tu ficha de salud (datos
            antropométricos, alergias, patologías declaradas, medicación,
            hábitos y contacto de emergencia) para que tu nutricionista pueda
            armar un plan adecuado y dar seguimiento a tu evolución.
          </p>
          <p>
            Solo vos y los nutricionistas con quienes tengas turnos previos
            pueden ver tu ficha. El personal de recepción y otros roles del
            gimnasio no tienen acceso a datos clínicos. Toda la información
            queda asociada a tu cuenta y al gimnasio donde la cargaste.
          </p>
          <p>
            Podés ejercer tus derechos de acceso, rectificación,
            cancelación y oposición (ARCO) escribiendo a la administración
            del gimnasio. Si decidís no continuar, podés pedir la baja de tu
            ficha y dejaremos de utilizarla para nuevas recomendaciones.
          </p>
          {fechaConsentimiento && (
            <p
              className="rounded-md border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800"
              role="status"
            >
              Expresaste tu consentimiento el{' '}
              <strong>{formatFechaCorta(fechaConsentimiento)}</strong>.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={manejarAceptar}
            data-testid="boton-aceptar-consentimiento"
          >
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
