# SDD Tasks — SUPERADMIN Panel (Full Impersonation Mode)

**Change**: `superadmin-panel`
**Phase**: Tasks
**Reference spec**: `openspec/changes/superadmin-panel/spec.md`
**Reference design**: `openspec/changes/superadmin-panel/design.md`
**Topic key**: `sdd/superadmin-panel/tasks`
**Execution mode**: interactive
**Artifact store**: hybrid (Engram + openspec)
**Delivery strategy**: ask-on-risk (STOP when diff exceeds 800 lines)
**Review budget**: 800 lines to break

---

## Implementation Order

```
1 → 2 → 5 → 6 →  [break for PR 1: frontend core]  → 3 → 4 → 7 →  [PR 1 closed]  → 8 → 10 → 9 → 11  [PR 2: backend]
```

### PR Split Recommendation

| PR | Tasks | Est. lines | Content |
|----|-------|-----------|---------|
| PR 1 | T1, T2, T5, T6, T3, T4, T7 | ~600 | AuthContext, TenantSwitcher, Sidebar, Dashboard, ImpersonationIndicator |
| PR 2 | T8, T10, T9, T11 | ~400 | Audit events, expiraEn fix, exit endpoint, RolesGuard |

---

## T1 — AuthContext: `rolEfectivo` + async `salirDeImpersonacion`

**Spec**: SPEC 1 (sections: AuthState, AuthContextValue, computed useMemo, salirDeImpersonacion async)
**Files**: `apps/frontend/src/contexts/AuthContext.tsx` (lines 29–41, 56–83, ~290, 272–285)

**Changes**:
- **Line ~57**: Add `rolOriginal: Rol | null` to `AuthState` interface — stores the impersonated user's actual rol, null when not impersonating
- **Line ~57**: Add `rolEfectivo: Rol | null` to `AuthContextValue` interface
- **Lines 272–285**: Replace `salirDeImpersonacion` callback with async version:
  ```ts
  const salirDeImpersonacion = useCallback(async () => {
    if (!auth) return;
    try {
      await apiRequest<void>('/auth/exit-impersonation', {
        method: 'POST',
        token: auth.tokenOriginal,
      });
    } catch {
      // Local cleanup even if endpoint fails
    }
    const nextAuth: AuthState = {
      ...auth,
      token: auth.tokenOriginal,
      gimnasioId: null,
      impersonatedBy: null,
      rolOriginal: null,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    setGimnasioActual(null);
  }, [auth]);
  ```
- **~Line 290 (useMemo)**: Add `rolEfectivo` derivation:
  ```ts
  const rolEfectivo: Rol | null = auth?.impersonatedBy != null
    ? auth.rolOriginal ?? 'ADMIN'
    : auth?.rol ?? null;
  ```
- **In `impersonarGimnasio` (around line 240)**: Capture `resultado.usuario.rol` and store in `rolOriginal` field of nextAuth

**Verification**: `npm run typecheck --workspace=apps/frontend`. Manual: login as SUPERADMIN → impersonate gym → DevTools shows `rolEfectivo === 'ADMIN'`

**Dependencies**: None
**Est. lines**: ~60

---

## T2 — TenantSwitcher: mount in MainLayout header

**Spec**: SPEC 2 (section: mount point)
**Files**: `apps/frontend/src/components/layout/MainLayout.tsx` (lines 10–14)

**Changes**:
- **Line 1**: Add `import { TenantSwitcher } from '@/components/admin/TenantSwitcher'`
- **Lines 10–14**: Wrap with header div containing TenantSwitcher:
  ```tsx
  <div className="flex items-center justify-between mb-4">
    <TenantSwitcher />
  </div>
  ```
  Mount it above `ImpersonationIndicator` and `Outlet`, inside the main content div. The component is already fully functional (impersonate, exit, list, search) — only the mount location changes.

**Verification**: Manual — login as SUPERADMIN → TenantSwitcher dropdown visible top-left of content area, not in Configuracion page.

**Dependencies**: None
**Est. lines**: ~10

---

## T3 — Sidebar: navigation branching on `rolEfectivo`

**Spec**: SPEC 3 (section: filterLinks change)
**Files**: `apps/frontend/src/components/layout/Sidebar.tsx` (lines 41, 167–168)

**Changes**:
- **Line 41**: Destructuring — add `rolEfectivo` from `useAuth()`:
  ```ts
  const { rol, rolEfectivo } = useAuth();
  ```
