import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, FileText, HeartPulse, Scale, Target, Utensils } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparadorFotosSesion } from '@/components/progreso/ComparadorFotosSesion';
import { HistorialTurnosPaciente } from '@/components/pacientes/HistorialTurnosPaciente';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { GaleriaFotos, HistorialMediciones } from '@/components/progreso/types';
import type {
  HistorialConsultaPaciente,
  HistorialTurnoPaciente,
} from '@/types/consulta';

interface FichaSaludPaciente {
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: string;
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string | null;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  restriccionesAlimentarias: string | null;
  horasSueno: number | null;
}

interface ListaObjetivosFicha {
  activos: Array<{ idObjetivo: number; tipoMetrica: string; valorActual: number; valorObjetivo: number; progreso: number }>;
  completados: Array<{ idObjetivo: number; tipoMetrica: string; valorActual: number; valorObjetivo: number; progreso: number }>;
}

export function FichaPacientePage() {
  const { token, personaId } = useAuth();
  const navigate = useNavigate();
  const { socioId: socioIdParam } = useParams({ from: '/auth/profesional/paciente/$socioId/ficha' });
  const socioId = Number(socioIdParam);

  const habilitado = !!token && !!personaId && !!socioId;

  const fichaQuery = useQuery({
    queryKey: ['ficha-paciente', personaId, socioId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<FichaSaludPaciente>>(
        `/turnos/profesional/${personaId}/pacientes/${socioId}/ficha-salud`,
        { token },
      );
      return response.data;
    },
    enabled: habilitado,
  });

  const historialQuery = useQuery({
    queryKey: ['paciente', socioId, 'mediciones', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<HistorialMediciones>>(
        `/turnos/profesional/${personaId}/pacientes/${socioId}/historial-mediciones`,
        { token },
      );
      return response.data;
    },
    enabled: habilitado,
  });

  const consultasQuery = useQuery({
    queryKey: ['ficha-paciente', 'consultas', personaId, socioId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<HistorialConsultaPaciente[]>>(
        `/turnos/profesional/${personaId}/pacientes/${socioId}/historial-consultas`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: habilitado,
  });

  const historialTurnosQuery = useQuery({
    queryKey: ['ficha-paciente', 'turnos', personaId, socioId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<HistorialTurnoPaciente[]>>(
        `/turnos/profesional/${personaId}/pacientes/${socioId}/historial-turnos`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: habilitado,
  });

  const fotosQuery = useQuery({
    queryKey: ['paciente', socioId, 'fotos', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<GaleriaFotos>>(
        `/progreso/${socioId}/fotos`,
        { token },
      );
      return response.data;
    },
    enabled: habilitado,
  });

  const objetivosQuery = useQuery({
    queryKey: ['paciente', socioId, 'objetivos', token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<ListaObjetivosFicha>>(
        `/progreso/${socioId}/objetivos`,
        { token },
      );
      return response.data;
    },
    enabled: habilitado,
  });

  if (!socioId) {
    return <MensajeError mensaje="No se pudo identificar al paciente." />;
  }

  const cargando =
    fichaQuery.isLoading ||
    historialQuery.isLoading ||
    consultasQuery.isLoading ||
    historialTurnosQuery.isLoading ||
    fotosQuery.isLoading ||
    objetivosQuery.isLoading;
  const ficha = fichaQuery.data;
  const historial = historialQuery.data;
  const objetivosActivos = objetivosQuery.data?.activos ?? [];
  const turnos = historialTurnosQuery.data ?? [];
  const ultimaMedicion = historial?.mediciones.at(0);
  const nombrePaciente = historial
    ? `${historial.nombreSocio} ${historial.apellidoSocio}`.trim()
    : 'Paciente';

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
              <Link to="/pacientes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a pacientes
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Ficha longitudinal de {cargando ? 'paciente' : nombrePaciente}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Una vista única para entender historia clínica, evolución,
              objetivos, consultas y fotos por sesión.
            </p>
          </div>
          <Button asChild>
            <Link
              to="/profesional/paciente/$socioId/progreso"
              params={{ socioId: String(socioId) }}
            >
              Ver progreso completo
            </Link>
          </Button>
        </div>
      </div>

      {cargando ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricaFicha icono={Scale} etiqueta="Peso actual" valor={ultimaMedicion ? `${ultimaMedicion.peso} kg` : '-'} />
            <MetricaFicha icono={HeartPulse} etiqueta="IMC actual" valor={ultimaMedicion?.imc ? ultimaMedicion.imc.toFixed(1) : '-'} />
            <MetricaFicha icono={Calendar} etiqueta="Turnos con el profesional" valor={String(turnos.length)} />
            <MetricaFicha icono={Target} etiqueta="Objetivos activos" valor={String(objetivosActivos.length)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Ficha de salud
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DatoFicha etiqueta="Altura" valor={ficha ? `${ficha.altura} cm` : '-'} />
                <DatoFicha
                  etiqueta="Ultimo peso registrado"
                  valor={ultimaMedicion ? `${ultimaMedicion.peso} kg` : 'Sin registros'}
                />
                <DatoFicha
                  etiqueta="IMC de la ultima medicion"
                  valor={ultimaMedicion?.imc ? ultimaMedicion.imc.toFixed(1) : '-'}
                />
                <DatoFicha etiqueta="Actividad fisica" valor={ficha?.nivelActividadFisica ?? '-'} />
                <DatoFicha etiqueta="Sueno" valor={ficha?.horasSueno ? `${ficha.horasSueno} h` : '-'} />
                <DatoFicha etiqueta="Objetivo personal" valor={ficha?.objetivoPersonal ?? '-'} ancho />
                <DatoFicha etiqueta="Restricciones" valor={ficha?.restriccionesAlimentarias ?? '-'} ancho />
                <DatoFicha etiqueta="Alergias" valor={ficha?.alergias?.join(', ') || '-'} />
                <DatoFicha etiqueta="Patologias" valor={ficha?.patologias?.join(', ') || '-'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                  Plan y objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objetivosActivos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay objetivos activos.</p>
                ) : (
                  objetivosActivos.map((objetivo) => (
                    <div key={objetivo.idObjetivo} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{objetivo.tipoMetrica}</p>
                        <span className="text-sm text-muted-foreground">{objetivo.progreso}%</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {objetivo.valorActual} / {objetivo.valorObjetivo}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <HistorialTurnosPaciente
            turnos={turnos}
            cargando={historialTurnosQuery.isLoading}
            onRetomarTurno={(idTurno) => {
              void navigate({ to: `/profesional/consulta/${idTurno}` });
            }}
          />

          <ComparadorFotosSesion sesiones={fotosQuery.data?.sesiones ?? []} />
        </>
      )}
    </div>
  );
}

function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
      {mensaje}
    </div>
  );
}

function MetricaFicha({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Scale;
  etiqueta: string;
  valor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icono className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{etiqueta}</p>
          <p className="text-xl font-bold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DatoFicha({ etiqueta, valor, ancho = false }: { etiqueta: string; valor: string; ancho?: boolean }) {
  return (
    <div className={ancho ? 'md:col-span-2' : undefined}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 font-medium">{valor}</p>
    </div>
  );
}
