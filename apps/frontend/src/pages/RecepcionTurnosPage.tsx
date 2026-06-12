import { useCallback, useEffect, useState } from 'react';
import type { ApiResponse } from '@/types/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipboardCheck, Clock, History } from 'lucide-react';

import type { EstadoTurno } from '@nutrifit/shared';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  obtenerClasesEstadoTurno,
  obtenerEtiquetaEstadoTurno,
  puedeHacerCheckInTurno,
} from '@/lib/turnos/estadoTurno';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RevertirAusenteModal } from '@/components/turnos/RevertirAusenteModal';

interface TurnoRecepcion {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  nombreSocio: string;
  nombreNutricionista: string;
  dniSocio: string;
  llegadaTardeMin?: number | null;
}



export function RecepcionTurnosPage() {
  const { token, rol } = useAuth();

  const esRecepcionista = rol === 'RECEPCIONISTA';
  const esAdmin = rol === 'ADMIN';
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(
    new Date(),
  );
  const [turnos, setTurnos] = useState<TurnoRecepcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] =
    useState<TurnoRecepcion | null>(null);
  const [procesandoCheckIn, setProcesandoCheckIn] = useState(false);
  const [turnoARevertir, setTurnoARevertir] = useState<TurnoRecepcion | null>(null);

  const fecha = format(fechaSeleccionada ?? new Date(), 'yyyy-MM-dd');

  const cargarTurnosDelDia = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCargando(true);

      const response = await apiRequest<ApiResponse<TurnoRecepcion[]>>(
        `/turnos/recepcion/dia?fecha=${fecha}`,
        { token },
      );

      setTurnos(response.data ?? []);
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los turnos del día';
      toast.error(mensaje);
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  }, [token, fecha]);

  useEffect(() => {
    void cargarTurnosDelDia();
  }, [cargarTurnosDelDia]);

  const abrirModalCheckIn = (turno: TurnoRecepcion) => {
    setTurnoSeleccionado(turno);
  };

  const cerrarModalCheckIn = () => {
    setTurnoSeleccionado(null);
  };

  const confirmarCheckIn = async () => {
    if (!token || !turnoSeleccionado) {
      return;
    }

    try {
      setProcesandoCheckIn(true);

      await apiRequest(`/turnos/${turnoSeleccionado.idTurno}/check-in`, {
        method: 'POST',
        token,
      });

      toast.success('Check-in registrado exitosamente');
      cerrarModalCheckIn();
      await cargarTurnosDelDia();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al registrar check-in';
      toast.error(mensaje);
    } finally {
      setProcesandoCheckIn(false);
    }
  };

  const getEstadoBadge = (estado: EstadoTurno) => {
    return (
      <Badge className={obtenerClasesEstadoTurno(estado)}>
        {obtenerEtiquetaEstadoTurno(estado)}
      </Badge>
    );
  };

  const puedeHacerCheckIn = (turno: TurnoRecepcion) => {
    if (!esRecepcionista) return false;
    return puedeHacerCheckInTurno(turno.estadoTurno);
  };

  if (!esRecepcionista && !esAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>Solo para personal de recepción o administración.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ClipboardCheck className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Check-in de Turnos
              </h1>
            </div>
            <p className="text-muted-foreground">
              Registra la llegada de los socios a sus turnos programados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <p className="whitespace-nowrap text-sm text-muted-foreground">Fecha:</p>
            <DatePicker
              date={fechaSeleccionada}
              setDate={setFechaSeleccionada}
              placeholder="Seleccionar fecha"
              className="w-[220px]"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turnos del {fecha}</CardTitle>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay turnos activos para este día.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Hora</th>
                    <th className="text-left p-3 text-sm font-semibold">Socio</th>
                    <th className="text-left p-3 text-sm font-semibold">DNI</th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Nutricionista
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">Estado</th>
                    <th className="text-left p-3 text-sm font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((turno) => (
                    <tr
                      key={turno.idTurno}
                      className="border-b hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{turno.horaTurno}</span>
                          {turno.llegadaTardeMin && turno.llegadaTardeMin > 0 && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Llega {turno.llegadaTardeMin}m tarde
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {turno.nombreSocio}
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {turno.dniSocio || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {turno.nombreNutricionista}
                      </td>
                      <td className="p-3">{getEstadoBadge(turno.estadoTurno)}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {puedeHacerCheckIn(turno) ? (
                            <Button
                              size="sm"
                              onClick={() => abrirModalCheckIn(turno)}
                              className="gap-2"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                              Check-in
                            </Button>
                          ) : turno.estadoTurno === 'AUSENTE' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTurnoARevertir(turno)}
                              className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                              <History className="h-4 w-4" />
                              Revertir
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              No disponible
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(turnoSeleccionado)} onOpenChange={cerrarModalCheckIn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Check-in</DialogTitle>
            <DialogDescription>
              ¿Confirmar la llegada del socio a su turno?
            </DialogDescription>
          </DialogHeader>

          {turnoSeleccionado && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Socio:</span>
                <span className="font-medium">
                  {turnoSeleccionado.nombreSocio}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DNI:</span>
                <span className="font-medium">{turnoSeleccionado.dniSocio || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{turnoSeleccionado.fechaTurno}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hora:</span>
                <span className="font-medium">{turnoSeleccionado.horaTurno}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nutricionista:</span>
                <span className="font-medium">
                  {turnoSeleccionado.nombreNutricionista}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cerrarModalCheckIn}
              disabled={procesandoCheckIn}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarCheckIn} disabled={procesandoCheckIn}>
              {procesandoCheckIn ? 'Procesando...' : 'Confirmar Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RevertirAusenteModal
        isOpen={Boolean(turnoARevertir)}
        onClose={() => setTurnoARevertir(null)}
        turnoId={turnoARevertir?.idTurno ?? null}
        onSuccess={() => {
          setTurnoARevertir(null);
          void cargarTurnosDelDia();
        }}
      />
    </div>
  );
}
