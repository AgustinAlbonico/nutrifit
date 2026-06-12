import { addHours, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';

import { useSlotsDisponibles } from '@/hooks/useSlotsDisponibles';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarioDisponibilidadProps {
  nutricionistaId: number | null;
  fecha: Date | undefined;
  slotSeleccionado: { horaInicio: string; horaFin: string } | null;
  onFechaChange: (fecha: Date | undefined) => void;
  onSeleccionar: (slot: { horaInicio: string; horaFin: string }) => void;
}

/**
 * Calendario de disponibilidad del nutricionista. Replica el patron
 * visual de `AgendarTurno.tsx` (grid de slots, libres seleccionables,
 * ocupados/pasados deshabilitados).
 *
 * Aplica las reglas de anticipacion del lado del cliente:
 *  - Si la fecha NO es hoy: libre = seleccionable
 *  - Si la fecha es hoy: libre = seleccionable solo si faltan al menos 1h
 *
 * La validacion canonica vive en el backend (helper
 * `ValidacionesCreacionTurno`); este filtro es solo UX.
 */
export function CalendarioDisponibilidad({
  nutricionistaId,
  fecha,
  slotSeleccionado,
  onFechaChange,
  onSeleccionar,
}: CalendarioDisponibilidadProps) {
  const { data: slots, isLoading, error } = useSlotsDisponibles(
    nutricionistaId,
    fecha,
  );

  const slotEstaDisponible = (horaInicio: string): boolean => {
    if (!fecha) return false;

    if (!isToday(fecha)) return true;

    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fechaHoraTurno = new Date(fecha);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);

    return fechaHoraTurno >= addHours(new Date(), 1);
  };

  const motivoNoDisponible = (horaInicio: string): string | null => {
    if (!fecha || !isToday(fecha)) return null;
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const fechaHoraTurno = new Date(fecha);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);
    const ahora = new Date();
    if (fechaHoraTurno <= ahora) return 'Ya paso';
    if (fechaHoraTurno < addHours(ahora, 1)) return 'Muy pronto';
    return null;
  };

  return (
    <div className="space-y-4" data-testid="calendario-disponibilidad">
      <div>
        <DatePicker
          date={fecha}
          setDate={onFechaChange}
          minDate={new Date()}
          className="w-full max-w-sm"
        />
      </div>

      {!nutricionistaId ? (
        <p className="text-sm text-muted-foreground">
          Selecciona un profesional para ver la disponibilidad.
        </p>
      ) : !fecha ? (
        <p className="text-sm text-muted-foreground">
          Selecciona una fecha para ver los horarios.
        </p>
      ) : isLoading ? (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando disponibilidad...
        </div>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          No se pudo cargar la disponibilidad. Intentá nuevamente.
        </p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay horarios para esta fecha.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot) => {
            const estaLibre = slot.estado === 'LIBRE';
            const disponibleParaSeleccion = estaLibre && slotEstaDisponible(slot.horaInicio);
            const motivo = motivoNoDisponible(slot.horaInicio);
            const seleccionado =
              slotSeleccionado?.horaInicio === slot.horaInicio;
            const deshabilitado = !disponibleParaSeleccion;

            return (
              <Button
                key={slot.horaInicio}
                type="button"
                variant={
                  seleccionado
                    ? 'default'
                    : disponibleParaSeleccion
                      ? 'outline'
                      : 'ghost'
                }
                disabled={deshabilitado}
                aria-label={
                  deshabilitado
                    ? `${slot.horaInicio} no disponible`
                    : `Seleccionar ${slot.horaInicio}`
                }
                data-testid={`slot-${slot.horaInicio}`}
                data-estado={slot.estado}
                onClick={() => onSeleccionar(slot)}
                className={cn('h-auto justify-start py-3 text-left')}
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    {slot.horaInicio} - {slot.horaFin}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {!estaLibre
                      ? 'Ocupado'
                      : motivo
                        ? motivo
                        : seleccionado
                          ? 'Seleccionado'
                          : 'Disponible'}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      )}

      {fecha && (
        <p className="text-xs text-muted-foreground">
          Fecha seleccionada: {format(fecha, 'PPP', { locale: es })}
        </p>
      )}
    </div>
  );
}
