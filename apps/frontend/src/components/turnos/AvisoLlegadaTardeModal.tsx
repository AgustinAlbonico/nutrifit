import { useState } from 'react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface AvisoLlegadaTardeModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnoId: number | null;
  onSuccess: () => void;
}

export function AvisoLlegadaTardeModal({
  isOpen,
  onClose,
  turnoId,
  onSuccess,
}: AvisoLlegadaTardeModalProps) {
  const { token } = useAuth();
  const [minutos, setMinutos] = useState('10');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async () => {
    if (!turnoId || !token) return;
    
    const min = parseInt(minutos, 10);
    if (isNaN(min) || min < 1 || min > 30) {
      toast.error('Ingresá un valor entre 1 y 30 minutos');
      return;
    }

    try {
      setCargando(true);
      await apiRequest(`/turnos/socio/${turnoId}/aviso-llegada-tarde`, {
        method: 'POST',
        token,
        body: { minutosTarde: min },
      });
      toast.success('Aviso enviado a recepción');
      setMinutos('10');
      onSuccess();
      onClose();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al avisar tardanza';
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aviso de llegada tarde</DialogTitle>
          <DialogDescription>
            Si tenés una demora, avisanos para mantener tu lugar. Recordá que la tolerancia máxima es de 30 minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="mb-2 block text-sm font-medium">¿Cuántos minutos estimás demorar?</label>
          <Input
            type="number"
            min="1"
            max="30"
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            disabled={cargando}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={cargando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={cargando || !minutos}>
            {cargando ? 'Enviando...' : 'Avisar tardanza'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
