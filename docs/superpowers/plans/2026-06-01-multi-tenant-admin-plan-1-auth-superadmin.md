# Plan 1: Auth + Login + SUPERADMIN Relaxation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow SUPERADMIN to operate without `gimnasioId` in JWT (cross-tenant admin). Refactor auth, login, and guards to support this without weakening security for other roles.

**Architecture:** Defense in depth — JWT carries `gimnasioId: number | null` (null only for SUPERADMIN without impersonation). Backend guards allow null ONLY for SUPERADMIN. Login removes the `gimnasioId=1` legacy fallback. ActionsGuard bypass restricted to SUPERADMIN (not ADMIN).

**Tech Stack:** NestJS guards, TypeScript, Jest (TDD)

---

## Contexto previo

**Branch:** `feature/multi-tenant-admin` (worktree: `.worktrees/multi-tenant-admin/`)

**Baseline commit:** `1ff8017` — ya incluye entities con `gimnasioId`, repos con filtro, `TenantContextService`, `JwtStrategy`, `LocalStrategy`, y los tests base.

**Lo que falta (per spec §6):**
- §6.1: `auth.guard.ts` rechaza `gimnasioId=null` para TODOS → debe permitirlo solo para SUPERADMIN
- §6.3: `login.use-case.ts` tiene fallback a `gimnasioId=1` → debe removerlo; SUPERADMIN puede tener `gimnasioId=null` en JWT
- §6.6: `actions.guard.ts` bypasea ADMIN y SUPERADMIN → debe bypassear solo SUPERADMIN
- §6.2: `TenantContextService` no tiene `impersonatedBy` (se agrega ahora aunque impersonación es Plan 5 — el type va primero)
- Tipos: `JwtPayload.gimnasioId: number` → `number | null`; `roles.guard.ts` igual; `actions.guard.ts` igual

**Skills requeridos durante ejecución:**
- `nestjs-best-practices` (per backend AGENTS.md)
- `javascript-testing-patterns` (per backend AGENTS.md)

---

## File Structure

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `apps/backend/src/domain/services/jwt.service.ts` | `JwtPayload` type (modificar) | Modificar |
| `apps/backend/src/infrastructure/auth/guards/auth.guard.ts` | Tenant validation (modificar) | Modificar |
| `apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts` | Tests del guard | Modificar |
| `apps/backend/src/infrastructure/auth/guards/actions.guard.ts` | Permission check (modificar) | Modificar |
| `apps/backend/src/application/auth/login.use-case.ts` | Login flow (modificar) | Modificar |
| `apps/backend/src/application/auth/login.use-case.spec.ts` | Tests del login | Modificar |
| `apps/backend/src/infrastructure/auth/tenant-context.service.ts` | Add `impersonatedBy` | Modificar |
| `apps/backend/src/infrastructure/auth/tenant-context.service.spec.ts` | Tests del service | Modificar |
| `apps/backend/src/infrastructure/auth/guards/roles.guard.ts` | Update `gimnasioId` type | Modificar |

---

## Tasks

### Task 1: Update `JwtPayload` type to allow null gimnasioId

**Files:**
- Modify: `apps/backend/src/domain/services/jwt.service.ts:19`

- [ ] **Step 1: Update type**

```ts
// apps/backend/src/domain/services/jwt.service.ts
export interface JwtPayload {
  id: number | null;
  email: string;
  rol: Rol;
  acciones?: string[];
  personaId: number | null;
  /** ID del gimnasio/tenant. null solo para SUPERADMIN sin impersonar. */
  gimnasioId: number | null;  // <-- changed from `number`
  jti: string;
  exp?: number;
  /** ID del SUPERADMIN que inició la sesión de impersonación (null si no impersona) */
  impersonatedBy?: number | null;  // <-- new field
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS (no other files should break yet; we'll fix in subsequent tasks)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/domain/services/jwt.service.ts
git commit -m "feat(auth): allow null gimnasioId + add impersonatedBy to JwtPayload"
```

---

### Task 2: Update `RolesGuard` to allow null gimnasioId in user type

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/roles.guard.ts:7-16`

- [ ] **Step 1: Update user interface**

```ts
// apps/backend/src/infrastructure/auth/guards/roles.guard.ts
interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: Rol;
    gimnasioId: number | null;  // <-- changed from `number`
    personaId: number | null;
    jti: string;
  };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/auth/guards/roles.guard.ts
