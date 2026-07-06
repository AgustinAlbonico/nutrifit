import type { EstadoTurno, PaginatedData } from '@nutrifit/shared';
import { useNavigate } from '@tanstack/react-router';
import { Heart, Calendar, Activity, Target, ArrowRight, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { PlanAlimenticioCard } from '@/components/dashboard/PlanAlimenticioCard';
import { GraficoProgresoCard } from '@/components/dashboard/GraficoProgresoCard';
import { ObjetivosCard } from '@/components/dashboard/ObjetivosCard';
import { AccionesRapidasSocioCard } from '@/components/dashboard/AccionesRapidasSocioCard';
import { MensajeMotivacional } from '@/components/dashboard/MensajeMotivacional';
import { esEstadoTurnoVigente } from '@/lib/turnos/estadoTurno';
import type { ApiResponse } from '@/types/api';

interface MiTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidad: string;
}

type CategoriaIMC = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';

interface ResumenProgreso {
  peso: {
    actual: number | null;
  };
  imc: {
    actual: number | null;
    categoriaActual: CategoriaIMC | null;
  };
  rangoSaludable: {
    pesoMinimo: number | null;
    pesoMaximo: number | null;
  };
  totalMediciones: number;
}

interface DistanciaRangoSaludable {
  valor: number;
  estado: 'bajo' | 'alto' | 'dentro';
}

const formatearFechaTurno = (fecha: string): string =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

const ICONO_PROXIMO_TURNO = <Calendar className="h-4 w-4" />;
const ICONO_IMC = <Activity className="h-4 w-4" />;
const ICONO_OBJETIVO = <Target className="h-4 w-4" />;

const CATEGORIAS_IMC: Record<CategoriaIMC, string> = {
  bajo_peso: 'Bajo peso',
  normal: 'Normal',
  sobrepeso: 'Sobrepeso',
  obesidad: 'Obesidad',
};

const calcularDistanciaRangoSaludable = (
  pesoActual: number | null,
  pesoMinimo: number | null,
  pesoMaximo: number | null,
): DistanciaRangoSaludable | null => {
  if (pesoActual === null || pesoMinimo === null || pesoMaximo === null) {
    return null;
  }

  if (pesoActual < pesoMinimo) {
    return { valor: pesoMinimo - pesoActual, estado: 'bajo' };
  }

  if (pesoActual > pesoMaximo) {
    return { valor: pesoActual - pesoMaximo, estado: 'alto' };
  }

  return { valor: 0, estado: 'dentro' };
};

export function DashboardSocio() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // KPIs - Turnos
  const { data: turnosResponse, isLoading: cargandoTurnos } = useQuery({
    queryKey: ['mis-turnos', token],
    queryFn: () =>
      apiRequest<ApiResponse<PaginatedData<MiTurno>>>(
        '/turnos/socio/mis-turnos?page=1&limit=5',
        { token },
      ),
    enabled: !!token,
  });

  // KPIs - Progreso
  const { data: progresoResponse, isLoading: cargandoProgreso } = useQuery({
    queryKey: ['mi-progreso', token],
    queryFn: () =>
      apiRequest<ApiResponse<ResumenProgreso>>('/turnos/socio/mi-progreso', {
        token,
      }),
    enabled: !!token,
  });

  const turnos = turnosResponse?.data?.data ?? [];
  const progreso = progresoResponse?.data ?? null;

  // Calcular proximo turno
  const ahora = new Date();
  const proximoTurno = turnos
    .filter((t) => {
      if (!esEstadoTurnoVigente(t.estadoTurno)) {
        return false;
      }

      if (t.estadoTurno === 'PRESENTE' || t.estadoTurno === 'EN_CURSO') {
        return true;
      }

      const fechaTurno = new Date(`${t.fechaTurno}T${t.horaTurno}`);
      return fechaTurno.getTime() >= ahora.getTime();
    })
    .sort((a, b) => {
      const fechaA = new Date(`${a.fechaTurno}T${a.horaTurno}`);
      const fechaB = new Date(`${b.fechaTurno}T${b.horaTurno}`);
      return fechaA.getTime() - fechaB.getTime();
    })[0];

  const distanciaRangoSaludable = calcularDistanciaRangoSaludable(
    progreso?.peso.actual ?? null,
    progreso?.rangoSaludable.pesoMinimo ?? null,
    progreso?.rangoSaludable.pesoMaximo ?? null,
  );

  const textoProximoTurno = proximoTurno
    ? formatearFechaTurno(proximoTurno.fechaTurno)
    : 'Sin turnos';
  const detalleProximoTurno = proximoTurno
    ? `${proximoTurno.horaTurno} hs · ${proximoTurno.profesionalNombreCompleto}`
    : 'Reservá tu próxima consulta para sostener el seguimiento.';
  const mensajeHero = proximoTurno
    ? `Tu próxima consulta es con ${proximoTurno.profesionalNombreCompleto}. Revisá tu evolución y llevá tus dudas para aprovecharla mejor.`
    : 'Todavía no tenés un turno próximo. Agendá una consulta y retomá el seguimiento con tu nutricionista.';
  const textoImc = progreso?.imc.actual !== null && progreso?.imc.actual !== undefined
    ? progreso.imc.actual.toFixed(1)
    : '-';
  const descripcionImc = progreso?.imc.categoriaActual
    ? CATEGORIAS_IMC[progreso.imc.categoriaActual]
    : 'Sin datos';
  const textoDistanciaRango = distanciaRangoSaludable
    ? `${distanciaRangoSaludable.valor.toFixed(1)} kg`
    : '-';
  const descripcionDistanciaRango = distanciaRangoSaludable
    ? {
        bajo: 'por debajo del rango saludable',
        alto: 'sobre el rango saludable',
        dentro: 'Dentro del rango saludable',
      }[distanciaRangoSaludable.estado]
    : 'Sin rango calculado';

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-50 via-rose-50 to-background p-6 shadow-sm md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Badge className="mb-4 border-0 bg-orange-100 text-orange-700 hover:bg-orange-100">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Tu plan de hoy
            </Badge>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              <Heart className="h-8 w-8 text-orange-500" />
              Seguimiento nutricional
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {mensajeHero}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                className="bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => navigate({ to: '/turnos/agendar' })}
              >
                Reservar turno
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-orange-200 bg-white/80 hover:bg-orange-50"
                onClick={() => navigate({ to: '/mi-progreso' })}
              >
                Ver mi progreso
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-muted-foreground">Próximo paso</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{textoProximoTurno}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{detalleProximoTurno}</p>
            <div className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">
              Tus mediciones las carga el nutricionista. Acá podés revisar tu
              evolución antes de la consulta.
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <EstadisticasKpiCard
          titulo="Próximo Turno"
          valor={textoProximoTurno}
          descripcion={proximoTurno ? `${proximoTurno.horaTurno} hs` : 'Sin turno agendado'}
          icono={ICONO_PROXIMO_TURNO}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Mi IMC"
          valor={textoImc}
          descripcion={descripcionImc}
          icono={ICONO_IMC}
          cargando={cargandoProgreso}
        />
        <EstadisticasKpiCard
          titulo="Distancia saludable"
          valor={textoDistanciaRango}
          descripcion={descripcionDistanciaRango}
          icono={ICONO_OBJETIVO}
          cargando={cargandoProgreso}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <PlanAlimenticioCard />
        <GraficoProgresoCard />
        <ObjetivosCard />
        <MensajeMotivacional />
      </div>

      {/* Footer - Acciones */}
      <AccionesRapidasSocioCard />
    </div>
  );
}
