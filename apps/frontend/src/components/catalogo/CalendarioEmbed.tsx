import { useEffect, useState, useCallback, useMemo } from 'react';
import { addHours, isBefore, format } from 'date-fns';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface SlotDisponible {
  fechaHora: string;
  disponible: boolean;
}

export interface DisponibilidadAmpliada {
  nutricionistaId: number;
  duracionMin: number;
  slots: SlotDisponible[];
}

interface CalendarioEmbedProps {
  nutricionistaId: number;
  duracionMin: number;
  onSeleccionarSlot?: (slot: SlotDisponible) => void;
}

function formatHoraLocal(iso: string): string {
  const d = new Date(iso);
  return format(d, 'HH:mm');
}

function formatFechaCompletaLocal(iso: string): string {
  const d = new Date(iso);
  return format(d, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function CalendarioEmbed({
  nutricionistaId,
  duracionMin,
  onSeleccionarSlot,
}: CalendarioEmbedProps) {
  const { token } = useAuth();

  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date>(() =>
    addHours(new Date(), 2),
  );
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fechaMin = useMemo(() => addHours(new Date(), 2), []);

  const cargarSlots = useCallback(
    async (fecha: Date) => {
      if (!token) return;

      try {
        setCargando(true);
        setError(null);

        // El endpoint acepta ?fecha=YYYY-MM-DD (un solo dia). El usuario navega dia por dia con el DatePicker.
        const fechaStr = format(fecha, 'yyyy-MM-dd');

        const response = await apiRequest<ApiResponse<DisponibilidadAmpliada>>(
          `/turnos/socio/profesional/${nutricionistaId}/disponibilidad?fecha=${fechaStr}`,
          { token },
        );

        const data = response.data;
        setSlots(data?.slots ?? []);
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los horarios.';
        setError(mensaje);
        setSlots([]);
      } finally {
        setCargando(false);
      }
    },
    [nutricionistaId, token],
  );

  useEffect(() => {
    if (!fechaSeleccionada) return;
    void cargarSlots(fechaSeleccionada);
  }, [fechaSeleccionada, cargarSlots]);

  const fechaEsMuyPronto = isBefore(fechaSeleccionada, fechaMin);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-orange-500" />
          Disponibilidad
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Turnos de {duracionMin} min · Ventana: 2h a 60 días
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <DatePicker
          date={fechaSeleccionada}
          setDate={(d) => d && setFechaSeleccionada(d)}
          minDate={fechaMin}
          className="w-full max-w-sm"
        />

        {fechaEsMuyPronto && (
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Muy pronto para reservar. Elegí un horario al menos 2h desde ahora.
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {cargando ? (
          <p className="text-sm text-muted-foreground">
            Cargando horarios disponibles...
          </p>
        ) : slots.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto mb-2 h-8 w-8" />
            Este profesional no tiene disponibilidad en los próximos 60 días.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slot) => {
              const horaStr = formatHoraLocal(slot.fechaHora);
              const fechaCompleta = formatFechaCompletaLocal(slot.fechaHora);
              const disponible = slot.disponible;
              return (
                <Button
                  key={fechaCompleta}
                  variant={disponible ? 'outline' : 'ghost'}
                  className="h-auto justify-center py-2 text-sm"
                  disabled={!disponible}
                  onClick={() => onSeleccionarSlot?.(slot)}
                >
                  {disponible ? (
                    horaStr
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="line-through">{horaStr}</span>
                      <span className="text-[10px] text-muted-foreground">Ocupado</span>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {slots.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {slots.filter((s) => s.disponible).length} slots disponibles
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
