# Modal bloqueante de ficha requerida — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear con un modal bloqueante el acceso a vistas de turnos del socio (`ProximoTurnoCard` y `Turnos.tsx`) cuando el socio no tiene ficha de salud cargada, redirigiendo al socio a `/turnos/ficha-salud`.

**Architecture:** Hook compartido de React Query (`useEstadoFichaRequerida`) que wrappea `GET /turnos/socio/ficha-salud`. Componente de presentación (`ModalFichaRequeridaSocio`) sin lógica, controlado por el padre vía prop `abierto`. El padre decide cuándo mostrarlo según `fichaCargada` del hook. Invalidación de la query en `FichaSaludSocio.tsx` al hacer `PUT` exitoso para que el modal desaparezca al volver.

**Tech Stack:** React 19, TanStack Query 5, Radix UI Dialog (shadcn/ui), vitest + MSW + @testing-library/react. Sin backend, sin TypeScript types nuevos (reutilizamos `FichaSaludSocio` de `@/types/ficha-salud`).

---

## Estructura de archivos

### Nuevos

- `apps/frontend/src/hooks/useEstadoFichaRequerida.ts` — hook de React Query que wrappea el endpoint.
- `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx` — modal controlado.
- `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx` — tests unitarios.

### Modificados

- `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx` — usa el hook y renderiza el modal.
- `apps/frontend/src/pages/Turnos.tsx` — usa el hook y renderiza el modal antes de listar.
- `apps/frontend/src/pages/FichaSaludSocio.tsx` — invalida `['ficha-salud', 'estado']` al hacer `PUT` exitoso.

### Sin cambios

- Backend completo.
- `apps/frontend/src/pages/AgendarTurno.tsx` (sigue con banner ámbar).
- Componentes `FichaSaludConsentimientoModal`, `FichaSaludHistorialModal`, `FichaSaludBannerUltimaEdicion`, `SeccionConsentimiento`.

---

## Task 1: Hook `useEstadoFichaRequerida`

**Files:**
- Create: `apps/frontend/src/hooks/useEstadoFichaRequerida.ts`

- [ ] **Step 1: Crear el archivo del hook**

Crear `apps/frontend/src/hooks/useEstadoFichaRequerida.ts`:

```ts
/**
 * Hook de React Query para saber si el socio autenticado tiene
 * ficha de salud cargada. Se usa para bloquear el acceso a vistas
 * de turnos (Mis Turnos, Dashboard) cuando la ficha está incompleta.
 *
 * Endpoint: `GET /turnos/socio/ficha-salud`
 * Cache key: `['ficha-salud', 'estado']`
 *
 * Devuelve un estado tri-state:
 * - `fichaCargada === null` mientras carga o si hay error.
 * - `fichaCargada === true` si la ficha existe.
 * - `fichaCargada === false` si la API devolvió `data: null`.
 *
 * RB14: bloqueo de flujo de turnos sin ficha completa.
 */

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

interface EstadoFichaHook {
  cargando: boolean;
  fichaCargada: boolean | null;
  error: Error | null;
}

interface ParametrosEstadoFicha {
  token: string | null;
}

export function useEstadoFichaRequerida({
  token,
}: ParametrosEstadoFicha): EstadoFichaHook {
  const query = useQuery({
    queryKey: ['ficha-salud', 'estado', token],
    queryFn: async () => {
      const respuesta =
        await apiRequest<ApiResponseWrapper<unknown | null>>(
          '/turnos/socio/ficha-salud',
          { method: 'GET', token },
        );
      return respuesta.data;
    },
    enabled: Boolean(token),
    refetchOnWindowFocus: false,
  });

  let fichaCargada: boolean | null = null;
  if (query.data !== undefined) {
    fichaCargada = query.data !== null;
  }

  return {
    cargando: query.isLoading,
    fichaCargada,
    error: query.error as Error | null,
  };
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run typecheck --workspace=apps/frontend`
Expected: pasa sin errores.

- [ ] **Step 3: Commit**

```bash
git add "apps/frontend/src/hooks/useEstadoFichaRequerida.ts"
git commit -m "feat(frontend): hook useEstadoFichaRequerida"
```

---

## Task 2: Modal `ModalFichaRequeridaSocio` (con tests)

**Files:**
- Create: `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx`
- Create: `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx`

