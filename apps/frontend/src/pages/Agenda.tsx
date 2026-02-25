import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  CalendarRange, 
  Clock, 
  Plus, 
  Save, 
  RefreshCw, 
  Trash2, 
  Lock, 
  Unlock, 
  User, 
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';

interface AgendaItem {
  idAgenda: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// Tipos para configuración de horario
const DIA_SEMANA_OPTIONS = [
  { value: 'Lunes', label: 'Lunes' },
  { value: 'Martes', label: 'Martes' },
  { value: 'Miércoles', label: 'Miércoles' },
  { value: 'Jueves', label: 'Jueves' },
  { value: 'Viernes', label: 'Viernes' },
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
] as const;

type DiaSemanaOption = (typeof DIA_SEMANA_OPTIONS)[number]['value'];

interface AgendaFormItem {
  id: string;
  dia: DiaSemanaOption;
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

interface ConfigureAgendaPayload {
  agendas: Array<{
    dia: DiaSemanaOption;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
  }>;
}

// Tipos para gestión de excepciones (Bloqueos)
interface AgendaSlot {
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO' | 'AUSENTE' | 'REPROGRAMADO' | 'BLOQUEADO';
  turnoId?: number;
  socio?: {
    nombre: string;
    dni: string;
  };
}

const createAgendaFormId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyAgendaFormItem = (): AgendaFormItem => ({
  id: createAgendaFormId(),
  dia: 'Lunes',
  horaInicio: '09:00',
  horaFin: '13:00',
  duracionTurno: 30,
});

const mapAgendaToForm = (items: AgendaItem[]): AgendaFormItem[] => {
  if (!items.length) {
    return [createEmptyAgendaFormItem()];
  }

  return items.map((item) => ({
    id: String(item.idAgenda),
    dia: item.dia as DiaSemanaOption,
    horaInicio: item.horaInicio.slice(0, 5),
    horaFin: item.horaFin.slice(0, 5),
    duracionTurno: item.duracionTurno,
  }));
};

const minutesFromHour = (hourValue: string) => {
  const [hour, minute] = hourValue.split(':').map(Number);
  return hour * 60 + minute;
};

export function Agenda() {
  const { token, rol, personaId } = useAuth();
  
  // State for Configuration Tab
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [agendaForm, setAgendaForm] = useState<AgendaFormItem[]>([
    createEmptyAgendaFormItem(),
  ]);
  const [cargandoConfig, setCargandoConfig] = useState(true);
  const [guardandoAgenda, setGuardandoAgenda] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Exceptions Tab
  const [fechaExcepcion, setFechaExcepcion] = useState<Date | undefined>(new Date());
  const [slotsExcepcion, setSlotsExcepcion] = useState<AgendaSlot[]>([]);
  const [cargandoExcepciones, setCargandoExcepciones] = useState(false);
  const [procesandoExcepcion, setProcesandoExcepcion] = useState<string | null>(null);

  // --- Logic for Configuration Tab ---
  const cargarAgendaConfig = useCallback(async () => {
    if (!token || !personaId || rol !== 'NUTRICIONISTA') {
      setCargandoConfig(false);
      return;
    }

    try {
      setCargandoConfig(true);
      setError(null);

      const agendaResponse = await apiRequest<ApiResponse<AgendaItem[]>>(
        `/agenda/${personaId}`,
        { token },
      );

      const agendaData = agendaResponse.data ?? [];
      setAgenda(agendaData);
      setAgendaForm(mapAgendaToForm(agendaData));
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar la agenda';
      setError(message);
    } finally {
      setCargandoConfig(false);
    }
  }, [token, personaId, rol]);

  useEffect(() => {
    void cargarAgendaConfig();
  }, [cargarAgendaConfig]);

  const actualizarBloqueAgenda = <K extends keyof AgendaFormItem>(
    id: string,
    field: K,
    value: AgendaFormItem[K],
  ) => {
    setAgendaForm((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const agregarBloqueAgenda = () => {
    setAgendaForm((prev) => [...prev, createEmptyAgendaFormItem()]);
  };

  const quitarBloqueAgenda = (id: string) => {
    setAgendaForm((prev) => {
      if (prev.length === 1) {
        return [createEmptyAgendaFormItem()];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const guardarConfiguracionAgenda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !personaId || rol !== 'NUTRICIONISTA') return;

    for (const bloque of agendaForm) {
      if (!bloque.horaInicio || !bloque.horaFin) {
        toast.error('Completa hora de inicio y hora de fin en todos los bloques.');
        return;
      }
      if (bloque.duracionTurno < 5) {
        toast.error('La duracion minima del turno es 5 minutos.');
        return;
      }
      const inicio = minutesFromHour(bloque.horaInicio);
      const fin = minutesFromHour(bloque.horaFin);
      if (fin <= inicio) {
        toast.error('La hora de fin debe ser mayor a la hora de inicio.');
        return;
      }
    }

    const bloquesPorDia: Record<string, Array<{ inicio: number; fin: number }>> = {};
    for (const bloque of agendaForm) {
      const inicio = minutesFromHour(bloque.horaInicio);
      const fin = minutesFromHour(bloque.horaFin);

      if (!bloquesPorDia[bloque.dia]) {
        bloquesPorDia[bloque.dia] = [];
      }

      const tieneColision = bloquesPorDia[bloque.dia].some(
        (b) =>
          (inicio >= b.inicio && inicio < b.fin) ||
          (fin > b.inicio && fin <= b.fin) ||
          (inicio <= b.inicio && fin >= b.fin),
      );

      if (tieneColision) {
        toast.error(`Hay horarios superpuestos en el dia ${bloque.dia}.`);
        return;
      }
      bloquesPorDia[bloque.dia].push({ inicio, fin });
    }

    const payload: ConfigureAgendaPayload = {
      agendas: agendaForm.map((item) => ({
        dia: item.dia,
        horaInicio: item.horaInicio.slice(0, 5),
        horaFin: item.horaFin.slice(0, 5),
        duracionTurno: item.duracionTurno,
      })),
    };

    try {
      setGuardandoAgenda(true);
      setError(null);
      await apiRequest<ApiResponse<AgendaItem[]>>(
        `/agenda/${personaId}/configuracion`,
        { method: 'PUT', token, body: payload },
      );
      toast.success('Horarios de atencion actualizados.');
      await cargarAgendaConfig();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error al guardar';
      setError(message);
      toast.error(message);
    } finally {
      setGuardandoAgenda(false);
    }
  };

  // --- Logic for Exceptions Tab ---
  const cargarExcepciones = useCallback(async () => {
    if (!token || !personaId || rol !== 'NUTRICIONISTA' || !fechaExcepcion) return;

    try {
      setCargandoExcepciones(true);
      const fechaFormatted = format(fechaExcepcion, 'yyyy-MM-dd');
      const response = await apiRequest<ApiResponse<AgendaSlot[]>>(
        `/turnos/profesional/${personaId}/disponibilidad?fecha=${fechaFormatted}`,
        { token },
      );
      setSlotsExcepcion(response.data ?? []);
    } catch {
      toast.error('No se pudo cargar la disponibilidad del dia.');
      setSlotsExcepcion([]);
    } finally {
      setCargandoExcepciones(false);
    }
  }, [token, personaId, rol, fechaExcepcion]);

  useEffect(() => {
    void cargarExcepciones();
  }, [cargarExcepciones]);

  const bloquearTurno = async (hora: string) => {
    if (!token || !personaId || !fechaExcepcion) return;
    try {
      setProcesandoExcepcion(hora);
      const fechaFormatted = format(fechaExcepcion, 'yyyy-MM-dd');
      await apiRequest(`/turnos/profesional/${personaId}/bloquear`, {
        method: 'POST',
        token,
        body: { fecha: fechaFormatted, horaTurno: hora },
      });
      toast.success('Turno bloqueado exitosamente.');
      await cargarExcepciones();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al bloquear turno';
      toast.error(msg);
    } finally {
      setProcesandoExcepcion(null);
    }
  };

  const desbloquearTurno = async (turnoId: number) => {
    if (!token || !personaId) return;
    try {
      setProcesandoExcepcion(`id-${turnoId}`);
      await apiRequest(`/turnos/profesional/${personaId}/${turnoId}/desbloquear`, {
        method: 'PATCH',
        token,
      });
      toast.success('Turno desbloqueado exitosamente.');
      await cargarExcepciones();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al desbloquear turno';
      toast.error(msg);
    } finally {
      setProcesandoExcepcion(null);
    }
  };

  const getEstadoBadge = (estado: AgendaSlot['estado']) => {
    switch (estado) {
      case 'LIBRE':
        return <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-sm hover:from-emerald-600 hover:to-emerald-700">Libre</Badge>;
      case 'BLOQUEADO':
        return <Badge className="bg-gradient-to-r from-rose-500 to-rose-600 text-white border-0 shadow-sm hover:from-rose-600 hover:to-rose-700">Bloqueado</Badge>;
      case 'PENDIENTE':
        return <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-sm hover:from-amber-600 hover:to-amber-700">Pendiente</Badge>;
      case 'CONFIRMADO':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm hover:from-blue-600 hover:to-blue-700">Confirmado</Badge>;
      default:
        return <Badge variant="outline" className="shadow-sm">{estado}</Badge>;
    }
  };

  if (rol !== 'NUTRICIONISTA') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-rose-100 p-4 mb-4">
           <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Acceso denegado</h2>
        <p className="text-muted-foreground mt-2">Esta pantalla solo está disponible para profesionales de la nutrición.</p>
      </div>
    );
  }

  if (!personaId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-amber-100 p-4 mb-4">
           <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Perfil incompleto</h2>
        <p className="text-muted-foreground mt-2">No se pudo resolver tu perfil profesional. Vuelve a iniciar sesión.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header moderno con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Calendar className="h-8 w-8 text-orange-500" />
            Mi Agenda
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Configura tus horarios habituales de atención y gestiona excepciones por fecha para mantener tu disponibilidad siempre actualizada.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <Tabs defaultValue="configuracion" className="w-full space-y-8">
        {/* Tabs estilo pills con iconos */}
        <TabsList className="inline-flex h-auto w-full items-center justify-start gap-2 rounded-full bg-muted/50 p-1.5 lg:w-fit">
          <TabsTrigger 
            value="configuracion" 
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/5"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Horarios Habituales
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="excepciones" 
            className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-black/5"
          >
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Gestionar Fechas
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            {/* Formulario principal */}
            <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
              <CardHeader>
                <CardTitle className="text-xl">Configuración Semanal</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define los días y rangos horarios en los que atiendes regularmente.
                </p>
              </CardHeader>
              <CardContent>
                {cargandoConfig ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-orange-500" />
                    <p className="text-sm">Cargando configuración de horarios...</p>
                  </div>
                ) : (
                  <form onSubmit={guardarConfiguracionAgenda} className="space-y-6">
                    <div className="space-y-4">
                      {agendaForm.map((bloque) => (
                        <div key={bloque.id} className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md group">
                          <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-orange-400 to-rose-400 opacity-50 transition-opacity group-hover:opacity-100" />
                          
                          <div className="flex flex-col md:flex-row gap-4 md:items-end ml-2">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`agenda-dia-${bloque.id}`} className="text-xs font-bold uppercase text-muted-foreground">Día</Label>
                              <select
                                id={`agenda-dia-${bloque.id}`}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-transparent transition-all shadow-sm"
                                value={bloque.dia}
                                onChange={(e) => actualizarBloqueAgenda(bloque.id, 'dia', e.target.value as DiaSemanaOption)}
                                disabled={guardandoAgenda}
                              >
                                {DIA_SEMANA_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`agenda-inicio-${bloque.id}`} className="text-xs font-bold uppercase text-muted-foreground">Inicio</Label>
                              <div className="relative">
                                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                 <Input
                                    id={`agenda-inicio-${bloque.id}`}
                                    type="time"
                                    className="pl-9 focus-visible:ring-orange-500 transition-all shadow-sm"
                                    value={bloque.horaInicio}
                                    step={300}
                                    onChange={(e) => actualizarBloqueAgenda(bloque.id, 'horaInicio', e.target.value)}
                                    disabled={guardandoAgenda}
                                    required
                                  />
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`agenda-fin-${bloque.id}`} className="text-xs font-bold uppercase text-muted-foreground">Fin</Label>
                              <div className="relative">
                                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                 <Input
                                    id={`agenda-fin-${bloque.id}`}
                                    type="time"
                                    className="pl-9 focus-visible:ring-orange-500 transition-all shadow-sm"
                                    value={bloque.horaFin}
                                    step={300}
                                    onChange={(e) => actualizarBloqueAgenda(bloque.id, 'horaFin', e.target.value)}
                                    disabled={guardandoAgenda}
                                    required
                                  />
                              </div>
                            </div>

                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`agenda-duracion-${bloque.id}`} className="text-xs font-bold uppercase text-muted-foreground">Duración (min)</Label>
                              <Input
                                id={`agenda-duracion-${bloque.id}`}
                                type="number"
                                min={5}
                                step={5}
                                className="focus-visible:ring-orange-500 transition-all shadow-sm"
                                value={bloque.duracionTurno}
                                onChange={(e) => actualizarBloqueAgenda(bloque.id, 'duracionTurno', Number(e.target.value) || 0)}
                                disabled={guardandoAgenda}
                                required
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => quitarBloqueAgenda(bloque.id)}
                              disabled={guardandoAgenda || agendaForm.length === 1}
                              className="h-10 w-10 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-colors shrink-0"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t mt-6">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={agregarBloqueAgenda} 
                        disabled={guardandoAgenda}
                        className="border-dashed border-2 hover:border-orange-500 hover:text-orange-600 transition-colors bg-transparent"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir otro bloque
                      </Button>
                      
                      <div className="flex-1" />

                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => void cargarAgendaConfig()} 
                        disabled={guardandoAgenda}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Descartar
                      </Button>

                      <Button 
                        type="submit" 
                        disabled={guardandoAgenda}
                        className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        {guardandoAgenda ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar horarios
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Sidebar de vista previa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight px-1">Vista previa activa</h3>
              {cargandoConfig ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : agenda.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/20">
                  <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  No hay horarios guardados actualmente.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {agenda.map((item) => (
                    <div key={item.idAgenda} className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-orange-50/30 p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-orange-400 to-rose-400" />
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-inner">
                           <CalendarDays className="h-4 w-4" />
                        </div>
                        <p className="font-bold">{item.dia}</p>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 text-orange-500/70" />
                            <span className="font-medium">{item.horaInicio} - {item.horaFin}</span>
                         </div>
                         <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 text-orange-500/70" />
                            <span>Duración: <span className="font-medium">{item.duracionTurno} min</span></span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="excepciones" className="focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-gradient-to-b from-muted/30 to-muted/10 p-10 shadow-sm text-center max-w-3xl mx-auto">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-inner">
                <CalendarRange className="h-8 w-8" />
              </div>
              <Label className="mb-3 block text-xl font-bold tracking-tight">Seleccionar Fecha de Gestión</Label>
              <p className="mb-8 text-sm text-muted-foreground max-w-md mx-auto">
                Elige el día en el que deseas bloquear horarios o ver el estado de tus turnos. Recuerda que solo puedes gestionar desde hoy en adelante.
              </p>
              <div className="w-full max-w-sm rounded-xl bg-card shadow-md p-1 border">
                <DatePicker
                  date={fechaExcepcion}
                  setDate={setFechaExcepcion}
                  minDate={new Date()}
                  className="w-full h-12 text-base"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xl font-bold tracking-tight">Horarios del día</h3>
                {slotsExcepcion.length > 0 && !cargandoExcepciones && (
                  <Badge variant="secondary" className="bg-muted/50">
                    {slotsExcepcion.length} turnos encontrados
                  </Badge>
                )}
              </div>

              {cargandoExcepciones ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mb-4 text-rose-500" />
                  <p className="text-sm">Buscando disponibilidad para la fecha seleccionada...</p>
                </div>
              ) : slotsExcepcion.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed bg-muted/10 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-medium">No hay horarios configurados para este día</p>
                  <p className="text-sm mt-1">Es posible que sea un día no laboral o no tengas bloques asignados.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {slotsExcepcion.map((slot) => {
                    const idTurnoBloqueado = slot.turnoId;
                    const isBloqueado = slot.estado === 'BLOQUEADO';
                    const isLibre = slot.estado === 'LIBRE';
                    const isOcupado = !isBloqueado && !isLibre;

                    return (
                      <div
                        key={slot.horaInicio}
                        className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-md ${
                          isBloqueado 
                            ? 'bg-gradient-to-br from-rose-50/50 to-rose-100/30 border-rose-200' 
                            : isLibre 
                            ? 'bg-card border-border hover:border-emerald-200' 
                            : 'bg-gradient-to-br from-muted/30 to-muted/10 border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className={`h-5 w-5 ${
                              isBloqueado ? 'text-rose-500' : isLibre ? 'text-emerald-500' : 'text-blue-500'
                            }`} />
                            <span className="font-bold text-xl tracking-tight">{slot.horaInicio}</span>
                          </div>
                          {getEstadoBadge(slot.estado)}
                        </div>
                        
                        <div className="min-h-[4rem] text-sm flex flex-col justify-center">
                          {slot.socio ? (
                            <div className="flex items-start gap-3 rounded-lg bg-background/50 p-3 shadow-sm border border-border/50">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{slot.socio.nombre}</span>
                                <span className="text-muted-foreground text-xs mt-0.5">DNI: {slot.socio.dni}</span>
                              </div>
                            </div>
                          ) : isBloqueado ? (
                            <div className="flex items-center gap-2 text-rose-600 bg-rose-50/50 p-3 rounded-lg border border-rose-100/50">
                              <Lock className="h-4 w-4" />
                              <span className="font-medium">No disponible</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                               <Unlock className="h-4 w-4" />
                               <span className="font-medium">Espacio disponible para reservar</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5">
                          {isLibre && (
                            <Button 
                              variant="outline" 
                              className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors shadow-sm"
                              onClick={() => bloquearTurno(slot.horaInicio)}
                              disabled={!!procesandoExcepcion}
                            >
                              {procesandoExcepcion === slot.horaInicio ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bloqueando...</>
                              ) : (
                                <><Lock className="mr-2 h-4 w-4" /> Bloquear Horario</>
                              )}
                            </Button>
                          )}
                          
                          {isOcupado && (
                            <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed" disabled>
                              Turno Ocupado
                            </Button>
                          )}
                          
                          {isBloqueado && typeof idTurnoBloqueado === 'number' && (
                            <Button 
                              variant="outline" 
                              className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm"
                              onClick={() => desbloquearTurno(idTurnoBloqueado)}
                              disabled={!!procesandoExcepcion}
                            >
                              {procesandoExcepcion === `id-${idTurnoBloqueado}` ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Habilitando...</>
                              ) : (
                                <><Unlock className="mr-2 h-4 w-4" /> Habilitar Horario</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
