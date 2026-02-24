# Plan Detallado: Dashboard Nutricionista

**Diseño general:** `docs/plans/2026-02-24-dashboard-mejoras-design.md`  
**Fecha:** 2026-02-24

---

## 1. Estado Actual

**Archivo:** `apps/frontend/src/pages/DashboardNutricionista.tsx`

```tsx
// Estructura actual (muy básica)
<div className="space-y-8 pb-10">
  <Header />
  <div className="grid gap-6 md:grid-cols-2">
    <TurnosDelDiaCard />
    <PacientesRecientesCard />
  </div>
</div>
```

**Componentes existentes:**
- `TurnosDelDiaCard` - Lista de hasta 5 turnos
- `PacientesRecientesCard` - Lista de hasta 5 pacientes

---

## 2. Estructura Final

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "Dashboard Nutricionista" + descripción               │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: [Pacientes] [Turnos Hoy] [Planes] [Pendientes]          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Turnos de Hoy            │  │ Pacientes Recientes      │    │
│  │ (lista completa)         │  │ (últimos 5)              │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Acciones Rápidas         │  │ Paciente Destacado       │    │
│  │ (3-4 botones)            │  │ (selector + mini-gráfico)│    │
│  └──────────────────────────┘  └──────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Próximos turnos de mañana (preview)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tareas Detalladas

### Tarea 1: Crear EstadisticasKpiCard
**Archivo:** `apps/frontend/src/components/dashboard/EstadisticasKpiCard.tsx`

```tsx
interface EstadisticasKpiCardProps {
  titulo: string;
  valor: number | string;
  icono: React.ReactNode;
  descripcion?: string;
  badge?: { texto: string; variante: 'default' | 'success' | 'warning' | 'destructive' };
  cargando?: boolean;
}

export function EstadisticasKpiCard({ 
  titulo, 
  valor, 
  icono, 
  descripcion, 
  badge, 
  cargando 
}: EstadisticasKpiCardProps) {
  if (cargando) {
    return <Card><Skeleton /></Card>;
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icono}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descripcion && (
          <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>
        )}
        {badge && (
          <Badge variant={badge.variante} className="mt-2">{badge.texto}</Badge>
        )}
      </CardContent>
    </Card>
  );
}
```

### Tarea 2: Crear AccionesRapidasCard
**Archivo:** `apps/frontend/src/components/dashboard/AccionesRapidasCard.tsx`