git commit -m "feat(auth): allow null gimnasioId in RolesGuard user type"
```

---

### Task 3: Update `ActionsGuard` user type

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/actions.guard.ts:14-24`

- [ ] **Step 1: Update user interface**

```ts
// apps/backend/src/infrastructure/auth/guards/actions.guard.ts
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    rol: Rol;
    acciones?: string[];
    gimnasioId: number | null;  // <-- changed
    personaId: number | null;
    jti: string;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/infrastructure/auth/guards/actions.guard.ts
git commit -m "feat(auth): allow null gimnasioId in ActionsGuard user type"
```

---

### Task 4: Write failing test for SUPERADMIN with null gimnasioId in auth.guard

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts`

- [ ] **Step 1: Add new tests**

Append to the existing `describe('tenant context enforcement', ...)` block:

```ts
it('should allow SUPERADMIN with null gimnasioId (cross-tenant admin)', () => {
  jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(false);

  const superadminPayload = {
    id: 1,
    email: 'superadmin@nutrifit.com',
    rol: 'SUPERADMIN' as Rol,
    personaId: null,  // SUPERADMIN no tiene persona
    gimnasioId: null,  // explícitamente null
    jti: 'jti-super',
  };

  jest.spyOn(jwtService, 'verify').mockReturnValue(superadminPayload as any);

  const result = guard.canActivate(createMockContext('Bearer superadmin-token'));

  expect(result).toBe(true);
  expect((mockRequest as any).user).toEqual(superadminPayload);
});

