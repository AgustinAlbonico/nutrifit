import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { addHours, format as formatearFechaIso, isToday } from 'date-fns';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MiTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  especialidad?: string;
  profesionalId?: number;
  profesionalNombreCompleto?: string;
  nutricionista?: {
    idPersona: number;
    nombreCompleto: string;
    matricula?: string;
  };
}

interface TurnoDisponible {
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'OCUPADO';
}

interface TurnoOperacionResponse {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function Turnos() {
  const { token, rol } = useAuth();
  const [turnos, setTurnos] = useState<MiTurno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('TODOS');
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [limitePorPagina, setLimitePorPagina] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  const [procesandoCancelacionId, setProcesandoCancelacionId] = useState<
    number | null
  >(null);
  const [turnoEnReprogramacion, setTurnoEnReprogramacion] =
    useState<MiTurno | null>(null);
  const [fechaReprogramacion, setFechaReprogramacion] = useState<
    Date | undefined
  >(undefined);
  const [horariosReprogramacion, setHorariosReprogramacion] = useState<
    TurnoDisponible[]
  >([]);
  const [horarioSeleccionadoReprogramacion, setHorarioSeleccionadoReprogramacion] =
    useState<TurnoDisponible | null>(null);
  const [cargandoHorariosReprogramacion, setCargandoHorariosReprogramacion] =
    useState(false);
  const [procesandoReprogramacion, setProcesandoReprogramacion] =
    useState(false);
  const [errorReprogramacion, setErrorReprogramacion] = useState<string | null>(
    null,
  );

  const obtenerNombreProfesional = (turno: MiTurno) => {
    if (turno.profesionalNombreCompleto?.trim()) {
      return turno.profesionalNombreCompleto;
    }

    if (turno.nutricionista?.nombreCompleto?.trim()) {
      return turno.nutricionista.nombreCompleto;
    }

    return 'Profesional asignado';
  };

  const obtenerMatriculaProfesional = (turno: MiTurno) => {
    return turno.nutricionista?.matricula?.trim() ?? '';
  };

  const formatearFechaDescriptiva = (fechaTurno: string) => {
    const fecha = new Date(`${fechaTurno}T00:00:00`);

    if (Number.isNaN(fecha.getTime())) {
      return fechaTurno;
    }

    const fechaFormateada = fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  };

  const obtenerDescripcionEstado = (estadoTurno: string) => {
    switch (estadoTurno) {
      case 'PENDIENTE':
        return 'Tu turno esta pendiente de confirmacion.';
      case 'CONFIRMADO':
        return 'Tu turno esta confirmado.';
      case 'REPROGRAMADO':
        return 'Este turno fue reprogramado.';
      case 'CANCELADO':
        return 'Este turno fue cancelado.';
      case 'REALIZADO':
        return 'Consulta realizada.';
      case 'AUSENTE':
        return 'No registraste asistencia a este turno.';
      default:
        return 'Estado actualizado del turno.';
    }
  };

