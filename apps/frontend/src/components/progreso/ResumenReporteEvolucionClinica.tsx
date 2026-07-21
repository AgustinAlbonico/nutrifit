import { AlertCircle, CalendarCheck, Target, Weight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReporteEvolucionPaciente } from '@/components/progreso/types';

interface PropiedadesResumenReporteEvolucionClinica {
  reporte?: ReporteEvolucionPaciente;
  cargando: boolean;
  error: unknown;
}

function formatearFecha(fecha: string | null): string {
  return fecha
    ? new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin consultas registradas';
}

export function ResumenReporteEvolucionClinica({
  reporte,
  cargando,
  error,
}: PropiedadesResumenReporteEvolucionClinica) {
  if (cargando) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex gap-3 p-5 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          No se pudo cargar el resumen clínico del paciente.
        </CardContent>
      </Card>
    );
  }

  if (!reporte) {
    return null;
  }

  const { resumen } = reporte;
  const hayPeso = resumen.pesoInicial !== null && resumen.pesoActual !== null;

  return (
    <section className="space-y-4" aria-labelledby="titulo-resumen-clinico">
      <div>
        <h2 id="titulo-resumen-clinico" className="text-xl font-semibold">Resumen clínico</h2>
        <p className="text-sm text-muted-foreground">Indicadores calculados a partir de consultas realizadas.</p>
      </div>

      {resumen.sinControles && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>Sin controles recientes: pasaron {resumen.diasDesdeUltimoControl ?? resumen.umbralSinControlDias} días desde la última consulta. El umbral de seguimiento es de {resumen.umbralSinControlDias} días.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Consultas realizadas</CardDescription><CardTitle className="text-2xl">{resumen.consultasRealizadas}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarCheck className="h-4 w-4" />Última: {formatearFecha(resumen.ultimaConsulta)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Plan alimentario</CardDescription><CardTitle className="text-2xl">{resumen.planActivo ? 'Activo' : 'Sin plan'}</CardTitle></CardHeader><CardContent><Badge variant={resumen.planActivo ? 'default' : 'outline'}>{resumen.planActivo ? 'Plan vigente' : 'Revisar seguimiento'}</Badge></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Peso actual</CardDescription><CardTitle className="text-2xl">{resumen.pesoActual === null ? 'Sin medición' : `${resumen.pesoActual} kg`}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xs text-muted-foreground"><Weight className="h-4 w-4" />{hayPeso ? `Inicial ${resumen.pesoInicial} kg · Variación ${resumen.diferenciaPeso ?? 0} kg` : 'Aún no hay mediciones comparables'}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Objetivo de peso</CardDescription><CardTitle className="text-2xl">{resumen.objetivoPeso ? `${resumen.objetivoPeso.progresoPorcentaje.toFixed(1)}%` : 'Sin objetivo'}</CardTitle></CardHeader><CardContent className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-4 w-4" />{resumen.objetivoPeso ? `Meta: ${resumen.objetivoPeso.valorObjetivo} kg` : 'No hay una meta activa'}</CardContent></Card>
      </div>
    </section>
  );
}
