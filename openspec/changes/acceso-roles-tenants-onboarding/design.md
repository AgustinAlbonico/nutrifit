# Design: Acceso, Roles, Tenants y Onboarding

## Technical Approach

Implement five chained slices over the existing Clean Architecture/NestJS + React structure. Security state enters through JWT, is copied to a request tenant context, and is consumed only by infrastructure adapters/guards; use-cases keep business rules and receive already-scoped repositories.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Tenant enforcement | Add `gimnasioId`, `personaId`, `jti` to `JwtPayload`; use `TenantContextInterceptor` backed by `nestjs-cls`; repositories MUST call `TenantScopeService`. | Controller-only filters; DB row-level security. | Controllers are leaky; MySQL RLS is unavailable. CLS centralizes scope while preserving current repository pattern. |
| Sensitive consent | `ConsentimientoGuard` + `@RequiereConsentimiento({ ia?: true })` on ficha, progreso, plan, consulta, and `ia` endpoints. | UI-only consent. | Legal controls must be server-side and auditable. |
| Audit automation | Keep `AuditoriaService`, add `AuditoriaInterceptor` + `@Auditable()` metadata for PHI/security actions. | Manual service calls everywhere. | Existing manual calls are inconsistent; interceptor captures IP/user-agent/tenant uniformly. |
| Sessions | Persist token `jti` in `sesion_usuario`; logout revokes current `jti`; guard rejects revoked tokens. | Stateless JWT only; blacklist cache only. | Revocation must survive process restart and support audit. |
| Onboarding credentials | New setup-token flow for welcome credentials; never email temporary passwords. | Admin sets password manually. | Safer, self-service, auditable. |

## Data Flow

```text
login -> UsuarioRepository(with persona) -> JWT{id,personaId,gimnasioId,jti}
request -> JwtAuthGuard(revocation) -> TenantContextInterceptor(CLS)
        -> ConsentimientoGuard? -> Controller -> UseCase -> Repository + TenantScopeService
        -> AuditoriaInterceptor -> auditoria(gimnasioId, ip, userAgent)

password reset/setup -> token email -> hashed token lookup -> password update -> revoke old sessions
```

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/backend/src/domain/services/jwt.service.ts` | Modify | Extend payload with `personaId`, `gimnasioId`, `jti`, `exp`. |
| `apps/backend/src/application/auth/*` | Create/Modify | Login with tenant/session creation; logout, password reset, setup credentials use-cases/DTOs. |
| `apps/backend/src/infrastructure/auth/guards/auth.guard.ts` | Modify | Validate token shape and revocation before assigning `req.user`. |
| `apps/backend/src/infrastructure/auth/tenant-context.interceptor.ts` | Create | Seed CLS tenant context for authenticated requests. |
| `apps/backend/src/infrastructure/auth/guards/consentimiento.guard.ts` | Create | Enforce latest accepted terms and AI privacy preference. |
| `apps/backend/src/infrastructure/services/auditoria/*` | Modify/Create | Add interceptor, decorator, and `gimnasioId` registration. |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/*.ts` | Create/Modify | Add `SesionUsuario`, `PasswordResetToken`, `TokenBienvenida`, `TerminoConsentimiento`, `ConsentimientoUsuario`, `PreferenciasPrivacidad`; add `auditoria.gimnasioId`. |
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260601000000-AccesoRolesTenantsOnboarding.ts` | Create | Tables, FKs, indexes, backfill `auditoria.id_gimnasio = 1`. |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/*.ts` | Modify | Apply tenant scope to `persona`, `turno`, `auditoria`, and derived clinical queries. |
| `apps/frontend/src/contexts/AuthContext.tsx` | Modify | Store tenant/session metadata, call logout API, idle timer, pending consent state. |
| `apps/frontend/src/pages/Login.tsx` | Modify | Forgot-password link and post-login consent gate. |
| `apps/frontend/src/pages/ResetPasswordPage.tsx`, `SetupCredencialesPage.tsx`, `PrivacidadPage.tsx`, `AyudaPage.tsx` | Create | Recovery, welcome setup, privacy preferences, role-aware help. |
| `apps/frontend/src/router.tsx`, `components/layout/Sidebar.tsx` | Modify | Add `/reset-password`, `/setup-credenciales`, `/privacidad`, `/ayuda` routes/nav. |

## Interfaces / Contracts

```ts
interface JwtPayload { id: number; email: string; rol: Rol; acciones?: string[]; personaId: number | null; gimnasioId: number; jti: string; }
type PreferenciasPrivacidad = { permiteIa: boolean; permiteRecordatorios: boolean; permiteReportesAnonimos: boolean };
```

## Slice Sequencing

1. Tenant JWT/CLS/repository isolation + audit tenant column.
2. Consent/privacy entities, guard, consent UI.
3. Password reset + welcome credential setup + email adapter.
4. Session table, logout revocation, idle timeout.
5. Role-aware help content and navigation polish.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Backend unit | Login payload, tenant scope helper, consent/session guards, token use-cases. | Jest with mocked repositories/CLS/email. |
| Backend integration | Cross-tenant list/detail denial; audit `gimnasioId`; revoked token rejected. | Nest testing module + TypeORM test DB. |
| Frontend unit | AuthContext idle/logout, consent gate, privacy forms, help role filtering. | Vitest + Testing Library + MSW. |
| E2E/manual | Login, accept terms, reset password, setup credentials, idle timeout. | Playwright against seeded users. |

## Migration / Rollout

Run migration after backend build. Deploy Slice 1 first; reject legacy tokens without `gimnasioId` after a short forced re-login window. Feature-flag `ConsentimientoGuard` until legal copy is approved. Rollback by disabling guards/interceptors first, then reverting schema only if no new rows exist.

## Open Questions

- [ ] Confirm legal text/version owner before enabling `ConsentimientoGuard` globally.
- [ ] Confirm SMTP provider and token TTLs: reset 30 min, welcome setup 7 days proposed.
