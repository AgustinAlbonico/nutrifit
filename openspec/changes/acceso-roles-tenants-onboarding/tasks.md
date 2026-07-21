# Tasks: Acceso, Roles, Tenants y Onboarding

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2200-3000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 tenants/audit -> PR2 consent/privacy -> PR3 reset/setup -> PR4 session timeout -> PR5 ayuda |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | JWT + tenant isolation + audit tenant | PR 1 | base = feature branch |
| 2 | Consent + privacy enforcement | PR 2 | base = PR1 |
| 3 | Reset password + welcome setup | PR 3 | base = PR2 |
| 4 | Logout revocation + idle timeout | PR 4 | base = PR3 |
| 5 | Role-aware help + nav polish | PR 5 | base = PR4 |

## Phase 1: Foundation / Tenant Security

- [ ] 1.1 Extend `apps/backend/src/domain/services/jwt.service.ts`, `application/auth/login.use-case.ts`, `application/auth/login.use-case.spec.ts` with `personaId`, `gimnasioId`, `jti` and forced re-login coverage.
- [ ] 1.2 Create `apps/backend/src/infrastructure/auth/tenant-context.interceptor.ts` plus `TenantScopeService`; wire `apps/backend/src/application/auth/auth.module.ts` and `infrastructure/auth/guards/auth.guard.ts` to seed/validate tenant context.
- [ ] 1.3 Scope `apps/backend/src/infrastructure/persistence/typeorm/repositories/{socio.respository.ts,nutricionista.repository.ts,agenda.repository.ts,foto-progreso.repository.ts,objetivo.repository.ts,usuario.repository.ts}` by `gimnasioId`; add integration tests for cross-gym denial.
- [ ] 1.4 Add `id_gimnasio` to `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` and create migration `20260601000000-AccesoRolesTenantsOnboarding.ts` with backfill/indexes.

## Phase 2: Consent / Privacy

- [ ] 2.1 Create entities and repositories for `TerminoConsentimiento`, `ConsentimientoUsuario`, `PreferenciasPrivacidad` under `apps/backend/src/infrastructure/persistence/typeorm/entities/` and register them in persistence modules.
- [ ] 2.2 Create `consentimiento.guard.ts`, `requiere-consentimiento.decorator.ts`, consent DTOs/use-cases/controllers in `apps/backend/src/application/auth/` and `presentation/` for pending/accept flows.
- [ ] 2.3 Update `apps/frontend/src/contexts/AuthContext.tsx`, `pages/Login.tsx`, `pages/Configuracion.tsx`, `router.tsx` with consent gate, privacy page/route, and Vitest coverage for blocked sensitive flows.

## Phase 3: Credential Recovery / Setup

- [ ] 3.1 Create `PasswordResetToken` and `TokenBienvenida` entities, token hashing services, and auth use-cases/controllers for `/auth/forgot-password`, `/auth/reset-password`, `/auth/setup-credenciales`.
- [ ] 3.2 Wire `apps/backend/src/infrastructure/email/` templates/providers for reset and welcome emails; add Jest tests for TTL, single-use, and session revocation after password change.
- [ ] 3.3 Create `apps/frontend/src/pages/{RecuperarContrasenaPage,ResetPasswordPage,SetupCredencialesPage}.tsx`; update `pages/Login.tsx` and `router.tsx` with recovery/setup routes and success/error states.

## Phase 4: Session Control / Audit Wiring

- [ ] 4.1 Create `SesionUsuario` persistence, logout use-case, revocation checks in `auth.guard.ts`, and `AuditoriaInterceptor`/`@Auditable()` for login, logout, PHI access, and reset events.
- [ ] 4.2 Update `apps/frontend/src/contexts/AuthContext.tsx` to call backend logout, enforce idle timeout, clear storage, and redirect predictably; cover timer behavior with Vitest.

## Phase 5: Help / Verification

- [ ] 5.1 Create `apps/frontend/src/pages/AyudaPage.tsx`, add role-aware sections and `apps/frontend/src/components/layout/Sidebar.tsx` link; verify route guards in `router.tsx`.
- [ ] 5.2 Run backend Jest unit/integration coverage for tenant-consent-session scenarios and frontend Vitest for auth/help flows; document rollout/rollback notes in `openspec/changes/acceso-roles-tenants-onboarding/` if checks expose migration or token cutover constraints.