```tsx
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, FileText, Calendar, Users } from 'lucide-react';

interface AccionRapida {
  etiqueta: string;
  icono: React.ReactNode;
  ruta: string;
}

const ACCIONES_NUTRICIONISTA: AccionRapida[] = [
  { etiqueta: 'Crear Plan', icono: <FileText className="h-4 w-4" />, ruta: '/planes' },
  { etiqueta: 'Asignar Turno', icono: <Calendar className="h-4 w-4" />, ruta: '/agenda' },
  { etiqueta: 'Ver Pacientes', icono: <Users className="h-4 w-4" />, ruta: '/pacientes' },
];

export function AccionesRapidasCard() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-orange-500" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {ACCIONES_NUTRICIONISTA.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={() => navigate({ to: accion.ruta })}
            >
              {accion.icono}
              <span className="text-xs">{accion.etiqueta}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tarea 3: Crear PacienteDestacadoCard
**Archivo:** `apps/frontend/src/components/dashboard/PacienteDestacadoCard.tsx`

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Weight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function PacienteDestacadoCard() {
  const { token, personaId } = useAuth();
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>('');

  // Obtener lista de pacientes
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes-nutricionista', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: Paciente[] }>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Obtener progreso del paciente seleccionado
  const { data: progreso } = useQuery({
    queryKey: ['progreso-paciente', pacienteSeleccionado],
    queryFn: async () => {
      const response = await apiRequest<{ data: Medicion[] }>(
        `/turnos/profesional/${personaId}/pacientes/${pacienteSeleccionado}/historial-mediciones`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!pacienteSeleccionado && !!token,
  });

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          Paciente Destacado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={pacienteSeleccionado} onValueChange={setPacienteSeleccionado}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar paciente..." />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((p) => (
              <SelectItem key={p.idSocio} value={p.idSocio.toString()}>
                {p.nombreCompleto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {progreso && progreso.length > 0 && (
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progreso.slice(-10)}>
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!pacienteSeleccionado && (
          <p className="text-sm text-muted-foreground mt-4">
            Seleccioná un paciente para ver su progreso
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Tarea 4: Modificar DashboardNutricionista
**Archivo:** `apps/frontend/src/pages/DashboardNutricionista.tsx`

```tsx
import { Activity, Users, Calendar, FileText, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { AccionesRapidasCard } from '@/components/dashboard/AccionesRapidasCard';
import { PacienteDestacadoCard } from '@/components/dashboard/PacienteDestacadoCard';
import { TurnosDelDiaCard } from '@/components/dashboard/TurnosDelDiaCard';
import { PacientesRecientesCard } from '@/components/dashboard/PacientesRecientesCard';

export function DashboardNutricionista() {
  const { token, personaId } = useAuth();

  // KPIs
  const { data: pacientes, isLoading: cargandoPacientes } = useQuery({
    queryKey: ['pacientes-count', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: any[] }>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  const { data: turnosHoy, isLoading: cargandoTurnos } = useQuery({
    queryKey: ['turnos-hoy', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: any[] }>(
        `/turnos/profesional/${personaId}/hoy`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  const { data: planes, isLoading: cargandoPlanes } = useQuery({
    queryKey: ['planes-count', personaId],
    queryFn: async () => {
      const response = await apiRequest<{ data: any[] }>(
        `/planes-alimentacion/nutricionista/${personaId}`,
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // Cálculos de KPIs
  const pacientesActivos = pacientes?.length ?? 0;
  const turnosHoyCount = turnosHoy?.length ?? 0;
  const pendientesCount = turnosHoy?.filter(t => t.estadoTurno === 'PENDIENTE').length ?? 0;
  const planesCount = planes?.length ?? 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-500" />
            Dashboard Nutricionista
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Panel de control con tus métricas y accesos rápidos.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <EstadisticasKpiCard
          titulo="Pacientes Activos"
          valor={pacientesActivos}
          icono={<Users className="h-4 w-4" />}
          cargando={cargandoPacientes}
        />
        <EstadisticasKpiCard
          titulo="Turnos Hoy"
          valor={turnosHoyCount}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Planes Creados"
          valor={planesCount}
          icono={<FileText className="h-4 w-4" />}
          cargando={cargandoPlanes}
        />
        <EstadisticasKpiCard
          titulo="Pendientes"
          valor={pendientesCount}
          icono={<Clock className="h-4 w-4" />}
          badge={pendientesCount > 0 ? { texto: 'Atención', variante: 'warning' } : undefined}
          cargando={cargandoTurnos}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <TurnosDelDiaCard />
        <PacientesRecientesCard />
        <AccionesRapidasCard />
        <PacienteDestacadoCard />
      </div>
    </div>
  );
}
```

---

## 4. Checklist de Verificación

- [ ] EstadisticasKpiCard muestra datos correctamente
- [ ] AccionesRapidasCard navega a las páginas correctas
- [ ] PacienteDestacadoCard carga pacientes en el selector
- [ ] PacienteDestacadoCard muestra gráfico al seleccionar
- [ ] KPIs se calculan correctamente
- [ ] Estados de carga (skeleton) funcionan
- [ ] Responsive en mobile (grid 1 columna)
- [ ] Sin errores de TypeScript
- [ ] Sin errores de ESLint

---

## 5. Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/dashboard/EstadisticasKpiCard.tsx` | CREAR |
| `src/components/dashboard/AccionesRapidasCard.tsx` | CREAR |
| `src/components/dashboard/PacienteDestacadoCard.tsx` | CREAR |
| `src/pages/DashboardNutricionista.tsx` | MODIFICAR |
