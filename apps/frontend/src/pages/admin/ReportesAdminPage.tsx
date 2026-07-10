import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  Brain,
  CalendarCheck,
  Download,
  Filter,
  Loader2,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, apiRequest } from '@/lib/api';

interface KpiTurnos {
  programados: number;
  presentes: number;
  ausentes: number;
  cancelados: number;
  reprogramados: number;
  total: number;
  ratioPresencia: number;
  ratioAusencia: number;
}

interface KpiSocios {
  totalSocios: number;
  conFichaCompleta: number;
  sinFichaCompleta: number;
  conPlanActivo: number;
  sinPlanActivo: number;
}

interface KpiProfesional {
  profesionalId: string;
  nombreProfesional: string;
  turnosProgramados: number;
  turnosRealizados: number;
  ratioAusencias: number;
  usoIa: number;
}

interface KpiCompleto {
  turnos: KpiTurnos;
  socios: KpiSocios;
  profesionales: KpiProfesional[];
  usoIa: { profesionalId: string; cantidad: number }[];
  periodo: { fechaInicio: string; fechaFin: string };
}

interface DatoTurnoEstado {
  estado: string;
  cantidad: number;
  color: string;
}

interface DatoProfesionalGrafico {
  nombre: string;
  Programados: number;
  Realizados: number;
  'Uso IA': number;
}

interface DatoSocio {
  nombre: string;
  valor: number;
}

const COLORES_TURNOS: Record<string, string> = {
  Programados: '#3b82f6',
  Presentes: '#10b981',
  Ausentes: '#ef4444',
  Cancelados: '#6b7280',
  Reprogramados: '#f59e0b',
};

const COLORES_SOCIOS = ['#10b981', '#f59e0b', '#3b82f6', '#a855f7'];

const ROLES_AUTORIZADOS = ['ADMIN', 'SUPERADMIN'];

function formatearFechaInput(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function obtenerRangoPorDefecto(): { inicio: string; fin: string } {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 30);
  return { inicio: formatearFechaInput(inicio), fin: formatearFechaInput(fin) };
}

