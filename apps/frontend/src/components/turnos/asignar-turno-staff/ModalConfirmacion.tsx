import { AlertTriangle, FileWarning, Loader2 } from 'lucide-react';

import type { SocioConFicha, NutricionistaActivo } from '@/types/asignar-turno';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatearFechaArgentinaCorta } from '@/lib/fechasArgentina';

interface ModalConfirmacionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  socio: SocioConFicha | null;
  nutricionista: NutricionistaActivo | null;
  fechaTurno: string;
  horaTurno: string;
  /** Warning opcional devuelto por el backend (ej. 'socio_sin_ficha'). */
  warning?: 'socio_sin_ficha' | null;
  /** Error 400 del backend con `FICHA_INCOMPLETA` para nutri. */
  errorFichaIncompleta?: string | null;
  /** En true muestra el spinner en el boton de confirmar. */
  enviando: boolean;
}

/**
 * Modal de confirmacion del turno. Muestra el resumen del turno
 * (socio, nutricionista, fecha, hora) y dos tipos de alerta:
 *  - Ambar no-bloqueante: warning del backend (socio sin ficha
 *    completa, solo para RECEPCION/ADMIN).
 *  - Roja bloqueante: error 400 del backend cuando la ficha esta
 *    incompleta (defensa en profundidad para el flujo de nutri).
 */
export function ModalConfirmacion({
  open,
  onClose,
  onConfirm,
  socio,
  nutricionista,
  fechaTurno,
  horaTurno,
  warning,
  errorFichaIncompleta,
  enviando,
}: ModalConfirmacionProps) {
  const nombreSocio =
    socio?.nombreCompleto ??
    (socio ? `${socio.nombre} ${socio.apellido}`.trim() : '');
  const nombreNutri =
    nutricionista?.nombreCompleto ??
    (nutricionista
      ? `${nutricionista.nombre} ${nutricionista.apellido}`.trim()
      : '');

  return (
    <Dialog open={open} onOpenChange={(estaAbierto) => !estaAbierto && onClose()}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-confirmacion">
        <DialogHeader>
          <DialogTitle>Confirmar turno</DialogTitle>
          <DialogDescription>
            Revisa los datos del turno antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paciente:</span>
            <span className="font-medium">{nombreSocio || '-'}</span>
          </div>
          {socio?.dni && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">DNI:</span>
              <span className="font-medium">{socio.dni}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Profesional:</span>
            <span className="font-medium">{nombreNutri || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">
              {formatearFechaArgentinaCorta(fechaTurno) || fechaTurno}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hora:</span>
            <span className="font-medium">{horaTurno} hs</span>
          </div>
        </div>

        {warning === 'socio_sin_ficha' && (
          <Alert
            className="border-amber-300 bg-amber-50/60"
            role="status"
            aria-live="polite"
            data-testid="modal-warning-ficha"
          >
            <FileWarning className="h-5 w-5 text-amber-600" />
            <AlertTitle>Ficha medica incompleta</AlertTitle>
            <AlertDescription>
              El paciente no completo su ficha medica. Recordale que
              la complete antes de la consulta.
            </AlertDescription>
          </Alert>
        )}

        {errorFichaIncompleta && (
          <Alert
            variant="destructive"
            role="alert"
            aria-live="assertive"
            data-testid="modal-error-ficha"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>No se puede agendar el turno</AlertTitle>
            <AlertDescription>{errorFichaIncompleta}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={enviando}
            data-testid="boton-cancelar-modal"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={enviando || Boolean(errorFichaIncompleta)}
            data-testid="boton-confirmar-modal"
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
          >
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar turno'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
