# Verify Report — ficha-salud

## 1. Resumen ejecutivo

El change implementa y verifica en runtime la mayor parte del scope planificado de ficha-salud: RB14, RB16, RB33, RB42, RB44 y RB50 tienen evidencia de código y tests focalizados passing; RB29 quedó validada solo con simulación unitaria de concurrencia y RB21 no tiene una prueba de no-regresión específica. No cumple completamente contra el set documental vigente porque la spec `ficha-salud-eventos-email.md` sigue sin implementación y RB45 (`revisada_por_nutricionista_at`) no se actualiza al leer la ficha desde nutricionista, así que la recomendación final es **no archivar todavía**.

## 2. Estado por RB

### RB14 — Ficha completa obligatoria antes de reservar turno
- **Implementado en**: PR 1a (`bf8f0d1`), verificación E2E agregada en PR 3 (`2a44508`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts:336-419` — cubre bloqueo con ficha `null`, bloqueo con `completada=false` y permiso con `completada=true`.
  - E2E test: `e2e/ficha-salud/crear-ficha.spec.ts:19-139` — crea/completa ficha, confirma `completada=true` por API y valida que no aparece el mensaje RB14 al pasar a agendar.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.ts:71-75`, `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:93-97`, `e2e/ficha-salud/crear-ficha.spec.ts:108-138`.

### RB16 — RECEPCIONISTA no accede a datos clínicos
- **Implementado en**: PR 1b (`7f46855`, `526129f`), cobertura E2E en PR 3 (`052c006`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/presentation/http/controllers/turnos.controller.spec.ts:30-181` — ejecuta `RolesGuard` real contra todos los handlers de ficha-salud y confirma `false` para `RECEPCIONISTA`.
  - E2E test: `e2e/ficha-salud/rbac-roles.spec.ts:24-139` — valida 403 sobre endpoints de socio, endpoints de paciente y PUT de ficha.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts:245-256`, `apps/backend/src/presentation/http/controllers/turnos.controller.ts:288-299`, `apps/backend/src/presentation/http/controllers/turnos.controller.ts:311-372`.

### RB21 — IMC histórico no se recalcula
- **Implementado en**: PR 1a (`2370926`) como preservación del comportamiento existente.
- **Cómo se verifica**:
  - Unit test: **no existe caso específico** que pruebe que editar peso/altura no dispara recálculo de IMC histórico.
  - E2E test: **no existe cobertura específica** para este caso borde.
- **Cumple**: ⚠️
- **Evidencia**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:104-162` solo muta la ficha/versiones; no invoca servicios de mediciones/IMC. La spec todavía exige esta prueba en `openspec/changes/ficha-salud/specs/ficha-salud-editar.md:21-29` y `:36-41`.

### RB29 — Last-write-wins
- **Implementado en**: PR 1a (`2370926`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:482-617` — prueba versiones consecutivas 1/2/3 y dos PATCH concurrentes sin perder ninguna versión.
  - E2E test: no hay escenario concurrente real; `e2e/ficha-salud/editar-ficha.spec.ts:124-163` solo valida orden DESC del historial luego de editar.
- **Cumple**: ⚠️
- **Evidencia**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:133-147` usa `SELECT MAX(version) ... FOR UPDATE`; `apps/backend/src/infrastructure/persistence/typeorm/repositories/ficha-salud-version.repository.impl.ts:60-73` expone el lock pesimista en el repositorio.

### RB33 — Auditoría antes/después
- **Implementado en**: PR 1b (`bed5be9`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:746-964` — cubre CREATE con shape seguro, UPDATE con `antes/después`, `camposModificados` y no-registro ante rollback.
  - E2E test: no hay cobertura dedicada.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts:13-27`, `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:167-214`.

### RB42 — Ficha editable
- **Implementado en**: backend en PR 1a (`2370926`), UI principal en PR 2 (`08782d0`), verificación E2E en PR 3 (`4eb8754`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:256-313` — edita ficha existente, conserva `consentAt` y actualiza `actualizadaAt`.
  - E2E test: `e2e/ficha-salud/editar-ficha.spec.ts:17-165` — edita peso, ve mensaje de éxito, abre historial y lee detalle read-only.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:98-162`, `apps/frontend/src/pages/FichaSaludSocio.tsx:155-176`, `apps/frontend/src/pages/FichaSaludSocio.tsx:378-382`, `apps/frontend/src/pages/FichaSaludSocio.tsx:919-951`.

### RB44 — Consentimiento una sola vez
- **Implementado en**: PR 1a (`2370926`) y PR 2 (`08782d0`), cobertura E2E en PR 3 (`2a44508`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:362-479` — exige `consentimiento=true` en creación y lo ignora en edición sin tocar `consentAt`.
  - E2E test: `e2e/ficha-salud/crear-ficha.spec.ts:49-88` — checkbox obligatorio, modal RGPD y submit habilitado recién luego del consentimiento.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:66-71`, `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:95-101`, `apps/frontend/src/pages/FichaSaludSocio.tsx:253-270`, `apps/frontend/src/pages/FichaSaludSocio.tsx:408-426`, `apps/frontend/src/components/ficha-salud/SeccionConsentimiento.tsx:49-99`.

### RB50 — Historial de versiones inmutable
- **Implementado en**: PR 1a (`da8304f`, `2370926`), PR 1b (`7f46855`), PR 2 (`e6124f9`, `5145d10`), PR 3 (`4eb8754`, `934b818`).
- **Cómo se verifica**:
  - Unit test: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:482-617`, `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.spec.ts:98-185`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.spec.ts:96-170`, `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud-nutricionista.use-case.spec.ts:91-142`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud-nutricionista.use-case.spec.ts:91-142`.
  - E2E test: `e2e/ficha-salud/editar-ficha.spec.ts:83-163` y `e2e/ficha-salud/historial-nutricionista.spec.ts:24-151`.
- **Cumple**: ✅
- **Evidencia**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603194401-FichaSaludVersionado.ts:33-237`, `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:133-162`, `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.ts:44-66`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.ts:44-76`, `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.tsx:64-229`.

## 3. Estado por spec

- **Spec**: `ficha-salud-completar.md`
  - **Estado**: parcial
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:225-359`, `apps/frontend/src/pages/FichaSaludSocio.test.tsx:245-359`, `e2e/ficha-salud/crear-ficha.spec.ts:19-139`
  - **Issues abiertos**: no hay caso runtime específico para A1 (faltan obligatorios); la source doc original también enumera campos no modelados en el delta actual (`docs/iteraciones/.../08-completar-ficha-salud.md:43-73`).

- **Spec**: `ficha-salud-editar.md`
  - **Estado**: parcial
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:256-313`, `:482-617`, `apps/frontend/src/pages/FichaSaludSocio.test.tsx:214-243`, `:362-372`, `e2e/ficha-salud/editar-ficha.spec.ts:17-165`
  - **Issues abiertos**: RB21 no tiene test específico de no-regresión; la alerta RB15 al nutricionista sigue fuera de scope funcional.

- **Spec**: `ficha-salud-versioning.md`
  - **Estado**: parcial
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:482-617`, `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.spec.ts:98-185`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.spec.ts:96-170`, `e2e/ficha-salud/editar-ficha.spec.ts:83-163`
  - **Issues abiertos**: en verify no se re-ejecutaron migraciones contra DB real; el comportamiento de migration/backfill quedó validado solo por inspección de `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603194401-FichaSaludVersionado.ts:33-237`.

- **Spec**: `ficha-salud-auditoria.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:746-964`
  - **Issues abiertos**: no hay integración/E2E dedicada, pero la cobertura unitaria de CREATE/UPDATE/rollback existe y pasó.

- **Spec**: `ficha-salud-rb14-bloqueo-reserva.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts:336-419`, `e2e/ficha-salud/crear-ficha.spec.ts:108-138`
  - **Issues abiertos**: ninguno específico del change.

- **Spec**: `ficha-salud-rb16-acceso.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/backend/src/presentation/http/controllers/turnos.controller.spec.ts:30-181`, `e2e/ficha-salud/rbac-roles.spec.ts:24-139`
  - **Issues abiertos**: ninguno específico del change.

- **Spec**: `ficha-salud-rb44-consentimiento.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:362-479`, `apps/frontend/src/pages/FichaSaludSocio.test.tsx:245-286`, `apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.test.tsx:28-101`, `e2e/ficha-salud/crear-ficha.spec.ts:49-88`
  - **Issues abiertos**: ninguno específico del change.

- **Spec**: `ficha-salud-endpoints-historial.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.spec.ts:98-185`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.spec.ts:96-170`, `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud-nutricionista.use-case.spec.ts:91-142`, `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud-nutricionista.use-case.spec.ts:91-142`, `e2e/ficha-salud/historial-nutricionista.spec.ts:24-151`
  - **Issues abiertos**: la UI específica de nutricionista para historial no existe por decisión de scope; la cobertura E2E de ese lado es API-based, no visual (`e2e/ficha-salud/historial-nutricionista.spec.ts:12-16`).

- **Spec**: `ficha-salud-ui-wizard.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/frontend/src/pages/FichaSaludSocio.test.tsx:197-372`, `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.test.tsx:48-139`, `apps/frontend/src/components/ficha-salud/FichaSaludVersionDetalle.test.tsx:15-92`
  - **Issues abiertos**: en tests aparecen warnings de Radix `DialogContent`, pero los componentes sí renderizan `DialogTitle`/`DialogDescription` en código (`apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.tsx:50-69`, `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.tsx:87-103`).

- **Spec**: `ficha-salud-ui-validaciones.md`
  - **Estado**: implementado
  - **Tests que lo cubren**: `apps/frontend/src/pages/FichaSaludSocio.test.tsx:288-323`, `apps/frontend/src/schemas/ficha-salud.schema.ts:27-53`, `packages/shared/src/types/ficha-salud.ts:28-56`
  - **Issues abiertos**: la representación quedó en centímetros (`100..250`) en lugar de metros (`1.0..2.5`), pero es consistente con el backend y está documentada en el schema (`apps/frontend/src/schemas/ficha-salud.schema.ts:4-14`).

- **Spec**: `ficha-salud-eventos-email.md`
  - **Estado**: no implementado
  - **Tests que lo cubren**: ninguno
  - **Issues abiertos**: `UpsertFichaSaludSocioUseCase` no inyecta ni invoca `NotificacionesService`/email post-commit (`apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:33-52`, `:167-223`), mientras que la spec y las source docs siguen pidiéndolo (`openspec/changes/ficha-salud/specs/ficha-salud-eventos-email.md:8-35`, `docs/iteraciones/iteraciones/iteracion 1/features/ficha-salud/08-completar-ficha-salud.md:94-99`, `docs/iteraciones/iteraciones/iteracion 1/features/ficha-salud/09-editar-ficha-salud.md:62-67`).

## 4. Criterios de aceptación (de la proposal)

- **PR 1 — La migración persiste el modelo correcto**: ⚠️ Pass con caveats — la migración y el backfill están implementados (`apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603194401-FichaSaludVersionado.ts:33-237`), pero en verify no se re-ejecutó `migration:run`/`migration:revert`.
- **PR 1 — Primera solicitud genera versión 1; siguientes ediciones generan 2, 3, ...**: ✅ Pass — `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:482-547`.
- **PR 1 — RB14 bloquea reservas si la ficha no está completada**: ✅ Pass — `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts:336-419`.
- **PR 1 — Auditoría se registra efectivamente**: ✅ Pass — `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts:746-964`.
- **PR 2 — El checkbox de consentimiento es obligatorio si la ficha no existe**: ✅ Pass — `apps/frontend/src/pages/FichaSaludSocio.test.tsx:245-268`.
- **PR 2 — El banner de "Última edición" se muestra si es vista de edición**: ✅ Pass — `apps/frontend/src/pages/FichaSaludSocio.test.tsx:214-224`, `:362-372`.
- **PR 2 — Modal de historial opera sin errores**: ✅ Pass — `apps/frontend/src/pages/FichaSaludSocio.test.tsx:226-243`, `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.test.tsx:48-139`.
- **PR 3 — El socio puede loguearse, consentir, completar ficha, recibir email y reservar turno**: ❌ Fail — el flujo de ficha/reserva tiene tests E2E escritos (`e2e/ficha-salud/crear-ficha.spec.ts:19-139`), pero no se ejecutó en esta verificación y el email sigue sin implementación (`openspec/changes/ficha-salud/specs/ficha-salud-eventos-email.md:8-35`).

## 5. Tests

### Backend (Jest)
- **Total**: 440 tests, 388 passing, 52 failing.
- **Tests nuevos en PRs ficha-salud**: 65.
- **Suite focal ficha-salud**: `npx jest ...ficha-salud... --runInBand` → 70/70 passing (incluye 5 casos preexistentes del archivo `reservar-turno-socio.use-case.spec.ts`).
- **Cobertura de `UpsertFichaSaludSocioUseCase`**: 77.27% líneas, 76.10% statements, 77.33% branches, 47.36% functions (`npx jest ... --coverage`).
- **Issues pre-existentes**:
  - DI / módulos ajenos a ficha-salud: `application/turnos/use-cases/cancelar-turno-socio.use-case.spec.ts`, `presentation/http/gimnasios.module.spec.ts`, `presentation/http/controllers.module.spec.ts`, `infrastructure/services/adjunto-clinico/adjunto-clinico.service.spec.ts`.
  - Compilación en permisos: `application/permisos/use-cases/{crear,editar,eliminar,asignar-acciones-grupo}.use-case*.ts`.
  - Seed / utilitarios: `seed/shared-actions.loader.spec.ts`, `seed-multi-tenant.syntax.spec.ts`.
  - Repository mock ajeno: `infrastructure/persistence/typeorm/repositories/agenda.repository.spec.ts`.

### Frontend (Vitest)
- **Total**: 90 tests, 74 passing, 16 failing.
- **Tests nuevos**: 21.
- **Suite focal ficha-salud**: `npx vitest run src/pages/FichaSaludSocio.test.tsx src/components/ficha-salud/*.test.tsx` → 21/21 passing.
- **Issues pre-existentes**:
  - Auth / impersonación: `src/contexts/__tests__/AuthContext.test.tsx`, `src/components/admin/__tests__/ImpersonationIndicator.test.tsx`, `src/components/admin/__tests__/TenantSwitcher.test.tsx`.
  - Pantalla de configuración aún en construcción: `src/pages/__tests__/Configuracion.test.tsx`.

### E2E (Playwright)
- **Tests creados**: 11 (4 specs × {chromium, firefox, webkit} = 33 runs).
- **Estado**: **NO ejecutados**. Al momento de verificar, `localhost:5173` estaba arriba pero `localhost:3000` estaba caído; por regla explícita no se inició el backend del usuario.
- **Cómo correrlos**: desde la raíz del repo, con **frontend 5173** y **backend 3000** ya levantados por el usuario: `npx playwright test e2e/ficha-salud/`.

## 6. Typecheck y lint

- **Backend typecheck**: errors — 12 errores preexistentes en permisos/tests (`apps/backend/src/application/permisos/use-cases/asignar-acciones-grupo.use-case.ts`, `crear-grupo.use-case.ts`, `editar-grupo.use-case.ts`, `eliminar-grupo.use-case.ts`, más `editar-grupo.use-case.spec.ts`).
- **Frontend typecheck**: errors — preexistentes y ajenos a ficha-salud en `src/components/admin/{ImpersonationIndicator,TenantSwitcher}.tsx`, `src/components/layout/Sidebar.tsx`, `src/contexts/__tests__/AuthContext.test.tsx`, `src/pages/__tests__/Configuracion.test.tsx` y `src/pages/Nutricionistas.tsx`.
- **Backend lint**: errors — 637 problemas (550 errors, 87 warnings), mayormente ajenos al change (AI, gimnasios, permisos, reportes, seed) y además ruido masivo de Prettier/EOL en este checkout Windows.
- **Frontend lint**: errors — 2 errors y 4 warnings, ajenos a ficha-salud (`src/components/media/DialogFotoMaximize.tsx`, `src/pages/Nutricionistas.tsx`, warnings en `coverage/`).

## 7. Issues críticos encontrados

### CRITICAL
1. **Spec de emails no implementada**
   - La spec `openspec/changes/ficha-salud/specs/ficha-salud-eventos-email.md:8-35` y las source docs (`08-completar-ficha-salud.md:94-99`, `09-editar-ficha-salud.md:62-67`) siguen exigiendo `FICHA_COMPLETADA` / `FICHA_ACTUALIZADA`, pero `UpsertFichaSaludSocioUseCase` no hace ningún dispatch post-commit (`apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts:33-52`, `:167-223`).
2. **RB45 no implementada funcionalmente**
   - La columna existe en modelo/migración (`apps/backend/src/infrastructure/persistence/typeorm/entities/ficha-salud.entity.ts:195-200`, `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603194401-FichaSaludVersionado.ts:83-86`), pero `GetFichaSaludPacienteUseCase` solo lee la ficha y nunca setea `revisada_por_nutricionista_at` (`apps/backend/src/application/turnos/use-cases/get-ficha-salud-paciente.use-case.ts:49-95`). La source doc todavía lo exige (`docs/iteraciones/iteraciones/iteracion 1/features/ficha-salud/08-completar-ficha-salud.md:176`).

### WARNING
1. **RB21 sin prueba dedicada** — no hay test unitario/E2E que demuestre explícitamente que editar ficha no recalcula IMC histórico (`openspec/changes/ficha-salud/specs/ficha-salud-editar.md:21-29`).
2. **Cobertura del use case principal por debajo de lo planificado** — `UpsertFichaSaludSocioUseCase` quedó en 77.27% líneas, por debajo del >90% pedido en `tasks.md`.
3. **Suites globales no verdes** — backend y frontend tienen fallas preexistentes ajenas a ficha-salud; eso no invalida la suite focal del change, pero sí impide declarar el monorepo “clean”.

### SUGGESTION
1. Antes de archivar, reconciliar proposal/specs/tasks con el scope efectivamente aceptado: si email y RB45 quedan fuera, los artifacts deben actualizarse; si siguen dentro, falta implementarlos y re-verificar.

## 8. Recomendación

- **❌ No apto — blocking issues**

El change está **cerca** de cerrar, pero hoy no llega a `archive` porque hay dos gaps contra la documentación fuente/especificaciones activas: emails no implementados y RB45 ausente. La próxima acción recomendada es **corregir esos gaps (o bajar formalmente el scope en proposal/specs) y recién después re-verificar**.