- **Line 168**: Change filter logic:
  ```ts
  // OLD: link.roles.includes(rol || '')
  // NEW:
  items.filter((link) => link.roles.includes(rolEfectivo || ''))
  ```
- **Footer**: Display `rolEfectivo` instead of `rol` in user info badge (shows ADMIN while impersonating, SUPERADMIN otherwise).

**Verification**: Manual — login as SUPERADMIN → sidebar shows Gimnasios, Auditoría. Impersonate ADMIN gym → sidebar switches to Socios, Nutricionistas, Turnos del día.

**Dependencies**: T1 (`rolEfectivo` must exist in AuthContext)
**Est. lines**: ~15

---

## T4 — Dashboard: branching by `rolEfectivo` + new DashboardAdminPage

**Spec**: SPEC 4 (section: Dashboard.tsx branch, DashboardAdminPage content)
**Files**: `apps/frontend/src/pages/Dashboard.tsx` (lines 1–22) | NEW: `apps/frontend/src/pages/admin/DashboardAdminPage.tsx`

**Changes**:
- **Dashboard.tsx lines 1–7**: Add imports:
  ```ts
  import { DashboardAdminPage } from '@/pages/admin/DashboardAdminPage';
  ```
- **~Line 10**: Destructuring — add `rolEfectivo` from `useAuth()`
- **~Line 24 (before generic fallback)**: Add branch:
  ```ts
  if (rolEfectivo === 'ADMIN') {
    return <DashboardAdminPage />;
  }
  ```
- **NEW `DashboardAdminPage.tsx`**: Create at `apps/frontend/src/pages/admin/DashboardAdminPage.tsx`. Content: hero gradient banner (Shield icon + gym name if impersonating), 4-card stats grid (placeholder stats: Socios, Nutricionistas, Turnos, Planes). Reuse existing Card components from the UI library. Matches existing dashboard patterns (DashboardNutricionista, DashboardSocio) in structure.

**Verification**: `npm run typecheck --workspace=apps/frontend`. Manual — SUPERADMIN without impersonating → generic fallback. SUPERADMIN impersonating ADMIN → DashboardAdminPage renders with gym name in header.

**Dependencies**: T1
**Est. lines**: ~80 (including new page)

---

## T5 — ImpersonationIndicator: amber/warning prominent style

**Spec**: SPEC 5 (section: style implementation)
**Files**: `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` (lines 18–46)

**Changes**:
- **Lines 18–46 (entire return JSX)**: Replace with amber style:
  ```tsx
  <div className="flex items-center justify-between gap-4 border-2 border-amber-300 bg-amber-50/80 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-sm shadow-amber-200/30 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200/60">
        <Building2 className="h-4 w-4 text-amber-700" />
      </div>
      <div className="flex flex-col">
        <p className="text-sm font-bold text-amber-900">Modo Impersonación</p>
        <p className="text-xs text-amber-700">
          Operando como <span className="font-semibold">{gimnasioActual.nombre}</span>
        </p>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={/* opens confirm dialog (T6) */}
      className="h-7 px-2 text-xs gap-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
    >
      <X className="h-3 w-3" />
      <span>Salir</span>
    </Button>
  </div>
  ```
  No dismiss button. Respects Tailwind v4 `@theme inline` variables if available, falls back to arbitrary amber values.

**Verification**: Manual — impersonate gym → yellow/amber banner visible at top of content area. Not subtle.

**Dependencies**: None
**Est. lines**: ~35

---

## T6 — ImpersonationIndicator: confirmation dialog before exit

**Spec**: SPEC 6 (section: AlertDialog integration)
**Files**: `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` (additions)

**Changes**:
- **Add**: `useState` import + `mostrarConfirm: boolean` state
- **Button onClick**: Change from direct call to `setMostrarConfirm(true)`
- **Add state initializer**: `const [mostrarConfirm, setMostrarConfirm] = useState(false)`
- **Add AlertDialog block** after the main indicator div:
  ```tsx
  <AlertDialog open={mostrarConfirm} onOpenChange={setMostrarConfirm}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Salir del modo impersonación?</AlertDialogTitle>
        <AlertDialogDescription>
          Vas a volver al panel de SUPERADMIN. El gimnasio{' '}
          <span className="font-semibold text-foreground">{gimnasioActual.nombre}</span>
          {' '}seguirá activo.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={async () => {
            setMostrarConfirm(false);
            await salirDeImpersonacion();
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Confirmar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  ```
  All AlertDialog components from shadcn/ui already exist in the project.

