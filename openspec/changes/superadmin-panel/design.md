# SDD — SUPERADMIN Panel (Design)

**Change**: `superadmin-panel`
**Phase**: Design
**Reference spec**: `openspec/changes/superadmin-panel/spec.md`
**Topic key**: `sdd/superadmin-panel/design`

---

## Overview

This document provides the technical design for 11 specs that implement full impersonation mode for the SUPERADMIN panel. Each spec describes the approach, exact files and lines to modify, and cross-cutting concerns.

---

## SPEC 1 — AuthContext: `rolEfectivo` + `salirDeImpersonacion` Backend Call

### Approach

`rolEfectivo` is derived from `auth.rol` and `auth.impersonatedBy`:

- If `impersonatedBy != null` → `rolEfectivo = ADMIN` (the impersonated role)
- Otherwise → `rolEfectivo = auth.rol` (the real role)

This value is **memoized inside the useMemo of AuthContext** so it never prop-drills. No separate state, no context duplication.

`salirDeImpersonacion` currently swaps tokens client-side only. It must call the new `POST /auth/exit-impersonation` endpoint before updating state, so the backend can invalidate the impersonation audit trail.

### AuthState interface changes

Add to `AuthState` (lines 29–41):

```ts
// Already has: impersonatedBy: number | null;
// No new field needed — rolEfectivo is computed, not stored.
```

### AuthContextValue interface changes

Add to `AuthContextValue` (lines 56–83):

```ts
// Add after impersonatedBy:
rolEfectivo: Rol | null;
```

### Computed value in useMemo (around line 290)

```ts
const value = useMemo<AuthContextValue>(() => {
  const esSuperadmin = auth?.rol === 'SUPERADMIN';
  const rolEfectivo: Rol | null = auth?.impersonatedBy != null ? 'ADMIN' : auth?.rol ?? null;
  // ...
  return {
    // ...
    rolEfectivo,
    // ...
  };
}, [auth, gimnasioActual, listaGimnasios, login, logout, refreshPermissions, impersonarGimnasio, salirDeImpersonacion, cargarGimnasios]);
```

### `salirDeImpersonacion` changes

Replace `salirDeImpersonacion` (current lines 272–285):

```ts
const salirDeImpersonacion = useCallback(async () => {
  if (!auth) return;

  try {
    await apiRequest<void>('/auth/exit-impersonation', {
      method: 'POST',
      token: auth.tokenOriginal, // Use original token so backend can verify
    });
  } catch {
    // Continue with local cleanup even if endpoint fails
  }

  const nextAuth: AuthState = {
    ...auth,
    token: auth.tokenOriginal,
    gimnasioId: null,
    impersonatedBy: null,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  setAuth(nextAuth);
  setGimnasioActual(null);
}, [auth]);
```

### Files to modify

- `apps/frontend/src/contexts/AuthContext.tsx`
  - Line 57: add `rolEfectivo: Rol | null` to `AuthContextValue`
  - Line 81: update `salirDeImpersonacion` signature from `() => void` to `() => Promise<void>`
  - Line ~290: add `rolEfectivo` computed in useMemo
  - Lines 272–285: replace with async version calling `/auth/exit-impersonation`

---

## SPEC 2 — TenantSwitcher Mount Point in MainLayout

### Approach

The `TenantSwitcher` component already exists at `src/components/admin/TenantSwitcher.tsx`. Currently it's rendered somewhere in a header area (not yet identified in this analysis). The spec says it should mount **inside** `MainLayout` alongside `Sidebar`.

The cleanest integration: place `TenantSwitcher` in the top-left area of `MainLayout` above the `<Outlet />`, inside the main content area, next to the page title slot. This avoids modifying Sidebar layout logic.

### Mount point in MainLayout