  const obtenerVarianteEstado = (estadoTurno: string) => {
    switch (estadoTurno) {
      case 'CONFIRMADO':
      case 'REALIZADO':
        return 'default' as const;
      case 'PENDIENTE':
      case 'REPROGRAMADO':
        return 'secondary' as const;
      case 'CANCELADO':
      case 'AUSENTE':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const obtenerProfesionalId = (turno: MiTurno): number | null => {
    if (typeof turno.profesionalId === 'number' && turno.profesionalId > 0) {
      return turno.profesionalId;
    }

    if (
      typeof turno.nutricionista?.idPersona === 'number' &&
      turno.nutricionista.idPersona > 0
    ) {
      return turno.nutricionista.idPersona;
    }

    return null;
  };

  const actualizarTurnoEnListado = (turnoActualizado: TurnoOperacionResponse) => {
    setTurnos((previos) =>
      previos.map((turno) => {
        if (turno.idTurno !== turnoActualizado.idTurno) {
          return turno;
        }

        return {
          ...turno,
          fechaTurno: turnoActualizado.fechaTurno,
          horaTurno: turnoActualizado.horaTurno,
          estadoTurno: turnoActualizado.estadoTurno,
        };
      }),
    );
  };

  const limpiarEstadoReprogramacion = () => {
    setFechaReprogramacion(undefined);
    setHorariosReprogramacion([]);
    setHorarioSeleccionadoReprogramacion(null);
    setErrorReprogramacion(null);
    setProcesandoReprogramacion(false);
    setCargandoHorariosReprogramacion(false);
  };

  const abrirReprogramacion = (turno: MiTurno) => {
    const profesionalId = obtenerProfesionalId(turno);

    if (!profesionalId) {
      toast.error('No se pudo identificar el profesional del turno.');
      return;
    }

    setTurnoEnReprogramacion(turno);
    limpiarEstadoReprogramacion();
  };

  const cerrarReprogramacion = () => {
    setTurnoEnReprogramacion(null);
    limpiarEstadoReprogramacion();
  };

  const manejarCambioFechaReprogramacion = (fecha: Date | undefined) => {
    setFechaReprogramacion(fecha);
    setHorarioSeleccionadoReprogramacion(null);
    setErrorReprogramacion(null);
  };

  const cargarHorariosReprogramacionPorFecha = useCallback(
    async (turno: MiTurno, fecha: Date) => {
      if (!token) {
        return;
      }

      const profesionalId = obtenerProfesionalId(turno);

      if (!profesionalId) {
        setErrorReprogramacion('No se pudo identificar el profesional del turno.');
        setHorariosReprogramacion([]);
        return;
      }

      const fechaApi = formatearFechaIso(fecha, 'yyyy-MM-dd');

      try {
        setCargandoHorariosReprogramacion(true);
        setErrorReprogramacion(null);

        const response = await apiRequest<ApiResponse<TurnoDisponible[]>>(
          `/turnos/socio/profesional/${profesionalId}/disponibilidad?fecha=${fechaApi}`,
          { token },
        );

        setHorariosReprogramacion(response.data ?? []);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'No se pudo cargar la disponibilidad para reprogramar';

        setErrorReprogramacion(message);
        setHorariosReprogramacion([]);
      } finally {
        setCargandoHorariosReprogramacion(false);
      }
    },
    [token],
  );

  const horarioDisponibleParaReprogramar = (turnoDisponible: TurnoDisponible) => {
    if (turnoDisponible.estado !== 'LIBRE') {
      return false;
    }

    if (!fechaReprogramacion) {
      return false;
    }

    if (!isToday(fechaReprogramacion)) {
      return true;
    }

    const ahora = new Date();
    const [horas, minutos] = turnoDisponible.horaInicio
      .split(':')
      .map((value) => Number(value));
    const fechaHoraTurno = new Date(fechaReprogramacion);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);

    return fechaHoraTurno >= addHours(ahora, 1);
  };

  const obtenerMotivoNoDisponibleReprogramacion = (
    turnoDisponible: TurnoDisponible,
  ): string | null => {
    if (turnoDisponible.estado === 'OCUPADO') {
      return null;
    }

    if (!fechaReprogramacion || !isToday(fechaReprogramacion)) {
      return null;
    }

    const ahora = new Date();
    const [horas, minutos] = turnoDisponible.horaInicio
      .split(':')
      .map((value) => Number(value));
    const fechaHoraTurno = new Date(fechaReprogramacion);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);

    if (fechaHoraTurno <= ahora) {
      return 'Ya paso';
    }

    if (fechaHoraTurno < addHours(ahora, 1)) {
      return 'Muy pronto';
    }

    return null;
  };