async function exportarCsvKpi(
  fechaInicio: string,
  fechaFin: string,
): Promise<void> {
  const authCrudo = localStorage.getItem('nutrifit.auth');
  const token = authCrudo ? (JSON.parse(authCrudo) as { token?: string }).token : null;

  const response = await fetch(
    `${API_BASE_URL}/admin/reportes/kpi/export?formato=csv&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error('No se pudo exportar el CSV');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `kpi-report-${fechaInicio}-${fechaFin}.csv`;
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function ReportesAdminPage() {
  const { rol } = useAuth();
  const rangoInicial = useMemo(() => obtenerRangoPorDefecto(), []);
  const [fechaInicio, setFechaInicio] = useState(rangoInicial.inicio);
  const [fechaFin, setFechaFin] = useState(rangoInicial.fin);
  const [exportando, setExportando] = useState(false);

  const autorizado = rol !== null && ROLES_AUTORIZADOS.includes(rol);

  const consultaKpi = useQuery({
    queryKey: ['admin', 'kpi-completo', fechaInicio, fechaFin],
    queryFn: async () => {
      // El backend envuelve cada respuesta con ApiResponseInterceptor
      // ({ success, message, data, meta, errors }); apiRequest no desenvuelve.
      const respuesta = await apiRequest<{ data: KpiCompleto }>(
        `/admin/estadisticas/kpi-completo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      );
      return respuesta.data;
    },
    enabled: autorizado && !!fechaInicio && !!fechaFin,
  });

  const datos = consultaKpi.data;
  const cargando = consultaKpi.isLoading;
  const error = consultaKpi.error;

  const manejarCambiarInicio = (valor: string) => {
    setFechaInicio(valor);
  };

  const manejarCambiarFin = (valor: string) => {
    setFechaFin(valor);
  };

  const manejarExportarCsv = async () => {
    try {
      setExportando(true);
      await exportarCsvKpi(fechaInicio, fechaFin);
      toast.success('CSV exportado correctamente');
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      toast.error(mensaje);
    } finally {
      setExportando(false);
    }
  };

  const datosTurnos: DatoTurnoEstado[] = datos
    ? [
        { estado: 'Programados', cantidad: datos.turnos.programados, color: COLORES_TURNOS.Programados },
        { estado: 'Presentes', cantidad: datos.turnos.presentes, color: COLORES_TURNOS.Presentes },
        { estado: 'Ausentes', cantidad: datos.turnos.ausentes, color: COLORES_TURNOS.Ausentes },
        { estado: 'Cancelados', cantidad: datos.turnos.cancelados, color: COLORES_TURNOS.Cancelados },
        { estado: 'Reprogramados', cantidad: datos.turnos.reprogramados, color: COLORES_TURNOS.Reprogramados },
      ]
    : [];

  const datosProfesionales: DatoProfesionalGrafico[] = datos
    ? datos.profesionales.map((p) => ({
        nombre: p.nombreProfesional,
        Programados: p.turnosProgramados,
        Realizados: p.turnosRealizados,
        'Uso IA': p.usoIa,
      }))
    : [];

  const datosSocios: DatoSocio[] = datos
    ? [
        { nombre: 'Con ficha completa', valor: datos.socios.conFichaCompleta },
        { nombre: 'Sin ficha completa', valor: datos.socios.sinFichaCompleta },
        { nombre: 'Con plan activo', valor: datos.socios.conPlanActivo },
        { nombre: 'Sin plan activo', valor: datos.socios.sinPlanActivo },
      ]
    : [];

  const totalUsoIa = datos
    ? datos.usoIa.reduce((sumatoria, item) => sumatoria + item.cantidad, 0)
    : 0;

  const fechaHoy = formatearFechaInput(new Date());

  if (!autorizado) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Acceso denegado
        </h3>
        <p className="text-muted-foreground">
          No tenés permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reportes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Indicadores cruzados del gimnasio para asistir la toma de decisiones.
          </p>
        </div>
        <Button
          onClick={manejarExportarCsv}
          disabled={exportando || cargando}
          aria-label="Exportar reporte a CSV"
        >
          {exportando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Período
          </CardTitle>
          <CardDescription>
            Definí el rango de fechas para calcular los indicadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="fecha-inicio">Desde</Label>
            <Input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              max={fechaFin || fechaHoy}
              onChange={(evento) => manejarCambiarInicio(evento.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="fecha-fin">Hasta</Label>
            <Input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              min={fechaInicio}
              max={fechaHoy}
              onChange={(evento) => manejarCambiarFin(evento.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              Error al cargar los datos:{' '}
              {error instanceof Error ? error.message : 'desconocido'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EstadisticasKpiCard
          titulo="Total Socios"
          valor={datos?.socios.totalSocios ?? '-'}
          icono={<Users className="h-4 w-4" />}
          descripcion={
            datos
              ? `${datos.socios.conFichaCompleta} con ficha completa`
              : undefined
          }
          cargando={cargando}
        />
        <EstadisticasKpiCard
          titulo="Total Turnos"
          valor={datos?.turnos.total ?? '-'}
          icono={<CalendarCheck className="h-4 w-4" />}
          descripcion={
            datos ? 'En el período seleccionado' : undefined
          }
          cargando={cargando}
        />
        <EstadisticasKpiCard
          titulo="% Asistencia"
          valor={
            datos ? `${(datos.turnos.ratioPresencia * 100).toFixed(1)}%` : '-'
          }
          icono={<BarChart3 className="h-4 w-4" />}
          badge={
            datos
              ? datos.turnos.ratioPresencia >= 0.7
                ? { texto: 'Buena asistencia', variante: 'success' }
                : { texto: 'Asistencia baja', variante: 'warning' }
              : undefined
          }
          descripcion={
            datos
              ? `${datos.turnos.presentes} presentes / ${datos.turnos.total} totales`
              : undefined
          }
          cargando={cargando}
        />
        <EstadisticasKpiCard
          titulo="Sugerencias IA"
          valor={totalUsoIa}
          icono={<Brain className="h-4 w-4" />}
          descripcion={
            datos
              ? `${datos.usoIa.length} profesionales usaron IA`
              : undefined
          }
          cargando={cargando}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Distribución de turnos por estado
            </CardTitle>
            <CardDescription>
              Cantidad de turnos agrupados según su estado actual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={datosTurnos}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {datosTurnos.map((entrada, indice) => (
                      <Cell key={`turno-${indice}`} fill={entrada.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composición de socios</CardTitle>
            <CardDescription>
              Distribución según ficha clínica y plan alimentario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Pie
                    data={datosSocios}
                    dataKey="valor"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  >
                    {datosSocios.map((_entrada, indice) => (
                      <Cell
                        key={`socio-${indice}`}
                        fill={COLORES_SOCIOS[indice % COLORES_SOCIOS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad por nutricionista</CardTitle>
          <CardDescription>
            Turnos programados, realizados y uso de IA por profesional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Skeleton className="h-80 w-full" />
          ) : datosProfesionales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay datos de profesionales en este período.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={datosProfesionales}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="nombre"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={70}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Programados" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Realizados" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Uso IA" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por nutricionista</CardTitle>
          <CardDescription>
            Resumen numérico de cada profesional en el período.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {cargando ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, indice) => (
                <Skeleton key={indice} className="h-10 w-full" />
              ))}
            </div>
          ) : !datos || datos.profesionales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay profesionales para mostrar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="text-right">Programados</TableHead>
                  <TableHead className="text-right">Realizados</TableHead>
                  <TableHead className="text-right">% Ausencias</TableHead>
                  <TableHead className="text-right">Uso IA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.profesionales.map((profesional) => (
                  <TableRow key={profesional.profesionalId}>
                    <TableCell className="font-medium">
                      {profesional.nombreProfesional}
                    </TableCell>
                    <TableCell className="text-right">
                      {profesional.turnosProgramados}
                    </TableCell>
                    <TableCell className="text-right">
                      {profesional.turnosRealizados}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          profesional.ratioAusencias >= 0.3
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {(profesional.ratioAusencias * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {profesional.usoIa}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}