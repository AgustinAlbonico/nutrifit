# Accesos Rápidos y Banner de Consulta Activa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar accesos rápidos en la tarjeta de turnos del día y un banner global persistente cuando hay una consulta activa para nutricionistas.

**Architecture:** Modificación del componente `TurnosDelDiaCard` para agregar botones de acción. Creación de un `BannerConsultaActiva` inteligente en `AppLayout` que consulta con `react-query` el estado de los turnos del día del profesional.

**Tech Stack:** React, Tailwind CSS, Lucide React, React Query, React Router.

---

### Task 1: Componente BannerConsultaActiva

**Files:**
- Create: `apps/frontend/src/components/layout/BannerConsultaActiva.tsx`
- Modify: `apps/frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Crear componente `BannerConsultaActiva`**

```tsx
// apps/frontend/src/components/layout/BannerConsultaActiva.tsx
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { ApiResponse } from '@/types/api';
import type { EstadoTurno } from '@nutrifit/shared';

interface TurnoDelDia {
  idTurno: number;
  estadoTurno: EstadoTurno;
  socio: {
    nombreCompleto: string;
  };
}

export function BannerConsultaActiva() {
  const { token, rol, personaId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // No mostrar si no es nutricionista o si ya esta en la vista de consulta
  const esNutricionista = rol === 'NUTRICIONISTA';
  const estaEnConsulta = location.pathname.includes('/profesional/consulta/');
  
  const { data: turnos = [] } = useQuery({
    queryKey: ['turnos-del-dia', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<TurnoDelDia[]>>(
        `/turnos/profesional/${personaId}/hoy`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId && esNutricionista && !estaEnConsulta,
    // Refresco cada 30 segundos para mantener el banner actualizado
    refetchInterval: 30000,
  });

  if (!esNutricionista || estaEnConsulta) return null;

  const turnoActivo = turnos.find(t => t.estadoTurno === 'EN_CURSO');
  if (!turnoActivo) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Activity className="h-4 w-4 animate-pulse text-violet-200" />
          <span>Consulta en curso: {turnoActivo.socio.nombreCompleto}</span>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-8 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border-0"
          onClick={() => navigate({ to: `/profesional/consulta/${turnoActivo.idTurno}` })}
        >
          Volver a la consulta
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Inyectar en `AppLayout`**

```tsx
// Edit apps/frontend/src/components/layout/AppLayout.tsx
// Add import:
// import { BannerConsultaActiva } from './BannerConsultaActiva';

// Dentro del componente AppLayout, justo encima del Sidebar o Navbar, según como esté estructurado, idealmente como primer hijo del contenedor raíz o justo debajo del Header:
// <div className="...">
//   <BannerConsultaActiva />
//   {/* resto del layout */}
// </div>
```
*(Nota para el subagente: Inspeccionar la estructura real de `AppLayout.tsx` antes de inyectar para asegurar que no rompa el flex/grid)*.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/layout/BannerConsultaActiva.tsx apps/frontend/src/components/layout/AppLayout.tsx
git commit -m "feat: agregar banner global de consulta activa para nutricionista"
```

### Task 2: Accesos rápidos en TurnosDelDiaCard

**Files:**
- Modify: `apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx`

- [ ] **Step 1: Agregar navegación al TurnosDelDiaCard**

```tsx
// Modificar apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx
// Agregar import:
// import { useNavigate } from '@tanstack/react-router';
// import { PlayCircle, Eye } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// Dentro de TurnosDelDiaCard:
// const navigate = useNavigate();

// Reemplazar la renderizacion de <Badge> por la logica de estado + boton
```
*(Nota para el subagente: El código completo a reemplazar es el iterador `turnos.slice(0, 5).map(...)`. Deberá quedar similar a esto:)*

```tsx
            {turnos.slice(0, 5).map((turno) => (
              <div
                key={turno.idTurno}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground w-16">
                    <Clock className="h-4 w-4" />
                    {turno.horaTurno}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      <span className="font-medium">{turno.socio.nombreCompleto}</span>
                    </div>
                    <div className="sm:hidden mt-1">
                      <Badge className={obtenerClasesEstadoTurno(turno.estadoTurno)}>
                        {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 justify-end">
                  <div className="hidden sm:block">
                    <Badge className={obtenerClasesEstadoTurno(turno.estadoTurno)}>
                      {obtenerEtiquetaEstadoTurno(turno.estadoTurno)}
                    </Badge>
                  </div>
                  
                  {turno.estadoTurno === 'PRESENTE' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Iniciar
                    </Button>
                  )}
                  {turno.estadoTurno === 'EN_CURSO' && (
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                      Continuar
                    </Button>
                  )}
                  {turno.estadoTurno === 'REALIZADO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8 px-2"
                      onClick={() => navigate({ to: `/profesional/consulta/${turno.idTurno}` })}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Ver
                    </Button>
                  )}
                </div>
              </div>
            ))}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx
git commit -m "feat: agregar botones de acceso rapido a consultas en dashboard"
```

### Task 3: Verificación final
- [ ] **Step 1: Typecheck**
Run: `npm run typecheck --workspace=@nutrifit/frontend`
Expected: Exits 0

- [ ] **Step 2: Lint**
Run: `npm run lint --workspace=@nutrifit/frontend`
Expected: Exits 0