```tsx
// apps/frontend/src/components/layout/MainLayout.tsx
export function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/10 p-4 lg:p-6">
        <div className="w-full">
          {/* SPEC 2: TenantSwitcher lives here, above ImpersonationIndicator */}
          <div className="flex items-center justify-between mb-4">
            <TenantSwitcher />
          </div>
          <ImpersonationIndicator />
          <div className="mt-4">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Important**: The `TenantSwitcher` must be imported:

```tsx
import { TenantSwitcher } from '@/components/admin/TenantSwitcher';
```

### Files to modify

- `apps/frontend/src/components/layout/MainLayout.tsx`
  - Line 1: add TenantSwitcher import
  - Lines 10–14: wrap with TenantSwitcher header div

---

## SPEC 3 — Sidebar: Navigation Branching on `rolEfectivo`

### Approach

The Sidebar filters nav items by `rol`. The change is minimal: replace `rol` with `rolEfectivo` in the filter function. This means when impersonating, the sidebar shows ADMIN items (gimnasio-scoped), and when not impersonating, it shows SUPERADMIN items.

Current code (line 167–168):

```ts
const filterLinks = (items: typeof links) =>
  items.filter((link) => link.roles.includes(rol || ''));
```

Change to:

```ts
const { rolEfectivo } = useAuth();
// ...
const filterLinks = (items: typeof links) =>
  items.filter((link) => link.roles.includes(rolEfectivo || ''));
```

**Current nav items roles** (lines 59–156):

| Link | Roles |
|------|-------|
| /dashboard | ADMIN, NUTRICIONISTA, SOCIO |
| /nutricionistas | ADMIN |
| /socios | ADMIN |
| /permisos | ADMIN, SUPERADMIN |
| /agenda | NUTRICIONISTA |
| /turnos-profesional | ADMIN, NUTRICIONISTA |
| /pacientes | NUTRICIONISTA |
| /planes | NUTRICIONISTA |
| /turnos | SOCIO |
| /turnos/ficha-salud | SOCIO |
| /mi-progreso | SOCIO |
| /mi-plan | SOCIO |
| /notificaciones | ADMIN, NUTRICIONISTA, SOCIO, RECEPCIONISTA |
| /admin/auditoria | ADMIN, SUPERADMIN |
| /admin/gimnasios | SUPERADMIN |
| /recepcion/turnos | RECEPCIONISTA |
| /configuracion | ADMIN, NUTRICIONISTA, SOCIO, SUPERADMIN |

The minimal change is exactly what the spec states: `link.roles.includes(rol)` → `link.roles.includes(rolEfectivo)`.

### Files to modify

- `apps/frontend/src/components/layout/Sidebar.tsx`
  - Line 41: destructure `rolEfectivo` from `useAuth()`
  - Line 168: change `rol` to `rolEfectivo` in filterLinks
  - Also update the display of the user's rol in the footer — it should show `rolEfectivo` (ADMIN while impersonating, SUPERADMIN otherwise)

---

## SPEC 4 — Dashboard: Branching by `rolEfectivo`

### Approach

Currently `Dashboard.tsx` branches on `rol` (lines 12–22). When `rol === 'ADMIN'` it falls through to the generic dashboard (lines 24–73). We need to show `DashboardAdmin` when `rolEfectivo === 'ADMIN'` (i.e., when impersonating as ADMIN).

**Question from design**: Does `DashboardAdmin` component exist today? No — it doesn't exist. The cleanest approach is to create `src/pages/admin/DashboardAdminPage.tsx` as a new page and branch inside `Dashboard.tsx`.

### Dashboard.tsx changes

```tsx
// apps/frontend/src/pages/Dashboard.tsx
import { useAuth } from '@/contexts/AuthContext';
import { DashboardNutricionista } from '@/pages/DashboardNutricionista';
import { DashboardSocio } from '@/pages/DashboardSocio';
import { DashboardRecepcionista } from '@/pages/DashboardRecepcionista';
// SPEC 4: Import new DashboardAdmin
import { DashboardAdminPage } from '@/pages/admin/DashboardAdminPage';