**Verification**: Manual — click "Salir" on banner → modal appears with gym name. "Cancelar" closes modal. "Confirmar" → exits. ESC and click-outside → Cancel.

**Dependencies**: T5 (indicator must exist), T1 (`salirDeImpersonacion` must be async)
**Est. lines**: ~45

---

## T7 — GimnasioDetailPage: post-impersonate navigation + invalidation

**Spec**: SPEC 7 (section: onSuccess update)
**Files**: `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx` (lines 130–138)

**Changes**:
- **Mutation onSuccess (lines 130–138)**: Update callback:
  ```ts
  onSuccess: () => {
    toast.success(`Ahora operás como ADMIN de este gimnasio`);
    queryClient.invalidateQueries({ queryKey: ['gimnasios'] });
    navigate({ to: '/dashboard' });
  },
  ```
  `queryClient` already available at line 71. `navigate` already imported. Toast stays unchanged.

**Verification**: Manual — click "Impersonar" → loading → toast → navigate to `/dashboard`. Dashboard shows ADMIN view of impersonated gym.

**Dependencies**: T4 (DashboardAdminPage must exist)
**Est. lines**: ~5

---

## T8 — Backend: Audit events IMPERSONAR_INICIO + IMPERSONAR_FIN

**Spec**: SPEC 8 (section: AccionAuditoria enum, audit call)
**Files**: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` (line 13) | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` (~line 120, after token generation)

**Changes**:
- **auditoria.entity.ts**: Add to `AccionAuditoria` enum:
  ```ts
  IMPERSONAR_INICIO = 'IMPERSONAR_INICIO',
  IMPERSONAR_FIN = 'IMPERSONAR_FIN',
  ```
- **impersonar-usuario.use-case.ts**: Inject `AuditoriaService` in constructor (same pattern as reprogramar-turno-socio.use-case.ts). After `const token = this.jwtService.sign(payload)` (~line 120):
  ```ts
  await this.auditoriaService.registrar({
    usuarioId: superadminId,
    accion: AccionAuditoria.IMPERSONAR_INICIO,
    entidad: 'Gimnasio',
    entidadId: gimnasioId,
    metadata: {
      gimnasioId,
      usuarioImpersonadoId: usuario.idUsuario,
      emailImpersonado: usuario.email,
      jti,
    },
  });
  ```

**Verification**: `npm run build --workspace=apps/backend`. Manual — impersonate gym → query `auditoria` table → `IMPERSONAR_INICIO` row present.

**Dependencies**: None
**Est. lines**: ~40

---

## T9 — Backend: Exit endpoint POST /auth/exit-impersonation

**Spec**: SPEC 9 (section: use-case, controller endpoint)
**Files**: NEW: `apps/backend/src/application/auth/use-cases/exit-impersonation.use-case.ts` | `apps/backend/src/presentation/http/controllers/auth.controller.ts` | `apps/backend/src/infrastructure/auth/guards/roles.guard.ts` (lines 7–16, extend RequestWithUser type)

**Changes**:
- **NEW `exit-impersonation.use-case.ts`**: Create use-case that:
  1. Verifies `currentToken` has `impersonatedBy != null` → throws `UnauthorizedError` if not impersonating
  2. Decodes `originalToken` to extract `superadminId`
  3. Generates new token from original SUPERADMIN payload (removes `impersonatedBy`, `gimnasioId`, restores `jti`)
  4. Registers `IMPERSONAR_FIN` audit event
  5. Returns `{ token: newToken }`

- **auth.controller.ts**: Add `exitImpersonation` endpoint:
  ```ts
  @Post('exit-impersonation')
  @UseGuards(JwtAuthGuard)
  async exitImpersonation(
    @CurrentUser() user: Express.AuthenticatedUserPayload,
    @Headers('x-superadmin-token') originalToken: string,
  ) {
    if (!user.impersonatedBy) {
      throw new BadRequestError('No hay sesión de impersonación activa');
    }
    const result = await this.exitImpersonationUseCase.execute(
      /* pass tokens for processing */,
      originalToken,
    );
    return result;
  }
  ```
  Frontend sends `Authorization: Bearer <impersonationToken>` via JwtAuthGuard, and `X-Superadmin-Token: <originalToken>` as custom header.

