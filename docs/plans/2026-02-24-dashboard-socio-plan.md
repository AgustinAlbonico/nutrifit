# Plan Detallado: Dashboard Socio

**Diseño general:** `docs/plans/2026-02-24-dashboard-mejoras-design.md`  
**Fecha:** 2026-02-24

---

## 1. Estado Actual

**Archivo:** `apps/frontend/src/pages/DashboardSocio.tsx`

```tsx
// Estructura actual (básica)
<div className="space-y-8 pb-10">
  <Header />
  <div className="grid gap-6 md:grid-cols-2">
    <ProximoTurnoCard />
    <ProgresoResumenCard />
  </div>
  <MensajeMotivacional />
</div>
```

**Componentes existentes:**
- `ProximoTurnoCard` - Próximo turno programado
- `ProgresoResumenCard` - Peso, IMC, objetivo
- `MensajeMotivacional` - Frase del día

---

## 2. Estructura Final

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "Mi Dashboard" + descripción                          │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: [Próximo Turno] [Mi IMC] [Progreso]                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Mi Plan Alimenticio      │  │ Gráfico de Progreso      │    │
│  │ (comidas del día)        │  │ (evolución peso/IMC)     │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Mis Objetivos            │  │ Mensaje Motivacional     │    │
│  │ (lista con progreso)     │  │ (frase del día)          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Acciones Rápidas                                      │
│  [Reservar Turno] [Ver Mi Plan] [Subir Foto]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tareas Detalladas

### Tarea 1: Crear PlanAlimenticioCard
**Archivo:** `apps/frontend/src/components/dashboard/PlanAlimenticioCard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Coffee, Apple, Soup, Moon, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';

interface Comida {
  tipo: 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';
  alimentos: string[];
  calorias?: number;
}

interface PlanActivo {
  idPlan: number;
  nombre: string;
  comidas: Comida[];
  caloriasTotales: number;
}

const ICONOS_COMIDA = {
  DESAYUNO: Coffee,
  ALMUERZO: Soup,
  MERIENDA: Apple,
  CENA: Moon,
  COLACION: Utensils,
};

export function PlanAlimenticioCard() {
  const { token, personaId } = useAuth();
  const navigate = useNavigate();

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan-activo', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: PlanActivo | null }>(
        `/planes-alimentacion/socio/${personaId}/activo`,
        { token }
      );
      return response.data;
    },
    enabled: !!token && !!personaId,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            No tenés un plan alimenticio activo. Contactá a tu nutricionista.
          </p>
          <Badge variant="secondary">Sin plan activo</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </span>
          <Badge variant="outline" className="text-xs">
            {plan.caloriasTotales} kcal
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{plan.nombre}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plan.comidas.map((comida, index) => {
            const IconoComida = ICONOS_COMIDA[comida.tipo] || Utensils;
            return (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <IconoComida className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">
                    {comida.tipo.toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {comida.alimentos.slice(0, 3).join(', ')}
                    {comida.alimentos.length > 3 && '...'}
                  </p>
                </div>
                {comida.calorias && (
                  <span className="text-xs text-muted-foreground">
                    {comida.calorias} kcal
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => navigate({ to: '/planes' })}
          className="mt-4 flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
        >
          Ver plan completo
          <ExternalLink className="h-3 w-3" />
        </button>
      </CardContent>
    </Card>
  );
}
```

### Tarea 2: Crear GraficoProgresoCard
**Archivo:** `apps/frontend/src/components/dashboard/GraficoProgresoCard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Medicion {
  fecha: string;
  peso: number;
  imc?: number;
}

interface Progreso {
  pesoActual: number;
  pesoObjetivo: number | null;
  imc: number | null;
}

export function GraficoProgresoCard() {
  const { token, personaId } = useAuth();

  const { data: historial, isLoading: cargandoHistorial } = useQuery({
    queryKey: ['historial-mediciones', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: Medicion[] }>(
        `/turnos/socio/mi-historial-mediciones`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  const { data: progreso } = useQuery({
    queryKey: ['mi-progreso', personaId],
    queryFn: async () => {
      const response = await apiRequest<Progreso>(
        `/turnos/socio/mi-progreso`,
        { token }
      );
      return response;
    },
    enabled: !!token,
  });

  if (cargandoHistorial) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Mi Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!historial || historial.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Mi Progreso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Aún no tienes mediciones registradas para graficar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formatear datos para el gráfico
  const datosGrafico = historial.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    peso: m.peso,
    imc: m.imc,
  }));

  const pesoObjetivo = progreso?.pesoObjetivo;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Mi Progreso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 11 }}
                stroke="#9ca3af"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              
              {/* Línea de peso objetivo */}
              {pesoObjetivo && (
                <ReferenceLine 
                  y={pesoObjetivo} 
                  stroke="#22c55e" 
                  strokeDasharray="5 5"
                  label={{ value: 'Objetivo', fontSize: 10, fill: '#22c55e' }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="peso" 
                name="Peso (kg)"
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tarea 3: Crear ObjetivosCard
**Archivo:** `apps/frontend/src/components/dashboard/ObjetivosCard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Objetivo {
  id: number;
  descripcion: string;
  valorObjetivo: number;
  valorActual: number;
  unidad: string;
  completado: boolean;
}

