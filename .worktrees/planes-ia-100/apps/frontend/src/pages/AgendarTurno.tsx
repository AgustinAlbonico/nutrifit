import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { format, isToday, addHours } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle2, FileWarning, Search, User } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ProfesionalDisponible {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  ciudad: string;
  provincia: string;
  tarifaSesion: number | string;
}

interface TurnoDisponible {
  horaInicio: string;
  horaFin: string;
  estado: 'LIBRE' | 'OCUPADO';
}

interface FichaSaludSocio {
  socioId: number;
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: 'Sedentario' | 'Moderado' | 'Intenso';
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string;
}

export function AgendarTurno() {
  const { token, rol } = useAuth();

  const [cargandoProfesionales, setCargandoProfesionales] = useState(true);
  const [errorProfesionales, setErrorProfesionales] = useState<string | null>(null);
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<
    ProfesionalDisponible[]
  >([]);
  const [busquedaProfesional, setBusquedaProfesional] = useState('');

  const [profesionalSeleccionado, setProfesionalSeleccionado] =
    useState<ProfesionalDisponible | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(
    undefined,
  );
  const [turnosDisponibles, setTurnosDisponibles] = useState<TurnoDisponible[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [fichaSaludCargada, setFichaSaludCargada] = useState<boolean | null>(null);
  const [cargandoFichaSalud, setCargandoFichaSalud] = useState(true);

  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoDisponible | null>(null);
  const [procesandoReserva, setProcesandoReserva] = useState(false);
  const [errorReserva, setErrorReserva] = useState<string | null>(null);
  const [mensajeReserva, setMensajeReserva] = useState<string | null>(null);
  const [datosTurnoReservado, setDatosTurnoReservado] = useState<{
    idTurno: number;
    fechaTurno: string;
    horaTurno: string;
    profesionalNombre: string;
  } | null>(null);

  const obtenerNombreCompletoProfesional = (profesional: ProfesionalDisponible) => {
    return `${profesional.nombre} ${profesional.apellido}`.trim();
  };

  const formatearTarifa = (tarifaSesion: number | string) => {
    const numeroTarifa = Number(tarifaSesion);

    if (!Number.isFinite(numeroTarifa)) {
      return String(tarifaSesion);
    }

    return numeroTarifa.toLocaleString('es-AR');
  };

  const profesionalesFiltrados = useMemo(() => {
    const termino = busquedaProfesional.trim().toLowerCase();

    if (!termino) {
      return profesionalesDisponibles;
    }

    return profesionalesDisponibles.filter((profesional) => {
      const nombreCompleto = obtenerNombreCompletoProfesional(profesional).toLowerCase();

      return (
        nombreCompleto.includes(termino) ||
        profesional.ciudad.toLowerCase().includes(termino) ||
        profesional.provincia.toLowerCase().includes(termino)
      );
    });
  }, [profesionalesDisponibles, busquedaProfesional]);

  const cargarProfesionalesDisponibles = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCargandoProfesionales(true);
      setErrorProfesionales(null);

      const response = await apiRequest<ApiResponse<ProfesionalDisponible[]>>(
        '/profesional/publico/disponibles',
        { token },
      );

      setProfesionalesDisponibles(response.data ?? []);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los profesionales disponibles';
      setErrorProfesionales(message);
    } finally {
      setCargandoProfesionales(false);
    }
  }, [token]);

  const cargarEstadoFichaSalud = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCargandoFichaSalud(true);
      const response = await apiRequest<ApiResponse<FichaSaludSocio | null>>(
        '/turnos/socio/ficha-salud',
        { token },
      );
      setFichaSaludCargada(Boolean(response.data));
    } catch {
      setFichaSaludCargada(null);
    } finally {
      setCargandoFichaSalud(false);
    }
  }, [token]);

  const cargarTurnosDisponibles = useCallback(
    async (nutricionistaId: number, fecha: Date) => {
      if (!token) {
        return;
      }

      const fechaApi = format(fecha, 'yyyy-MM-dd');

      try {
        setCargandoTurnos(true);
        setErrorReserva(null);

        const response = await apiRequest<ApiResponse<TurnoDisponible[]>>(
          `/turnos/socio/profesional/${nutricionistaId}/disponibilidad?fecha=${fechaApi}`,
          { token },
        );

        setTurnosDisponibles(response.data ?? []);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'No se pudieron cargar los horarios disponibles para esa fecha';
        setErrorReserva(message);
        setTurnosDisponibles([]);
      } finally {
        setCargandoTurnos(false);
      }
    },
    [token],
  );

  const seleccionarProfesional = (profesional: ProfesionalDisponible) => {
    setProfesionalSeleccionado(profesional);
    setFechaSeleccionada(undefined);
    setTurnosDisponibles([]);
    setErrorReserva(null);
    setMensajeReserva(null);
    setTurnoSeleccionado(null);
    setDatosTurnoReservado(null);
  };

  const manejarCambioFecha = (fecha: Date | undefined) => {
    setFechaSeleccionada(fecha);
    setErrorReserva(null);
    setMensajeReserva(null);
    setTurnoSeleccionado(null);
    setDatosTurnoReservado(null);
  };

  const seleccionarTurno = (turno: TurnoDisponible) => {
    setTurnoSeleccionado(turno);
    setErrorReserva(null);
    setMensajeReserva(null);
  };

  const reservarTurno = async () => {
    if (!token || !profesionalSeleccionado || !fechaSeleccionada || !turnoSeleccionado) {
      return;
    }

    if (fichaSaludCargada === false) {
      setErrorReserva(
        'No tenes la ficha de salud cargada. Completa tu ficha para poder reservar un turno.',
      );
      return;
    }

    try {
      setProcesandoReserva(true);
      setErrorReserva(null);
      setMensajeReserva(null);

      const fechaTurno = format(fechaSeleccionada, 'yyyy-MM-dd');

      const response = await apiRequest<ApiResponse<{
        idTurno: number;
        fechaTurno: string;
        horaTurno: string;
      }>>('/turnos/socio/reservar', {
        method: 'POST',
        token,
        body: {
          nutricionistaId: profesionalSeleccionado.idPersona,
          fechaTurno,
          horaTurno: turnoSeleccionado.horaInicio,
        },
      });

      setDatosTurnoReservado({
        idTurno: response.data.idTurno,
        fechaTurno: response.data.fechaTurno,
        horaTurno: response.data.horaTurno,
        profesionalNombre: obtenerNombreCompletoProfesional(profesionalSeleccionado),
      });
      setMensajeReserva('Turno reservado correctamente.');
      await cargarTurnosDisponibles(profesionalSeleccionado.idPersona, fechaSeleccionada);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo reservar el turno';
      setErrorReserva(message);
      setMensajeReserva(null);
    } finally {
      setProcesandoReserva(false);
    }
  };

  const obtenerEtiquetaEstadoTurno = (estado: TurnoDisponible['estado']) => {
    return estado === 'LIBRE' ? 'Disponible' : 'Ocupado';
  };

  /**
   * Determina si un turno está disponible para seleccionar.
   * Reglas:
   * - Si la fecha no es hoy → disponible si está LIBRE
   * - Si la fecha es hoy → solo disponible si faltan al menos 1 hora desde ahora
   */
  const turnoEstaDisponibleParaSeleccion = (turno: TurnoDisponible): boolean => {
    if (turno.estado !== 'LIBRE') {
      return false;
    }

    if (!fechaSeleccionada) {
      return false;
    }

    // Si no es hoy, todos los turnos libres están disponibles
    if (!isToday(fechaSeleccionada)) {
      return true;
    }

    // Si es hoy, verificar que falte al menos 1 hora
    const ahora = new Date();
    const [horas, minutos] = turno.horaInicio.split(':').map((v) => Number(v));
    const fechaHoraTurno = new Date(fechaSeleccionada);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);

    const unaHoraDespues = addHours(ahora, 1);

    return fechaHoraTurno >= unaHoraDespues;
  };

  /**
   * Obtiene el motivo por el cual un turno no está disponible
   */
  const obtenerMotivoNoDisponible = (turno: TurnoDisponible): string | null => {
    if (turno.estado === 'OCUPADO') {
      return null; // Los ocupados no muestran motivo especial
    }

    if (!fechaSeleccionada || !isToday(fechaSeleccionada)) {
      return null;
    }

    const ahora = new Date();
    const [horas, minutos] = turno.horaInicio.split(':').map((v) => Number(v));
    const fechaHoraTurno = new Date(fechaSeleccionada);
    fechaHoraTurno.setHours(horas, minutos, 0, 0);

    if (fechaHoraTurno <= ahora) {
      return 'Ya pasó';
    }

    const unaHoraDespues = addHours(ahora, 1);
    if (fechaHoraTurno < unaHoraDespues) {
      return 'Muy pronto';
    }

    return null;
  };

  useEffect(() => {
    if (!token || rol !== 'SOCIO') {
      setCargandoProfesionales(false);
      setCargandoFichaSalud(false);
      return;
    }

    void cargarProfesionalesDisponibles();
    void cargarEstadoFichaSalud();
  }, [token, rol, cargarProfesionalesDisponibles, cargarEstadoFichaSalud]);

  useEffect(() => {
    if (!token || !profesionalSeleccionado || !fechaSeleccionada) {
      setTurnosDisponibles([]);
      return;
    }

    void cargarTurnosDisponibles(profesionalSeleccionado.idPersona, fechaSeleccionada);
  }, [token, profesionalSeleccionado, fechaSeleccionada, cargarTurnosDisponibles]);

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
              <Calendar className="h-8 w-8 text-orange-500" />
              Agendar turno
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Primero elige profesional, luego fecha, y por ultimo el horario.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/turnos">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis turnos
            </Link>
          </Button>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paso 1
            </p>
            <p className="mt-1 font-medium">Seleccionar profesional</p>
            {profesionalSeleccionado && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completo
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paso 2
            </p>
            <p className="mt-1 font-medium">Seleccionar fecha</p>
            {fechaSeleccionada && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completo
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paso 3
            </p>
            <p className="mt-1 font-medium">Elegir horario y reservar</p>
            {datosTurnoReservado && (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Reserva creada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {fichaSaludCargada === false && !cargandoFichaSalud && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-amber-900">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">
                No tenes la ficha de salud cargada. Es obligatoria para reservar un turno.
              </p>
            </div>
            <Button asChild>
              <Link to="/turnos/ficha-salud">Cargar ficha de salud</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>1) Profesional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, ciudad o provincia"
              value={busquedaProfesional}
              onChange={(event) => setBusquedaProfesional(event.target.value)}
            />
          </div>

          {errorProfesionales && (
            <p className="text-sm text-destructive">{errorProfesionales}</p>
          )}

          {cargandoProfesionales ? (
            <p className="text-sm text-muted-foreground">
              Cargando profesionales disponibles...
            </p>
          ) : profesionalesFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay profesionales para la busqueda actual.
            </p>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {profesionalesFiltrados.map((profesional) => {
                const nombreProfesional = obtenerNombreCompletoProfesional(profesional);
                const estaSeleccionado =
                  profesionalSeleccionado?.idPersona === profesional.idPersona;

                return (
                  <div
                    key={profesional.idPersona}
                    className="flex items-center gap-2"
                  >
                    <Button
                      variant={estaSeleccionado ? 'default' : 'outline'}
                      className="h-auto flex-1 justify-start py-3 text-left"
                      onClick={() => seleccionarProfesional(profesional)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{nombreProfesional}</span>
                        <span className="text-xs opacity-90">
                          {profesional.especialidad} · {profesional.ciudad}, {profesional.provincia}
                        </span>
                        <span className="text-xs opacity-90">
                          Tarifa: ${formatearTarifa(profesional.tarifaSesion)}
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Ver perfil completo"
                    >
                      <a href={`/nutricionistas/${profesional.idPersona}/perfil`}>
                        <User className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2) Fecha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!profesionalSeleccionado ? (
            <p className="text-sm text-muted-foreground">
              Selecciona un profesional para habilitar la fecha.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Profesional seleccionado:{' '}
                <span className="font-medium text-foreground">
                  {obtenerNombreCompletoProfesional(profesionalSeleccionado)}
                </span>
              </p>

              <DatePicker
                date={fechaSeleccionada}
                setDate={manejarCambioFecha}
                minDate={new Date()}
                className="w-full max-w-sm"
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3) Horarios disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!profesionalSeleccionado || !fechaSeleccionada ? (
            <p className="text-sm text-muted-foreground">
              Selecciona profesional y fecha para ver horarios.
            </p>
          ) : cargandoTurnos ? (
            <p className="text-sm text-muted-foreground">
              Cargando horarios disponibles...
            </p>
          ) : turnosDisponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay horarios libres para la fecha seleccionada.
            </p>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {turnosDisponibles.map((turnoDisponible) => {
                  const disponibleParaSeleccion = turnoEstaDisponibleParaSeleccion(turnoDisponible);
                  const estaSeleccionado =
                    turnoSeleccionado?.horaInicio === turnoDisponible.horaInicio;
                  const motivoNoDisponible = obtenerMotivoNoDisponible(turnoDisponible);

                  return (
                    <Button
                      key={turnoDisponible.horaInicio}
                      variant={
                        estaSeleccionado ? 'default' : disponibleParaSeleccion ? 'outline' : 'ghost'
                      }
                      className="h-auto justify-start py-3 text-left"
                      onClick={() => seleccionarTurno(turnoDisponible)}
                      disabled={!disponibleParaSeleccion || procesandoReserva}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {turnoDisponible.horaInicio} - {turnoDisponible.horaFin}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {motivoNoDisponible ?? obtenerEtiquetaEstadoTurno(turnoDisponible.estado)}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {turnoSeleccionado && !datosTurnoReservado && (
                <div className="rounded-md border bg-muted/50 p-4">
                  <p className="mb-3 text-sm font-medium">
                    Horario seleccionado: {turnoSeleccionado.horaInicio} -{' '}
                    {turnoSeleccionado.horaFin}
                  </p>
                  <Button
                    onClick={() => void reservarTurno()}
                    disabled={procesandoReserva || fichaSaludCargada === false}
                    className="w-full sm:w-auto"
                  >
                    {procesandoReserva ? 'Reservando...' : 'Reservar turno'}
                  </Button>
                </div>
              )}
            </>
          )}

          {errorReserva && <p className="text-sm text-destructive">{errorReserva}</p>}
          {mensajeReserva && datosTurnoReservado && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-emerald-700">{mensajeReserva}</p>
                  <div className="space-y-1 text-sm text-emerald-600">
                    <p>
                      <span className="font-medium">Código:</span> #
                      {datosTurnoReservado.idTurno}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span>{' '}
                      {datosTurnoReservado.fechaTurno}
                    </p>
                    <p>
                      <span className="font-medium">Horario:</span>{' '}
                      {datosTurnoReservado.horaTurno}
                    </p>
                    <p>
                      <span className="font-medium">Profesional:</span>{' '}
                      {datosTurnoReservado.profesionalNombre}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
