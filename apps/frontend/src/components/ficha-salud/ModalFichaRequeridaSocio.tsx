/**
 * Modal bloqueante para socios sin ficha de salud.
 *
 * Se muestra cuando el socio intenta acceder a una vista de turnos
 * (Dashboard, /turnos) sin tener la ficha cargada. Lo redirige a
 * `/turnos/ficha-salud` con un único CTA.
 *
 * El modal no se puede cerrar: sin X, sin Esc, sin click fuera. RB14.
 */

import { Link } from '@tanstack/react-router';
import { FileWarning } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PropiedadesModalFichaRequeridaSocio {
  abierto: boolean;
}

export function ModalFichaRequeridaSocio({
  abierto,
}: PropiedadesModalFichaRequeridaSocio) {
  return (
    <Dialog open={abierto}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(evento) => evento.preventDefault()}
        onPointerDownOutside={(evento) => evento.preventDefault()}
        onInteractOutside={(evento) => evento.preventDefault()}
        data-testid="modal-ficha-requerida-socio"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-600" />
            <DialogTitle>Necesitamos tu ficha de salud</DialogTitle>
          </div>
          <DialogDescription>
            No tenés la ficha de salud cargada. Es obligatoria para poder
            ver y gestionar tus turnos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link to="/turnos/ficha-salud">Ir a cargar mi ficha</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
