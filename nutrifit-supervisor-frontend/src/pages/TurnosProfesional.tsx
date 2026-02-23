import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';
import { 
  CalendarX2, 
  Loader2, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  PlayCircle,
  ShieldBan,
  CalendarDays,
  Users
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';

interface AgendaSlot {
  horaInicio: string;
  horaFin: string;
  estado:
    | 'LIBRE'
    | 'PENDIENTE'
    | 'CONFIRMADO'
    | 'CANCELADO'
    | 'REALIZADO'
    | 'AUSENTE'
    | 'REPROGRAMADO'
    | 'BLOQUEADO'
    | 'PRESENTE';
  turnoId?: number;
  socio?: {
    nombre: string;
    dni: string;
  };
}

interface NutricionistaListado {
  idPersona: number;
  nombre: string;
  apellido: string;
  activo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function TurnosProfesional() {
  const { token, rol, personaId } = useAuth();
  const navigate = useNavigate();
  const esNutricionista = rol === 'NUTRICIONISTA';
  const esAdmin = rol === 'ADMIN';

  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(
    new Date(),
  );
  const [slots, setSlots] = useState<AgendaSlot[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  const [nutricionistas, setNutricionistas] = useState<NutricionistaListado[]>([]);
  const [nutricionistaSeleccionadoId, setNutricionistaSeleccionadoId] = useState<
    number | null
  >(null);
  const [cargandoNutricionistas, setCargandoNutricionistas] = useState(false);

  const fecha = format(fechaSeleccionada ?? new Date(), 'yyyy-MM-dd');

  const nutricionistaSeleccionado = useMemo(() => {
    if (!nutricionistaSeleccionadoId) {
      return null;
    }

    return (
      nutricionistas.find(
        (nutricionista) => nutricionista.idPersona === nutricionistaSeleccionadoId,
      ) ?? null
    );
  }, [nutricionistas, nutricionistaSeleccionadoId]);

  const cargarNutricionistas = useCallback(async () => {
    if (!token || !esAdmin) {
      return;
    }

    try {
      setCargandoNutricionistas(true);

      const response = await apiRequest<ApiResponse<NutricionistaListado[]>>(
        '/profesional',
        { token },
      );

      const nutricionistasActivos = (response.data ?? []).filter(
        (nutricionista) => nutricionista.activo,
      );

      setNutricionistas(nutricionistasActivos);

      setNutricionistaSeleccionadoId((valorActual) => {
        if (
          valorActual &&
          nutricionistasActivos.some(
            (nutricionista) => nutricionista.idPersona === valorActual,
          )
        ) {
          return valorActual;
        }

        return nutricionistasActivos[0]?.idPersona ?? null;
      });
    } catch {
      toast.error('No se pudo cargar la lista de nutricionistas.');
      setNutricionistas([]);
      setNutricionistaSeleccionadoId(null);
    } finally {
      setCargandoNutricionistas(false);
    }
  }, [token, esAdmin]);

  useEffect(() => {
    if (!esAdmin) {
      setNutricionistas([]);
      setNutricionistaSeleccionadoId(null);
      return;
    }

    void cargarNutricionistas();
  }, [esAdmin, cargarNutricionistas]);

  const cargarDisponibilidad = useCallback(async () => {
    if (!token) {
      return;
    }

    const profesionalId = esNutricionista ? personaId : nutricionistaSeleccionadoId;

    if (!profesionalId) {
      setSlots([]);
      return;
    }

    try {
      setCargando(true);

      const rutaDisponibilidad = esAdmin
        ? `/turnos/admin/profesional/${profesionalId}/disponibilidad?fecha=${fecha}`
        : `/turnos/profesional/${profesionalId}/disponibilidad?fecha=${fecha}`;

      const response = await apiRequest<ApiResponse<AgendaSlot[]>>(
        rutaDisponibilidad,
        { token },
      );

      setSlots(response.data ?? []);
    } catch {
      toast.error('No se pudo cargar la disponibilidad del día.');
      setSlots([]);
    } finally {
      setCargando(false);
    }
  }, [token, esNutricionista, personaId, nutricionistaSeleccionadoId, esAdmin, fecha]);

  useEffect(() => {
    void cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  const bloquearTurno = async (hora: string) => {
    if (!token || !personaId || !esNutricionista) {
      return;
    }

    try {
      setProcesando(hora);
      await apiRequest(`/turnos/profesional/${personaId}/bloquear`, {
        method: 'POST',
        token,
        body: {
          fecha,
          horaTurno: hora,
        },
      });
      toast.success('Turno bloqueado exitosamente.');
      await cargarDisponibilidad();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al bloquear turno';
      toast.error(msg);
    } finally {
      setProcesando(null);
    }
  };

  const desbloquearTurno = async (turnoId: number) => {
    if (!token || !personaId || !esNutricionista) {
      return;
    }

    try {
      setProcesando(`id-${turnoId}`);
      await apiRequest(`/turnos/profesional/${personaId}/${turnoId}/desbloquear`, {
        method: 'PATCH',
        token,
      });
      toast.success('Turno desbloqueado exitosamente.');
      await cargarDisponibilidad();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al desbloquear turno';
      toast.error(msg);
    } finally {
      setProcesando(null);
    }
  };

  const getEstadoBadge = (estado: AgendaSlot['estado']) => {
    switch (estado) {
      case 'REALIZADO':
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Realizado
          </Badge>
        );
      case 'PENDIENTE':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200">
            <Clock className="mr-1 h-3 w-3" /> Pendiente
          </Badge>
        );
      case 'CONFIRMADO':
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmado
          </Badge>
        );
      case 'PRESENTE':
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <User className="mr-1 h-3 w-3" /> Presente
          </Badge>
        );
      case 'CANCELADO':
      case 'AUSENTE':
      case 'BLOQUEADO':
        return (
          <Badge className="border-rose-200 bg-rose-100 text-rose-800 hover:bg-rose-200">
            <XCircle className="mr-1 h-3 w-3" />{' '}
            {estado.charAt(0) + estado.slice(1).toLowerCase()}
          </Badge>
        );
      case 'LIBRE':
        return (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          >
            Libre
          </Badge>
        );
      case 'REPROGRAMADO':
        return (
          <Badge className="border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200">
            Reprogramado
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (!esNutricionista && !esAdmin) {
    return (
      <div className="mx-auto max-w-7xl pb-10">
        <Card className="rounded-2xl border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="bg-rose-50/50 pt-8">
            <CardTitle className="text-2xl text-rose-600">Acceso denegado</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-muted-foreground">
              Solo para nutricionistas o administración.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-orange-500" />
              Gestión de Turnos
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              {esNutricionista
                ? 'Administra la disponibilidad y turnos del día.'
                : 'Consulta la agenda diaria de los nutricionistas.'}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {esAdmin && (
              <div className="w-full sm:w-[280px]">
                <label htmlFor="nutricionista-select" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nutricionista
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    id="nutricionista-select"
                    className="flex h-10 w-full appearance-none rounded-xl border border-input bg-background py-2 pl-10 pr-8 text-sm outline-none ring-offset-background transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={nutricionistaSeleccionadoId ?? ''}
                    onChange={(event) =>
                      setNutricionistaSeleccionadoId(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                    disabled={cargandoNutricionistas || nutricionistas.length === 0}
                  >
                    {nutricionistas.length === 0 ? (
                      <option value="">Sin nutricionistas activos</option>
                    ) : (
                      nutricionistas.map((nutricionista) => (
                        <option
                          key={nutricionista.idPersona}
                          value={nutricionista.idPersona}
                        >
                          {nutricionista.nombre} {nutricionista.apellido}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

            <div className="w-full sm:w-[220px]">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha de agenda
              </span>
              <DatePicker
                date={fechaSeleccionada}
                setDate={setFechaSeleccionada}
                placeholder="Seleccionar fecha"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg ring-1 ring-border/50">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 to-rose-500" />
        <CardHeader className="border-b bg-slate-50/50 pb-6 pt-8">
          <CardTitle className="flex items-center text-xl font-bold">
            <CalendarDays className="mr-3 h-6 w-6 text-orange-500" />
            Agenda del {format(fechaSeleccionada ?? new Date(), 'dd/MM/yyyy')}
            {esAdmin && nutricionistaSeleccionado ? (
              <span className="ml-2 font-normal text-muted-foreground">
                | {nutricionistaSeleccionado.nombre}{' '}
                {nutricionistaSeleccionado.apellido}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {esAdmin && cargandoNutricionistas ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">
                Cargando profesionales...
              </p>
            </div>
          ) : esAdmin && nutricionistas.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No hay nutricionistas activos para consultar.
              </p>
            </div>
          ) : esAdmin && !nutricionistaSeleccionadoId ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed text-center">
              <User className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Selecciona un profesional para ver sus turnos.
              </p>
            </div>
          ) : cargando ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="animate-pulse text-sm font-medium text-muted-foreground">
                Cargando disponibilidad...
              </p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex min-h-[300px] animate-in zoom-in-95 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center duration-500">
              <div className="mb-4 rounded-full bg-orange-100 p-4 shadow-inner">
                <CalendarX2 className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-800">
                Sin turnos disponibles
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {esNutricionista
                  ? 'No hay horarios configurados o disponibles para este día. Asegúrate de revisar tu configuración de agenda semanal.'
                  : 'El profesional seleccionado no tiene configurada disponibilidad para esta fecha.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {slots.map((slot) => {
                const turnoIdBloqueado =
                  typeof slot.turnoId === 'number' ? slot.turnoId : null;

                return (
                  <div
                    key={slot.horaInicio}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
                      slot.estado === 'BLOQUEADO'
                        ? 'border-rose-100 bg-rose-50/30'
                        : slot.estado === 'LIBRE'
                          ? 'border-slate-200'
                          : 'border-blue-100 bg-blue-50/20'
                    }`}
                  >
                    {slot.estado !== 'LIBRE' && (
                      <div
                        className={`absolute bottom-0 left-0 top-0 w-1.5 ${
                          slot.estado === 'BLOQUEADO' ||
                          slot.estado === 'CANCELADO' ||
                          slot.estado === 'AUSENTE'
                            ? 'bg-rose-400'
                            : slot.estado === 'REALIZADO'
                              ? 'bg-emerald-400'
                              : slot.estado === 'PENDIENTE'
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                        }`}
                      />
                    )}

                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xl font-bold tracking-tight">
                          {slot.horaInicio}
                        </span>
                      </div>
                      {getEstadoBadge(slot.estado)}
                    </div>

                    <div className="mb-5 min-h-[3.5rem] flex-1 text-sm">
                      {slot.socio ? (
                        <div className="flex flex-col space-y-1 rounded-xl bg-background/60 p-3 shadow-sm ring-1 ring-border/50">
                          <span className="font-semibold">{slot.socio.nombre}</span>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <User className="mr-1 h-3 w-3" />
                            DNI: {slot.socio.dni}
                          </span>
                        </div>
                      ) : slot.estado === 'BLOQUEADO' ? (
                        <div className="flex items-center pt-2 text-muted-foreground">
                          <ShieldBan className="mr-2 h-4 w-4" />
                          <span className="italic">Horario no disponible</span>
                        </div>
                      ) : (
                        <div className="flex items-center pt-2 font-medium text-emerald-600">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          <span>Espacio disponible</span>
                        </div>
                      )}
                    </div>

                    {esNutricionista && (
                      <div className="mt-auto flex gap-2">
                        {slot.estado === 'LIBRE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => void bloquearTurno(slot.horaInicio)}
                            disabled={Boolean(procesando)}
                          >
                            {procesando === slot.horaInicio ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <ShieldBan className="mr-2 h-3 w-3" />
                            )}
                            Bloquear
                          </Button>
                        )}

                        {slot.estado === 'BLOQUEADO' &&
                          turnoIdBloqueado !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-slate-600 hover:bg-slate-100"
                              onClick={() => void desbloquearTurno(turnoIdBloqueado)}
                              disabled={Boolean(procesando)}
                            >
                              {procesando === `id-${turnoIdBloqueado}` ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-3 w-3" />
                              )}
                              Habilitar
                            </Button>
                          )}

                        {slot.estado === 'PRESENTE' && slot.turnoId && (
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:from-orange-600 hover:to-rose-600"
                            onClick={() =>
                              navigate({
                                to: `/profesional/consulta/${slot.turnoId}`,
                              })
                            }
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Iniciar consulta
                          </Button>
                        )}

                        {(slot.estado === 'PENDIENTE' ||
                          slot.estado === 'CONFIRMADO') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                            disabled
                          >
                            Ver detalles
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
