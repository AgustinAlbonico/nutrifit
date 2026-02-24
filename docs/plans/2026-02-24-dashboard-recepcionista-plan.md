# Plan Detallado: Dashboard Recepcionista (NUEVO)

**Diseño general:** `docs/plans/2026-02-24-dashboard-mejoras-design.md`  
**Fecha:** 2026-02-24

---

## 1. Estado Actual

**No existe dashboard para recepcionista.** El `Dashboard.tsx` genérico solo muestra:
- Título "Dashboard"
- Rol actual
- Lista de permisos

El recepcionista necesita un dashboard funcional con:
- Turnos del día para gestión de check-in
- Estadísticas rápidas
- Agenda de profesionales
- Acciones rápidas

---

## 2. Estructura Final

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: "Panel de Recepción" + descripción                    │
├─────────────────────────────────────────────────────────────────┤
│  KPIs: [Turnos Hoy] [Check-ins] [Pendientes] [Cancelaciones]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Turnos del Día           │  │ Agenda Profesionales     │    │
│  │ (tabla con acciones)     │  │ (disponibilidad)         │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Acciones Rápidas         │  │ Últimos Registrados      │    │
│  │ (botones)                │  │ (pacientes nuevos)       │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER: Resumen del día                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Tareas Detalladas

### Tarea 1: Crear TurnosTablaCard
**Archivo:** `apps/frontend/src/components/dashboard/TurnosTablaCard.tsx`

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, User, CheckCircle, X, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface TurnoRecepcion {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: 'PENDIENTE' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO';
  socio: {
    nombreCompleto: string;
    dni: string;
  };
  profesional: {
    nombreCompleto: string;
  };
}

const ESTADOS_TURNO = ['TODOS', 'PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO'] as const;

