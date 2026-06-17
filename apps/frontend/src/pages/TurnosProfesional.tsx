import type { EstadoTurno } from '@nutrifit/shared';
import { useCallback, useEffect, useState } from 'react';
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
  FileCheck,
  Ban,
  Eye,
  History,
  FileText,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPaciente } from '@/components/ui/avatar-paciente';
import { MarcarAusenteManualModal } from '@/components/turnos/MarcarAusenteManualModal';
import { RevertirAusenteModal } from '@/components/turnos/RevertirAusenteModal';
import { obtenerClasesEstadoTurno } from '@/lib/turnos/estadoTurno';
import type { ApiResponse } from '@/types/api';

interface TurnoDelDia {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  tipoConsulta: string;
  socio: {
    idPersona: number;
    nombreCompleto: string;
    dni: string;
    objetivo: string | null;
  };
  fichaActualizada: boolean;
  consultaId: number | null;
}



export function TurnosProfesional() {
  const { token, rol, personaId } = useAuth();
  const navigate = useNavigate();
  const esNutricionista = rol === 'NUTRICIONISTA';
  const esAdmin = rol === 'ADMIN';

  const [fechaReferencia] = useState<Date>(() => new Date());
  const [turnos, setTurnos] = useState<TurnoDelDia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);

  // Estado para el modal de marcar ausente manual
  const [modalAusenteOpen, setModalAusenteOpen] = useState(false);
  const [turnoIdAusente, setTurnoIdAusente] = useState<number | null>(null);

  // Estado para el modal de revertir ausente
  const [modalRevertirOpen, setModalRevertirOpen] = useState(false);
  const [turnoIdRevertir, setTurnoIdRevertir] = useState<number | null>(null);

  const cargarAgenda = useCallback(async () => {
    if (!token || !esNutricionista || !personaId) {
      setTurnos([]);
      return;
    }

    try {
      setCargando(true);

      // El endpoint /hoy devuelve los turnos del nutricionista para el
      // dia actual, ya con metadata clinica: fichaActualizada, consultaId.
      const response = await apiRequest<ApiResponse<TurnoDelDia[]>>(
        `/turnos/profesional/${personaId}/hoy`,
        { token },
      );

      setTurnos(response.data ?? []);
    } catch {
      toast.error('No se pudo cargar la agenda del día.');
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  }, [token, esNutricionista, personaId]);

  useEffect(() => {
    void cargarAgenda();
  }, [cargarAgenda]);

  const marcarPresente = async (turnoId: number) => {
    if (!token || !personaId || !esNutricionista) {
      return;
    }

    try {
      setProcesando(`presente-${turnoId}`);
      await apiRequest(
        `/turnos/profesional/${personaId}/${turnoId}/asistencia`,
        {
          method: 'PATCH',
          token,
          body: { estado: 'PRESENTE' },
        },
      );
      toast.success('Asistencia registrada.');
      await cargarAgenda();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar asistencia';
      toast.error(msg);
    } finally {
      setProcesando(null);
    }
  };

  const abrirModalAusente = (turnoId: number) => {
    setTurnoIdAusente(turnoId);
    setModalAusenteOpen(true);
  };

  const getEstadoBadge = (estado: EstadoTurno) => {
    return (
      <Badge className={obtenerClasesEstadoTurno(estado)}>
        {estado === 'PRESENTE' && <User className="mr-1 h-3 w-3" />}
        {(estado === 'PROGRAMADO' || estado === 'CONFIRMADO') && <Clock className="mr-1 h-3 w-3" />}
        {estado === 'EN_CURSO' && <PlayCircle className="mr-1 h-3 w-3" />}
        {estado === 'REALIZADO' && <CheckCircle2 className="mr-1 h-3 w-3" />}
        {estado === 'CANCELADO' && <XCircle className="mr-1 h-3 w-3" />}
        {estado === 'AUSENTE' && <Ban className="mr-1 h-3 w-3" />}
        {estado}
      </Badge>
    );
  };

  if (!esNutricionista && !esAdmin) {
    return (
      <div className="pb-10">
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

  // El endpoint /hoy es para nutricionistas; admin sigue con su flujo
  // de disponibilidad por fecha (out of scope en PR #1).
  if (esAdmin) {
    return (
      <div className="pb-10">
        <Card className="rounded-2xl border-0 shadow-lg ring-1 ring-border/50">
          <CardHeader className="bg-blue-50/50 pt-8">
            <CardTitle className="text-2xl text-blue-600">
              Vista de administración
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <p className="text-muted-foreground">
              La nueva agenda del día con metadata clínica (ficha
              actualizada, consulta) se entrega únicamente al nutricionista.
              El flujo admin se mantiene en la pantalla anterior.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-orange-500" />
              Mi Agenda de Hoy
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Turnos del {format(fechaReferencia, 'dd/MM/yyyy')}.
              Gestioná la asistencia y abrí cada consulta desde acá.
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right:20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg ring-1 ring-border/50">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-500 to-rose-500" />
        <CardHeader className="border-b bg-slate-50/50 pb-6 pt-8">
          <CardTitle className="flex items-center text-xl font-bold">
            <CalendarDays className="mr-3 h-6 w-6 text-orange-500" />
            Turnos del {format(fechaReferencia, 'dd/MM/yyyy')}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {cargando ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="animate-pulse text-sm font-medium text-muted-foreground">
                Cargando agenda...
              </p>
            </div>
          ) : turnos.length === 0 ? (
            <div className="flex min-h-[300px] animate-in zoom-in-95 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center duration-500">
              <div className="mb-4 rounded-full bg-orange-100 p-4 shadow-inner">
                <CalendarX2 className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-800">
                Sin turnos para hoy
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                No tenés turnos asignados para esta fecha. Si esperás un turno
                nuevo, esperá a que un socio o administrador lo registre.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {turnos.map((turno) => {
                const estado = turno.estadoTurno;
                const procesandoKey = `${estado}-${turno.idTurno}`;

                return (
                  <div
                    key={turno.idTurno}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
                      estado === 'AUSENTE' || estado === 'CANCELADO'
                        ? 'border-rose-100 bg-rose-50/30'
                        : estado === 'REALIZADO'
                          ? 'border-emerald-100 bg-emerald-50/20'
                          : estado === 'EN_CURSO'
                            ? 'border-violet-100 bg-violet-50/20'
                            : 'border-blue-100 bg-blue-50/20'
                    }`}
                  >
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-1.5 ${
                        estado === 'AUSENTE' || estado === 'CANCELADO'
                          ? 'bg-rose-400'
                          : estado === 'REALIZADO'
                            ? 'bg-emerald-400'
                            : estado === 'PROGRAMADO' || estado === 'CONFIRMADO'
                              ? 'bg-amber-400'
                              : estado === 'EN_CURSO'
                                ? 'bg-violet-400'
                                : 'bg-blue-400'
                      }`}
                    />

                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xl font-bold tracking-tight">
                          {turno.horaTurno}
                        </span>
                      </div>
                      {getEstadoBadge(estado)}
                    </div>

                    <div className="mb-5 min-h-[3.5rem] flex-1 text-sm">
                      <div className="flex items-start gap-3 rounded-xl bg-background/60 p-3 shadow-sm ring-1 ring-border/50">
                        <AvatarPaciente
                          fotoUrl={null}
                          nombreCompleto={turno.socio.nombreCompleto}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold block truncate">
                              {turno.socio.nombreCompleto}
                            </span>
                            {turno.fichaActualizada && (
                              <Badge
                                className="border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                title="La ficha de salud se actualizó después de la última consulta"
                              >
                                <FileCheck className="mr-1 h-3 w-3" />
                                Ficha actualizada
                              </Badge>
                            )}
                          </div>
                          <span className="flex items-center text-xs text-muted-foreground">
                            <User className="mr-1 h-3 w-3" />
                            DNI: {turno.socio.dni}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones contextuales por estado (TASK-1.16). */}
                    <div className="mt-auto flex flex-col gap-2">
                      {(estado === 'PROGRAMADO' || estado === 'CONFIRMADO') && (
                        <>
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:from-orange-600 hover:to-rose-600"
                            onClick={() => void marcarPresente(turno.idTurno)}
                            disabled={Boolean(procesando)}
                          >
                            {procesando === procesandoKey ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <User className="mr-2 h-3 w-3" />
                            )}
                            Marcar presente
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => abrirModalAusente(turno.idTurno)}
                            disabled={Boolean(procesando)}
                          >
                            <Ban className="mr-2 h-3 w-3" />
                            Marcar ausente
                          </Button>
                        </>
                      )}

                      {estado === 'PRESENTE' && (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm hover:from-orange-600 hover:to-rose-600"
                          onClick={() =>
                            navigate({
                              to: `/profesional/consulta/${turno.idTurno}`,
                            })
                          }
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Iniciar consulta
                        </Button>
                      )}

                      {estado === 'EN_CURSO' && (
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:from-violet-600 hover:to-indigo-600"
                          onClick={() =>
                            navigate({
                              to: `/profesional/consulta/${turno.idTurno}`,
                            })
                          }
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Continuar consulta
                        </Button>
                      )}

                      {estado === 'REALIZADO' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() =>
                            navigate({
                              to: `/profesional/consulta/${turno.idTurno}`,
                            })
                          }
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          Ver consulta
                        </Button>
                      )}

                      {estado === 'AUSENTE' && (
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTurnoIdRevertir(turno.idTurno);
                              setModalRevertirOpen(true);
                            }}
                            disabled={Boolean(procesando)}
                            className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <History className="mr-2 h-3 w-3" />
                            Revertir ausente
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate({
                                to: `/profesional/paciente/${turno.socio.idPersona}/ficha-salud`,
                              })
                            }
                            disabled={Boolean(procesando)}
                            className="w-full text-muted-foreground hover:text-foreground"
                          >
                            <FileText className="mr-2 h-3 w-3" />
                            Ver ficha del paciente
                          </Button>
                        </div>
                      )}

                      {estado === 'CANCELADO' && (
                        <div className="flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                          <ShieldBan className="h-3 w-3" />
                          <span>No requiere acción</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de marcar ausente manual (TASK-1.17). */}
      {esNutricionista && personaId && token && turnoIdAusente !== null && (
        <MarcarAusenteManualModal
          isOpen={modalAusenteOpen}
          onClose={() => {
            setModalAusenteOpen(false);
            setTurnoIdAusente(null);
          }}
          turnoId={turnoIdAusente}
          token={token}
          onConfirmado={async () => {
            setModalAusenteOpen(false);
            setTurnoIdAusente(null);
            await cargarAgenda();
          }}
        />
      )}

      {/* Modal de revertir ausente (incluye opción de check-in directo). */}
      {esNutricionista && token && turnoIdRevertir !== null && (
        <RevertirAusenteModal
          isOpen={modalRevertirOpen}
          onClose={() => {
            setModalRevertirOpen(false);
            setTurnoIdRevertir(null);
          }}
          turnoId={turnoIdRevertir}
          onSuccess={async () => {
            setModalRevertirOpen(false);
            setTurnoIdRevertir(null);
            await cargarAgenda();
          }}
        />
      )}
    </div>
  );
}