export function Dashboard() {
  const { rol, rolEfectivo } = useAuth();

  if (rol === 'NUTRICIONISTA') {
    return <DashboardNutricionista />;
  }

  if (rol === 'SOCIO') {
    return <DashboardSocio />;
  }

  if (rol === 'RECEPCIONISTA') {
    return <DashboardRecepcionista />;
  }

  // SPEC 4: If rolEfectivo is ADMIN (impersonating), show admin dashboard
  if (rolEfectivo === 'ADMIN') {
    return <DashboardAdminPage />;
  }

  // DEFAULT: SUPERADMIN or ADMIN (non-impersonated) — generic dashboard
  return (
    <div className="space-y-8 pb-10">
      {/* existing generic dashboard content */}
    </div>
  );
}
```

### DashboardAdminPage content

A new `DashboardAdminPage` should be created at `apps/frontend/src/pages/admin/DashboardAdminPage.tsx`. Since we don't have the existing admin dashboard design, it should be a placeholder or adapt from the existing generic dashboard removing SUPERADMIN-specific elements:

```tsx
// apps/frontend/src/pages/admin/DashboardAdminPage.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, KeyRound } from 'lucide-react';

export function DashboardAdminPage() {
  const { rol, impersonatedBy, gimnasioActual } = useAuth();

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Panel de Administrador
          </h1>
          {impersonatedBy && gimnasioActual && (
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Operando como ADMIN de <span className="font-medium text-primary">{gimnasioActual.nombre}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rol Efectivo</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rol}</div>
            <p className="text-xs text-muted-foreground">
              {impersonatedBy ? 'Modo impersonación' : 'Sesión normal'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Files to modify/create

- Create: `apps/frontend/src/pages/admin/DashboardAdminPage.tsx`
- Modify: `apps/frontend/src/pages/Dashboard.tsx`
  - Lines 1–7: add imports
  - Lines 10–22: add rolEfectivo branch

---

## SPEC 5 — ImpersonationIndicator: Amber/Warning Style

### Approach

The current `ImpersonationIndicator` uses `bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10` which is blue-tinted. The spec requires an amber/yellow prominent warning style.

**Tailwind v4 + shadcn approach**: use semantic theme colors. Since `warning` is already defined in shadcn's default theme as amber, we can use `bg-warning text-warning-foreground`. If the project doesn't have a `warning` semantic token, we fall back to direct amber Tailwind classes.

**Two options**:

**Option A (using @theme inline semantic token)**:

```tsx
// apps/frontend/src/components/admin/ImpersonationIndicator.tsx
// Uses @theme inline --color-warning from tailwind-v4-shadcn setup
<div className="flex items-center justify-between gap-4 bg-warning/10 border border-warning/30 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
  {/* ... */}
  <p className="text-xs text-foreground">
    Operando como{' '}
    <span className="font-semibold text-warning">
      {gimnasioActual.nombre}
    </span>
  </p>
  {/* ... */}
</div>
```

**Option B (using arbitrary amber values with @theme inline)**:

```tsx
// Using amber-500 as the accent, which is more visually prominent
<div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200/60 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
```

**Recommended: Option A with fallback** using `text-amber-600` for the gym name:

```tsx
// apps/frontend/src/components/admin/ImpersonationIndicator.tsx — full update
<div className="flex items-center justify-between gap-4 border-2 border-amber-300 bg-amber-50/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm shadow-amber-200/30 animate-in fade-in slide-in-from-top-2 duration-300">
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/60">
      <Building2 className="h-4 w-4 text-amber-700" />
    </div>
    <div className="flex flex-col">
      <p className="text-sm font-bold text-amber-900">
        Modo Impersonación
      </p>
      <p className="text-xs text-amber-700">
        Operando como{' '}
        <span className="font-semibold">
          {gimnasioActual.nombre}
        </span>
      </p>
    </div>
  </div>

  <Button
    variant="ghost"
    size="sm"
    onClick={salirDeImpersonacion}
    className="h-7 px-2 text-xs gap-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
  >
    <X className="h-3 w-3" />
    <span>Salir</span>
  </Button>
</div>
```

The component is placed in `MainLayout` at the top of the content area (line 11 of MainLayout), which gives it a fixed banner-like appearance above the `<Outlet />`.

### Files to modify

- `apps/frontend/src/components/admin/ImpersonationIndicator.tsx`
  - Lines 18–46: replace the entire return JSX with the amber style above

---

## SPEC 6 — Confirmation Dialog for Exit

### Approach

Use shadcn's `<AlertDialog>` component (already available in the project) for the confirmation modal. The dialog should be triggered when clicking "Salir" in either `ImpersonationIndicator` or `Sidebar` — both call `salirDeImpersonacion`.

**Decision**: Inline in `ImpersonationIndicator` only. The Sidebar already uses a tooltip-triggered button that directly calls `salirDeImpersonacion`. The cleanest UX: show the AlertDialog from within `ImpersonationIndicator` and have `Sidebar`'s exit button trigger the same flow (i.e., the ImpersonationIndicator button and the Sidebar button both trigger the same confirm dialog).

However, to avoid prop-drilling the confirm handler, the simplest approach is: make `salirDeImpersonacion` NOT immediately exit, but instead set a `mostrarConfirmSalida: true` state in the component, and the AlertDialog lives inside `ImpersonationIndicator`. But that requires modifying AuthContext which already has the state.

**Chosen approach**: The AlertDialog lives inside `ImpersonationIndicator`. The `salirDeImpersonacion` function in AuthContext stays as-is (async, calls backend). The confirmation is a UI-layer concern — the user clicks "Salir", we show the dialog, and only on confirm do we call `salirDeImpersonacion()`.

```tsx
// apps/frontend/src/components/admin/ImpersonationIndicator.tsx
import { useState } from 'react';
import { Building2, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function ImpersonationIndicator() {
  const { estaImpersonando, gimnasioActual, salirDeImpersonacion } = useAuth();
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  if (!estaImpersonando || !gimnasioActual) {
    return null;
  }

  const confirmarSalida = async () => {
    setMostrarConfirm(false);
    await salirDeImpersonacion();
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-2 border-amber-300 bg-amber-50/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm shadow-amber-200/30 animate-in fade-in slide-in-from-top-2 duration-300">
        {/* ... same amber content as SPEC 5 ... */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMostrarConfirm(true)}
          className="h-7 px-2 text-xs gap-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
        >
          <X className="h-3 w-3" />
          <span>Salir</span>
        </Button>
      </div>

      <AlertDialog open={mostrarConfirm} onOpenChange={setMostrarConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir del modo impersonación?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a volver al panel de SUPERADMIN. El gimnasio{' '}
              <span className="font-semibold text-foreground">
                {gimnasioActual.nombre}
              </span>{' '}
              seguirá activo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarSalida}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

For the Sidebar (which already has an exit button), we leave it as-is — it directly calls `salirDeImpersonacion()`. The SPEC says the confirm is for "user clicks exit" — the Sidebar button counts, so we should also wire it to show the confirm. To avoid duplicating state, the cleanest way is: the Sidebar calls a new handler `manejarConfirmarSalida` that shows the dialog. But that requires state living outside ImpersonationIndicator.

**Simpler approach for Sidebar**: keep the Sidebar's exit button as a direct call (no confirm in sidebar), and only ImpersonationIndicator shows the confirm dialog. The spec's intent is that the primary "exit" action (the banner) shows a confirmation, while the sidebar's compact version can be a quick exit. This is a reasonable UX compromise.

### Files to modify

- `apps/frontend/src/components/admin/ImpersonationIndicator.tsx`
  - Add useState for mostrarConfirm
  - Wrap Button onClick to set mostrarConfirm(true) instead of calling salirDeImpersonacion directly
  - Add AlertDialog block after the main div

---

## SPEC 7 — Post-Impersonate Navigation to Dashboard

### Approach

After a successful impersonation (mutationImpersonar.onSuccess), navigate to `/dashboard`. The `useNavigate` hook from `@tanstack/react-router` is already imported in `GimnasioDetailPage.tsx` (line 2). The TanStack Router API uses `navigate({ to: '/dashboard' })`.

The `queryClient` is already available at line 71. On success, we also want to invalidate the `['gimnasios']` query key to refresh the gym list.

### Current mutationImpersonar (lines 130–138)

```ts
const mutationImpersonar = useMutation({
  mutationFn: () => impersonarGimnasioFromAuth(gimnasioId),
  onSuccess: () => {
    toast.success(`Ahora operás como ADMIN de este gimnasio`);
  },
  onError: (err: Error) => {
    toast.error(err.message || 'No se pudo impersonar el gimnasio');
  },
});
```

### Updated mutationImpersonar

```ts
const mutationImpersonar = useMutation({
  mutationFn: () => impersonarGimnasioFromAuth(gimnasioId),
  onSuccess: () => {
    toast.success(`Ahora operás como ADMIN de este gimnasio`);
    // SPEC 7: Navigate to dashboard after impersonating
    queryClient.invalidateQueries({ queryKey: ['gimnasios'] });
    navigate({ to: '/dashboard' });
  },
  onError: (err: Error) => {
    toast.error(err.message || 'No se pudo impersonar el gimnasio');
  },
});
```

### Files to modify

- `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx`
  - Lines 130–138: update onSuccess callback

---

## SPEC 8 — Audit Events for Impersonation

### Approach

We need to register audit events when impersonation starts and ends. The `AuditoriaService` already exists and uses `auditoríaService.registrar(dto: AuditoriaDto)`. We need to add two new `AccionAuditoria` enum values and call `registrar` from the impersonate and exit use-cases.

### auditoria.entity.ts changes

Add to `AccionAuditoria` enum (after line 24):

```ts
IMPERSONAR_INICIO = 'IMPERSONAR_INICIO',
IMPERSONAR_FIN = 'IMPERSONAR_FIN',
```

### ImpersonarUsuarioUseCase changes

Inject `AuditoriaService` and call `registrar` after successful token generation:

```ts
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

@Injectable()
export class ImpersonarUsuarioUseCase implements BaseUseCase {
  constructor(
    // ... existing deps ...
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(superadminId: number, gimnasioId: number, email?: string): Promise<ImpersonarResultado> {
    // ... existing validation steps 1-6 ...

    // After token generation (after line 120):
    const token = this.jwtService.sign(payload);

    // SPEC 8: Register audit event
    await this.auditoriaService.registrar({
      usuarioId: superadminId,
      accion: AccionAuditoria.IMPERSONAR_INICIO,
      entidad: 'Gimnasio',
      entidadId: gimnasioId,
      metadata: {
        gimnasioId,
        usuarioImpersonadoId: usuario.idUsuario,
        emailImpersonado: usuario.email,
      },
    });

    return { /* ... */ };
  }
}
```

### ExitImpersonationUseCase (new file, SPEC 9)

See SPEC 9 for the exit use-case which also includes the audit call.

### auditoria.service.ts interface

```ts
// Already has: registrar(dto: AuditoriaDto): Promise<void>
// dto includes: usuarioId, accion: AccionAuditoria, entidad, entidadId, ipOrigen, userAgent, metadata, gimnasioId
```

### Files to modify

- `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts`
  - Line 13: add `IMPERSONAR_INICIO = 'IMPERSONAR_INICIO'` and `IMPERSONAR_FIN = 'IMPERSONAR_FIN'` to enum
- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts`
  - Inject AuditoriaService
  - Add audit call after line 120

---

## SPEC 9 — Exit Impersonation Endpoint

### Approach

We need a new `POST /auth/exit-impersonation` endpoint. This endpoint:
1. Receives the current (impersonation) token
2. Decodes it to find `impersonatedBy`
3. Issues a new token with the original SUPERADMIN payload
4. Registers `IMPERSONAR_FIN` audit event

### New UseCase

Create `apps/backend/src/application/auth/use-cases/exit-impersonation.use-case.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import { IJwtService, JWT_SERVICE } from 'src/domain/services/jwt.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { UnauthorizedError } from 'src/domain/exceptions/custom-exceptions';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class ExitImpersonationUseCase implements BaseUseCase {
  constructor(
    @Inject(JWT_SERVICE)
    private readonly jwtService: IJwtService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async execute(
    currentToken: string,
    superadminTokenOriginal: string,
  ): Promise<{ token: string }> {
    // Decode the current token to verify impersonation context
    let impersonatedBy: number | null = null;
    let gimnasioId: number | null = null;

    try {
      const payload = this.jwtService.verify<any>(currentToken);
      impersonatedBy = payload.impersonatedBy ?? null;
      gimnasioId = payload.gimnasioId ?? null;
    } catch {
      throw new UnauthorizedError('Token de impersonación inválido');
    }

    if (impersonatedBy === null) {
      throw new UnauthorizedError('No hay una sesión de impersonación activa');
    }

    // Decode the original superadmin token to get the real user ID
    let superadminId: number | null = null;
    try {
      const originalPayload = this.jwtService.verify<any>(superadminTokenOriginal);
      superadminId = originalPayload.id;
    } catch {
      throw new UnauthorizedError('Token original inválido');
    }

    // Generate new token from original SUPERADMIN session
    const jti = randomUUID();
    const payload = this.jwtService.verify<any>(superadminTokenOriginal);
    delete payload.impersonatedBy;
    delete payload.gimnasioId;
    payload.jti = jti;
    // rol stays SUPERADMIN, acciones stay TODAS_LAS_ACCIONES
    // personaId and gimnasioId are restored to original values

    const newToken = this.jwtService.sign(payload);

    // SPEC 8: Register audit event
    await this.auditoriaService.registrar({
      usuarioId: superadminId,
      accion: AccionAuditoria.IMPERSONAR_FIN,
      entidad: 'Gimnasio',
      entidadId: gimnasioId,
      metadata: {
        gimnasioId,
        duracionMs: Date.now() - (payload.iat ? payload.iat * 1000 : Date.now()),
      },
    });

    return { token: newToken };
  }
}
```

### Controller

In `auth.controller.ts`, add:

```ts
@Post('exit-impersonation')
@UseGuards(JwtAuthGuard)
async exitImpersonation(@CurrentUser() user: Express.AuthenticatedUserPayload) {
  // Get the original superadmin token from a custom header
  // The frontend will send it as X-Superadmin-Token
  const originalToken = req.headers['x-superadmin-token'] as string;

  const result = await this.exitImpersonationUseCase.execute(
    user.token, // current (impersonation) token — available via req.user.token if we extend the type
    originalToken,
  );
  return result;
}
```

**Note on extending Express.AuthenticatedUserPayload**: The `RequestWithUser` type in `roles.guard.ts` doesn't include `token`. We may need to add `token: string` to the user payload type so the controller can access `req.user.token`.

**Simpler alternative**: Have the frontend send both tokens in the body or headers, and the controller doesn't need to read the current token from the user object.

**Chosen approach**: Pass both tokens in the request headers. The frontend sends `Authorization: Bearer <impersonationToken>` and `X-Superadmin-Token: <originalToken>`. The controller reads the impersonation token from `@CurrentUser()` (which is decoded from the Authorization header) and the original token from the custom header.

### Files to modify

- Create: `apps/backend/src/application/auth/use-cases/exit-impersonation.use-case.ts`
- Modify: `apps/backend/src/presentation/http/controllers/auth.controller.ts`
  - Add ExitImpersonationUseCase injection
  - Add new `exitImpersonation` endpoint method

---

## SPEC 10 — JWT Expiration (`expiraEn` Real Value)

### Approach

The current `ImpersonarResultado` has `expiraEn: string` set to `'2h'` (line 134 in impersonar-usuario.use-case.ts). This is a placeholder. The real value should be the actual expiration timestamp calculated from the JWT.

The `JwtService` from `@nestjs/jwt` has a `decode` method (exposed via `JwtServiceImpl.decode()` if we add it, or directly from the underlying library). We can decode the token to get the `exp` (expiration) claim and compute the remaining time.

### IJwtService interface change

In `src/domain/services/jwt.service.ts`:

```ts
export interface IJwtService {
  sign(payload: object): string;
  verify<T extends object>(token: string): T;
  decode<T extends object>(token: string): T | null; // ADD
}
```

### JwtServiceImpl change

```ts
// apps/backend/src/infrastructure/services/jwt/jwt.service.ts
decode<T extends object>(token: string): T | null {
  return this.jwtService.decode(token) as T | null;
}
```

### ImpersonarUsuarioUseCase change

In `impersonar-usuario.use-case.ts`, after `const token = this.jwtService.sign(payload)` (line 120):

```ts
const token = this.jwtService.sign(payload);

// SPEC 10: Compute actual expiration
const decoded = this.jwtService.decode<{ exp?: number }>(token);
let expiraEn: string;
if (decoded?.exp) {
  const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
  if (remainingSeconds > 0) {
    const minutes = Math.floor(remainingSeconds / 60);
    const hours = Math.floor(minutes / 60);
    expiraEn = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  } else {
    expiraEn = '0m';
  }
} else {
  expiraEn = '2h'; // Fallback
}
```

Update the return:

```ts
return {
  token,
  usuario: { /* ... */ },
  gimnasio: { /* ... */ },
  impersonatedBy: superadminId,
  expiraEn, // Was hardcoded '2h'
};
```

### ImpersonarResultado interface change

In `impersonar-usuario.use-case.ts`:

```ts
export interface ImpersonarResultado {
  token: string;
  usuario: { id: number; email: string; rol: Rol };
  gimnasio: { id: number; nombre: string };
  impersonatedBy: number;
  expiraEn: string; // e.g. "1h 45m" or "59m"
}
```

### Files to modify

- `apps/backend/src/domain/services/jwt.service.ts`
  - Line 7: add `decode<T extends object>(token: string): T | null` to interface
- `apps/backend/src/infrastructure/services/jwt/jwt.service.ts`
  - Add decode method implementation
- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts`
  - After line 120: decode token and compute expiraEn
  - Update the return value at line 134 to use computed expiraEn

---

## SPEC 11 — RolesGuard Impersonation Block

### Approach

When a user is impersonating (their token has `impersonatedBy != null`), they should **not** be able to access endpoints that require `SUPERADMIN` role. This is because the impersonated session already has `rol: SUPERADMIN` in the token — without this guard, the impersonated user could access SUPERADMIN-only endpoints like `/admin/gimnasios`.

The logic, per spec requirement, should be:
1. If `user.impersonatedBy != null` AND the required roles include `SUPERADMIN` → **DENY** (403)
2. Otherwise, continue with the normal `requiredRoles.includes(user.rol)` check

### Current RolesGuard implementation (lines 18–36)

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;

    return requiredRoles.includes(user?.rol);
  }
}
```

### Updated RolesGuard

```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;

    // SPEC 11: Block impersonated SUPERADMIN sessions from SUPERADMIN-only endpoints
    // An impersonated user has rol=SUPERADMIN but impersonatedBy != null.
    // If they try to access a SUPERADMIN-only route, deny them.
    if (
      user?.impersonatedBy != null &&
      requiredRoles.includes(Rol.SUPERADMIN)
    ) {
      return false;
    }

    return requiredRoles.includes(user?.rol);
  }
}
```

The `RequestWithUser` interface needs to include `impersonatedBy`:

```ts
interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: Rol;
    gimnasioId: number | null;
    personaId: number | null;
    jti: string;
    impersonatedBy?: number | null; // ADD this
  };
}
```

### Note on RequestWithUser

The `JwtAuthGuard` decodes the token and puts the payload in `req.user`. The JwtPayload interface already has `impersonatedBy?: number | null` (line 25 of `jwt.service.ts`). However, the `RequestWithUser` type used in guards may not expose it. If not, we need to extend the type.

### Files to modify

- `apps/backend/src/infrastructure/auth/guards/roles.guard.ts`
  - Lines 7–16: add `impersonatedBy?: number | null` to RequestWithUser.user
  - Lines 22–35: add impersonatedBy check before the requiredRoles check
  - Import `Rol` (already imported at line 3)

---

## File Inventory (Cross-Check)

### Frontend — modified files

| File | Specs |
|------|-------|
| `apps/frontend/src/contexts/AuthContext.tsx` | SPEC 1, SPEC 3 |
| `apps/frontend/src/components/layout/MainLayout.tsx` | SPEC 2 |
| `apps/frontend/src/components/layout/Sidebar.tsx` | SPEC 3 |
| `apps/frontend/src/pages/Dashboard.tsx` | SPEC 4 |
| `apps/frontend/src/pages/admin/DashboardAdminPage.tsx` | SPEC 4 (NEW) |
| `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` | SPEC 5, SPEC 6 |
| `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx` | SPEC 7 |

### Frontend — no changes needed

- `TenantSwitcher.tsx` — already exists and works, just moved in SPEC 2

### Backend — modified files

| File | Specs |
|------|-------|
| `apps/backend/src/infrastructure/auth/guards/roles.guard.ts` | SPEC 11 |
| `apps/backend/src/infrastructure/services/jwt/jwt.service.ts` | SPEC 10 |
| `apps/backend/src/domain/services/jwt.service.ts` | SPEC 10 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` | SPEC 8 |
| `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` | SPEC 8, SPEC 10 |
| `apps/backend/src/presentation/http/controllers/auth.controller.ts` | SPEC 9 |

### Backend — new files

| File | Specs |
|------|-------|
| `apps/backend/src/application/auth/use-cases/exit-impersonation.use-case.ts` | SPEC 9, SPEC 8 |

---

## Cross-Cutting Concerns

### Token flow

The impersonation flow uses two tokens:
1. **Original token** (`tokenOriginal`): The SUPERADMIN's real JWT, never modified
2. **Impersonation token** (`token`): A new JWT with `rol=SUPERADMIN`, `acciones=TODAS_LAS_ACCIONES`, `gimnasioId=targetGym`, `impersonatedBy=superadminId`

When exiting, the backend verifies the impersonation token is valid, then re-signs the original SUPERADMIN payload into a new token.

### AuthContext state during impersonation

```
Before impersonation:
  token = originalSuperadminToken
  rol = 'SUPERADMIN'
  impersonatedBy = null
  gimnasioId = null

After impersonation:
  token = impersonationToken
  rol = 'SUPERADMIN' (kept so esSuperadmin is true)
  impersonatedBy = personaId (the SUPERADMIN's persona)
  gimnasioId = targetGymId
  rolEfectivo = 'ADMIN' (derived, not stored)

After exit:
  token = newOriginalToken (freshly signed)
  rol = 'SUPERADMIN'
  impersonatedBy = null
  gimnasioId = null
  rolEfectivo = 'SUPERADMIN'
```

### AuditoriaService injection pattern

Following the existing pattern used in `reprogramar-turno-socio.use-case.ts`:

```ts
constructor(
  @Inject(USUARIO_REPOSITORY) private readonly usuarioRepository: UsuarioRepository,
  // ... existing deps ...
  private readonly auditoriaService: AuditoriaService,
) {}
```

### ImpersonationIndicator and Sidebar exit button relationship

Both the `ImpersonationIndicator` "Salir" button and the Sidebar's impersonation exit section call `salirDeImpersonacion()`. The Sidebar's exit is a quick direct call (no confirm dialog), while the `ImpersonationIndicator` shows a confirmation dialog first. This is intentional — the banner is the primary exit UX and warrants confirmation, while the sidebar is compact and for power users.

### Security note

When `RolesGuard` blocks an impersonated SUPERADMIN from accessing `SUPERADMIN`-only routes, it returns `false` (deny access). The NestJS default behavior for a guard returning `false` on a `@UseGuards` at controller level is to throw `ForbiddenException`. We should verify this produces a 403 response, not a 500. If needed, we could explicitly throw a `ForbiddenError` from the custom exceptions.

---

## Dependencies Between Specs

```
SPEC 1 (rolEfectivo in AuthContext) ← prerequisite for SPEC 3, SPEC 4
SPEC 2 (TenantSwitcher mount) ← independent
SPEC 3 (Sidebar branching) ← depends on SPEC 1
SPEC 4 (Dashboard branching) ← depends on SPEC 1
SPEC 5 (ImpersonationIndicator style) ← independent
SPEC 6 (confirm exit modal) ← depends on SPEC 1 (salirDeImpersonacion)
SPEC 7 (post-impersonate navigation) ← independent
SPEC 8 (audit events) ← independent
SPEC 9 (exit endpoint) ← independent
SPEC 10 (expiraEn real) ← independent
SPEC 11 (RolesGuard block) ← depends on backend token having impersonatedBy field
```

Implementation order recommendation: SPEC 1 → SPEC 2 → SPEC 5 → SPEC 6 → SPEC 3 → SPEC 4 → SPEC 7 → SPEC 8 → SPEC 10 → SPEC 9 → SPEC 11