- [ ] **Step 1: Crear el test file (failing)**

Crear `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx`:

```tsx
/**
 * Tests del modal bloqueante de ficha requerida para Mis Turnos.
 *
 * Cubre:
 * - Renderiza título, body y CTA cuando `abierto={true}`.
 * - No renderiza el modal cuando `abierto={false}`.
 * - El CTA apunta a `/turnos/ficha-salud`.
 * - El modal no muestra botón de cerrar (X).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ModalFichaRequeridaSocio } from './ModalFichaRequeridaSocio';

// Polyfill de ResizeObserver (necesario para Dialog de shadcn/radix).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

// Mock de TanStack Router: Link → <a> nativo.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
    <a {...rest}>{children}</a>
  ),
}));

describe('ModalFichaRequeridaSocio', () => {
  it('renderiza título, body y CTA cuando abierto=true', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);

    const dialog = screen.getByRole('dialog');
    expect(
      screen.getByText('Necesitamos tu ficha de salud'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/No tenés la ficha de salud cargada/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ir a cargar mi ficha/i }),
    ).toBeInTheDocument();
  });

  it('no renderiza el dialog cuando abierto=false', () => {
    render(<ModalFichaRequeridaSocio abierto={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el CTA apunta a /turnos/ficha-salud', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);
    const cta = screen.getByRole('link', { name: /Ir a cargar mi ficha/i });
    expect(cta).toHaveAttribute('href', '/turnos/ficha-salud');
  });

  it('no muestra botón de cerrar (X) — modal bloqueante', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);
    // DialogContent renderiza un botón Close con sr-only "Close" cuando
    // showCloseButton es true. Con showCloseButton=false, no debe existir.
    expect(
      screen.queryByRole('button', { name: /close/i }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test --workspace=apps/frontend -- ModalFichaRequeridaSocio.test.tsx`
Expected: FAIL (no existe el componente).

- [ ] **Step 3: Crear el componente**

Crear `apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx`:

```tsx
/**
 * Modal bloqueante para socios sin ficha de salud.
 *
 * Se muestra cuando el socio intenta acceder a una vista de turnos
 * (Dashboard, /turnos) sin tener la ficha cargada. Lo redirige a
 * `/turnos/ficha-salud` con un único CTA.
 *
 * El modal no se puede cerrar: sin X, sin Esc, sin click fuera. RB14.
 */

import { Link } from '@tanstack/react-router';
import { FileWarning } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PropiedadesModalFichaRequeridaSocio {
  abierto: boolean;
}

export function ModalFichaRequeridaSocio({
  abierto,
}: PropiedadesModalFichaRequeridaSocio) {
  return (
    <Dialog open={abierto}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(evento) => evento.preventDefault()}
        onPointerDownOutside={(evento) => evento.preventDefault()}
        onInteractOutside={(evento) => evento.preventDefault()}
        data-testid="modal-ficha-requerida-socio"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-600" />
            <DialogTitle>Necesitamos tu ficha de salud</DialogTitle>
          </div>
          <DialogDescription>
            No tenés la ficha de salud cargada. Es obligatoria para poder
            ver y gestionar tus turnos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link to="/turnos/ficha-salud">Ir a cargar mi ficha</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm test --workspace=apps/frontend -- ModalFichaRequeridaSocio.test.tsx`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.tsx" "apps/frontend/src/components/ficha-salud/ModalFichaRequeridaSocio.test.tsx"
git commit -m "feat(frontend): modal bloqueante de ficha requerida"
```

---

## Task 3: Integrar en `ProximoTurnoCard`

**Files:**
- Modify: `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx`

- [ ] **Step 1: Reemplazar el contenido del archivo**

Sobreescribir `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx` completo:

```tsx
import type { EstadoTurno } from '@nutrifit/shared';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ModalFichaRequeridaSocio } from '@/components/ficha-salud/ModalFichaRequeridaSocio';
import { useEstadoFichaRequerida } from '@/hooks/useEstadoFichaRequerida';
import {
  esEstadoTurnoVigente,
  obtenerClasesEstadoTurno,
  obtenerEtiquetaEstadoTurno,
} from '@/lib/turnos/estadoTurno';

interface MiTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  profesionalId: number;
  profesionalNombreCompleto: string;
  especialidad: string;
}

