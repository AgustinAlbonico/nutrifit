# Design: auditoria-centralizada

## Technical Approach

Implementar auditoria centralizada con dos flujos: cambios tecnicos en `audit_log` y eventos auth en `login_audit`. `AuditoriaService.registrar()` sera la unica escritura de `audit_log`: encola, sanitiza, calcula snapshots/diffs y persiste de forma async no bloqueante. HTTP se captura con `AuditoriaInterceptor` solo cuando el handler tenga `@Audit(...)`; schedulers y use-cases complejos llaman directo con `usuarioId: 'system'` o actor resuelto.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Captura HTTP | `AuditoriaInterceptor` como `APP_INTERCEPTOR`, activado solo por metadata `@Audit(...)` | Interceptor method-bound | Mantiene registro unico global como `TenantContextInterceptor`, pero evita auditar rutas no marcadas. |
| Estado anterior | `AuditoriaEntityRegistry` mapea `entidad -> Repository` y PK; interceptor carga antes/despues por `entidadId` | Cada controller carga snapshots | Centraliza TypeORM y evita duplicar infraestructura en controllers. |
| Tipo CREATE/UPDATE/DELETE | `@Audit({ accion })` + verbo HTTP definen operacion; diff solo calcula payload | Inferir por diff antes/despues | El diff no distingue crear/borrar sin ambiguedad; el contrato semantico pertenece al endpoint. |
| Sanitizacion | `AuditoriaSanitizer` singleton con blacklist base + `camposSensibles` opcional en decorator | Lista hardcodeada solamente | La base cubre secretos globales y el override permite casos puntuales sin tocar servicio. |
| Auth audit | Instrumentar `LoginUseCase` y futuros logout/refresh use-cases | `AuthAuditInterceptor` | El login fallido necesita capturar excepciones y usuario/tenant parcialmente resueltos dentro del caso de uso. |
| Export | Buffer para `pageSize<=1000`; stream para exportes mayores | Siempre stream | Simplicidad para consultas normales y seguridad de memoria para reportes grandes. |
| IP/UserAgent | Helper `extraerOrigenRequest(request)` reutilizado | Inline en interceptores | Evita divergencia con `LoggingInterceptor.getIP()`. |

## Data Flow

```text
HTTP @Audit route -> AuditoriaInterceptor -> carga antes -> handler -> carga despues
  -> AuditoriaService.registrar() -> queue -> Sanitizer -> snapshot/diff -> audit_log

Scheduler/use-case -> AuditoriaService.registrar(usuarioId='system') -> audit_log
Auth use-case -> LoginAuditService.registrar() -> login_audit
GET /admin/auditoria -> tenantContext.gimnasioId -> audit_log/login_audit -> DTO/export
```

## File Changes

| Path | Change |
|---|---|
| `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` | Reemplazar shape por `AuditLogOrmEntity` sobre `audit_log`; conservar `metadataLegacy`. |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/login-audit.entity.ts` | Nuevo `LoginAuditOrmEntity`. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria.service.ts` | Nuevo DTO, cola async, diff-only, sanitizer, filtros/export. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria-sanitizer.service.ts` | Nuevo blacklist base + override por decorator. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria.decorator.ts` | Nuevo `@Audit({ modulo, accion, descripcion, camposSensibles? })`. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria.interceptor.ts` | Nuevo interceptor global metadata-gated. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria-entity.registry.ts` | Nuevo mapa `Turno -> TurnoOrmEntity/idTurno`. |
| `apps/backend/src/infrastructure/services/auditoria/login-audit.service.ts` | Nuevo servicio event-based para auth. |
| `apps/backend/src/infrastructure/common/http/request-origin.helper.ts` | Nuevo helper para `ip` y `userAgent`. |
| `apps/backend/src/infrastructure/services/auditoria/auditoria.module.ts` | Registrar entidades, registry, interceptor y servicios nuevos. |
| `apps/backend/src/application/auth/login.use-case.ts` | Registrar `SUCCESS`, `FAILURE`, `BLOCKED` en `login_audit`. |
| `apps/backend/src/infrastructure/schedulers/ausencia-turno.scheduler.ts` | Auditar AUSENTE automatico con `tipoAccion`. |
| `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts` | Auditar preaviso/cierre automatico con `usuarioId='system'`. |
| `apps/backend/src/presentation/http/controllers/turnos.controller.ts` | Anotar mutaciones criticas con `@Audit(...)`. |
| `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts` | Filtros, paginacion default 50, CSV/JSON y tenant estricto. |
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/*AuditLog*.ts` | Drop `auditoria`, crear `audit_log`, crear `login_audit`. |
| `apps/frontend/src/pages/AdminAuditoriaPage.tsx` | Adaptar filtros (`modulo`, `usuarioId`, `entidadId`) y export CSV/JSON. |

## Interfaces/Contracts

```ts
export interface AuditoriaRegistroDto {
  gimnasioId: number;
  usuarioId: number | 'system' | null;
  modulo: string;
  entidad: string;
  entidadId: number | string | null;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  descripcion: string;
  tipoAccion?: 'RESERVA' | 'BLOQUEO' | 'CANCELACION' | 'AUSENCIA_AUTO' | 'CIERRE_AUTO';
  valoresAntes: Record<string, unknown> | null;
  valoresDespues: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditOptions {
  modulo: string;
  accion: string;
  descripcion: string;
  entidad?: string;
  entidadIdParam?: string;
  camposSensibles?: string[];
}
```

## Testing Strategy

No crear nuevos archivos de test por politica del proyecto. Verificar con tests existentes de backend/frontend, `npm run typecheck`, `npm run build`, y QA manual/API sobre `GET /admin/auditoria` con filtros/export. Si Agustin pide tests, cubrir sanitizer, diff UPDATE, interceptor metadata-gated y tenant scoping.

## Migration/Rollout

Migracion limpia: drop `auditoria`, crear `audit_log` con `metadataLegacy`, `valoresAntes`, `valoresDespues`, `ip`, `userAgent`, `descripcion`, indices por `gimnasioId/fecha/modulo/accion`; crear `login_audit`. Rollback: drop nuevas tablas y recrear `auditoria` legacy, perdiendo logs post-deploy.

## Open Questions

Ninguna pendiente. `tipoAccion` sera obligatorio en operaciones sobrecargadas: reserva, asignacion manual, bloqueo/desbloqueo, cancelacion socio/staff, ausencia auto/manual, check-in/revert, inicio/cierre/reapertura de consulta.