  const cancelarTurno = async (turno: MiTurno) => {
    if (!token) {
      return;
    }

    try {
      setProcesandoCancelacionId(turno.idTurno);

      const response = await apiRequest<ApiResponse<TurnoOperacionResponse>>(
        `/turnos/socio/${turno.idTurno}/cancelar`,
        {
          method: 'PATCH',
          token,
        },
      );

      if (response.data) {
        actualizarTurnoEnListado(response.data);
      }

      toast.success(`Turno #${turno.idTurno} cancelado correctamente.`);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cancelar el turno';

      toast.error(message);
    } finally {
      setProcesandoCancelacionId(null);
    }
  };

  const confirmarReprogramacion = async () => {
    if (
      !token ||
      !turnoEnReprogramacion ||
      !fechaReprogramacion ||
      !horarioSeleccionadoReprogramacion
    ) {
      return;
    }

    try {
      setProcesandoReprogramacion(true);
      setErrorReprogramacion(null);

      const response = await apiRequest<ApiResponse<TurnoOperacionResponse>>(
        `/turnos/socio/${turnoEnReprogramacion.idTurno}/reprogramar`,
        {
          method: 'PATCH',
          token,
          body: {
            fechaTurno: formatearFechaIso(fechaReprogramacion, 'yyyy-MM-dd'),
            horaTurno: horarioSeleccionadoReprogramacion.horaInicio,
          },
        },
      );

      if (response.data) {
        actualizarTurnoEnListado(response.data);
      }

      toast.success(`Turno #${turnoEnReprogramacion.idTurno} reprogramado correctamente.`);
      cerrarReprogramacion();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo reprogramar el turno';

      setErrorReprogramacion(message);
    } finally {
      setProcesandoReprogramacion(false);
    }
  };

  const estadosDisponibles = useMemo(() => {
    return Array.from(new Set(turnos.map((turno) => turno.estadoTurno))).sort();
  }, [turnos]);

