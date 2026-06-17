import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

interface RevertirCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number | null;
  onSuccess: () => void;
}

interface RevertirCheckinResponse {
  success: boolean;
  estado: string;
}

export function RevertirCheckinModal({
  isOpen,
  onClose,
  turnoId,
  onSuccess,
}: RevertirCheckinModalProps) {
  const { token } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    if (!turnoId || !token) return;

    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      toast.error('El motivo es obligatorio');
      return;
    }

    try {
      setCargando(true);
      await apiRequest<RevertirCheckinResponse>(
        `/turnos/${turnoId}/revertir-checkin`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ motivo: motivoLimpio }),
        },
      );

      toast.success('Check-in revertido. Turno en CONFIRMADO.');
      setMotivo('');
      onSuccess();
      onClose();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al revertir el check-in';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const handleClose = () => {
    if (cargando) return;
    setMotivo('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Revertir Check-in
          </DialogTitle>
          <DialogDescription>
            Esta acción deshace el check-in de este turno y lo vuelve a estado
            CONFIRMADO. Quedará registrada en la auditoría con tu nombre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>¿Estás seguro?</strong> Esta operación queda auditada y solo
            debe usarse cuando se marcó presente al socio equivocado.
          </div>

          <div>
            <label
              htmlFor="revertir-checkin-motivo"
              className="mb-2 block text-sm font-medium"
            >
              Motivo de la reversión
            </label>
            <Textarea
              id="revertir-checkin-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Se marcó presente al socio equivocado por error de DNI"
              rows={3}
              disabled={cargando}
              data-testid="revertir-checkin-motivo"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cargando || !motivo.trim()}
            data-testid="boton-confirmar-revertir-checkin"
          >
            {cargando ? 'Revirtiendo...' : 'Revertir check-in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
