import { useEffect, useState, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileText,
  Calendar,
  Lock,
  Utensils,
  Sun,
  CloudSun,
  Coffee,
  Moon,
  Apple,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Salad,
} from 'lucide-react';

import { ExportPlanPDFButton } from '@/components/plan/ExportPlanPDFButton';
import type { ComidaEnPlan } from '@/components/plan/WeeklyPlanGrid';

// ── Tipos que coinciden con el backend ────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface Alimento {
  idAlimento: number;
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: string;
}

interface ItemComida {
  idItemComida: number;
  cantidad: number;
  unidad: string;
  notas: string | null;
  alimento: Alimento;
}

interface OpcionComida {
  idOpcionComida: number;
  tipoComida: TipoComida;
  comentarios: string | null;
  items: ItemComida[];
}

interface DiaPlan {
  idDiaPlan: number;
  dia: DiaSemana;
  orden: number;
  opcionesComida: OpcionComida[];
}

interface PlanAlimentacion {
  idPlanAlimentacion: number;
  fechaCreacion: string;
  objetivoNutricional: string;
  activo: boolean;
  eliminadoEn: string | null;
  motivoEliminacion: string | null;
  motivoEdicion: string | null;
  ultimaEdicion: string | null;
  socioId: number;
  nutricionistaId: number;
  dias: DiaPlan[];
}

type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';
type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';

type EstadoPlan = 'CARGANDO' | 'ACTIVO' | 'SIN_PLAN' | 'SIN_PERMISOS' | 'ERROR';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORDEN_DIAS: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const ICONOS_COMIDA: Record<TipoComida, React.ElementType> = {
  DESAYUNO: Sun,
  ALMUERZO: CloudSun,
  MERIENDA: Coffee,
  CENA: Moon,
  COLACION: Apple,
};

const COLORES_COMIDA: Record<TipoComida, string> = {
  DESAYUNO: 'text-amber-500',
  ALMUERZO: 'text-orange-500',
  MERIENDA: 'text-rose-400',
  CENA: 'text-indigo-500',
  COLACION: 'text-green-500',
};

const NOMBRES_DIAS: Record<DiaSemana, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

