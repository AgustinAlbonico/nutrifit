import { useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

interface RevertirAusenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number | null;
  onSuccess: () => void;
}

interface RevertirResponse {
  success: boolean;
  estadoFinal: 'PROGRAMADO' | 'PRESENTE' | 'EN_CURSO' | 'REALIZADO' | 'AUSENTE' | 'CANCELADO';
  hizoCheckIn: boolean;
}

export function RevertirAusenteModal({
  isOpen,
  onClose,
  turnoId,
  onSuccess,
}: RevertirAusenteModalProps) {
  const { token } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [minutosTarde, setMinutosTarde] = useState('');
  const [cargando, setCargando] = useState(false);

  const quiereCheckIn = minutosTarde.trim() !== '';

  const handleSubmit = async () => {
    if (!turnoId || !token) return;

    if (!motivo.trim()) {
      toast.error('El motivo es obligatorio');
      return;
    }

    let minutos: number | undefined;
    if (quiereCheckIn) {
      const parsed = Number(minutosTarde);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
        toast.error('Los minutos tarde deben ser un entero entre 1 y 30');
        return;
      }
      minutos = parsed;
    }

    try {
      setCargando(true);
      const response = await apiRequest<RevertirResponse>(
        `/turnos/${turnoId}/revertir-ausente`,
        {
          method: 'PATCH',
          token,
          body: JSON.stringify({
            motivoReversion: motivo,
            ...(minutos !== undefined ? { llegadaTardeMin: minutos } : {}),
          }),
        },
      );

      if (response.hizoCheckIn) {
        toast.success(
          `Turno revertido y check-in registrado (${minutos} min tarde)`,
        );
      } else {
        toast.success('Estado ausente revertido. Turno en PROGRAMADO.');
      }

      setMotivo('');
      setMinutosTarde('');
      onSuccess();
      onClose();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al revertir ausente';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revertir Estado Ausente</DialogTitle>
          <DialogDescription>
            El socio llegó al gimnasio pero el sistema lo marcó como ausente.
            Elegí qué hacer: revertir a PROGRAMADO o revertir y registrar el
            check-in directo con los minutos tarde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Motivo de reversión
            </label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: El socio avisó por WhatsApp que llegaba tarde"
              rows={3}
              disabled={cargando}
            />
          </div>

          <div>
            <Label
              htmlFor="revertir-minutos-tarde"
              className="mb-2 block text-sm font-medium"
            >
              Minutos tarde (opcional)
            </Label>
            <Input
              id="revertir-minutos-tarde"
              type="number"
              min={1}
              max={30}
              value={minutosTarde}
              onChange={(e) => setMinutosTarde(e.target.value)}
              placeholder="Dejar vacío para solo revertir"
              disabled={cargando}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Si completás este campo, el turno vuelve a PRESENTE con check-in
              registrado en una sola acción. Rango válido: 1 a 30.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={cargando || !motivo.trim()}>
            {cargando
              ? 'Guardando...'
              : quiereCheckIn
                ? 'Revertir y check-in'
                : 'Revertir a PROGRAMADO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