  const turnosFiltrados = useMemo(() => {
    const textoNormalizado = textoBusqueda.trim().toLowerCase();
    const fechaDesdeFiltro = fechaDesde
      ? formatearFechaIso(fechaDesde, 'yyyy-MM-dd')
      : '';
    const fechaHastaFiltro = fechaHasta
      ? formatearFechaIso(fechaHasta, 'yyyy-MM-dd')
      : '';

    return turnos.filter((turno) => {
      const nombreProfesional = obtenerNombreProfesional(turno).toLowerCase();
      const estadoTurno = turno.estadoTurno.toLowerCase();

      const coincideTexto =
        !textoNormalizado ||
        nombreProfesional.includes(textoNormalizado) ||
        turno.fechaTurno.toLowerCase().includes(textoNormalizado) ||
        turno.horaTurno.toLowerCase().includes(textoNormalizado) ||
        estadoTurno.includes(textoNormalizado);

      const coincideEstado =
        estadoSeleccionado === 'TODOS' || turno.estadoTurno === estadoSeleccionado;

      const coincideDesde = !fechaDesdeFiltro || turno.fechaTurno >= fechaDesdeFiltro;
      const coincideHasta = !fechaHastaFiltro || turno.fechaTurno <= fechaHastaFiltro;

      return coincideTexto && coincideEstado && coincideDesde && coincideHasta;
    });
  }, [turnos, textoBusqueda, estadoSeleccionado, fechaDesde, fechaHasta]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(turnosFiltrados.length / limitePorPagina),
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [textoBusqueda, estadoSeleccionado, fechaDesde, fechaHasta, limitePorPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const indiceFin = indiceInicio + limitePorPagina;
  const turnosPaginados = turnosFiltrados.slice(indiceInicio, indiceFin);

  const limpiarFiltros = () => {
    setTextoBusqueda('');
    setEstadoSeleccionado('TODOS');
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setPaginaActual(1);
  };

  useEffect(() => {
    if (!token || rol !== 'SOCIO') {
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        setCargando(true);
        setError(null);

        const response = await apiRequest<ApiResponse<MiTurno[]>>(
          '/turnos/socio/mis-turnos',
          { token },
        );

        setTurnos(response.data ?? []);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar tus turnos';
        setError(message);
      } finally {
        setCargando(false);
      }
    };

    void cargar();
  }, [token, rol]);

  useEffect(() => {
    if (!turnoEnReprogramacion || !fechaReprogramacion) {
      setHorariosReprogramacion([]);
      return;
    }

    void cargarHorariosReprogramacionPorFecha(
      turnoEnReprogramacion,
      fechaReprogramacion,
    );
  }, [
    turnoEnReprogramacion,
    fechaReprogramacion,
    cargarHorariosReprogramacionPorFecha,
  ]);

  if (rol !== 'SOCIO') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>Esta pantalla solo esta disponible para socios.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-orange-500" />
              Mis Turnos
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Historial y proximos turnos.
            </p>
          </div>

          <Button asChild>
            <Link to="/turnos/agendar">
              <CalendarPlus className="h-4 w-4" />
              Ir a agendar turno
            </Link>
          </Button>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargando ? (
            <p className="text-sm text-muted-foreground">Cargando turnos...</p>
          ) : turnos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenes turnos registrados.</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Buscar</p>
                  <Input
                    placeholder="Profesional, fecha, hora o estado"
                    value={textoBusqueda}
                    onChange={(event) => setTextoBusqueda(event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={estadoSeleccionado}
                    onChange={(event) => setEstadoSeleccionado(event.target.value)}
                  >
                    <option value="TODOS">Todos</option>
                    {estadosDisponibles.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Desde</p>
                  <DatePicker
                    date={fechaDesde}
                    setDate={setFechaDesde}
                    placeholder="Fecha desde"
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Hasta</p>
                  <DatePicker
                    date={fechaHasta}
                    setDate={setFechaHasta}
                    placeholder="Fecha hasta"
                    minDate={fechaDesde}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Por pagina</p>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={limitePorPagina}
                    onChange={(event) => setLimitePorPagina(Number(event.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Resultados:{' '}
                  <span className="font-medium text-foreground">
                    {turnosFiltrados.length}
                  </span>
                </p>
                <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </div>

              {turnosFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay turnos que coincidan con los filtros seleccionados.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {turnosPaginados.map((turno) => {
                      const nombreProfesional = obtenerNombreProfesional(turno);
                      const matriculaProfesional = obtenerMatriculaProfesional(turno);
                      const fechaDescriptiva = formatearFechaDescriptiva(
                        turno.fechaTurno,
                      );
                      const descripcionEstado = obtenerDescripcionEstado(
                        turno.estadoTurno,
                      );
                      const varianteEstado = obtenerVarianteEstado(
                        turno.estadoTurno,
                      );
                      const especialidadTurno =
                        turno.especialidad?.trim() ?? 'Nutricionista';

                      return (
                        <div
                          key={turno.idTurno}
                          className="rounded-lg border bg-card p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-base font-semibold">{fechaDescriptiva}</p>
                              <p className="text-sm text-muted-foreground">
                                Horario: {turno.horaTurno} hs
                              </p>
                            </div>
                            <Badge variant={varianteEstado}>{turno.estadoTurno}</Badge>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <p>
                              <span className="text-muted-foreground">Profesional: </span>
                              <span className="font-medium">{nombreProfesional}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Especialidad: </span>
                              <span className="font-medium">{especialidadTurno}</span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Matricula: </span>
                              <span className="font-medium">
                                {matriculaProfesional || 'No informada'}
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Codigo de turno: </span>
                              <span className="font-medium">#{turno.idTurno}</span>
                            </p>
                          </div>

                          <p className="mt-3 text-xs text-muted-foreground">
                            {descripcionEstado}
                          </p>

                          {turno.estadoTurno === 'PENDIENTE' && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirReprogramacion(turno)}
                                disabled={procesandoCancelacionId === turno.idTurno}
                              >
                                Reprogramar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => void cancelarTurno(turno)}
                                disabled={procesandoCancelacionId === turno.idTurno}
                              >
                                {procesandoCancelacionId === turno.idTurno
                                  ? 'Cancelando...'
                                  : 'Cancelar turno'}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando{' '}
                      <span className="font-medium text-foreground">
                        {indiceInicio + 1}
                      </span>
                      {' - '}
                      <span className="font-medium text-foreground">
                        {Math.min(indiceFin, turnosFiltrados.length)}
                      </span>
                      {' de '}
                      <span className="font-medium text-foreground">
                        {turnosFiltrados.length}
                      </span>
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaginaActual((previa) => Math.max(1, previa - 1))}
                        disabled={paginaActual === 1}
                      >
                        Anterior
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        Pagina {paginaActual} de {totalPaginas}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPaginaActual((previa) =>
                            Math.min(totalPaginas, previa + 1),
                          )
                        }
                        disabled={paginaActual === totalPaginas}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(turnoEnReprogramacion)}
        onOpenChange={(abierto) => {
          if (!abierto) {
            cerrarReprogramacion();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Reprogramar turno
              {turnoEnReprogramacion ? ` #${turnoEnReprogramacion.idTurno}` : ''}
            </DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y horario disponible para tu turno.
            </DialogDescription>
          </DialogHeader>

          {turnoEnReprogramacion && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Profesional: </span>
                  <span className="font-medium">
                    {obtenerNombreProfesional(turnoEnReprogramacion)}
                  </span>
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">Turno actual: </span>
                  <span className="font-medium">
                    {formatearFechaDescriptiva(turnoEnReprogramacion.fechaTurno)} -{' '}
                    {turnoEnReprogramacion.horaTurno} hs
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Nueva fecha</p>
                <DatePicker
                  date={fechaReprogramacion}
                  setDate={manejarCambioFechaReprogramacion}
                  minDate={new Date()}
                  className="w-full max-w-sm"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Horarios disponibles</p>

                {!fechaReprogramacion ? (
                  <p className="text-sm text-muted-foreground">
                    Selecciona una fecha para ver los horarios disponibles.
                  </p>
                ) : cargandoHorariosReprogramacion ? (
                  <p className="text-sm text-muted-foreground">
                    Cargando horarios disponibles...
                  </p>
                ) : horariosReprogramacion.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay horarios disponibles para la fecha seleccionada.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {horariosReprogramacion.map((horario) => {
                      const disponible = horarioDisponibleParaReprogramar(horario);
                      const estaSeleccionado =
                        horarioSeleccionadoReprogramacion?.horaInicio ===
                        horario.horaInicio;
                      const motivoNoDisponible =
                        obtenerMotivoNoDisponibleReprogramacion(horario);

                      return (
                        <Button
                          key={horario.horaInicio}
                          variant={
                            estaSeleccionado
                              ? 'default'
                              : disponible
                                ? 'outline'
                                : 'ghost'
                          }
                          className="h-auto justify-start py-3 text-left"
                          disabled={!disponible || procesandoReprogramacion}
                          onClick={() =>
                            setHorarioSeleccionadoReprogramacion(horario)
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {horario.horaInicio} - {horario.horaFin}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {motivoNoDisponible ??
                                (horario.estado === 'LIBRE'
                                  ? 'Disponible'
                                  : 'Ocupado')}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {errorReprogramacion && (
                <p className="text-sm text-destructive">{errorReprogramacion}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cerrarReprogramacion}
              disabled={procesandoReprogramacion}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => void confirmarReprogramacion()}
              disabled={
                !fechaReprogramacion ||
                !horarioSeleccionadoReprogramacion ||
                procesandoReprogramacion
              }
            >
              {procesandoReprogramacion
                ? 'Reprogramando...'
                : 'Confirmar reprogramacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