export function ProximoTurnoCard() {
  const { token } = useAuth();
  const { fichaCargada, cargando: cargandoFicha } =
    useEstadoFichaRequerida({ token });

  const { data, isLoading } = useQuery({
    queryKey: ['mis-turnos', token],
    queryFn: () =>
      apiRequest<MiTurno[]>('/turnos/socio/mis-turnos', { token }),
    enabled: !!token && fichaCargada === true,
  });

  const turnos = Array.isArray(data) ? data : [];

  const ahora = new Date();
  const proximoTurno = turnos
    .filter((t) => esEstadoTurnoVigente(t.estadoTurno))
    .filter((t) => {
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

  return (
    <>
      <ModalFichaRequeridaSocio
        abierto={!cargandoFicha && fichaCargada === false}
      />
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-orange-500" />
            Proximo Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cargandoFicha || isLoading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : !proximoTurno ? (
            <p className="text-muted-foreground text-sm">
              No tienes turnos programados
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{proximoTurno.fechaTurno}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{proximoTurno.horaTurno} hs</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{proximoTurno.profesionalNombreCompleto}</span>
              </div>
              <Badge
                className={`${obtenerClasesEstadoTurno(proximoTurno.estadoTurno)} mt-2`}
              >
                {obtenerEtiquetaEstadoTurno(proximoTurno.estadoTurno)}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
```

Notas de diseño:
- El componente siempre renderiza el `<ModalFichaRequeridaSocio>` envuelto en un Fragment, en lugar de hacer `if (fichaCargada === false) return <Modal />`. Esto se hace así porque Radix UI necesita que el `Dialog` esté en el árbol de React para controlar la visibilidad via la prop `open`. Si se hace early-return, el modal se desmonta y se vuelve a montar cada vez que cambia el estado.
- `useQuery` de mis-turnos queda deshabilitado (`enabled: !!token && fichaCargada === true`) hasta confirmar ficha. Esto evita pedir turnos al backend si todavía no sabemos si hay ficha.

- [ ] **Step 2: Verificar typecheck y lint**

Run: `npm run typecheck --workspace=apps/frontend && npm run lint --workspace=apps/frontend`
Expected: ambos pasan.

- [ ] **Step 3: Correr tests del frontend**

Run: `npm test --workspace=apps/frontend`
Expected: pasan los tests existentes + los nuevos (ModalFichaRequeridaSocio).

- [ ] **Step 4: Commit**

```bash
git add "apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx"
git commit -m "feat(frontend): bloquear ProximoTurnoCard sin ficha"
```

---

## Task 4: Integrar en `Turnos.tsx`

**Files:**
- Modify: `apps/frontend/src/pages/Turnos.tsx`

- [ ] **Step 1: Agregar los imports**

Después del import existente de `@/components/ui/dialog` (alrededor de la línea 20) y antes de los imports `@/lib/...`, agregar dos imports (en el grupo "Local modules", orden alfabético):

```tsx
import { ModalFichaRequeridaSocio } from '@/components/ficha-salud/ModalFichaRequeridaSocio';
import { useEstadoFichaRequerida } from '@/hooks/useEstadoFichaRequerida';
```

- [ ] **Step 2: Agregar el hook después del `useAuth()` existente**

En la línea 64, el componente `Turnos` ya tiene:
```tsx
const { token, rol } = useAuth();
```

Debajo de esa línea, agregar:
```tsx
const { fichaCargada, cargando: cargandoFicha } =
  useEstadoFichaRequerida({ token });
```

NO duplicar el `useAuth()` que ya existe.

- [ ] **Step 3: Gatear el `useEffect` que dispara el fetch**

Localizar el `useEffect` (o `useCallback`) que llama a `/turnos/socio/mis-turnos`. La condición actual (alrededor de la línea 445) es:

```tsx
if (!token || rol !== 'SOCIO') {
  setCargando(false);
  return;
}
```

Modificarla a:

```tsx
if (!token || rol !== 'SOCIO' || fichaCargada === false) {
  setCargando(false);
  return;
}
```

Esto evita llamar al endpoint de turnos cuando el socio no tiene ficha.

- [ ] **Step 4: Agregar el modal bloqueante en el JSX**

Localizar el `return` final del componente `Turnos`. Justo antes de ese `return`, agregar el modal. El componente actualmente retorna un Fragment o un único elemento; agregar el modal como hermano de ese elemento, envuelto en un Fragment:

```tsx
return (
  <>
    <ModalFichaRequeridaSocio
      abierto={!cargandoFicha && fichaCargada === false}
    />
    {/* … resto del JSX existente … */}
  </>
);
```

El componente `ModalFichaRequeridaSocio` controla su propia visibilidad con la prop `abierto`, así que cuando el socio tiene ficha el modal se cierra sin tocar el resto de la UI.

- [ ] **Step 5: Verificar typecheck y lint**

Run: `npm run typecheck --workspace=apps/frontend && npm run lint --workspace=apps/frontend`
Expected: pasan.

- [ ] **Step 6: Correr tests del frontend**

Run: `npm test --workspace=apps/frontend`
Expected: pasan los tests existentes.

- [ ] **Step 7: Commit**

```bash
git add "apps/frontend/src/pages/Turnos.tsx"
git commit -m "feat(frontend): bloquear Turnos.tsx sin ficha"
```

---

## Task 5: Invalidar `['ficha-salud', 'estado']` al guardar

**Files:**
- Modify: `apps/frontend/src/pages/FichaSaludSocio.tsx`

- [ ] **Step 1: Localizar el `queryClient.invalidateQueries` existente**

Buscar en `apps/frontend/src/pages/FichaSaludSocio.tsx` el bloque:

```tsx
      // Invalidar cache del historial para que la próxima apertura del modal
      // traiga la versión nueva. RB50.
      void queryClient.invalidateQueries({
        queryKey: ['ficha-salud', 'historial'],
      });
```

- [ ] **Step 2: Agregar invalidación adicional**

Modificar ese bloque a:

```tsx
      // Invalidar caches para que vistas que dependen del estado de la
      // ficha (modal bloqueante en Mis Turnos, modal de historial)
      // reflejen el cambio al volver.
      void queryClient.invalidateQueries({
        queryKey: ['ficha-salud', 'historial'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ficha-salud', 'estado'],
      });
```

- [ ] **Step 3: Verificar typecheck y lint**

Run: `npm run typecheck --workspace=apps/frontend && npm run lint --workspace=apps/frontend`
Expected: pasan.

- [ ] **Step 4: Correr tests del frontend**

Run: `npm test --workspace=apps/frontend`
Expected: pasan todos los tests existentes (FichaSaludSocio.test.tsx ya cubre el flujo de PUT y ahora también verificará implícitamente que la invalidación extra no rompe nada).

- [ ] **Step 5: Commit**

```bash
git add "apps/frontend/src/pages/FichaSaludSocio.tsx"
git commit -m "feat(frontend): invalidar estado ficha al guardar"
```

---

## Task 6: Verificación final

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck --workspace=apps/frontend`
Expected: pasa.

- [ ] **Step 2: Lint**

Run: `npm run lint --workspace=apps/frontend`
Expected: pasa.

- [ ] **Step 3: Tests**

Run: `npm test --workspace=apps/frontend`
Expected: pasan todos los tests, incluyendo los 4 nuevos de `ModalFichaRequeridaSocio`.

- [ ] **Step 4: Build de producción**

Run: `npm run build --workspace=apps/frontend`
Expected: pasa.

- [ ] **Step 5: Commit final de cualquier ajuste pendiente**

Si hubo ajustes en archivos no commiteados, hacer:

```bash
git status
# revisar diffs
git add <archivos>
git commit -m "chore(frontend): ajustes finales modal ficha requerida"
```

Si no hay nada, continuar.

---

## Criterio de aceptación

✅ Socio sin ficha ve modal bloqueante al entrar al dashboard y a `/turnos`.
✅ Socio con ficha ve sus turnos sin modal.
✅ Click en "Ir a cargar mi ficha" navega a `/turnos/ficha-salud`.
✅ Al completar la ficha y volver, el modal desaparece sin recargar manualmente.
✅ `npm run typecheck` y `npm run lint` pasan.
✅ 4 tests nuevos pasan; tests existentes no se rompen.

## Out of scope

- Backend (sin cambios).
- `AgendarTurno.tsx` (sigue con banner ámbar).
- Otras rutas de la app.
- Notificaciones / emails.
- E2E test (opcional, no obligatorio para esta iteración).
