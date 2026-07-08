# Tasks: Auditoria centralizada

## Testing Strategy

Omitido per project policy: no crear `.spec.ts`, `.test.ts`, fixtures, mocks ni helpers. Verificar con typecheck/build y QA manual/API existente.

## Phase 1: Schema and Core

- [x] 1.1 ID: `AUD-001`; files: `apps/backend/src/infrastructure/persistence/typeorm/migrations/*AuditLog*.ts`; description: rename/copy `auditoria` to `audit_log`, add columns, copy `metadata` to `metadataLegacy`, create `login_audit`; depends-on: none.
- [x] 1.2 ID: `AUD-002`; files: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/login-audit.entity.ts`; description: define `AuditLogOrmEntity` and `LoginAuditOrmEntity`; depends-on: AUD-001.
- [x] 1.3 ID: `AUD-003`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria-sanitizer.service.ts`; description: implement blacklist plus `camposSensibles`; depends-on: AUD-002.
- [x] 1.4 ID: `AUD-004`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts`; description: add DTO, async queue, snapshot/diff, filters/export helpers; depends-on: AUD-003.
- [x] 1.5 ID: `AUD-005`; files: `apps/backend/src/infrastructure/services/auditoria/login-audit.service.ts`, `apps/backend/src/infrastructure/services/auditoria/auditoria.module.ts`; description: wire services/entities/providers; depends-on: AUD-004.

## Phase 2: Capture Producers

- [x] 2.1 ID: `AUD-006`; files: `apps/backend/src/infrastructure/common/http/request-origin.helper.ts`; description: centralize IP/UserAgent extraction; depends-on: AUD-005.
- [x] 2.2 ID: `AUD-007`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria.decorator.ts`, `apps/backend/src/infrastructure/services/auditoria/auditoria-entity.registry.ts`, `apps/backend/src/infrastructure/services/auditoria/auditoria.interceptor.ts`; description: add metadata-gated global `APP_INTERCEPTOR` and Turno registry; depends-on: AUD-006.
- [x] 2.3 ID: `AUD-008`; files: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`; description: annotate critical mutations with `@Audit(...)` and mandatory `TipoAccion`; depends-on: AUD-007.
- [x] 2.4 ID: `AUD-009`; files: `apps/backend/src/application/turnos/use-cases/*.ts`; description: close gaps for reservar, asignar, bloquear, desbloquear, confirmar, iniciar, reabrir, cancel/check-in; depends-on: AUD-008.
- [x] 2.5 ID: `AUD-010`; files: `apps/backend/src/infrastructure/schedulers/ausencia-turno.scheduler.ts`, `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts`; description: register scheduler audits with `usuarioId='system'`, tenant and `TipoAccion`; depends-on: AUD-004.
- [x] 2.6 ID: `AUD-011`; files: `apps/backend/src/application/auth/login.use-case.ts`; description: record SUCCESS, FAILURE and BLOCKED auth events; depends-on: AUD-005.

## Phase 3: Reports and Frontend

- [x] 3.1 ID: `AUD-012`; files: `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts`; description: implement tenant-aware listing, filters, pagination default 50 and parsed diffs; depends-on: AUD-011.
- [x] 3.2 ID: `AUD-013`; files: `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts`, `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts`; description: add CSV/JSON export, buffer <=1000 and stream above; depends-on: AUD-012.
- [x] 3.3 ID: `AUD-014`; files: `apps/frontend/src/pages/AdminAuditoriaPage.tsx`; description: adapt filters and CSV/JSON export actions; depends-on: AUD-013.
- [x] 3.4 ID: `AUD-015`; files: `openspec/changes/auditoria-centralizada/tasks.md`; description: verify manually with existing typecheck/build and API/UI QA only; depends-on: AUD-014.

## Phase 4: Criticals fix (post-verify)

The first verify pass found missing auth-session producers, missing `login_audit` read integration, incomplete CSV columns, nominal streaming, and stale task checkboxes. This phase closes those post-verify gaps strictly without adding tests, sessions, refresh-token persistence, or dev-server steps.

- [x] 4.1 ID: `AUD-016`; files: `apps/backend/src/application/auth/logout.use-case.ts`, `apps/backend/src/presentation/http/controllers/auth.controller.ts`, `apps/backend/src/application/auth/auth.module.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/login-audit.entity.ts`; description: add authenticated logout endpoint and `LOGOUT` audit event; depends-on: AUD-011.
- [x] 4.2 ID: `AUD-017`; files: `apps/backend/src/application/auth/refresh-token.use-case.ts`, `apps/backend/src/presentation/http/controllers/auth.controller.ts`, `apps/backend/src/application/auth/auth.module.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/login-audit.entity.ts`; description: add stateless JWT refresh endpoint and refresh success/failure audit outcomes; depends-on: AUD-011.
- [x] 4.3 ID: `AUD-018`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts`, `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts`, `apps/backend/src/infrastructure/services/auditoria/auditoria.module.ts`; description: merge `login_audit` rows into `/admin/auditoria` when `modulo=auth`, including superadmin tenantless visibility; depends-on: AUD-012.
- [x] 4.4 ID: `AUD-019`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts`; description: export full CSV report columns with RFC 4180 escaping and compact JSON values; depends-on: AUD-013.
- [x] 4.5 ID: `AUD-020`; files: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts`; description: stream large CSV/JSON exports with database streams instead of materialized buffers; depends-on: AUD-013.
- [x] 4.6 ID: `AUD-021`; files: `openspec/changes/auditoria-centralizada/tasks.md`; description: mark AUD-014/AUD-015 complete and record post-verify fixes; depends-on: AUD-016,AUD-017,AUD-018,AUD-019,AUD-020.
- [x] 4.7 ID: `AUD-022`; files: `openspec/specs/auditoria-auth/spec.md`; description: reviewed auth spec wording; no spec change required because logout and refresh scenarios already existed; depends-on: AUD-016,AUD-017.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 schema/core -> PR 2 producers -> PR 3 reports/frontend |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Schema + audit core | PR 1 | Migration, entities, sanitizer, service |
| 2 | Producers | PR 2 | Interceptor, decorators, auth, turnos, schedulers |
| 3 | Consumers | PR 3 | Admin API/export + frontend page |
