import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CalendarRange, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TurnoAfectado {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  socioId: number | null;
  socioNombre: string | null;
}

interface ExcepcionResponse {
  idExcepcion: number;
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
  turnosAfectados?: TurnoAfectado[];
}

interface BloqueoRangoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personaId: number;
  token: string;
}

export function BloqueoRangoModal({
  isOpen,
  onClose,
  onSuccess,
  personaId,
  token,
}: BloqueoRangoModalProps) {
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [motivo, setMotivo] = useState('');
  const [confirmarConTurnosOcupados, setConfirmarConTurnosOcupados] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [turnosAfectados, setTurnosAfectados] = useState<TurnoAfectado[] | null>(null);
  const [enviandoConConfirmacion, setEnviandoConConfirmacion] = useState(false);

  const resetForm = () => {
    setFechaInicio(undefined);
    setFechaFin(undefined);
    setMotivo('');
    setConfirmarConTurnosOcupados(false);
    setTurnosAfectados(null);
    setEnviandoConConfirmacion(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona fecha de inicio y fin.');
      return;
    }

    if (fechaFin <= fechaInicio) {
      toast.error('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }

    try {
      setCargando(true);

      await apiRequest<{
        success: boolean;
        data: ExcepcionResponse;
      }>(`/agenda/${personaId}/excepciones-disponibilidad`, {
        method: 'POST',
        token,
        body: {
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          motivo: motivo.trim() || null,
          confirmarConTurnosOcupados,
        },
      });

      toast.success('Bloqueo por rango creado correctamente.');
      resetForm();
      onSuccess();
    } catch (err) {
      const errorObj = err as {
        status?: number;
        context?: { requiereConfirmacion?: boolean; turnosAfectados?: TurnoAfectado[] };
        message?: string;
      };

      if (
        errorObj?.status === 409 &&
        errorObj?.context?.requiereConfirmacion &&
        errorObj?.context?.turnosAfectados
      ) {
        setTurnosAfectados(errorObj.context.turnosAfectados);
        setEnviandoConConfirmacion(true);
        return;
      }

      const msg =
        err instanceof Error ? err.message : 'Error al crear el bloqueo por rango.';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  const handleReenviarConConfirmacion = async () => {
    setConfirmarConTurnosOcupados(true);
    await handleSubmit();
  };

  const motivoValido = motivo.length <= 255;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-rose-500" />
            Bloquear Rango de Fechas
          </DialogTitle>
          <DialogDescription>
            Bloqueá tu disponibilidad por un período continuo, por ejemplo para
            vacaciones o licencia.
          </DialogDescription>
        </DialogHeader>

        {turnosAfectados && turnosAfectados.length > 0 && enviandoConConfirmacion ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">
                    Hay {turnosAfectados.length} turno(s) reservado(s) en este rango
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Si confirmás, el bloqueo se creará igual y los turnos existentes
                    quedarán como están (no se cancelan automáticamente).
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
              {turnosAfectados.map((t) => (
                <div
                  key={t.idTurno}
                  className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm"
                >
                  <span className="font-medium">
                    {t.fechaTurno.slice(0, 10)} - {t.horaTurno.slice(0, 5)}
                  </span>
                  {t.socioNombre && (
                    <span className="text-muted-foreground">{t.socioNombre}</span>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={cargando}>
                Cancelar
              </Button>
              <Button
                onClick={handleReenviarConConfirmacion}
                disabled={cargando}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bloqueando...
                  </>
                ) : (
                  'Confirmar bloqueo de todos modos'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Fecha inicio
                </Label>
                <DatePicker
                  date={fechaInicio}
                  setDate={setFechaInicio}
                  minDate={new Date()}
                  placeholder="Desde..."
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Fecha fin
                </Label>
                <DatePicker
                  date={fechaFin}
                  setDate={setFechaFin}
                  minDate={fechaInicio || new Date()}
                  placeholder="Hasta..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="motivo"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                Motivo (opcional)
              </Label>
              <Input
                id="motivo"
                placeholder="Ej: Vacaciones, Licencia, Capacitación..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={255}
                className={`transition-all ${!motivoValido ? 'border-rose-500 ring-rose-500' : ''}`}
              />
              <p className="text-xs text-muted-foreground">{motivo.length}/255</p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
              <Checkbox
                id="confirmarConTurnosOcupados"
                checked={confirmarConTurnosOcupados}
                onCheckedChange={(checked) =>
                  setConfirmarConTurnosOcupados(checked === true)
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="confirmarConTurnosOcupados"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Confirmar aunque haya turnos reservados
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si hay turnos ocupados en el rango, se crearán igual y los turnos
                  existentes no se cancelan.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={cargando}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={cargando || !fechaInicio || !fechaFin || !motivoValido}
                className="bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 shadow-md"
              >
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Bloqueando...
                  </>
                ) : (
                  'Bloquear Rango'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