- **roles.guard.ts lines 7–16**: Extend `RequestWithUser.user` type to include `impersonatedBy?: number | null` and `token?: string` (to allow controller to access raw token if needed).

**Verification**: `npm run build --workspace=apps/backend`. `POST /auth/exit-impersonation` with impersonation token → 200 + new token. Without impersonation → 400. `auditoria` table shows `IMPERSONAR_FIN`.

**Dependencies**: T8 (audit enum must exist first)
**Est. lines**: ~120

---

## T10 — Backend: Fix expiraEn real value in impersonation result

**Spec**: SPEC 10 (section: IJwtService.decode, expiraEn computation)
**Files**: `apps/backend/src/domain/services/jwt.service.ts` (interface line 7) | `apps/backend/src/infrastructure/services/jwt/jwt.service.ts` (implementation) | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` (after line 120)

**Changes**:
- **jwt.service.ts interface**: Add to `IJwtService`:
  ```ts
  decode<T extends object>(token: string): T | null;
  ```
- **jwt.service.ts implementation**: Add method:
  ```ts
  decode<T extends object>(token: string): T | null {
    return this.jwtService.decode(token) as T | null;
  }
  ```
- **impersonar-usuario.use-case.ts** after `const token = this.jwtService.sign(payload)`:
  ```ts
  const decoded = this.jwtService.decode<{ exp?: number }>(token);
  let expiraEn: string;
  if (decoded?.exp) {
    const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const hours = Math.floor(minutes / 60);
    expiraEn = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  } else {
    expiraEn = '2h';
  }
  ```
- **Line ~134**: Replace hardcoded `expiraEn: '2h'` with computed `expiraEn`

**Verification**: `npm run build --workspace=apps/backend`. `POST /gimnasios/:id/impersonar` → response `expiraEn` shows real duration (e.g., `"1h 58m"`).

**Dependencies**: None
**Est. lines**: ~35

---

## T11 — Backend: RolesGuard blocks SUPERADMIN routes during impersonation

**Spec**: SPEC 11 (section: RolesGuard.canActivate update)
**Files**: `apps/backend/src/infrastructure/auth/guards/roles.guard.ts` (lines 7–16, 22–35)

**Changes**:
- **Lines 7–16 (RequestWithUser.user type)**: Add `impersonatedBy?: number | null` if not already present
- **Lines 22–35 (canActivate)**: After the requiredRoles null check and before the final `return requiredRoles.includes(user?.rol)`, add block:
  ```ts
  // Block impersonated SUPERADMIN sessions from SUPERADMIN-only endpoints
  if (
    user?.impersonatedBy != null &&
    requiredRoles.includes(Rol.SUPERADMIN)
  ) {
    throw new ForbiddenError('No podés acceder a rutas de SUPERADMIN mientras estás impersonando');
  }
  ```
  Import `ForbiddenError` from `src/domain/exceptions/custom-exceptions`. Import `Rol` (already imported).

**Verification**: `npm run build --workspace=apps/backend`. With impersonation token → any `SUPERADMIN`-guarded endpoint → 403. Without impersonation → 200.

**Dependencies**: T9 (impersonatedBy must be in RequestWithUser type for this to compile)
**Est. lines**: ~25

---

## Summary Table

| Task | Spec | Est. lines | Dependencies |
|------|------|-----------|--------------|
| T1 | SPEC 1 | ~60 | None |
| T2 | SPEC 2 | ~10 | T1 |
| T3 | SPEC 3 | ~15 | T1 |
| T4 | SPEC 4 | ~80 | T1 |
| T5 | SPEC 5 | ~35 | None |
| T6 | SPEC 6 | ~45 | T1, T5 |
| T7 | SPEC 7 | ~5 | T4 |
| T8 | SPEC 8 | ~40 | None |
| T9 | SPEC 9 | ~120 | T8 |
| T10 | SPEC 10 | ~35 | None |
| T11 | SPEC 11 | ~25 | T9 |

**Total estimated**: ~470 lines frontend (PR1) + ~220 lines backend (PR2) = ~690 lines.

**Delivery trigger**: PR1 (~470 lines, fits within 800-line budget) should be implemented first. PR2 (~220 lines) is separate.

**Highest risk task**: T9 (exit endpoint, ~120 lines in one new file) — may warrant its own task breakdown during apply if it gets complex.