export function ObjetivosCard() {
  const { token, personaId } = useAuth();

  const { data: objetivos = [], isLoading } = useQuery({
    queryKey: ['objetivos', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: Objetivo[] }>(
        `/progreso/${personaId}/objetivos`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Mis Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (objetivos.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-orange-500" />
            Mis Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No tienes objetivos configurados. Habla con tu nutricionista.
          </p>
        </CardContent>
      </Card>
    );
  }

  const calcularProgreso = (objetivo: Objetivo): number => {
    if (objetivo.completado) return 100;
    const progreso = (objetivo.valorActual / objetivo.valorObjetivo) * 100;
    return Math.min(Math.max(progreso, 0), 100);
  };

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-orange-500" />
          Mis Objetivos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {objetivos.slice(0, 4).map((objetivo) => {
            const progreso = calcularProgreso(objetivo);
            return (
              <div key={objetivo.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {objetivo.completado && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {objetivo.descripcion}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {objetivo.valorActual} / {objetivo.valorObjetivo} {objetivo.unidad}
                  </span>
                </div>
                <Progress 
                  value={progreso} 
                  className={`h-2 ${objetivo.completado ? '[&>div]:bg-green-500' : ''}`}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tarea 4: Crear AccionesRapidasSocioCard
**Archivo:** `apps/frontend/src/components/dashboard/AccionesRapidasSocioCard.tsx`

```tsx
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Calendar, FileText, Camera } from 'lucide-react';

const ACCIONES_SOCIO = [
  { etiqueta: 'Reservar Turno', icono: Calendar, ruta: '/reservar' },
  { etiqueta: 'Ver Mi Plan', icono: FileText, ruta: '/planes' },
  { etiqueta: 'Subir Foto', icono: Camera, ruta: '/progreso' },
];

export function AccionesRapidasSocioCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-r from-orange-50 to-rose-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {ACCIONES_SOCIO.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2 bg-white hover:bg-orange-50"
              onClick={() => navigate({ to: accion.ruta })}
            >
              <accion.icono className="h-5 w-5 text-orange-500" />
              <span className="text-xs">{accion.etiqueta}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tarea 5: Modificar DashboardSocio
**Archivo:** `apps/frontend/src/pages/DashboardSocio.tsx`

```tsx
import { Heart, Calendar, Activity, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { PlanAlimenticioCard } from '@/components/dashboard/PlanAlimenticioCard';
import { GraficoProgresoCard } from '@/components/dashboard/GraficoProgresoCard';
import { ObjetivosCard } from '@/components/dashboard/ObjetivosCard';
import { AccionesRapidasSocioCard } from '@/components/dashboard/AccionesRapidasSocioCard';
import { MensajeMotivacional } from '@/components/dashboard/MensajeMotivacional';

export function DashboardSocio() {
  const { token } = useAuth();

  // KPIs
  const { data: turnos, isLoading: cargandoTurnos } = useQuery({
    queryKey: ['mis-turnos', token],
    queryFn: () => apiRequest<any[]>('/turnos/socio/mis-turnos', { token }),
    enabled: !!token,
  });

  const { data: progreso, isLoading: cargandoProgreso } = useQuery({
    queryKey: ['mi-progreso', token],
    queryFn: () => apiRequest<any>('/turnos/socio/mi-progreso', { token }),
    enabled: !!token,
  });

  // Calcular próximo turno
  const proximoTurno = turnos
    ?.filter((t) => t.estadoTurno !== 'CANCELADO' && t.estadoTurno !== 'COMPLETADO')
    .sort((a, b) => {
      const fechaA = new Date(`${a.fechaTurno}T${a.horaTurno}`);
      const fechaB = new Date(`${b.fechaTurno}T${b.horaTurno}`);
      return fechaA.getTime() - fechaB.getTime();
    })[0];

  // Calcular progreso hacia objetivo
  const pesoRestante =
    progreso?.pesoActual && progreso?.pesoObjetivo
      ? Math.abs(progreso.pesoActual - progreso.pesoObjetivo)
      : null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Heart className="h-8 w-8 text-orange-500" />
            Mi Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Tu espacio personal para seguir tu progreso y plan nutricional.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <EstadisticasKpiCard
          titulo="Próximo Turno"
          valor={proximoTurno ? `${proximoTurno.fechaTurno}` : 'Sin turnos'}
          descripcion={proximoTurno ? `${proximoTurno.horaTurno} hs` : undefined}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Mi IMC"
          valor={progreso?.imc ? progreso.imc.toFixed(1) : '-'}
          descripcion={progreso?.clasificacionImc || 'Sin datos'}
          icono={<Activity className="h-4 w-4" />}
          cargando={cargandoProgreso}
        />
        <EstadisticasKpiCard
          titulo="Progreso"
          valor={pesoRestante !== null ? `${pesoRestante.toFixed(1)} kg` : '-'}
          descripcion={pesoRestante !== null ? 'para objetivo' : 'Sin objetivo'}
          icono={<Target className="h-4 w-4" />}
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
```

---

## 4. Checklist de Verificación

- [ ] PlanAlimenticioCard muestra plan activo o mensaje vacío
- [ ] GraficoProgresoCard renderiza con recharts
- [ ] ObjetivosCard muestra barras de progreso
- [ ] AccionesRapidasSocioCard navega correctamente
- [ ] KPIs calculan datos correctamente
- [ ] Estados de carga funcionan
- [ ] Estados vacíos son amigables
- [ ] Responsive en mobile
- [ ] Sin errores TypeScript/ESLint

---

## 5. Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/dashboard/PlanAlimenticioCard.tsx` | CREAR |
| `src/components/dashboard/GraficoProgresoCard.tsx` | CREAR |
| `src/components/dashboard/ObjetivosCard.tsx` | CREAR |
| `src/components/dashboard/AccionesRapidasSocioCard.tsx` | CREAR |
| `src/pages/DashboardSocio.tsx` | MODIFICAR |