interface TotalesNutricionales {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

function calcularTotalesComida(comida: OpcionComida): TotalesNutricionales {
  const items = comida.items || [];
  return items.reduce(
    (acc, item) => {
      const multiplicador = item.cantidad / (item.alimento.cantidad || 1);
      return {
        calorias: acc.calorias + (item.alimento.calorias || 0) * multiplicador,
        proteinas: acc.proteinas + (item.alimento.proteinas || 0) * multiplicador,
        carbohidratos:
          acc.carbohidratos + (item.alimento.carbohidratos || 0) * multiplicador,
        grasas: acc.grasas + (item.alimento.grasas || 0) * multiplicador,
      };
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );
}

function calcularCaloriasItem(item: ItemComida): number | null {
  if (item.alimento.calorias === null) {
    return null;
  }

  const multiplicador = item.cantidad / (item.alimento.cantidad || 1);
  return Math.round(item.alimento.calorias * multiplicador);
}

function calcularTotalesDia(dia: DiaPlan): TotalesNutricionales {
  const opciones = dia.opcionesComida || [];
  return opciones.reduce(
    (acc, comida) => {
      if (!comida) return acc;
      const totales = calcularTotalesComida(comida);
      return {
        calorias: acc.calorias + totales.calorias,
        proteinas: acc.proteinas + totales.proteinas,
        carbohidratos: acc.carbohidratos + totales.carbohidratos,
        grasas: acc.grasas + totales.grasas,
      };
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );
}

function ordenarDias(dias: DiaPlan[]): DiaPlan[] {
  return [...dias].sort((a, b) => {
    const indexA = ORDEN_DIAS.indexOf(a.dia as DiaSemana);
    const indexB = ORDEN_DIAS.indexOf(b.dia as DiaSemana);
    if (indexA !== indexB) return indexA - indexB;
    return a.orden - b.orden;
  });
}

// Helper para obtener nombre del día de forma segura
function obtenerNombreDia(dia: DiaSemana | string): string {
  return NOMBRES_DIAS[dia as DiaSemana] || String(dia);
}

// Helper para obtener icono de comida de forma segura
function obtenerIconoComida(tipo: TipoComida | string): React.ElementType {
  return ICONOS_COMIDA[tipo as TipoComida] || Apple;
}

// Helper para obtener color de comida de forma segura
function obtenerColorComida(tipo: TipoComida | string): string {
  return COLORES_COMIDA[tipo as TipoComida] || 'text-gray-500';
}

// Helper para convertir datos del plan al formato del PDF
function convertirAComidasEnPlan(dias: DiaPlan[]): ComidaEnPlan[] {
  const comidas: ComidaEnPlan[] = [];

  dias.forEach(dia => {
    dia.opcionesComida?.forEach(opcion => {
      comidas.push({
        dia: dia.dia as DiaSemana,
        tipoComida: opcion.tipoComida as TipoComida,
        alimentos: (opcion.items || []).map(item => ({
          alimento: {
            idAlimento: item.alimento.idAlimento,
            nombre: item.alimento.nombre,
            cantidad: item.alimento.cantidad,
            unidadMedida: item.alimento.unidadMedida,
            calorias: item.alimento.calorias,
            proteinas: item.alimento.proteinas,
            carbohidratos: item.alimento.carbohidratos,
            grasas: item.alimento.grasas,
            grupoAlimenticio: null,
          },
          cantidad: item.cantidad,
        })),
      });
    });
  });

  return comidas;
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function MiPlanPage() {
  const { token, personaId } = useAuth();

  const [estado, establecerEstado] = useState<EstadoPlan>('CARGANDO');
  const [error, setError] = useState<string | null>(null);
  const [planActivo, establecerPlanActivo] = useState<PlanAlimentacion | null>(null);

  useEffect(() => {
    if (!token || !personaId) {
      return;
    }

    const cargarPlan = async () => {
      try {
        setError(null);
        establecerEstado(() => 'CARGANDO');

        const response = await apiRequest<ApiResponse<PlanAlimentacion>>(
          `/planes-alimentacion/socio/${personaId}/activo`,
          { token }
        );

        if (response.data) {
          establecerPlanActivo(response.data);
          establecerEstado(() => 'ACTIVO');
        } else {
          establecerPlanActivo(null);
          establecerEstado(() => 'SIN_PLAN');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          establecerEstado(() => 'SIN_PERMISOS');
        } else if (err instanceof Error && err.message.includes('404')) {
          establecerEstado(() => 'SIN_PLAN');
        } else {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el plan');
          establecerEstado(() => 'ERROR');
        }
      }
    };

    void cargarPlan();
  }, [token, personaId]);

  const mostrarErrorInicial = useMemo(
    () => !token && !personaId && estado === 'CARGANDO',
    [token, personaId, estado]
  );

  const mostrarSinPermisos = useMemo(() => estado === 'SIN_PERMISOS', [estado]);

  const formatearFecha = (fechaStr: string | undefined | null) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderizarAlimento = (item: ItemComida) => (
    <div
      key={item.idItemComida}
      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1">
        <span className="font-medium text-sm">{item.alimento.nombre}</span>
        <span className="text-muted-foreground text-xs ml-2">
          ({item.cantidad} {item.unidad})
        </span>
      </div>
      {calcularCaloriasItem(item) !== null && (
        <Badge variant="outline" className="text-xs">
          {calcularCaloriasItem(item)} kcal
        </Badge>
      )}
    </div>
  );

  const renderizarComida = (comida: OpcionComida) => {
    const Icono = obtenerIconoComida(comida.tipoComida);
    const colorIcono = obtenerColorComida(comida.tipoComida);
    const totales = calcularTotalesComida(comida);

    return (
      <div key={comida.idOpcionComida} className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icono className={`h-5 w-5 ${colorIcono}`} />
            <h4 className="font-semibold capitalize">{String(comida.tipoComida).toLowerCase()}</h4>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {totales.calorias} kcal
            </span>
            <span className="flex items-center gap-1">
              <Beef className="h-3 w-3 text-red-400" />
              {totales.proteinas.toFixed(1)}g
            </span>
            <span className="flex items-center gap-1">
              <Wheat className="h-3 w-3 text-amber-500" />
              {totales.carbohidratos.toFixed(1)}g
            </span>
            <span className="flex items-center gap-1">
              <Droplet className="h-3 w-3 text-blue-400" />
              {totales.grasas.toFixed(1)}g
            </span>
          </div>
        </div>

        {comida.comentarios && (
          <p className="text-sm text-muted-foreground italic mb-3 bg-muted/30 p-2 rounded">
            {comida.comentarios}
          </p>
        )}

        <div className="space-y-2">
          {(comida.items || []).length > 0 ? (
            (comida.items || []).filter(Boolean).map(renderizarAlimento)
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin alimentos asignados</p>
          )}
        </div>
      </div>
    );
  };

  const renderizarDia = (dia: DiaPlan) => {
    const totales = calcularTotalesDia(dia);

    return (
      <AccordionItem key={`${dia.dia}-${dia.orden}`} value={`${dia.dia}-${dia.orden}`}>
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">{obtenerNombreDia(dia.dia)}</span>
              <Badge variant="secondary" className="text-xs">
                {dia.opcionesComida?.length || 0} comidas
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                {totales.calorias} kcal
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Beef className="h-4 w-4 text-red-400" />P: {totales.proteinas.toFixed(0)}g
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Wheat className="h-4 w-4 text-amber-500" />C: {totales.carbohidratos.toFixed(0)}g
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Droplet className="h-4 w-4 text-blue-400" />G: {totales.grasas.toFixed(0)}g
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid gap-4 pt-2">
            {(dia.opcionesComida || [])
              .sort((a, b) => {
                const ordenTipo: (TipoComida | string)[] = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'];
                return ordenTipo.indexOf(a.tipoComida) - ordenTipo.indexOf(b.tipoComida);
              })
              .map(renderizarComida)}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderizarPlanActivo = () => {
    if (!planActivo) return null;

    const diasOrdenados = ordenarDias(planActivo.dias || []);
    const totalesPlan = diasOrdenados.reduce(
      (acc, dia) => {
        const totales = calcularTotalesDia(dia);
        return {
          calorias: acc.calorias + totales.calorias,
          proteinas: acc.proteinas + totales.proteinas,
          carbohidratos: acc.carbohidratos + totales.carbohidratos,
          grasas: acc.grasas + totales.grasas,
        };
      },
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
    );

    const promedioDiario = diasOrdenados.length > 0
      ? {
          calorias: Math.round(totalesPlan.calorias / diasOrdenados.length),
          proteinas: totalesPlan.proteinas / diasOrdenados.length,
          carbohidratos: totalesPlan.carbohidratos / diasOrdenados.length,
          grasas: totalesPlan.grasas / diasOrdenados.length,
        }
      : null;

    return (
      <div className="space-y-6">
        {/* Header del plan */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Utensils className="h-6 w-6 text-emerald-600" />
                  Mi Plan de Alimentación
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Creado: {formatearFecha(planActivo.fechaCreacion)}
                  {planActivo.ultimaEdicion && (
                    <span className="ml-2">· Editado: {formatearFecha(planActivo.ultimaEdicion)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ExportPlanPDFButton
                  objetivoNutricional={planActivo.objetivoNutricional || ''}
                  comidas={convertirAComidasEnPlan(planActivo.dias || [])}
                  planId={planActivo.idPlanAlimentacion}
                />
                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                  Activo
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {planActivo.objetivoNutricional && (
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Objetivo Nutricional
                </h3>
                <p className="text-sm">{planActivo.objetivoNutricional}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen nutricional */}
        {promedioDiario && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Resumen Nutricional Diario (Promedio)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {promedioDiario.calorias}
                  </div>
                  <div className="text-xs text-muted-foreground">Calorías</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {promedioDiario.proteinas.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Proteínas</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {promedioDiario.carbohidratos.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Carbohidratos</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {promedioDiario.grasas.toFixed(0)}g
                  </div>
                  <div className="text-xs text-muted-foreground">Grasas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Días del plan */}
        {diasOrdenados.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Plan Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {diasOrdenados.map(renderizarDia)}
              </Accordion>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>El plan no tiene días configurados</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Salad className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Mi Plan de Alimentación
            </h1>
          </div>
          <p className="text-muted-foreground">
            Consulta tu plan nutricional personalizado con detalle de comidas y macros.
          </p>
        </div>
      </div>

      {estado === 'CARGANDO' ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Cargando plan...
          </CardContent>
        </Card>
      ) : mostrarErrorInicial ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Faltan datos de autenticación
          </CardContent>
        </Card>
      ) : mostrarSinPermisos ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-6 w-6" />
              No tienes permiso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-dashed p-10 text-center">
              <Utensils className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                No tienes permiso para ver planes de alimentación.
              </p>
              <p className="text-xs text-muted-foreground">
                Solo los nutricionistas pueden gestionar planes de alimentación.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : estado === 'SIN_PLAN' ? (
        <Card>
          <CardHeader>
            <CardTitle>Plan no configurado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-dashed p-10 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-sm text-muted-foreground">
                No tienes un plan de alimentación activo.
              </p>
              <p className="text-xs text-muted-foreground">
                Contacta a tu nutricionista para crear tu plan personalizado.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : estado === 'ACTIVO' ? (
        renderizarPlanActivo()
      ) : null}

      {error && !mostrarErrorInicial && !mostrarSinPermisos && estado !== 'SIN_PLAN' && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
