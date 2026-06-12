import { useEffect, useState } from 'react';
import { Ban, Loader2, FileWarning } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api';



interface MarcarAusenteManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number;
  token: string;
  onConfirmado: () => void | Promise<void>;
}

const MOTIVO_MINIMO = 3;
const MOTIVO_MAXIMO = 500;

export function MarcarAusenteManualModal({
  isOpen,
  onClose,
  turnoId,
  token,
  onConfirmado,
}: MarcarAusenteManualModalProps) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset estado al abrir/cerrar el modal.
  useEffect(() => {
    if (!isOpen) {
      setMotivo('');
      setError(null);
      setEnviando(false);
    }
  }, [isOpen]);

  const motivoLimpio = motivo.trim();
  const motivoValido =
    motivoLimpio.length >= MOTIVO_MINIMO &&
    motivoLimpio.length <= MOTIVO_MAXIMO;

  const confirmar = async () => {
    if (!motivoValido) {
      setError(
        `El motivo debe tener entre ${MOTIVO_MINIMO} y ${MOTIVO_MAXIMO} caracteres.`,
      );
      return;
    }

    try {
      setEnviando(true);
      setError(null);

      await apiRequest<ApiResponse<unknown>>(
        `/turnos/profesional/turnos/${turnoId}/marcar-ausente-manual`,
        {
          method: 'POST',
          token,
          body: { motivo: motivoLimpio },
        },
      );

      toast.success('Turno marcado como ausente.');
      await onConfirmado();
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo marcar el turno como ausente.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(abierto) => {
        if (!abierto && !enviando) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <Ban className="h-5 w-5" />
            Marcar ausente
          </DialogTitle>
          <DialogDescription>
            Registrá el motivo de la ausencia. Quedará asentado en la
            auditoría del turno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="motivo-ausente" required>
              Motivo (mínimo {MOTIVO_MINIMO} caracteres)
            </Label>
            <Textarea
              id="motivo-ausente"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: El socio avisó que no podía asistir por viaje."
              maxLength={MOTIVO_MAXIMO}
              rows={4}
              disabled={enviando}
              required
            />
            <p className="text-xs text-muted-foreground">
              {motivoLimpio.length}/{MOTIVO_MAXIMO} caracteres
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmar()}
            disabled={enviando || !motivoValido}
          >
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            Confirmar ausente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
