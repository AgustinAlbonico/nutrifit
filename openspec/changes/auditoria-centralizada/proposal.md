# Proposal: Auditoría centralizada (turnos + autenticación)

## Intent

Trazabilidad completa de acciones críticas del sistema y de eventos de autenticación. Hoy la tabla `auditoria` registra algunos cambios en turnos pero con shape limitado (`metadata` JSON libre) y muchos huecos. No hay registro de login/logout. El objetivo es: (1) cerrar todos los huecos de auditoría del módulo **turnos**, (2) registrar eventos de autenticación, (3) exponer reportes filtrables para admins y superadmins (incluyendo impersonación de gimnasio).

## Scope

### In Scope
- Migración limpia `auditoria` → `audit_log` con shape nuevo (diff por campo, ip, userAgent, descripcion).
- Tabla separada `login_audit` para login/logout/refresh.
- `AuditoriaInterceptor` HTTP con captura automática de `usuarioId`, `ip`, `userAgent` desde el request context.
- Decorador opcional `@Audit({ modulo, accion, descripcion })` para anotar endpoints con metadata semántica.
- Cierre de gaps en turnos: `reservar`, `asignar-manual`, `bloquear`, `desbloquear`, `confirmar`, `iniciar-consulta`, `reabrir-cierre-auto`, `AusenciaTurnoScheduler`, `CierreConsultaScheduler`.
- Migración de los 8 use-cases de turnos que ya llaman `AuditoriaService.registrar()` al nuevo shape.
- Sanitización centralizada: blacklist de campos sensibles (`password`, `passwordHash`, `hash`, `token`, `jwt`, `refreshToken`, `apiKey`) → `'[REDACTED]'`.
- Enganche explícito a schedulers vía `AuditoriaService.registrar({ usuarioId: 'system', ... })` (no pasan por HTTP).
- `GET /admin/auditoria` mejorado con filtros (módulo, acción, usuarioId, gimnasioId, rango fechas) y paginación. Tenant-aware: superadmins ven solo del gimnasio impersonado.

### Out of Scope
- Auditoría de fichas clínicas, planes alimentarios, pagos (fases futuras; turnos es el caso piloto).
- Reconstrucción histórica pre-migración (la columna `metadataLegacy` se conserva pero no se reinterpreta).
- UI de visualización de diff en frontend (fase posterior; hoy es solo API + Swagger).
- Alertas en tiempo real sobre eventos críticos.

## Capabilities

### New Capabilities
- `auditoria`: registro centralizado de cambios técnicos con diff por campo.
- `auditoria-auth`: registro separado de eventos de autenticación.
- `reportes-auditoria`: consulta filtrable de logs para admins/superadmins.

### Modified Capabilities
- Ninguno (no hay specs previas en `openspec/specs/`; este change introduce las nuevas).

## Approach

Arquitectura híbrida: `AuditoriaInterceptor` HTTP cubre todas las requests autenticadas, leyendo metadata del request context (usuarioId, ip, userAgent). Para mutaciones no-HTTP (schedulers), los use-cases invocan `AuditoriaService.registrar()` directo con `usuarioId='system'`. El service es la única fuente de verdad. `AuditoriaService.snapshot()` calcula diff campo-por-campo comparando estado previo (cargado antes de la mutación) y posterior, sanitizando campos sensibles antes de persistir. Reportes usan `tenantContext.gimnasioId` para scoping automático (superadmin impersonando = filtro por gimnasio impersonado).

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `apps/backend/src/infrastructure/services/auditoria/` | Modified | Entity + service migrados al nuevo shape |
| `apps/backend/src/infrastructure/auth/` | Modified | LoginService emite eventos a `login_audit` |
| `apps/backend/src/infrastructure/common/interceptors/` | New | `AuditoriaInterceptor` |
| `apps/backend/src/application/turnos/use-cases/*.ts` (9 archivos) | Modified | Hooks explícitos + cierre de gaps |
| `apps/backend/src/infrastructure/schedulers/` (2 schedulers) | Modified | Llamadas explícitas a `AuditoriaService.registrar()` |
| `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts` | Modified | Filtros + paginación |
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/` | New | Migration `auditoria→audit_log` + tabla `login_audit` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Estados overloaded (`CONFIRMADO`/`CANCELADO` cubren booked/bloqueado) | High | Metadata `tipoAccion` explícita en cada registro |
| Schedulers mudos hoy | High | Enganche explícito en `AusenciaTurnoScheduler` y `CierreConsultaScheduler` |
| Race conditions en reserva/bloqueo | Med | Audit captura contexto suficiente para investigar post-mortem |
| Performance de interceptor HTTP en endpoints de alto tráfico | Med | Modo async (`void`), batch opcional en service |
| Pérdida de datos históricos pre-migración | Low | Columna `metadataLegacy` preserva `metadata` original |
| Sanitización incompleta de campos nuevos | Med | Lista negra + test e2e sobre payload con campos sensibles |

## Rollback Plan

1. Revert de migration: drop columnas nuevas + `renameColumn('audit_log', 'metadataLegacy', 'metadata')` + `renameTable('audit_log', 'auditoria')` + drop tabla `login_audit`.
2. Revert de use-cases a la versión anterior (git revert del commit).
3. Revert del interceptor (retirar `app.useGlobalInterceptors(AuditoriaInterceptor)`).
4. CronJob/schedulers vuelven a estado sin audit.

Tiempo estimado de rollback: < 30 min. Riesgo de pérdida de datos nuevos: solo los registrados desde el deploy (acceptable).

## Dependencies

- Ninguna externa. Internas: `AuditoriaService` actual debe mantenerse funcional durante la transición (dual-write opcional si la migración se hace en dos fases).

## Success Criteria

- [ ] Los 14 use-cases de mutación de turnos + 2 schedulers escriben en `audit_log`.
- [ ] Login exitoso, login fallido, logout y refresh quedan registrados en `login_audit`.
- [ ] `GET /admin/auditoria` retorna resultados filtrados por módulo, acción, usuario, gimnasio y rango de fechas, con paginación.
- [ ] Ningún campo de la blacklist (`password`, `hash`, `token`, `jwt`, etc.) aparece en `valoresAntes` ni `valoresDespues`.
- [ ] Multi-tenant respetado: superadmin impersonando gimnasio X solo ve logs de X.
- [ ] Cobertura de tests unitarios sobre `AuditoriaService.snapshot()`, sanitización e interceptor ≥ 80%.