const getColorEstado = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMADO':
      return 'bg-blue-100 text-blue-800';
    case 'COMPLETADO':
      return 'bg-green-100 text-green-800';
    case 'CANCELADO':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function TurnosTablaCard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  const { data: turnos = [], isLoading } = useQuery({
    queryKey: ['turnos-recepcion-dia', token],
    queryFn: async () => {
      const response = await apiRequest<{ data: TurnoRecepcion[] }>(
        '/turnos/recepcion/dia',
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  const marcarCheckInMutation = useMutation({
    mutationFn: async (idTurno: number) => {
      await apiRequest(`/turnos/${idTurno}/check-in`, {
        method: 'PATCH',
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-recepcion-dia'] });
    },
  });

  const turnosFiltrados =
    filtroEstado === 'TODOS'
      ? turnos
      : turnos.filter((t) => t.estadoTurno === filtroEstado);

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Turnos del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Turnos del Día
            <Badge variant="secondary" className="ml-2">
              {turnos.length}
            </Badge>
          </CardTitle>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_TURNO.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado === 'TODOS' ? 'Todos' : estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {turnosFiltrados.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay turnos para mostrar
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnosFiltrados.slice(0, 8).map((turno) => (
                  <TableRow key={turno.idTurno}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {turno.horaTurno}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {turno.socio.nombreCompleto}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {turno.socio.dni}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {turno.profesional.nombreCompleto}
                    </TableCell>
                    <TableCell>
                      <Badge className={getColorEstado(turno.estadoTurno)}>
                        {turno.estadoTurno}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {turno.estadoTurno === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            onClick={() => marcarCheckInMutation.mutate(turno.idTurno)}
                            disabled={marcarCheckInMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {turnosFiltrados.length > 8 && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            +{turnosFiltrados.length - 8} turnos más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Tarea 2: Crear AgendaProfesionalesCard
**Archivo:** `apps/frontend/src/components/dashboard/AgendaProfesionalesCard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Profesional {
  idPersona: number;
  nombreCompleto: string;
  especialidad: string;
}

interface Slot {
  hora: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'DESCANSO';
}

export function AgendaProfesionalesCard() {
  const { token } = useAuth();

  // Obtener lista de profesionales
  const { data: profesionales = [], isLoading } = useQuery({
    queryKey: ['profesionales-lista', token],
    queryFn: async () => {
      const response = await apiRequest<{ data: Profesional[] }>(
        '/profesional',
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  // Por simplicidad, mostramos una vista resumida
  // En producción, haríamos queries individuales por profesional

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-orange-500" />
            Agenda Profesionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-orange-500" />
          Agenda Profesionales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {profesionales.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay profesionales registrados
          </p>
        ) : (
          <div className="space-y-3">
            {profesionales.map((prof) => (
              <div
                key={prof.idPersona}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{prof.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    {prof.especialidad}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Indicadores de disponibilidad */}
                  <div className="flex gap-1">
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                    <Circle className="h-3 w-3 fill-orange-500 text-orange-500" />
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Ver
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" /> Disponible
          <Circle className="h-2 w-2 fill-orange-500 text-orange-500" /> Ocupado
        </p>
      </CardContent>
    </Card>
  );
}
```

### Tarea 3: Crear AccionesRapidasRecepcionCard
**Archivo:** `apps/frontend/src/components/dashboard/AccionesRapidasRecepcionCard.tsx`

```tsx
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, UserPlus, CalendarPlus, CheckCircle } from 'lucide-react';

const ACCIONES_RECEPCION = [
  { etiqueta: 'Registrar Paciente', icono: UserPlus, ruta: '/socios/nuevo' },
  { etiqueta: 'Asignar Turno', icono: CalendarPlus, ruta: '/turnos/nuevo' },
  { etiqueta: 'Check-in Manual', icono: CheckCircle, ruta: '/turnos' },
];

export function AccionesRapidasRecepcionCard() {
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
        <div className="grid grid-cols-3 gap-3">
          {ACCIONES_RECEPCION.map((accion) => (
            <Button
              key={accion.etiqueta}
              variant="outline"
              className="flex flex-col h-auto py-4 gap-2"
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

### Tarea 4: Crear UltimosRegistradosCard
**Archivo:** `apps/frontend/src/components/dashboard/UltimosRegistradosCard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Socio {
  idPersona: number;
  nombreCompleto: string;
  dni: string;
  fechaRegistro: string;
}

export function UltimosRegistradosCard() {
  const { token } = useAuth();

  const { data: socios = [], isLoading } = useQuery({
    queryKey: ['ultimos-socios', token],
    queryFn: async () => {
      const response = await apiRequest<{ data: Socio[] }>(
        '/socio?limite=5&orden=desc',
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-orange-500" />
            Últimos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-orange-500" />
          Últimos Registrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {socios.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay pacientes registrados recientemente
          </p>
        ) : (
          <div className="space-y-3">
            {socios.map((socio) => (
              <div
                key={socio.idPersona}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{socio.nombreCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    DNI: {socio.dni}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(socio.fechaRegistro).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Tarea 5: Crear DashboardRecepcionista
**Archivo:** `apps/frontend/src/pages/DashboardRecepcionista.tsx`

```tsx
import { LayoutDashboard, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { EstadisticasKpiCard } from '@/components/dashboard/EstadisticasKpiCard';
import { TurnosTablaCard } from '@/components/dashboard/TurnosTablaCard';
import { AgendaProfesionalesCard } from '@/components/dashboard/AgendaProfesionalesCard';
import { AccionesRapidasRecepcionCard } from '@/components/dashboard/AccionesRapidasRecepcionCard';
import { UltimosRegistradosCard } from '@/components/dashboard/UltimosRegistradosCard';

export function DashboardRecepcionista() {
  const { token } = useAuth();

  const { data: turnos = [], isLoading: cargandoTurnos } = useQuery({
    queryKey: ['turnos-recepcion-dia', token],
    queryFn: async () => {
      const response = await apiRequest<{ data: any[] }>(
        '/turnos/recepcion/dia',
        { token }
      );
      return response.data ?? [];
    },
    enabled: !!token,
  });

  // Calcular KPIs
  const totalTurnos = turnos.length;
  const checkIns = turnos.filter((t) => t.estadoTurno === 'COMPLETADO').length;
  const pendientes = turnos.filter((t) => t.estadoTurno === 'PENDIENTE').length;
  const cancelados = turnos.filter((t) => t.estadoTurno === 'CANCELADO').length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-orange-500" />
            Panel de Recepción
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Gestión de turnos, check-ins y atención al paciente.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <EstadisticasKpiCard
          titulo="Turnos Hoy"
          valor={totalTurnos}
          icono={<Calendar className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Check-ins"
          valor={checkIns}
          icono={<CheckCircle className="h-4 w-4" />}
          badge={checkIns > 0 ? { texto: 'Atendidos', variante: 'success' } : undefined}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Pendientes"
          valor={pendientes}
          icono={<Clock className="h-4 w-4" />}
          badge={pendientes > 0 ? { texto: 'En espera', variante: 'warning' } : undefined}
          cargando={cargandoTurnos}
        />
        <EstadisticasKpiCard
          titulo="Cancelados"
          valor={cancelados}
          icono={<XCircle className="h-4 w-4" />}
          cargando={cargandoTurnos}
        />
      </div>

      {/* Grid Principal */}
      <div className="grid gap-6 md:grid-cols-2">
        <TurnosTablaCard />
        <AgendaProfesionalesCard />
        <AccionesRapidasRecepcionCard />
        <UltimosRegistradosCard />
      </div>

      {/* Footer - Resumen */}
      <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong>Resumen del día:</strong> {totalTurnos} turnos programados, 
        {checkIns} pacientes atendidos, {pendientes} en espera.
      </div>
    </div>
  );
}
```

### Tarea 6: Modificar Dashboard.tsx
**Archivo:** `apps/frontend/src/pages/Dashboard.tsx`

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { DashboardNutricionista } from '@/pages/DashboardNutricionista';
import { DashboardSocio } from '@/pages/DashboardSocio';
import { DashboardRecepcionista } from '@/pages/DashboardRecepcionista';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, KeyRound } from 'lucide-react';

export function Dashboard() {
  const { rol, permissions } = useAuth();

  // Rutas específicas por rol
  if (rol === 'NUTRICIONISTA') {
    return <DashboardNutricionista />;
  }

  if (rol === 'SOCIO') {
    return <DashboardSocio />;
  }

  if (rol === 'RECEPCIONISTA') {
    return <DashboardRecepcionista />;
  }

  // Fallback para ADMIN u otros roles sin dashboard específico
  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="h-8 w-8 text-orange-500" />
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl text-base">
            Bienvenido al panel de control. Aquí puedes ver tu información de sesión y permisos.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rol Actual
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rol}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-rose-400" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-orange-500" />
            Mis Permisos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.map((permission) => (
              <Badge key={permission} className="border-0 bg-orange-100 text-orange-700 hover:bg-orange-200">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 4. Checklist de Verificación

- [ ] DashboardRecepcionista renderiza correctamente
- [ ] TurnosTablaCard muestra datos reales
- [ ] TurnosTablaCard filtra por estado
- [ ] Check-in mutation funciona y actualiza lista
- [ ] AgendaProfesionalesCard muestra profesionales
- [ ] AccionesRapidasRecepcionCard navega correctamente
- [ ] UltimosRegistradosCard muestra pacientes
- [ ] KPIs calculan correctamente
- [ ] Dashboard.tsx redirige a DashboardRecepcionista
- [ ] Responsive en mobile
- [ ] Sin errores TypeScript/ESLint

---

## 5. Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/dashboard/TurnosTablaCard.tsx` | CREAR |
| `src/components/dashboard/AgendaProfesionalesCard.tsx` | CREAR |
| `src/components/dashboard/AccionesRapidasRecepcionCard.tsx` | CREAR |
| `src/components/dashboard/UltimosRegistradosCard.tsx` | CREAR |
| `src/pages/DashboardRecepcionista.tsx` | CREAR |
| `src/pages/Dashboard.tsx` | MODIFICAR |

---

## 6. Notas Importantes

### Endpoints necesarios
El endpoint `GET /turnos/recepcion/dia` debe existir. Si no existe, verificar:
- `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- Buscar rutas con `/recepcion/`

### Dependencias
- `@tanstack/react-query` - Ya instalado
- `recharts` - Necesario instalar para gráficos (Fase 1)
- Componentes shadcn/ui: Table, Select - Verificar que estén instalados

### Instalar Table y Select si no existen
```bash
cd apps/frontend
npx shadcn@latest add table select
```