it('should still reject SOCIO with null gimnasioId', () => {
  jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(false);

  const socioPayload = {
    id: 2,
    email: 'socio@test.com',
    rol: 'SOCIO' as Rol,
    personaId: 5,
    gimnasioId: null,
    jti: 'jti-socio',
  };

  jest.spyOn(jwtService, 'verify').mockReturnValue(socioPayload as any);

  const context = createMockContext('Bearer socio-tenantless-token');

  expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  expect(() => guard.canActivate(context)).toThrow('Token sin contexto de tenant');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts --runInBand -t "SUPERADMIN with null gimnasioId"`
Expected: FAIL — first test fails because guard currently rejects null `gimnasioId` even for SUPERADMIN

- [ ] **Step 3: Commit failing test**

```bash
git add apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts
git commit -m "test(auth): add SUPERADMIN null-gimnasio case to auth.guard"
```

---

### Task 5: Implement SUPERADMIN relaxation in auth.guard

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/auth.guard.ts:48-50`

- [ ] **Step 1: Update guard logic**

```ts
// apps/backend/src/infrastructure/auth/guards/auth.guard.ts
// (replace lines 47-50)

      // Validar que el token tenga los campos requeridos para tenant isolation.
      // SUPERADMIN puede no tener gimnasioId (operar cross-tenant).
      if (
        payload.rol !== Rol.SUPERADMIN &&
        (payload.gimnasioId === undefined || payload.gimnasioId === null)
      ) {
        throw new UnauthorizedException('Token sin contexto de tenant');
      }
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx jest apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts --runInBand`
Expected: PASS — all 8 tests (5 existing + 2 new + 1 updated)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/auth/guards/auth.guard.ts
git commit -m "feat(auth): allow SUPERADMIN with null gimnasioId in JwtAuthGuard"
```

---

### Task 6: Update TenantContextService with impersonatedBy

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/tenant-context.service.ts`

- [ ] **Step 1: Add field**

```ts
// apps/backend/src/infrastructure/auth/tenant-context.service.ts
// Add to class:

  private _impersonatedBy: number | null = null;

  get impersonatedBy(): number | null {
    return this._impersonatedBy;
  }

  // Update constructor:
  constructor(@Inject(REQUEST) @Optional() private readonly request?: Request) {
    if (request?.user) {
      const user = request.user as JwtPayload;
      this._gimnasioId = user.gimnasioId ?? null;
      this._personaId = user.personaId ?? null;
      this._usuarioId = user.id ?? null;
      this._jti = user.jti ?? null;
      this._rol = user.rol ?? null;
      this._impersonatedBy = user.impersonatedBy ?? null;
    }
  }

  // Update setFromPayload:
  setFromPayload(payload: JwtPayload): void {
    this._gimnasioId = payload.gimnasioId ?? null;
    this._personaId = payload.personaId ?? null;
    this._usuarioId = payload.id ?? null;
    this._jti = payload.jti ?? null;
    this._rol = payload.rol ?? null;
    this._impersonatedBy = payload.impersonatedBy ?? null;
  }

  // Update TenantContext interface (export):
export interface TenantContext {
  gimnasioId: number | null;  // <-- changed: null for SUPERADMIN
  personaId: number | null;
  usuarioId: number;
  jti: string;
  rol: string;
  impersonatedBy: number | null;  // <-- new
}
```

- [ ] **Step 2: Update existing tests to match new shape**

```ts
// apps/backend/src/infrastructure/auth/tenant-context.service.spec.ts
// Update the `tenant-context.service.spec.ts` test for `gimnasioId` from `5` to nullable checks
// Add new describe block:

describe('impersonatedBy', () => {
  it('should default to null when not set', () => {
    const service = new TenantContextService(mockRequest(undefined));
    expect(service.impersonatedBy).toBeNull();
  });

  it('should read impersonatedBy from request user', () => {
    const user = {
      id: 1,
      email: 'super@nutrifit.com',
      rol: 'SUPERADMIN' as Rol,
      gimnasioId: 3,
      impersonatedBy: 1,
      jti: 'jti-imp',
    };
    const service = new TenantContextService(mockRequest(user));
    expect(service.impersonatedBy).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest apps/backend/src/infrastructure/auth/tenant-context.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/auth/tenant-context.service.ts apps/backend/src/infrastructure/auth/tenant-context.service.spec.ts
git commit -m "feat(auth): add impersonatedBy field to TenantContextService"
```

---

### Task 7: Write failing test for LoginUseCase SUPERADMIN handling

**Files:**
- Modify: `apps/backend/src/application/auth/login.use-case.spec.ts`

- [ ] **Step 1: Add new describe block**

```ts
// apps/backend/src/application/auth/login.use-case.spec.ts
// Append a new describe block:

describe('SUPERADMIN without persona', () => {
  const mockSuperAdmin: UsuarioEntity = {
    idUsuario: 99,
    email: 'super@nutrifit.com',
    contraseña: 'hashed',
    fechaHoraAlta: new Date(),
    rol: 'SUPERADMIN' as Rol,
    persona: null,  // SUPERADMIN no tiene persona
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  it('debe emitir JWT con gimnasioId null para SUPERADMIN sin persona', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockSuperAdmin);
    jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

    let capturedPayload: JwtPayload | null = null;
    jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
      capturedPayload = payload as JwtPayload;
      return 'fake-jwt-token';
    });

    const result = await useCase.execute({
      email: 'super@nutrifit.com',
      contrasena: 'password',
    });

    expect(result.token).toBe('fake-jwt-token');
    expect(result.rol).toBe('SUPERADMIN');
    expect(capturedPayload!.gimnasioId).toBeNull();
    expect(capturedPayload!.personaId).toBeNull();
  });
});

describe('LoginUseCase - non-SUPERADMIN without gimnasioId should fail', () => {
  const mockUserNoGym: UsuarioEntity = {
    idUsuario: 50,
    email: 'nogym@test.com',
    contraseña: 'hashed',
    fechaHoraAlta: new Date(),
    rol: 'SOCIO' as Rol,
    persona: {
      idPersona: 5,
      gimnasioId: null,  // inconsistent state
    } as any,
    grupos: [],
    acciones: [],
    getAccionesEfectivas: () => [],
  };

  it('debe rechazar SOCIO con gimnasioId null (estado inconsistente)', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUserNoGym);
    jest.spyOn(passwordEncrypter, 'comparePasswords').mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'nogym@test.com', contrasena: 'password' }),
    ).rejects.toThrow('La cuenta no tiene gimnasio asignado');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/backend/src/application/auth/login.use-case.spec.ts --runInBand -t "SUPERADMIN sin persona"`
Expected: FAIL — current login.use-case.ts has fallback to 1, would emit `gimnasioId: 1` instead of null

- [ ] **Step 3: Commit failing test**

```bash
git add apps/backend/src/application/auth/login.use-case.spec.ts
git commit -m "test(auth): add SUPERADMIN and no-gimnasio cases to login.use-case"
```

---

### Task 8: Implement SUPERADMIN handling in LoginUseCase, remove fallback

**Files:**
- Modify: `apps/backend/src/application/auth/login.use-case.ts:62-85`

- [ ] **Step 1: Replace gimnasioId extraction logic**

```ts
// apps/backend/src/application/auth/login.use-case.ts
// Replace lines 62-85 with:

    // Extraer gimnasioId según el rol:
    // - SUPERADMIN sin persona: null (operar cross-tenant)
    // - Cualquier otro rol: requerido, sino error (estado inconsistente)
    const persona = user.persona;
    let gimnasioId: number | null;

    if (user.rol === Rol.SUPERADMIN) {
      gimnasioId = persona?.gimnasioId ?? null;
    } else {
      if (persona?.gimnasioId === undefined || persona?.gimnasioId === null) {
        this.loggerService.error(
          `LoginUseCase: Usuario ${email} (rol ${user.rol}) no tiene gimnasioId — estado inconsistente`,
        );
        throw new UnauthorizedError('La cuenta no tiene gimnasio asignado');
      }
      gimnasioId = persona.gimnasioId;
    }

    const personaId = persona?.idPersona ?? null;
    const jti = randomUUID();

    const jwtPayload: JwtPayload = {
      id: user.idUsuario,
      email: user.email,
      rol: user.rol,
      acciones: user.getAccionesEfectivas(),
      personaId,
      gimnasioId,
      jti,
    };

    const token = this.jwtService.sign(jwtPayload);
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx jest apps/backend/src/application/auth/login.use-case.spec.ts --runInBand`
Expected: PASS — all 5 tests (3 existing + 2 new)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/application/auth/login.use-case.ts
git commit -m "feat(auth): LoginUseCase supports SUPERADMIN null gymId, removes legacy fallback"
```

---

### Task 9: Write failing test for ActionsGuard bypass restriction

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/actions.guard.ts` (test) — there is no spec file yet, create one.

- [ ] **Step 1: Create actions.guard.spec.ts**

```ts
// apps/backend/src/infrastructure/auth/guards/actions.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActionsGuard } from './actions.guard';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { ACTIONS_KEY } from '../decorators/actions.decorator';
import { Request } from 'express';

describe('ActionsGuard', () => {
  let guard: ActionsGuard;
  let permisosService: PermisosService;

  const mockRequest = (user: any) => ({ user } as Request);

  const createMockContext = (user: any, requiredActions: string[]): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => mockRequest(user) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: PermisosService,
          useValue: { hasAllActions: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<ActionsGuard>(ActionsGuard);
    permisosService = module.get<PermisosService>(PermisosService);
  });

  it('debe bypassear SUPERADMIN sin chequear permisos', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['gimnasios.crear']);
    const superUser = { id: 1, email: 'super@nutrifit.com', rol: 'SUPERADMIN' as Rol };

    const result = await guard.canActivate(
      createMockContext(superUser, ['gimnasios.crear']),
    );

    expect(result).toBe(true);
    expect(permisosService.hasAllActions).not.toHaveBeenCalled();
  });

  it('NO debe bypassear ADMIN — debe chequear permisos explícitos', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['gimnasios.crear']);
    const adminUser = { id: 2, email: 'admin@nutrifit.com', rol: 'ADMIN' as Rol };

    jest.spyOn(permisosService, 'hasAllActions').mockResolvedValue(false);

    await expect(
      guard.canActivate(createMockContext(adminUser, ['gimnasios.crear'])),
    ).rejects.toThrow(ForbiddenException);

    expect(permisosService.hasAllActions).toHaveBeenCalledWith(2, ['gimnasios.crear']);
  });

  it('ADMIN con permisos explícitos debe pasar', async () => {
    jest.spyOn(guard['reflector'], 'getAllAndOverride').mockReturnValue(['socios.ver']);
    const adminUser = { id: 2, email: 'admin@nutrifit.com', rol: 'ADMIN' as Rol };

    jest.spyOn(permisosService, 'hasAllActions').mockResolvedValue(true);

    const result = await guard.canActivate(
      createMockContext(adminUser, ['socios.ver']),
    );

    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest apps/backend/src/infrastructure/auth/guards/actions.guard.spec.ts --runInBand -t "NO debe bypassear ADMIN"`
Expected: FAIL — current ActionsGuard bypasses both ADMIN and SUPERADMIN

- [ ] **Step 3: Commit failing test**

```bash
git add apps/backend/src/infrastructure/auth/guards/actions.guard.spec.ts
git commit -m "test(auth): ActionsGuard bypass test — SUPERADMIN only, not ADMIN"
```

---

### Task 10: Implement ActionsGuard bypass restriction

**Files:**
- Modify: `apps/backend/src/infrastructure/auth/guards/actions.guard.ts:51-53`

- [ ] **Step 1: Update bypass logic**

```ts
// apps/backend/src/infrastructure/auth/guards/actions.guard.ts
// Replace lines 51-53:

    // SUPERADMIN bypassea todo (es el "dueño del sistema").
    // ADMIN, NUTRICIONISTA, RECEPCIONISTA, SOCIO deben tener permisos explícitos.
    if (request.user.rol === Rol.SUPERADMIN) {
      return true;
    }

    const hasPermission = await this.permisosService.hasAllActions(
      userId,
      requiredActions,
    );
```

- [ ] **Step 2: Run tests**

Run: `npx jest apps/backend/src/infrastructure/auth/guards/actions.guard.spec.ts --runInBand`
Expected: PASS — 3 tests pass

- [ ] **Step 3: Run full backend suite to check for regressions**

Run: `npm test -w @nutrifit/backend -- --runInBand`
Expected: PASS — all existing tests still green; if not, triage and fix

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/infrastructure/auth/guards/actions.guard.ts
git commit -m "feat(auth): ActionsGuard bypass restricted to SUPERADMIN only"
```

---

### Task 11: Final verification

- [ ] **Step 1: Typecheck whole backend**

Run: `npx tsc --noEmit -p apps/backend/tsconfig.json`
Expected: PASS

- [ ] **Step 2: Lint backend**

Run: `npm run lint -w @nutrifit/backend`
Expected: PASS (or with only pre-existing warnings)

- [ ] **Step 3: Run full backend test suite**

Run: `npm test -w @nutrifit/backend -- --runInBand`
Expected: PASS

- [ ] **Step 4: Build backend**

Run: `npm run build -w @nutrifit/backend`
Expected: PASS

- [ ] **Step 5: Final commit if any trailing fixes**

```bash
git status
# If dirty:
git add -A
git commit -m "chore(plan-1): trailing fixes from final verification"
```

---

## Self-Review

### Spec coverage
- ✅ §6.1: auth.guard allows SUPERADMIN with null gymId (Task 5)
- ✅ §6.2: TenantContextService.impersonatedBy added (Task 6) — type only, full impersonation flow is Plan 5
- ✅ §6.3: LoginUseCase no fallback to 1, SUPERADMIN gets null (Task 8)
- ✅ §6.6: ActionsGuard bypass only SUPERADMIN (Task 10)
- ✅ Type updates: JwtPayload, RolesGuard, ActionsGuard (Tasks 1, 2, 3)

### Placeholder scan
- No "TODO", "TBD", "fill in later" in steps
- All code blocks contain the actual code
- All commands include expected output

### Type consistency
- `JwtPayload.gimnasioId: number | null` used in Tasks 1, 5, 8
- `TenantContext.gimnasioId: number | null` used in Task 6
- `impersonatedBy: number | null` consistent across Tasks 1, 6
- `Request.user.gimnasioId: number | null` consistent in Tasks 2, 3

### Out of scope (deferred)
- Full `POST /gimnasios/:id/impersonar` endpoint (Plan 5)
- `TenantSession.impersonatedBy` from spec §6.2 — partially covered: type added, runtime data flow is Plan 5
- `ImpersonarGimnasioUseCase` (Plan 5)

---

## Definition of Done

- [ ] All 11 tasks committed individually
- [ ] `npm test -w @nutrifit/backend` passes
- [ ] `npx tsc --noEmit -p apps/backend/tsconfig.json` passes
- [ ] `npm run build -w @nutrifit/backend` passes
- [ ] PROGRESS.md actualizado con estado Plan 1 = ✅
- [ ] `mem_session_summary` ejecutado antes de cerrar sesión
- [ ] CONTEXT.md en worktree actualizado para sesión 2

---

**Generated:** 2026-06-01
**Spec reference:** `docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md` §6
**Estimated time:** 0.5-1 day (per spec §10)
