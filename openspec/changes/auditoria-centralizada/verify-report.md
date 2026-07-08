# Verify Report: auditoria-centralizada (re-verify after AUD-016..022)

**Date**: 2026-07-08 (re-verify)
**Verifier**: sdd-verify (gpt-5.5 via Sisyphus-Junior)
**Build status**: backend=PASS, frontend=PASS, vite build=PASS
**Previous verdict**: FAIL (4 CRITICAL + 4 WARNING)
**Current verdict**: PASS WITH WARNINGS

## Summary

- Total scenarios: 27
- Implemented: 26
- Partial: 1
- Missing: 0
- CRITICAL: 0
- WARNING: 0
- SUGGESTION: 1

## Criticals Resolved

- [x] Logout event - evidence: `apps/backend/src/application/auth/logout.use-case.ts:24-32` writes a `login_audit` event with `resultado: ResultadoLoginAudit.LOGOUT`; exact line: `resultado: ResultadoLoginAudit.LOGOUT,`. `apps/backend/src/presentation/http/controllers/auth.controller.ts:67-80` exposes `@Post('logout')`, protects it with `@UseGuards(JwtAuthGuard)`, calls `this.logoutUseCase.execute(...)`, and returns `Sesión cerrada`.
- [x] Refresh event - evidence: `apps/backend/src/application/auth/refresh-token.use-case.ts:42-47` records `ResultadoLoginAudit.REFRESH_SUCCESS`, and `apps/backend/src/application/auth/refresh-token.use-case.ts:50-54` records `ResultadoLoginAudit.REFRESH_FAILURE` before throwing `UnauthorizedError('Token invalido o expirado')`. `apps/backend/src/presentation/http/controllers/auth.controller.ts:83-90` exposes `@Post('refresh')` behind `JwtAuthGuard` and calls `this.refreshTokenUseCase.execute(...)`.
- [x] Admin login_audit visibility - evidence: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:35-40` routes `filtros.modulo === 'auth'` to `listarAuthConFiltros(filtros)`. `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:213-233` selects rows from `login_audit` with `'login_audit' AS kind`, `'auth' AS modulo`, `resultado AS accion`, `ip`, `user_agent AS userAgent`, and `email_intentado AS emailIntentado`.
- [x] Superadmin tenantless login_audit - evidence: `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts:107-115` returns `gimnasioIdSolicitado ?? usuario.gimnasioId ?? null` for `SUPERADMIN`, allowing no selected tenant. `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:271-282` only adds tenant predicates when a gym filter exists or `incluirSinGimnasio` is explicit, so `SUPERADMIN` with `gimnasioId=null` can read tenantless and tenanted auth events.

## Warnings Resolved

- [x] modulo=auth filter - evidence: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:38-40` branches `modulo=auth` into the auth listing path, and `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:178-180` builds a union between `audit_log` auth rows and `login_audit` rows.
- [x] CSV all fields - evidence: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:489-505` defines CSV headers including `ip`, `userAgent`, `tipoAccion`, `valoresAntes`, and `valoresDespues`; `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:508-524` writes those same values into each CSV row.
- [x] Real streaming - evidence: `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:59-80` routes `limit === undefined || limit > 1000` to stream exports. `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:320-347` uses `this.auditoriaRepository.createQueryBuilder(...).stream()` for audit-log exports; `apps/backend/src/infrastructure/services/auditoria/auditoria-reporte.service.ts:352-360` uses `queryRunner.stream(...)` for auth union exports.
- [x] tasks.md updated - evidence: `openspec/changes/auditoria-centralizada/tasks.md:28-29` marks AUD-014 and AUD-015 as `[x]`; `openspec/changes/auditoria-centralizada/tasks.md:35-41` marks AUD-016 through AUD-022 as `[x]`.

## Spec Coverage Matrix

| # | Spec | Requirement | Scenario | Status | Evidence |
|---|---|---|---|---|---|
| 1 | auditoria | Registro de cambios tecnicos | Registro automatico via HTTP autenticado | Implemented | `AuditoriaInterceptor` is metadata-gated, captures actor/gym/IP/UserAgent, loads before/after snapshots, and calls `AuditoriaService.registrar()` at `apps/backend/src/infrastructure/services/auditoria/auditoria.interceptor.ts:30-82`. |
| 2 | auditoria | Registro de cambios tecnicos | Registro explicito desde scheduler | Implemented | Schedulers call `auditoriaService.registrar()` with `usuarioId: 'system'` and `tipoAccion` (`ausencia-turno.scheduler.ts:78-85`, `cierre-consulta.scheduler.ts:67-74` and `102-109`). |
| 3 | auditoria | Snapshots por tipo de operacion | Snapshot completo en CREATE | Implemented | `AuditoriaService.snapshot()` returns `valoresAntes: null` and sanitized `valoresDespues` for `CREATE` at `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts:123-125`. |
| 4 | auditoria | Snapshots por tipo de operacion | Snapshot completo en DELETE | Implemented | `AuditoriaService.snapshot()` returns sanitized `valoresAntes` and `valoresDespues: null` for `DELETE` at `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts:127-129`. |
| 5 | auditoria | Snapshots por tipo de operacion | Diff por campo en UPDATE | Implemented | `AuditoriaService.snapshot()` stores `{ cambios: this.calcularDiff(...) }` for `UPDATE` at `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts:116-120`. |
| 6 | auditoria | Proteccion de informacion sensible | Sanitizacion de password | Implemented | `AuditoriaSanitizer` redacts `password`, `passwordHash`, `hash`, `token`, `jwt`, `refreshToken`, and `apiKey` at `apps/backend/src/infrastructure/services/auditoria/auditoria-sanitizer.service.ts:7-19`. |
| 7 | auditoria | Alcance multi-tenant de consulta | Usuario de gimnasio A consulta logs | Implemented | `AdminAuditoriaController` resolves the caller tenant and rejects cross-tenant admin filters at `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts:107-129`; report queries apply `gimnasioId` predicates at `auditoria-reporte.service.ts:121-136`. |
| 8 | auditoria | Auditoria no bloqueante | Falla de auditoria no bloquea operacion | Implemented | `AuditoriaService.registrar()` fire-and-catches persistence errors at `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts:100-105`; `LoginAuditService.registrar()` does the same at `login-audit.service.ts:30-35`. |
| 9 | auditoria | Metadata semantica de accion | CONFIRMADO reservado versus bloqueo | Implemented | `tipoAccion` is carried by DTO/entity mapping and interceptor (`auditoria.service.ts:27`, `auditoria.service.ts:149`, `auditoria.interceptor.ts:75`) and is exported in CSV (`auditoria-reporte.service.ts:502`, `521`). |
| 10 | auditoria-auth | Registro de eventos de autenticacion | Login exitoso | Implemented | `LoginUseCase` records `ResultadoLoginAudit.SUCCESS` with user and tenant at `apps/backend/src/application/auth/login.use-case.ts:128-134`. |
| 11 | auditoria-auth | Registro de eventos de autenticacion | Login fallido por credenciales invalidas | Implemented | `LoginUseCase` records `ResultadoLoginAudit.FAILURE` for missing user and invalid password at `apps/backend/src/application/auth/login.use-case.ts:58-70`. |
| 12 | auditoria-auth | Eventos de sesion | Logout autenticado | Implemented | `LogoutUseCase.execute()` writes `ResultadoLoginAudit.LOGOUT` at `apps/backend/src/application/auth/logout.use-case.ts:24-32`; `POST /auth/logout` exists at `auth.controller.ts:67-80`. |
| 13 | auditoria-auth | Eventos de sesion | Refresh token exitoso y fallido | Implemented | `RefreshTokenUseCase.execute()` records `REFRESH_SUCCESS` at `apps/backend/src/application/auth/refresh-token.use-case.ts:42-47` and `REFRESH_FAILURE` at `refresh-token.use-case.ts:50-54`; `POST /auth/refresh` exists at `auth.controller.ts:83-90`. |
| 14 | auditoria-auth | Intentos bloqueados | Cuenta bloqueada por rate limit | Partial | Disabled accounts are audited as `BLOCKED` at `apps/backend/src/application/auth/login.use-case.ts:73-83`; no dedicated rate-limit producer was found in the current auth flow. |
| 15 | auditoria-auth | Alcance multi-tenant de consulta | Admin consulta eventos de su gimnasio | Implemented | `modulo=auth` reads `login_audit` via `AuditoriaReporteService`; admin tenant scoping is enforced by `admin-auditoria.controller.ts:117-129` and raw query predicates in `auditoria-reporte.service.ts:271-278`. |
| 16 | auditoria-auth | Alcance multi-tenant de consulta | Superadmin consulta eventos auth | Implemented | `SUPERADMIN` may resolve to `gimnasioId=null` at `admin-auditoria.controller.ts:113-115`, and auth union rows include `login_audit` tenantless records unless a tenant predicate is provided (`auditoria-reporte.service.ts:213-233`, `271-282`). |
| 17 | auditoria-auth | Retencion separada de audit log | Eventos auth no aparecen en audit_log | Implemented | Auth events persist through `LoginAuditOrmEntity`/`login_audit` (`login-audit.entity.ts:12-42`) and report as `kind='login_audit'` without copying diffs/snapshots (`auditoria-reporte.service.ts:213-233`). |
| 18 | reportes-auditoria | Listado paginado y ordenado | Listado paginado sin filtros | Implemented | Controller defaults `page=1` and `limit/pageSize=50` at `admin-auditoria.controller.ts:89-93`; report service orders by `fecha DESC` by default at `auditoria-reporte.service.ts:117-120`. |
| 19 | reportes-auditoria | Listado paginado y ordenado | Orden configurable | Implemented | `orden` is parsed by the controller at `admin-auditoria.controller.ts:103` and applied to audit-log query builders and auth union SQL (`auditoria-reporte.service.ts:117-120`, `181`, `235`). |
| 20 | reportes-auditoria | Filtros de busqueda | Filtro por modulo | Implemented | Non-auth modules filter `audit_log` at `auditoria-reporte.service.ts:146-148`; `modulo=auth` branches to auth union at `auditoria-reporte.service.ts:38-40` and includes `login_audit` rows at `213-233`. |
| 21 | reportes-auditoria | Filtros de busqueda | Filtro por rango de fechas | Implemented | `fechaDesde`/`fechaHasta` apply to audit-log queries at `auditoria-reporte.service.ts:138-144` and auth raw queries at `284-292`. |
| 22 | reportes-auditoria | Filtros de busqueda | Filtro por usuario | Implemented | `usuarioId` is parsed at `admin-auditoria.controller.ts:100` and applied to audit-log and login-audit queries at `auditoria-reporte.service.ts:164-168` and `309-312`. |
| 23 | reportes-auditoria | Alcance y autorizacion tenant-aware | Admin de gimnasio A no ve logs de B | Implemented | `@Rol(ADMIN, SUPERADMIN)` protects endpoints at `admin-auditoria.controller.ts:44-56`; non-superadmin cross-tenant filters throw `ForbiddenException` at `121-126`. |
| 24 | reportes-auditoria | Alcance y autorizacion tenant-aware | Superadmin con impersonacion | Implemented | Superadmin can query requested or impersonated gym through `resolverGimnasioAuditable()` at `admin-auditoria.controller.ts:111-115`; predicates are applied when a gym is resolved (`auditoria-reporte.service.ts:121-131`, `271-278`). |
| 25 | reportes-auditoria | Alcance y autorizacion tenant-aware | Rol no autorizado o superadmin sin gimnasio | Implemented | Unauthorized roles remain blocked by `@Rol(ADMIN, SUPERADMIN)`; superadmin without gym is intentionally allowed for auth investigation per AUD-018 (`admin-auditoria.controller.ts:44-56`, `113-115`). |
| 26 | reportes-auditoria | Shape de respuesta y diff visible | Diff visible en UPDATE | Implemented | Report DTO maps parsed `valoresAntes`/`valoresDespues` at `auditoria-reporte.service.ts:419-436` and `439-459`, preserving diff payloads from `AuditoriaService.snapshot()`. |
| 27 | reportes-auditoria | Exportacion filtrada | Exportacion CSV/JSON con filtros aplicados | Implemented | `AuditoriaReporteService.exportar()` applies the same filters/scope/order and exports full fields through buffered or streaming paths at `auditoria-reporte.service.ts:55-80`, `102-114`, `320-367`, and `489-524`. |

## Build Verification

| Command | Status | Evidence |
|---|---|---|
| `npx tsc --noEmit -p apps/backend/tsconfig.build.json` | PASS | Exit 0, no compiler output. |
| `npx tsc --noEmit -p apps/frontend/tsconfig.json` | PASS | Exit 0, no compiler output. |
| `cd apps/frontend && npx vite build` | PASS | Exit 0, transformed 4095 modules and built in 13.60s. Vite emitted the existing chunk-size warning for `assets/index-yf-G39L0.js` at 4,975.78 kB. |

## Remaining Risks (if any)

- No blocking risk remains from the 4 previous criticals or 4 previous warnings.
- Non-blocking residual: the rate-limit scenario remains Partial because no dedicated auth rate-limit producer exists; disabled-account blocks are audited as `BLOCKED`.
- Vite still reports the pre-existing chunk-size warning for the main JS asset; this is not introduced by AUD-016..022.

## Verdict

Overall: PASS WITH WARNINGS

Recommendation: archive `auditoria-centralizada` if Agustín accepts the known non-blocking rate-limit gap as out of scope for AUD-016..022; otherwise add a dedicated auth rate-limit producer and re-verify that single scenario.
