# Tasks: ficha-salud

**Change**: ficha-salud
**Strategy**: 4 PRs stacked-to-main
**Review budget**: 800 líneas/PR
**Persistence**: BOTH (OpenSpec + Engram)
**Date**: 2026-06-03
**Decision needed before apply**: No
**Chained PRs recommended**: Yes
**Chain strategy**: stacked-to-main
**400-line budget risk**: Low

---

## PR 1a — Datos + RB14 + RB44 (~500 líneas netas)

**Branch**: `feat/ficha-salud-pr1a-datos`
**Target**: `main`
**Depends on**: nothing
**Estimated changed lines**: ~500 (límite 800)
**RBs en alcance**: RB14, RB29, RB42, RB44, RB50 (versión + RB14 fix + consentimiento)

### Goal

Crear la base de datos para el versionado inmutable de la ficha de salud, ampliar el enum `NivelActividadFisica`, introducir el consentimiento RGPD (RB44) y endurecer `ReservarTurnoSocioUseCase` para chequear `completada=true` (RB14). Dejar el upsert funcionando y testeado, sin auditoría ni historial todavía (esos viven en PR 1b).

### Tasks

#### Task 1.1: Migración — crear tabla `ficha_salud_version` y agregar columnas a `ficha_salud`
- **Tipo**: backend-migration
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/<TIMESTAMP>-FichaSaludVersionado.ts`
- **Descripción**: Migración TypeORM que crea la tabla `ficha_salud_version` con todas las columnas (PK, FKs a `ficha_salud` y `persona`, `datos_json`, `created_at`, `created_by`, `version`), UNIQUE(`id_ficha_salud`,`version`), INDEX(`id_socio`), INDEX(`created_at`). Luego ALTER TABLE sobre `ficha_salud` agregando `completada boolean NOT NULL DEFAULT false`, `completada_at`, `actualizada_at`, `consent_at`, `version_actual_id` (FK a `ficha_salud_version.id_ficha_salud_version` con ON DELETE RESTRICT), `revisada_por_nutricionista_at`, e INDEX(`completada`). Backfill: para cada fila existente en `ficha_salud`, setear `completada=true`, `completada_at=fecha_creacion`, `actualizada_at=fecha_creacion`, `consent_at=fecha_creacion`; crear `FichaSaludVersion v1` con `datos_json` reconstruido de la fila actual. `down` revierte en orden inverso. Loggear conteo de filas backfilleadas.
- **Acceptance criteria**:
  - [ ] `npm run migration:run` ejecuta sin errores
  - [ ] `SHOW CREATE TABLE ficha_salud_version;` muestra la estructura correcta
  - [ ] `SHOW COLUMNS FROM ficha_salud;` muestra las 6 columnas nuevas
  - [ ] Fichas pre-existentes tienen `completada=true` y `consent_at` no nulo
  - [ ] Existe al menos una `ficha_salud_version` por cada `ficha_salud` con `version=1`
  - [ ] `npm run migration:revert` baja limpio
- **RBs**: RB29, RB42, RB44, RB50
- **Estimado**: L
- **Commit message**: `feat(ficha-salud): migración con tabla ficha_salud_version y columnas de versionado`
- **Notas**: usar el formato de timestamp del codebase (e.g. `1780224000000-FichaSaludVersionado.ts`). El backfill en producción con >10k fichas debe ser en batches para no bloquear.

#### Task 1.2: Migración — ampliar enum `NivelActividadFisica` a 5 valores
- **Tipo**: backend-migration
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/<TIMESTAMP>-AmpliarNivelActividadFisica.ts`
- **Descripción**: Migración TypeORM que ejecuta `ALTER TABLE ficha_salud MODIFY COLUMN nivel_actividad_fisica enum('SEDENTARIO','LIGERO','MODERADO','INTENSO','MUY_INTENSO') NOT NULL`. No perder los 3 valores existentes. `down` revierte a los 3 originales.
- **Acceptance criteria**:
  - [ ] La migración aplica sin pérdida de datos
  - [ ] `DESCRIBE ficha_salud;` muestra el enum con 5 valores
  - [ ] Fichas existentes siguen teniendo un valor válido
  - [ ] `npm run migration:revert` baja limpio
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): migración para ampliar enum nivel_actividad_fisica a 5 valores`
- **Notas**: PR 2 (frontend) consume estos 5 valores desde `@nutrifit/shared`. Esta migración debe correr DESPUÉS de la migración del Task 1.1.

#### Task 1.3: Entidad de dominio `FichaSaludVersion`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/FichaSalud/ficha-salud-version.entity.ts`
- **Descripción**: Crear la entidad de dominio pura (no TypeORM) con los campos: `idFichaSaludVersion: number`, `idFichaSalud: number`, `idSocio: number`, `version: number`, `datosJson: Record<string, unknown>`, `createdAt: Date`, `createdBy: number | null`. Documentar en JSDoc que la entidad es **inmutable**: no exponer setters ni métodos de mutación.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] La entidad es `class` con constructor completo (no setters públicos)
  - [ ] El JSDoc del archivo menciona la regla de inmutabilidad
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): entidad de dominio FichaSaludVersion inmutable`
- **Notas**: gemela de `apps/backend/src/domain/entities/FichaSalud/ficha-salud.entity.ts`. Mantener el patrón de archivos existente (ver `ficha-salud.entity.ts`).

#### Task 1.4: Entidad TypeORM `FichaSaludVersionOrmEntity`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/ficha-salud-version.entity.ts`
- **Descripción**: Crear la entidad TypeORM con `@Entity('ficha_salud_version')`. Mapeo exacto de las columnas de la migración: PK auto-increment, FKs a `ficha_salud` (CASCADE) y `persona` (RESTRICT), `datos_json` como `simple-json`, índices y UNIQUE constraint. Documentar en JSDoc que el repository NO expone `update` ni `delete`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] El decorador `@Entity` usa el nombre exacto `ficha_salud_version`
  - [ ] El JSDoc documenta la regla de inmutabilidad
  - [ ] El archivo se exporta en `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts`
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): entidad TypeORM FichaSaludVersion con índices y FKs`
- **Notas**: NO extender `AuditableOrmEntity` (no tiene `updated_at`). Usar `@CreateDateColumn` para `created_at`.

#### Task 1.5: Modificar entidad de dominio `FichaSalud` con campos nuevos
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/FichaSalud/ficha-salud.entity.ts`
- **Descripción**: Agregar a la entidad de dominio los campos: `completada: boolean` (default false), `completadaAt: Date | null`, `actualizadaAt: Date | null`, `consentAt: Date | null`, `versionActualId: number | null`, `revisadaPorNutricionistaAt: Date | null`. Inicializar `completada=false` en el constructor.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] Nuevos campos opcionales nullable según diseño
  - [ ] `completada` se inicializa en `false`
- **RBs**: RB14, RB44, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): agregar campos de versionado a entidad FichaSalud`
- **Notas**: los campos pre-existentes (altura, peso, etc.) NO se tocan.

#### Task 1.6: Modificar entidad TypeORM `FichaSaludOrmEntity` con columnas nuevas
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/ficha-salud.entity.ts`
- **Descripción**: Mapear los 6 campos nuevos de la entidad de dominio a columnas TypeORM: `completada` (boolean, default false), `completada_at`, `actualizada_at`, `consent_at` (datetime nullable), `version_actual_id` (int nullable, FK a `ficha_salud_version.id_ficha_salud_version`, ON DELETE RESTRICT), `revisada_por_nutricionista_at` (datetime nullable). La columna `completada` lleva índice.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] Las 6 columnas nuevas tienen el tipo TS correcto (especialmente `boolean` vs `tinyint`)
  - [ ] La FK `version_actual_id` tiene `onDelete: 'RESTRICT'`
  - [ ] `completada` tiene `@Index()`
- **RBs**: RB14, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): mapear columnas nuevas en FichaSaludOrmEntity`
- **Notas**: verificar que la entidad sigue extendiendo `AuditableOrmEntity` y que `fecha_creacion` sigue intacto.

#### Task 1.7: Ampliar enum `NivelActividadFisica` en dominio
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/FichaSalud/NivelActividadFisica.ts`
- **Descripción**: Agregar los valores `LIGERO = 'LIGERO'` y `MUY_INTENSO = 'MUY_INTENSO'` al enum TS. Mantener los 3 originales.
- **Acceptance criteria**:
  - [ ] El enum tiene 5 valores
  - [ ] El archivo compila sin errores
  - [ ] El test suite del módulo sigue pasando
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): ampliar enum NivelActividadFisica con LIGERO y MUY_INTENSO`
- **Notas**: coincide con la migración del Task 1.2. PR 2 importa el enum desde `@nutrifit/shared` (Task 2.1).

#### Task 1.8: Centralizar enums y labels en `@nutrifit/shared`
- **Tipo**: backend-shared
- **Archivos**: `packages/shared/src/types/ficha-salud.ts`, `packages/shared/src/index.ts`
- **Descripción**: Crear el módulo compartido con: `NIVELES_ACTIVIDAD_FISICA` (array de `{value, label}` con los 5 valores), `FRECUENCIAS_COMIDAS` (array con los valores actuales — strings libres por ahora), y tipos derivados (`NivelActividadFisicaValue`, `FrecuenciaComidasValue`). Exportar desde `packages/shared/src/index.ts`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] El paquete `@nutrifit/shared` se rebuilds y los tipos están disponibles
  - [ ] Los labels están en español (e.g. "Muy intenso" no "Very intense")
  - [ ] PR 2 (frontend) puede importar sin errores
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `feat(shared): centralizar enums y labels de ficha-salud`
- **Notas**: NO incluir `TipoNotificacion.FICHA_COMPLETADA` ni `FICHA_ACTUALIZADA` (decidido fuera de scope 2026-06-03).

#### Task 1.9: DTO de upsert — agregar `consentimiento` y rangos
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/upsert-ficha-salud-socio.dto.ts`
- **Descripción**: Agregar campo `consentimiento?: boolean` (opcional, controlado por use case). Confirmar que `altura` valida 100-250 cm y `peso` valida 20-500 kg (rango backend, mantener compatibilidad). El frontend validará 20-300 en Zod. Documentar la discrepancia en JSDoc.
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] `consentimiento` está marcado como `@IsOptional()` (la validación semántica la hace el use case)
  - [ ] Tests de validación existentes del DTO siguen pasando
  - [ ] JSDoc explica por qué peso puede ser 20-500 backend pero 20-300 frontend
- **RBs**: RB44
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): agregar campo consentimiento y rangos al DTO de upsert`
- **Notas**: NO validar `consentimiento=true` en el DTO. Esa validación es semántica de negocio y vive en el use case.

#### Task 1.10: DTO de respuesta — agregar campos nuevos
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/ficha-salud-socio-response.dto.ts`
- **Descripción**: Agregar al DTO de respuesta los campos: `completada: boolean`, `completadaAt: Date | null`, `actualizadaAt: Date | null`, `consentAt: Date | null`, `versionActual: number`. Mantener compatibilidad aditiva: el frontend puede ignorar campos nuevos.
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] Los 5 campos nuevos están presentes con tipos correctos
  - [ ] Los tests del response existentes siguen pasando
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): extender DTO de respuesta con campos de versionado`

#### Task 1.11: Modificar `UpsertFichaSaludSocioUseCase` con versionado y RB44
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts`
- **Descripción**: Reescribir el use case para soportar: (1) determinar si es creación o edición, (2) si es creación validar `payload.consentimiento === true` o lanzar `BadRequestError("Se requiere consentimiento expreso para almacenar la ficha")`, (3) si es creación setear `completada=true`, `completadaAt=now()`, `consentAt=now()`, (4) si es edición setear `actualizadaAt=now()` y NO tocar `consentAt`, (5) dentro de `dataSource.transaction()`: resolver alergias/patologías, guardar la ficha, calcular `nuevaVersion = (versionActualId ? maxVersion+1 : 1)` con `SELECT MAX(version) ... FOR UPDATE` para evitar race conditions, insertar la `FichaSaludVersion` inmutable con `datosJson` snapshot completo, actualizar `version_actual_id` en la ficha, guardar de nuevo, commit. **NO** incluir auditoría (eso es PR 1b). **NO** incluir notificaciones ni emails (decidido fuera de scope).
- **Acceptance criteria**:
  - [ ] Tests unitarios (Task 1.14) pasan: crear, editar, consent_required, consent_ignored_in_edit
  - [ ] Race condition test: dos PATCH concurrentes generan versiones N+1 y N+2, no se pierde ninguna
  - [ ] Si `ficha.save()` falla, NO se persiste `version.save()` (atomicidad transaccional)
  - [ ] El código NO llama a `notificacionesService` ni `emailService`
  - [ ] El código NO llama a `auditoriaService.registrar()` (eso es PR 1b)
- **RBs**: RB29, RB42, RB44, RB50
- **Estimado**: L
- **Commit message**: `feat(ficha-salud): versionado inmutable y consentimiento RGPD en upsert`
- **Notas**: este archivo será modificado de nuevo en PR 1b para agregar las llamadas de auditoría. Hacer la inserción de versión lo más al final de la transacción posible para minimizar el tiempo del lock.

#### Task 1.12: Modificar `ReservarTurnoSocioUseCase` — fix RB14 línea 71
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.ts`
- **Descripción**: Cambiar la condición de la línea 71 de `if (!socio.fichaSalud)` a `if (!socio.fichaSalud || !socio.fichaSalud.completada)`. Actualizar el mensaje de error a `"Debés completar y tener completada tu ficha de salud antes de reservar un turno."`. La relación `fichaSalud: true` ya está cargada en línea 187; no se requiere cambio adicional.
- **Acceptance criteria**:
  - [ ] Tests existentes (Task 1.15) siguen pasando
  - [ ] Tests nuevos `bloquea si completada=false` y `permite si completada=true` pasan
- **RBs**: RB14
- **Estimado**: S
- **Commit message**: `fix(ficha-salud): bloquear reserva de turno si ficha no está completada (RB14)`
- **Notas**: el fix es de 1 línea lógica + mensaje. Verificar que `fichaSalud.completada` se carga con la relación (debería estar disponible tras la migración del Task 1.1).

#### Task 1.13: Registrar `FichaSaludVersionOrmEntity` en el módulo
- **Tipo**: backend-module
- **Archivos**: `apps/backend/src/application/turnos/turnos.module.ts`, `apps/backend/src/infrastructure/persistence/typeorm/repositories/repositories.module.ts`
- **Descripción**: En `turnos.module.ts`, agregar `FichaSaludVersionOrmEntity` al array de `TypeOrmModule.forFeature([...])`. En `repositories.module.ts`, registrar la entidad en `TypeOrmModule.forFeature` global si corresponde. NO agregar todavía providers de repository (eso es PR 1b).
- **Acceptance criteria**:
  - [ ] El módulo compila sin errores
  - [ ] `npm run start:dev` arranca sin errores
  - [ ] La entidad `FichaSaludVersion` está disponible para inyección
- **RBs**: (estructura)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): registrar FichaSaludVersion en el módulo de turnos`
- **Notas**: en este PR la entidad existe pero no se usa todavía. PR 1b agrega el repository y los providers.

#### Task 1.14: Tests del `UpsertFichaSaludSocioUseCase`
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts`
- **Descripción**: Crear/reescribir el spec del use case con los siguientes casos: (1) Happy path crear → assert `version=1`, `completada=true`, `consentAt=now()`. (2) Happy path editar → assert `version=2`, `actualizadaAt` updated, `consentAt` intacto. (3) Validación altura fuera de rango vía `validateOrReject`. (4) Validación peso fuera de rango. (5) Validación enum `NivelActividadFisica` rechaza `"SUPER_INTENSO"`. (6) Consentimiento en creación `false` → `BadRequestError`. (7) Consentimiento en creación `undefined` → `BadRequestError`. (8) Consentimiento en edición `false` → éxito, `consentAt` intacto. (9) Consentimiento en edición `true` explícito → éxito, `consentAt` intacto. (10) Versionado: 3 PATCH consecutivos → versiones 1, 2, 3. (11) Race condition: dos `Promise.all` → versiones distintas. (12) Transacción atómica: si `version.save` falla, `ficha.save` hace rollback. (13) **NO** asserts sobre `auditoriaService` ni `notificacionesService` (esos son PR 1b).
- **Acceptance criteria**:
  - [ ] Todos los casos pasan
  - [ ] `npm run test -- upsert-ficha-salud-socio` muestra verde
  - [ ] Coverage del use case > 90%
- **RBs**: RB14, RB29, RB42, RB44, RB50
- **Estimado**: L
- **Commit message**: `test(ficha-salud): spec completo de upsert con versionado y consentimiento`
- **Notas**: usar `Test.createTestingModule` con mocks de `FichaSaludRepository`, `FichaSaludVersionRepository` (puede ser un mock simple en PR 1a), `AlergiaRepository`, `PatologiaRepository`, `DataSource` (con `transaction` mockeado a callback inmediato).

#### Task 1.15: Extender tests de `ReservarTurnoSocioUseCase` con RB14
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts`
- **Descripción**: Agregar al spec existente: (1) `RB14: bloquea si ficha es null` (verificar que el test existente sigue cubriendo este caso, ajustar si es necesario). (2) `RB14: bloquea si ficha existe pero completada=false` (nuevo). (3) `RB14: permite si ficha existe y completada=true` (nuevo).
- **Acceptance criteria**:
  - [ ] Los 3 casos pasan
  - [ ] Los tests existentes del use case siguen pasando (no romper lo que ya está)
  - [ ] `npm run test -- reservar-turno-socio` muestra verde
- **RBs**: RB14
- **Estimado**: M
- **Commit message**: `test(ficha-salud): spec cubrir RB14 con casos de ficha incompleta y completada`
- **Notas**: si el spec no existe, crearlo. Si existe, solo agregar los 2-3 casos nuevos.

### PR 1a — Tests requeridos

- `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts` (Task 1.14)
- `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts` (Task 1.15, extendido)
- Verificación manual de la migración: `npm run migration:run && npm run migration:revert`

### PR 1a — Acceptance criteria (overall)

- [ ] Las 2 migraciones corren limpio en una base de datos local con datos seed
- [ ] El backfill crea versiones inmutables para todas las fichas pre-existentes
- [ ] El frontend actual (sin cambios) sigue funcionando con los nuevos campos (aditivo)
- [ ] Un socio nuevo puede crear ficha vía el endpoint existente `PUT /turnos/socio/ficha-salud`
- [ ] Un socio sin `consentimiento=true` recibe 400 con el mensaje correcto
- [ ] Un socio con ficha `completada=false` recibe 400 al intentar reservar turno
- [ ] El campo `versionActual` aparece en la respuesta del upsert
- [ ] `npm run build` y `npm run lint` pasan en backend
- [ ] El spec del upsert tiene > 90% de coverage

### PR 1a — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. `npm run migration:revert` dos veces (en orden inverso: primero la migración del enum, luego la del versionado)
3. Verificar que `ficha_salud` no tiene las 6 columnas nuevas
4. Verificar que `ficha_salud_version` no existe
5. Los endpoints existentes siguen comportándose como antes del PR

---

## PR 1b — Historial + Audit (~300 líneas netas)

**Branch**: `feat/ficha-salud-pr1b-historial`
**Target**: `main` (después de PR 1a mergeado)
**Depends on**: PR 1a
**Estimated changed lines**: ~300 (límite 800)
**RBs en alcance**: RB13, RB29, RB33, RB50

### Goal

Exponer los endpoints de historial y versionado para socios y nutricionistas, integrar la auditoría RB33 con shape seguro (sin datos clínicos sensibles en CREATE) en el upsert, y dejar el backend cerrado. **NO** incluye emails ni notificaciones (decidido fuera de scope).

### Tasks

#### Task 1.16: Puerto y adaptador de `FichaSaludVersionRepository`
- **Tipo**: backend-repository
- **Archivos**: `apps/backend/src/domain/repositories/ficha-salud-version.repository.ts` (puerto), `apps/backend/src/infrastructure/persistence/typeorm/repositories/ficha-salud-version.repository.impl.ts` (adaptador)
- **Descripción**: Crear el puerto (interface) con métodos: `findById(id)`, `findByFichaId(idFichaSalud)`, `findByFichaIdAndVersion(idFichaSalud, version)`, `findMaxVersionByFichaId(idFichaSalud)` (con `setLockMode('pessimistic_write')`), y `save(version)` (insert puro). **NO** incluir `update()` ni `delete()` en el puerto — esto es defendible con tests. Crear el adaptador TypeORM que implementa el puerto usando `Repository<FichaSaludVersionOrmEntity>`.
- **Acceptance criteria**:
  - [ ] El puerto NO expone `update` ni `delete` (verificable con un test que intente llamar a esos métodos y reciba error de TypeScript o undefined)
  - [ ] El adaptador compila y se puede inyectar
  - [ ] `findMaxVersionByFichaId` usa `pessimistic_write` para prevenir race conditions
- **RBs**: RB50
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): puerto y adaptador de FichaSaludVersionRepository`
- **Notas**: ajustar la ruta del puerto según convención del proyecto (puede que viva en `apps/backend/src/domain/repositories/` o en `apps/backend/src/domain/entities/FichaSalud/`). Verificar con `ls apps/backend/src/domain/`.

#### Task 1.17: Registrar `FichaSaludVersionRepository` en el módulo de repositorios
- **Tipo**: backend-module
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/repositories/repositories.module.ts`, `apps/backend/src/application/turnos/turnos.module.ts`
- **Descripción**: Agregar el provider del nuevo repositorio en `repositories.module.ts` (binding del puerto al adaptador). Importar `RepositoriosModule` en `turnos.module.ts` si no está ya.
- **Acceptance criteria**:
  - [ ] El provider está registrado y se puede inyectar
  - [ ] `npm run start:dev` arranca sin errores
- **RBs**: (estructura)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): registrar FichaSaludVersionRepository como provider`
- **Notas**: seguir el patrón de los otros repositorios del módulo (e.g. `FichaSaludRepository`).

#### Task 1.18: Extender `AccionAuditoria` con `FICHA_COMPLETADA` y `FICHA_ACTUALIZADA`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts`
- **Descripción**: Agregar al enum `AccionAuditoria` los valores `FICHA_COMPLETADA = 'FICHA_COMPLETADA'` y `FICHA_ACTUALIZADA = 'FICHA_ACTUALIZADA'`.
- **Acceptance criteria**:
  - [ ] El enum compila sin errores
  - [ ] No se quitan valores existentes
  - [ ] Los consumers del enum (AuditoriaService, etc.) siguen funcionando
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): agregar acciones de auditoría FICHA_COMPLETADA y FICHA_ACTUALIZADA`
- **Notas**: si el enum vive en otro archivo (no en `auditoria.entity.ts`), ajustar la ruta. Verificar con grep.

#### Task 1.19: Helper `calcularDiffFicha` puro
- **Tipo**: backend-helper
- **Archivos**: `apps/backend/src/application/turnos/helpers/calcular-diff-ficha.helper.ts`, `apps/backend/src/application/turnos/helpers/calcular-diff-ficha.helper.spec.ts`
- **Descripción**: Crear helper puro (sin DI) que recibe dos objetos `{altura, peso, ...}` y retorna un array con los nombres de los campos modificados. Lógica: shallow equality por key, retornar solo las keys distintas. Casos: mismo payload → `[]`; cambio en `peso` → `['peso']`; cambios múltiples → `['peso', 'altura']`. Acompañar con spec completo.
- **Acceptance criteria**:
  - [ ] El spec pasa: 4+ casos (vacío, simple, múltiple, sin cambios)
  - [ ] El helper es 100% puro (sin imports de NestJS o TypeORM)
  - [ ] Coverage del helper = 100%
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): helper puro para calcular diff de campos de ficha`
- **Notas**: NO hacer deep diff. Solo shallow (un nivel). La ficha tiene campos planos y arrays de strings.

#### Task 1.20: DTO `HistorialFichaSaludItemDto`
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/historial-ficha-salud.dto.ts`
- **Descripción**: Crear DTO con: `version: number`, `versionId: number`, `createdAt: Date`, `createdBy: number | null`. Es un DTO de listado resumido (NO incluye `datosJson` para no exponer payload masivo en el resumen).
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] No expone `datosJson` ni campos clínicos
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): DTO resumido para historial de versiones`
- **Notas**: el response del endpoint será `HistorialFichaSaludItemDto[]`.

#### Task 1.21: DTO `DatosVersionFichaSaludDto`
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/datos-version-ficha-salud.dto.ts`
- **Descripción**: Crear DTO con: `version: number`, `createdAt: Date`, `datos: Record<string, unknown>`. Es el DTO de respuesta cuando el socio/nutricionista consulta una versión específica.
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] `datos` está tipado como `Record<string, unknown>` para máxima flexibilidad
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): DTO para datos completos de una versión`
- **Notas**: el controller deserializa `datosJson` (que se guardó como JSON string en DB) y lo expone como objeto.

#### Task 1.22: Use case `ListarHistorialFichaSaludSocioUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.ts`, `.../listar-historial-ficha-salud.use-case.spec.ts`
- **Descripción**: Implementar use case: (1) resolver socio por `userId`, (2) si no tiene ficha → `NotFoundError("No se encontraron fichas de salud")`, (3) `fichaSaludVersionRepository.findByFichaId(idFichaSalud)` ordenado DESC por `version`, (4) mapear a `HistorialFichaSaludItemDto[]`. Spec: socio sin ficha → 404; socio con 3 versiones → array de 3, ordenado DESC; cada item NO incluye `datosJson`.
- **Acceptance criteria**:
  - [ ] El use case compila sin errores
  - [ ] Spec pasa los 3 casos
  - [ ] Coverage del use case > 90%
- **RBs**: RB50
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): use case listar historial de versiones del socio`
- **Notas**: este es el use case para el socio. El del nutricionista es Task 1.24.

#### Task 1.23: Use case `ObtenerVersionFichaSaludSocioUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.ts`, `.../obtener-version-ficha-salud.use-case.spec.ts`
- **Descripción**: Implementar use case: (1) resolver socio, (2) si no tiene ficha → 404, (3) `fichaSaludVersionRepository.findByFichaIdAndVersion(idFichaSalud, n)`, (4) si no existe → `NotFoundError("Versión no encontrada")`, (5) retornar `DatosVersionFichaSaludDto` con `datos` parseado del JSON. Spec: versión existente → datos; inexistente (n=99 con 2 versiones) → 404; socio sin ficha → 404.
- **Acceptance criteria**:
  - [ ] El use case compila sin errores
  - [ ] Spec pasa los 3 casos
  - [ ] `datos` se deserializa correctamente (no se devuelve como string)
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): use case obtener una versión específica de ficha del socio`
- **Notas**: validar que `n` es un número positivo (e.g. `n < 1` → 404).

#### Task 1.24: Use case `ListarHistorialFichaSaludNutricionistaUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud-nutricionista.use-case.ts`, `.../listar-historial-ficha-salud-nutricionista.use-case.spec.ts`
- **Descripción**: Implementar use case para el endpoint nutricionista: (1) verificar que el nutricionista autenticado tiene turno previo con el socio (delegar a `GetFichaSaludPacienteUseCase` que ya tiene `hasTurnoVinculo` o replicar la lógica), (2) si no → `ForbiddenError("No tiene vínculo con este socio")`, (3) `fichaSaludVersionRepository.findByFichaId(socioId)` ordenado DESC, (4) mapear a DTO. Spec: nutricionista sin turno previo → 403; con turno previo → array; socio sin ficha → 404.
- **Acceptance criteria**:
  - [ ] El use case compila sin errores
  - [ ] Spec pasa los 3 casos
  - [ ] RB13 implementado correctamente
- **RBs**: RB13, RB50
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): use case historial de versiones para nutricionista (RB13)`
- **Notas**: investigar si la lógica de `hasTurnoVinculo` se puede reutilizar o si hay que replicarla. Si la respuesta es "reutilizar", el use case inyecta `GetFichaSaludPacienteUseCase` o el servicio que ya tiene esa lógica.

#### Task 1.25: Use case `ObtenerVersionFichaSaludNutricionistaUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud-nutricionista.use-case.ts`, `.../obtener-version-ficha-salud-nutricionista.use-case.spec.ts`
- **Descripción**: Análogo al Task 1.23 pero con la verificación de `hasTurnoVinculo` del Task 1.24. Misma firma `(nutricionistaId, socioId, n)`. Spec: 3 casos análogos.
- **Acceptance criteria**:
  - [ ] El use case compila sin errores
  - [ ] Spec pasa los 3 casos
- **RBs**: RB13, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): use case obtener versión para nutricionista (RB13)`

#### Task 1.26: Integrar auditoría en `UpsertFichaSaludSocioUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts`, `.../upsert-ficha-salud-socio.use-case.spec.ts`
- **Descripción**: Modificar el use case del Task 1.11 para agregar llamadas a `auditoriaService.registrar()` **dentro de la transacción, después del save**. Inyectar `AuditoriaService` en el constructor. Shape del metadata: para CREATE → `{version: 1, fichaSaludId, socioId, consentAt, resumen: {altura, peso, alergiasCount, patologiasCount}}` (sin datos clínicos sensibles como medicación, antecedentes). Para UPDATE → `{version: nuevaVersion, versionAnterior, fichaSaludId, socioId, antes: {altura, peso}, despues: {altura, peso}, camposModificados: calcularDiffFicha(...)}`. **NO** agregar notificaciones ni emails.
- **Acceptance criteria**:
  - [ ] Spec del Task 1.14 extendido con 4 casos: auditoría CREATE con shape seguro, auditoría UPDATE con antes/después, no se llama auditoría si la transacción falla, `camposModificados` se calcula con el helper
  - [ ] El spec pasa
  - [ ] El código NO llama a `notificacionesService` ni `emailService`
- **RBs**: RB33
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): integrar auditoría RB33 en upsert con shape seguro`
- **Notas**: el `metadata` se guarda en el campo `metadata` del `AuditoriaDto` (JSON libre), no en `antes_json`/`despues_json` directamente. Ajustar el `AuditoriaService.registrar()` para aceptar metadata rica, o usar el campo genérico.

#### Task 1.27: Extender tests de `UpsertFichaSaludSocioUseCase` con auditoría
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts`
- **Descripción**: Extender el spec del Task 1.14 con: (1) auditoría en CREATE: `auditoriaService.registrar` llamado 1 vez con `accion=FICHA_COMPLETADA`, metadata con shape seguro (sin medicación, sin antecedentes), `resumen` con counts. (2) auditoría en UPDATE: `auditoriaService.registrar` llamado con `accion=FICHA_ACTUALIZADA`, `camposModificados=['peso']` cuando solo cambia peso. (3) Si `auditoriaService.registrar` lanza, la transacción hace rollback (o el use case maneja gracefully — verificar patrón existente). (4) Si la versión `save` falla, NO se llama a auditoría.
- **Acceptance criteria**:
  - [ ] Los 4 casos pasan
  - [ ] Total de casos del spec ≥ 17 (los 13 del Task 1.14 + 4 de auditoría)
  - [ ] Coverage del use case > 90%
- **RBs**: RB33
- **Estimado**: M
- **Commit message**: `test(ficha-salud): spec auditoría RB33 en upsert con shape seguro`
- **Notas**: agregar `mockAuditoriaService` al `Test.createTestingModule`.

#### Task 1.28: Endpoints de historial en `turnos.controller.ts` (socio)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- **Descripción**: Agregar al controller existente 2 endpoints nuevos para socio: (1) `GET /turnos/socio/ficha-salud/historial` con `@Rol(SOCIO)` que invoca `ListarHistorialFichaSaludSocioUseCase`. (2) `GET /turnos/socio/ficha-salud/version/:n` con `@Rol(SOCIO)` (validar `:n` con `ParseIntPipe`) que invoca `ObtenerVersionFichaSaludSocioUseCase`. **NO** modificar el endpoint `GET /turnos/socio/ficha-salud` existente (sigue intacto).
- **Acceptance criteria**:
  - [ ] Los 2 endpoints existen
  - [ ] Cada uno tiene `@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)` + `@Rol(SOCIO)`
  - [ ] El response shape coincide con los DTOs (Task 1.20, 1.21)
- **RBs**: RB16, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): endpoints de historial y versión para socio`
- **Notas**: mantener consistencia con paths existentes (`/turnos/socio/...`).

#### Task 1.29: Endpoints de historial en `turnos.controller.ts` (nutricionista)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- **Descripción**: Agregar 2 endpoints nuevos para nutricionista: (1) `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial` con `@Rol(NUTRICIONISTA)` + `NutricionistaOwnershipGuard` que invoca `ListarHistorialFichaSaludNutricionistaUseCase`. (2) `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/version/:n` con la misma protección que invoca `ObtenerVersionFichaSaludNutricionistaUseCase`.
- **Acceptance criteria**:
  - [ ] Los 2 endpoints existen
  - [ ] Cada uno tiene `@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)` + `@Rol(NUTRICIONISTA)` + `NutricionistaOwnershipGuard`
  - [ ] El response shape coincide con los DTOs
- **RBs**: RB13, RB16, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): endpoints de historial y versión para nutricionista (RB13)`
- **Notas**: el path debe coincidir con el patrón del endpoint `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud` existente.

#### Task 1.30: Registrar nuevos use cases en `turnos.module.ts`
- **Tipo**: backend-module
- **Archivos**: `apps/backend/src/application/turnos/turnos.module.ts`, `apps/backend/src/application/turnos/use-cases/index.ts`
- **Descripción**: Agregar los 4 use cases nuevos (Tasks 1.22-1.25) al array de `providers` de `turnos.module.ts` y exportarlos desde el `index.ts` del directorio de use cases.
- **Acceptance criteria**:
  - [ ] Los 4 providers están registrados
  - [ ] El módulo compila sin errores
  - [ ] `npm run start:dev` arranca sin errores
- **RBs**: (estructura)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): registrar use cases de historial en el módulo`

#### Task 1.31: Test de integración RB16 — RECEPCIONISTA recibe 403
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/presentation/http/controllers/turnos.controller.spec.ts` (nuevo) o extendido
- **Descripción**: Crear o extender el spec del controller con: (1) `GET /turnos/socio/ficha-salud` con `Rol.RECEPCIONISTA` → 403. (2) `GET /turnos/socio/ficha-salud/historial` con `Rol.RECEPCIONISTA` → 403. (3) `GET /turnos/socio/ficha-salud/version/1` con `Rol.RECEPCIONISTA` → 403. (4) `GET /turnos/profesional/:n/pacientes/:s/ficha-salud` con `Rol.RECEPCIONISTA` → 403. Si el spec del controller no existe, crearlo con un mínimo de mocking (`@nestjs/testing`).
- **Acceptance criteria**:
  - [ ] Los 4 casos pasan
  - [ ] El spec no rompe ningún test existente del controller
- **RBs**: RB16
- **Estimado**: M
- **Commit message**: `test(ficha-salud): integración de roles RB16 con RECEPCIONISTA`
- **Notas**: usar `Test.createTestingModule` con `JwtAuthGuard` y `RolesGuard` mockeados, o probar a nivel de controller con un `appController.getHttpServer()`.

### PR 1b — Tests requeridos

- `listar-historial-ficha-salud.use-case.spec.ts` (Task 1.22)
- `obtener-version-ficha-salud.use-case.spec.ts` (Task 1.23)
- `listar-historial-ficha-salud-nutricionista.use-case.spec.ts` (Task 1.24)
- `obtener-version-ficha-salud-nutricionista.use-case.spec.ts` (Task 1.25)
- `calcular-diff-ficha.helper.spec.ts` (Task 1.19)
- `upsert-ficha-salud-socio.use-case.spec.ts` extendido (Task 1.27)
- `turnos.controller.spec.ts` con RB16 (Task 1.31)

### PR 1b — Acceptance criteria (overall)

- [ ] Un socio autenticado puede hacer `GET /turnos/socio/ficha-salud/historial` y ver la lista de versiones
- [ ] Un socio autenticado puede hacer `GET /turnos/socio/ficha-salud/version/1` y ver los datos completos
- [ ] Un nutricionista con turno previo puede ver el historial de su paciente
- [ ] Un nutricionista sin turno previo recibe 403
- [ ] RECEPCIONISTA recibe 403 en los 4 endpoints de ficha
- [ ] Cada upsert registra una fila en `auditoria` con `accion=FICHA_COMPLETADA` o `FICHA_ACTUALIZADA`
- [ ] El `metadata` de auditoría en CREATE no contiene `medicacion`, `antecedentes`, ni `cirugias`
- [ ] El `metadata` de auditoría en UPDATE contiene `camposModificados` con la diff correcta
- [ ] `npm run build` y `npm run lint` pasan en backend
- [ ] Coverage del módulo de turnos > 80%

### PR 1b — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. PR 1a sigue funcionando: el upsert sigue operativo, solo se pierden los endpoints de historial y la auditoría
3. Los datos de auditoría ya escritos quedan en la DB (limpieza opcional con query manual)

---

## PR 2 — Frontend (~600 líneas netas)

**Branch**: `feat/ficha-salud-pr2-frontend`
**Target**: `main` (después de PR 1b mergeado)
**Depends on**: PR 1b (necesita los endpoints `/historial` y `/version/:n`)
**Estimated changed lines**: ~600 (límite 800)
**RBs en alcance**: RB15, RB42, RB44 (UI)

### Goal

Construir la UI completa de la ficha de salud del socio: integrar el banner "Última edición", la sección de consentimiento (solo primera vez), el modal de consentimiento RGPD, el modal de historial de versiones con vista detallada, y un schema Zod con las validaciones correctas. **NO** incluye emails ni toasts de éxito que disparen emails.

### Tasks

#### Task 2.1: Tipos TypeScript del frontend
- **Tipo**: frontend-types
- **Archivos**: `apps/frontend/src/types/ficha-salud.ts`
- **Descripción**: Crear tipos espejo de los DTOs del backend: `FichaSaludSocio` (con `completada`, `completadaAt`, `actualizadaAt`, `consentAt`, `versionActual`), `HistorialItem` (con `version`, `versionId`, `createdAt`, `createdBy`), `DatosVersion` (con `version`, `createdAt`, `datos`). Importar `NIVELES_ACTIVIDAD_FISICA` y `FRECUENCIAS_COMIDAS` desde `@nutrifit/shared`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] Los tipos son consistentes con la respuesta del backend
  - [ ] `tsc --noEmit` no reporta errores en `apps/frontend/`
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): tipos TypeScript del frontend`
- **Notas**: el tipo de `datos` puede ser `Record<string, unknown>` o un tipo discriminado si se quiere. Empezar con `Record<string, unknown>` y refinar si es necesario.

#### Task 2.2: Schema Zod de validación
- **Tipo**: frontend-validation
- **Archivos**: `apps/frontend/src/schemas/ficha-salud.schema.ts`
- **Descripción**: Crear el schema Zod para el formulario: `altura` entre 100-250 cm, `peso` entre 20-300 kg (rango frontend, aunque backend acepte hasta 500), `nivelActividadFisica` enum, `objetivoPersonal` 1-500 chars, `consentimiento` boolean opcional. Mensajes de error en español.
- **Acceptance criteria**:
  - [ ] El schema compila sin errores
  - [ ] `altura: 50` falla con mensaje "La altura debe ser entre 1.00 y 2.50 m"
  - [ ] `peso: 15` falla con mensaje "El peso debe estar entre 20 y 300 kg"
  - [ ] `peso: 400` falla con mensaje "El peso debe estar entre 20 y 300 kg"
  - [ ] `nivelActividadFisica: 'SUPER_INTENSO'` falla con mensaje de enum inválido
  - [ ] `consentimiento: false` en modo creación se valida con `.superRefine()` o validación externa
- **RBs**: RB44, (validación)
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): schema Zod con validaciones estrictas`
- **Notas**: el proyecto actual no usa Zod extensivamente; introducirlo solo en este formulario. NO migrar otros formularios.

#### Task 2.3: Helper de formato de fechas
- **Tipo**: frontend-helper
- **Archivos**: `apps/frontend/src/lib/fechas.ts`
- **Descripción**: Crear o extender `formatFechaCorta(fecha: Date | null | undefined): string` que retorna `"DD/MM/YYYY HH:mm"` o `"desconocida"` si la fecha es null. Usar la API `Intl.DateTimeFormat` o una implementación manual.
- **Acceptance criteria**:
  - [ ] `formatFechaCorta(new Date('2026-06-03T14:30:00Z'))` retorna `"03/06/2026 11:30"` (o el formato local equivalente)
  - [ ] `formatFechaCorta(null)` retorna `"desconocida"`
  - [ ] El helper es testeable (puro)
- **RBs**: (UI)
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): helper de formato de fechas cortas`
- **Notas**: ajustar el formato según la convención del proyecto (e.g. si ya hay un helper existente, extenderlo en vez de crear uno nuevo).

#### Task 2.4: Hook `useObtenerHistorialFicha` (React Query)
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useObtenerHistorialFicha.ts`
- **Descripción**: Crear hook con `useQuery` que hace GET a `/turnos/socio/ficha-salud/historial`. `queryKey: ['ficha-salud', 'historial']`. `enabled: false` (solo fetchea al abrir el modal). `staleTime: 60_000`.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] `useObtenerHistorialFicha()` retorna `{data, isLoading, isError, refetch}` sin ejecutar la query hasta que se llame `refetch()` o se cambie `enabled` a `true`
  - [ ] El tipo de retorno es `HistorialItem[]`
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): hook useObtenerHistorialFicha con React Query`
- **Notas**: usar `solicitudApi` (utility existente) y tipar la respuesta con `HistorialItem[]`.

#### Task 2.5: Hook `useObtenerVersionFicha` (React Query)
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useObtenerVersionFicha.ts`
- **Descripción**: Crear hook con `useQuery` parametrizado por `n: number | null`. Hace GET a `/turnos/socio/ficha-salud/version/${n}`. `enabled: n != null`. `staleTime: 5 * 60_000`.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] `useObtenerVersionFicha(null)` no ejecuta la query
  - [ ] `useObtenerVersionFicha(1)` ejecuta la query
  - [ ] El tipo de retorno es `DatosVersion`
- **RBs**: RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): hook useObtenerVersionFicha con React Query`

#### Task 2.6: Componente `FichaSaludBannerUltimaEdicion`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ficha-salud/FichaSaludBannerUltimaEdicion.tsx`
- **Descripción**: Componente presentacional que muestra `"Última edición: 03/06/2026 14:30"` con fondo ámbar suave. Props: `fecha: Date | null`. Si `fecha` es null, mostrar `"Última edición: desconocida"`. Atributos ARIA: `role="status"`, `aria-live="polite"`, `aria-label="Fecha de la última edición"`.
- **Acceptance criteria**:
  - [ ] Renderiza correctamente con fecha válida
  - [ ] Renderiza "desconocida" con fecha null
  - [ ] Atributos ARIA presentes
  - [ ] Contraste de color AA (verificar con axe-core o similar)
- **RBs**: RB15, RB42, RB50
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): banner de última edición con accesibilidad`
- **Notas**: usar el componente `Card` o `Alert` de shadcn/ui si existe. Si no, `<div>` con clases Tailwind.

#### Task 2.7: Componente `SeccionConsentimiento` (dentro del wizard)
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ficha-salud/SeccionConsentimiento.tsx`
- **Descripción**: Componente con: Checkbox de shadcn/ui con label "Acepto almacenar mi información de salud conforme a la política de privacidad." y link "Ver detalle" que llama a `onAbrirModalRGPD`. Props: `checked`, `onChange`, `disabled`, `required`, `onAbrirModalRGPD`. Si `disabled`, mostrar "Consentimiento expresado el DD/MM/YYYY" con la fecha. Asterisco en el label si `required`.
- **Acceptance criteria**:
  - [ ] En modo creación: checkbox editable, label con asterisco
  - [ ] En modo edición: checkbox disabled, label con fecha de `consentAt`
  - [ ] Click en "Ver detalle" llama a `onAbrirModalRGPD`
  - [ ] Atributos ARIA: `aria-required` si `required`, `aria-disabled` si `disabled`
- **RBs**: RB44
- **Estimado**: S
- **Commit message**: `feat(ficha-salud): sección de consentimiento con checkbox y link RGPD`
- **Notas`: usar `<Checkbox>` de shadcn/ui. Si no existe, instalarlo.

#### Task 2.8: Componente `FichaSaludConsentimientoModal`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.tsx`
- **Descripción**: Modal shadcn `<Dialog>` con contenido RGPD en lenguaje claro: 3-4 párrafos explicando qué se almacena, quién accede (socio, nutricionistas con turno, no RECEPCIONISTA), cómo ejercer derechos ARCO. Botón "Aceptar" que llama a `onAceptar` y cierra. Props: `open`, `onClose`, `onAceptar`, `fechaConsentimiento?: Date`.
- **Acceptance criteria**:
  - [ ] El modal abre y cierra correctamente
  - [ ] El botón "Aceptar" llama a `onAceptar` y luego a `onClose`
  - [ ] Si `fechaConsentimiento` está presente, mostrar "Expresaste tu consentimiento el DD/MM/YYYY"
  - [ ] Atributos ARIA: `aria-labelledby` apuntando al título, `aria-describedby` al cuerpo
  - [ ] Focus trap funcional (lo provee shadcn)
- **RBs**: RB44
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): modal de consentimiento RGPD con texto legal claro`
- **Notas`: redactar el texto RGPD en español, 3-4 párrafos, ~200 palabras. No usar lenguaje legal denso.

#### Task 2.9: Componente `FichaSaludHistorialModal`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.tsx`
- **Descripción**: Modal shadcn `<Dialog>` con lista de versiones a la izquierda y detalle a la derecha (split) o en panel anidado. Lista con `<ScrollArea>` de shadcn. Click en un item llama a `onSeleccionarVersion(n)`. Botón "Cerrar". Props: `open`, `onClose`, `versiones`, `cargando`, `onSeleccionarVersion`, `versionSeleccionada`.
- **Acceptance criteria**:
  - [ ] El modal abre y cierra correctamente
  - [ ] La lista renderiza `versiones` ordenadas (DESC)
  - [ ] Click en un item llama a `onSeleccionarVersion`
  - [ ] Navegación con flechas y Enter funciona
  - [ ] `aria-activedescendant` o `aria-selected` según corresponda
- **RBs**: RB50
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): modal de historial con lista de versiones navegable`
- **Notas`: usar `role="dialog"` o shadcn Dialog que ya lo provee.

#### Task 2.10: Componente `FichaSaludVersionDetalle`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ficha-salud/FichaSaludVersionDetalle.tsx`
- **Descripción`: Componente que renderiza los mismos campos que el wizard pero todos `disabled` (read-only) envueltos en un `<fieldset disabled>`. Banner superior: "Versión N — DD/MM/YYYY". Props: `version`, `datos`, `cargando`.
- **Acceptance criteria**:
  - [ ] Renderiza todos los campos con los valores de `datos`
  - [ ] Todos los inputs están disabled
  - [ ] Banner muestra "Versión N — fecha"
  - [ ] Si `cargando`, mostrar `<Skeleton>` de shadcn
- **RBs**: RB50
- **Estimado**: M
- **Commit message**: `feat(ficha-salud): vista detallada de una versión en modo lectura`
- **Notas`: si el wizard actual tiene sub-componentes por sección (Antropometria, Habitos, etc.), reutilizarlos pasándoles `disabled={true}`.

#### Task 2.11: Modificar página `FichaSaludSocio` para integrar todo
- **Tipo**: frontend-page
- **Archivos**: `apps/frontend/src/pages/FichaSaludSocio.tsx`
- **Descripción`: Refactorizar la página para: (1) usar los nuevos tipos (Task 2.1), (2) integrar el schema Zod (Task 2.2) en el submit, (3) mostrar el banner de última edición (Task 2.6) cuando `ficha.completada === true`, (4) integrar la sección de consentimiento (Task 2.7) — requerida en creación, deshabilitada en edición, (5) abrir el modal RGPD (Task 2.8) al click en "Ver detalle", (6) abrir el modal de historial (Task 2.9) al click en "Ver historial", (7) renderizar `FichaSaludVersionDetalle` (Task 2.10) cuando se selecciona una versión, (8) invalidar `['ficha-salud', 'historial']` tras upsert exitoso, (9) cambiar mensajes de éxito/error a "Ficha de salud completada. Ya podés reservar turnos." (creación) o "Ficha actualizada correctamente." (edición). **NO** disparar emails ni toasts de email.
- **Acceptance criteria**:
  - [ ] La página compila sin errores
  - [ ] Modo creación: checkbox de consentimiento bloquea el submit hasta que esté tildado
  - [ ] Modo edición: checkbox de consentimiento disabled con fecha
  - [ ] Banner "Última edición" aparece cuando `completada=true` y `actualizadaAt` está presente
  - [ ] Botón "Ver historial" abre el modal y carga las versiones
  - [ ] Click en una versión carga y muestra el detalle
  - [ ] Errores de validación Zod se muestran inline en español
  - [ ] Toast de éxito (sin email) al guardar
  - [ ] `<main role="main" aria-labelledby="titulo-ficha">` y `h1` con id `titulo-ficha`
  - [ ] Errores con `aria-live="assertive"`, éxitos con `aria-live="polite"`
- **RBs**: RB15, RB42, RB44, RB50
- **Estimado**: L
- **Commit message**: `feat(ficha-salud): integrar banner, consentimiento, modal de historial y validación en la página`
- **Notas`: este es el task más grande del PR. Si se acerca a 250 líneas, partirlo en dos: (a) integración de banner + consentimiento, (b) integración del modal de historial. ⚠️ Monitorear el diff.

#### Task 2.12: Tests de `FichaSaludSocio` (página)
- **Tipo**: frontend-test
- **Archivos**: `apps/frontend/src/pages/FichaSaludSocio.test.tsx`
- **Descripción`: Spec de Vitest + Testing Library con casos: (1) renderiza en modo creación (sin ficha), (2) renderiza en modo edición (con ficha mock), (3) modal consentimiento se abre al click "Ver detalle", (4) checkbox consentimiento bloquea submit en creación, (5) checkbox consentimiento no bloquea submit en edición (disabled), (6) validación cliente: altura "0.5" muestra error, (7) validación cliente: peso "15" muestra error, (8) banner "Última edición" visible cuando `actualizadaAt` está presente, (9) click "Ver historial" abre modal, (10) toast éxito al guardar.
- **Acceptance criteria**:
  - [ ] Los 10 casos pasan
  - [ ] `npm run test -- FichaSaludSocio` muestra verde
  - [ ] Coverage de la página > 80%
- **RBs**: RB15, RB42, RB44, RB50
- **Estimado**: L
- **Commit message**: `test(ficha-salud): spec de FichaSaludSocio con consentimiento, banner y validación`
- **Notas`: usar `vi.mock` para `solicitudApi` y `useAuth`. Mockear `useObtenerHistorialFicha` y `useObtenerVersionFicha` con `vi.mocked`.

#### Task 2.13: Tests de `FichaSaludConsentimientoModal`
- **Tipo**: frontend-test
- **Archivos**: `apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.test.tsx`
- **Descripción`: Spec con casos: (1) renderiza texto RGPD, (2) botón "Aceptar" llama a `onAceptar` y cierra, (3) focus trap funcional, (4) `aria-labelledby` apunta al título.
- **Acceptance criteria**:
  - [ ] Los 4 casos pasan
- **RBs**: RB44
- **Estimado**: M
- **Commit message**: `test(ficha-salud): spec del modal de consentimiento con accesibilidad`
- **Notas`: Testing Library provee helpers para `getByRole('dialog')`.

#### Task 2.14: Tests de `FichaSaludHistorialModal`
- **Tipo`: frontend-test
- **Archivos`: `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.test.tsx`
- **Descripción`: Spec con casos: (1) lista versiones mockeadas, (2) click en versión llama a `onSeleccionarVersion`, (3) carga estado de `useObtenerVersionFicha`, (4) renderiza `FichaSaludVersionDetalle` con datos read-only.
- **Acceptance criteria`:
  - [ ] Los 4 casos pasan
- **RBs`: RB50
- **Estimado`: M
- **Commit message`: `test(ficha-salud): spec del modal de historial con selección de versión`
- **Notas`: mockear `useObtenerVersionFicha` con `vi.mocked` para controlar el estado de carga.

#### Task 2.15: Tests de `FichaSaludVersionDetalle`
- **Tipo`: frontend-test
- **Archivos`: `apps/frontend/src/components/ficha-salud/FichaSaludVersionDetalle.test.tsx`
- **Descripción`: Spec con casos: (1) renderiza todos los campos como disabled, (2) muestra banner "Versión N — fecha", (3) muestra `<Skeleton>` cuando `cargando=true`.
- **Acceptance criteria`:
  - [ ] Los 3 casos pasan
- **RBs`: RB50
- **Estimado`: S
- **Commit message`: `test(ficha-salud): spec del detalle de versión en modo lectura`

### PR 2 — Tests requeridos

- `FichaSaludSocio.test.tsx` (Task 2.12)
- `FichaSaludConsentimientoModal.test.tsx` (Task 2.13)
- `FichaSaludHistorialModal.test.tsx` (Task 2.14)
- `FichaSaludVersionDetalle.test.tsx` (Task 2.15)

### PR 2 — Acceptance criteria (overall)

- [ ] Un socio sin ficha ve el banner ámbar "Todavía no tenés ficha cargada"
- [ ] Un socio sin ficha no puede hacer submit sin tildar el checkbox de consentimiento
- [ ] Al tildar consentimiento y hacer submit, la ficha se crea y aparece el banner "Última edición"
- [ ] Un socio con ficha ve el banner "Última edición: 03/06/2026 14:30"
- [ ] Un socio con ficha puede abrir el modal de historial y ver la lista de versiones
- [ ] Click en una versión muestra los datos read-only con el banner "Versión N — fecha"
- [ ] Validación cliente: altura "0.5" muestra error en español
- [ ] Validación cliente: peso "15" o "400" muestra error en español
- [ ] Navegación con teclado funciona en todos los modales
- [ ] Screen reader anuncia los banners y errores correctamente
- [ ] `npm run build` y `npm run lint` pasan en frontend
- [ ] Coverage de la página y modales > 80%

### PR 2 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. El frontend vuelve a la versión anterior, los endpoints de backend (PR 1a y 1b) siguen funcionando
3. Los datos en la DB no se tocan (no hay migración nueva en este PR)

---

## PR 3 — E2E + Polish (~200 líneas netas)

**Branch**: `feat/ficha-salud-pr3-e2e`
**Target**: `main` (después de PR 2 mergeado)
**Depends on`: PR 2
**Estimated changed lines`: ~200 (límite 800)
**RBs en alcance`: RB14, RB16, RB42, RB50 (verificación end-to-end)

### Goal

Verificar el flujo completo con tests E2E de Playwright (crear ficha → reservar turno, editar ficha, ver historial, RB16 RECEPCIONISTA) y aplicar ajustes finales de UX detectados durante la integración. **NO** incluye emails ni tests de email.

### Tasks

#### Task 3.1: E2E — Crear ficha y reservar turno
- **Tipo`: e2e
- **Archivos`: `e2e/ficha-salud/crear-ficha.spec.ts`
- **Descripción`: Test Playwright que: (1) login como socio sin ficha, (2) navegar a `/mi-ficha-salud`, (3) completar el wizard con datos válidos, (4) tildar consentimiento, (5) submit, (6) verificar banner "Última edición" aparece, (7) navegar a reservar turno, (8) verificar que la reserva procede (no 400 de RB14).
- **Acceptance criteria`:
  - [ ] El test pasa contra backend y frontend levantados
  - [ ] Cubre el flujo completo RB14 end-to-end
- **RBs`: RB14
- **Estimado`: M
- **Commit message`: `test(e2e): flujo socio crea ficha y reserva turno (RB14)`
- **Notas`: usar el helper de auth Playwright que ya exista en el proyecto.

#### Task 3.2: E2E — Editar ficha y ver historial actualizado
- **Tipo`: e2e
- **Archivos`: `e2e/ficha-salud/editar-ficha.spec.ts`
- **Descripción`: Test Playwright que: (1) login como socio con ficha existente, (2) navegar a `/mi-ficha-salud`, (3) cambiar el peso, (4) submit, (5) verificar que el banner "Última edición" refleja la nueva fecha, (6) abrir modal de historial, (7) verificar que la lista muestra al menos 2 versiones.
- **Acceptance criteria`:
  - [ ] El test pasa
  - [ ] Cubre RB42 y RB50 end-to-end
- **RBs`: RB42, RB50
- **Estimado`: M
- **Commit message`: `test(e2e): flujo socio edita ficha y ve historial actualizado (RB42, RB50)`

#### Task 3.3: E2E — RB16 RECEPCIONISTA recibe 403
- **Tipo`: e2e
- **Archivos`: `e2e/ficha-salud/rbac-roles.spec.ts`
- **Descripción`: Test Playwright que: (1) login como RECEPCIONISTA, (2) intentar navegar a un endpoint de ficha-salud directamente, (3) verificar 403. Alternativa: hacer request HTTP directo desde Playwright con el token de RECEPCIONISTA y verificar 403 en cada endpoint. Si la UI no expone rutas de RECEPCIONISTA, hacerlo por API.
- **Acceptance criteria`:
  - [ ] El test pasa
  - [ ] Cubre RB16 end-to-end
- **RBs`: RB16
- **Estimado`: S
- **Commit message`: `test(e2e): RB16 RECEPCIONISTA sin acceso a ficha de salud`
- **Notas`: si Playwright no tiene un helper para obtener token de RECEPCIONISTA, agregarlo a `e2e/helpers/`.

#### Task 3.4: E2E — Nutricionista ve historial de su paciente
- **Tipo`: e2e
- **Archivos`: `e2e/ficha-salud/historial-nutricionista.spec.ts`
- **Descripción`: Test Playwright que: (1) login como nutricionista con turno previo con un socio, (2) navegar a la pantalla del paciente, (3) abrir el modal/panel de historial, (4) verificar que ve las versiones. (5) login como otro nutricionista SIN turno previo, (6) intentar ver el mismo historial, (7) verificar 403.
- **Acceptance criteria`:
  - [ ] El test pasa
  - [ ] Cubre RB13 y RB50 end-to-end
- **RBs`: RB13, RB50
- **Estimado`: S
- **Commit message`: `test(e2e): nutricionista ve historial de paciente con turno previo (RB13)`
- **Notas`: si no hay UI para que el nutricionista vea el historial, este test es solo API. Documentar.

#### Task 3.5: Polish de UX en `FichaSaludSocio`
- **Tipo`: frontend-polish
- **Archivos`: `apps/frontend/src/pages/FichaSaludSocio.tsx`, componentes varios
- **Descripción`: Ajustes menores de UX detectados durante la integración con E2E: (1) tooltips en campos complejos, (2) mejorar mensajes de error Zod para que sean más accionables, (3) ajustar animaciones de modal (fade in/out), (4) verificar que el focus se restaura al cerrar modales, (5) polish visual de los banners. Cada ajuste debe ser un cambio pequeño y verificable.
- **Acceptance criteria`:
  - [ ] Los 4 flujos E2E (Tasks 3.1-3.4) siguen pasando tras los ajustes
  - [ ] No se introducen regresiones en los tests unitarios
  - [ ] El tamaño de este PR no excede 800 líneas (monitorear `git diff --stat`)
- **RBs`: (UX)
- **Estimado`: S
- **Commit message`: `polish(ficha-salud): ajustes de UX detectados durante integración E2E`
- **Notas`: este task es catch-all. Si crece mucho, partirlo en polish-1 (copy) y polish-2 (animaciones).

#### Task 3.6: Verificación final de acceptance criteria
- **Tipo`: docs
- **Archivos`: N/A (checklist en PR description)
- **Descripción`: Antes de mergear PR 3, verificar que los 22 acceptance criteria del design §15 están cumplidos. Crear un checklist en la descripción del PR que mapee cada AC a su test (unit, integration, e2e).
- **Acceptance criteria`:
  - [ ] AC-01 a AC-22 verificados con tests específicos
  - [ ] El PR description incluye el checklist completo
- **RBs`: (todos)
- **Estimado`: S
- **Commit message`: N/A (va en la descripción del PR, no en código)
- **Notas`: este task es de proceso, no genera código.

#### Task 3.7: Documentación del feature en README
- **Tipo`: docs
- **Archivos`: `apps/frontend/src/pages/ficha-salud.README.md` o agregar a `apps/frontend/AGENTS.md`
- **Descripción`: Documentar brevemente el flujo de ficha-salud para futuros devs: endpoints disponibles, shape de respuestas, validaciones Zod, RBs satisfechos. NO crear archivos innecesarios; preferir agregar a un AGENTS.md existente.
- **Acceptance criteria`:
  - [ ] La documentación está en español
  - [ ] Menciona los 4 endpoints nuevos
  - [ ] Menciona los RBs satisfechos (RB14, RB42, RB44, RB50)
- **RBs`: (docs)
- **Estimado`: S
- **Commit message`: `docs(ficha-salud): documentar flujo y endpoints para futuros devs`

### PR 3 — Tests requeridos

- `e2e/ficha-salud/crear-ficha.spec.ts` (Task 3.1)
- `e2e/ficha-salud/editar-ficha.spec.ts` (Task 3.2)
- `e2e/ficha-salud/rbac-roles.spec.ts` (Task 3.3)
- `e2e/ficha-salud/historial-nutricionista.spec.ts` (Task 3.4)

### PR 3 — Acceptance criteria (overall)

- [ ] Los 4 tests E2E pasan contra backend y frontend levantados
- [ ] Los 22 AC del design §15 están verificados y mapeados a tests
- [ ] El flujo completo socio (crear ficha → reservar turno) funciona end-to-end
- [ ] El flujo completo nutricionista (ver historial de paciente) funciona end-to-end
- [ ] RECEPCIONISTA no puede acceder a ningún endpoint de ficha
- [ ] El Polish de UX no introduce regresiones
- [ ] La documentación del feature está actualizada
- [ ] `npm run build` y `npm run lint` pasan en ambos apps
- [ ] `npm run test` pasa en backend y frontend
- [ ] `npm run e2e` pasa

### PR 3 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. PR 1a, 1b y 2 siguen funcionando
3. Los tests E2E no se ejecutan, pero el feature sigue operativo

---

## Chain strategy: stacked-to-main

```
PR 1a (datos + RB14 + RB44) → merge main → historia base sólida
PR 1b (historial + audit)   → merge main → backend cerrado
PR 2  (frontend completo)   → merge main → UX completa
PR 3  (E2E + polish)        → merge main → feature ship-ready
```

Cada PR se mergea **INDEPENDIENTEMENTE** a `main`. No hay rama de integración.

- PR 1b se basa en `main` DESPUÉS de que PR 1a mergeó.
- PR 2 se basa en `main` DESPUÉS de que PR 1b mergeó.
- PR 3 se basa en `main` DESPUÉS de que PR 2 mergeó.

Si un PR bloquea al siguiente, se reabre y se ajusta sin afectar los anteriores.

---

## Total scope

| PR | Líneas netas | Acumulado | Tamaño budget | Estado |
|---|---|---|---|---|
| PR 1a | ~500 | 500 | 800 | OK |
| PR 1b | ~300 | 800 | 800 | OK |
| PR 2 | ~600 | 1400 | 800 | OK |
| PR 3 | ~200 | 1600 | 800 | OK |

---

## Review Workload Forecast

- **Total**: ~1600 líneas en 4 PRs
- **Cada PR ≤ 800 líneas**: Sí
- **Riesgo de regresión cross-PR**: Bajo (cada PR focalizado en una capa)
- **Riesgo de datos**: Bajo (la migración es aditiva, el backfill es conservador)
- **Chained PRs recomendados**: Sí
- **Decisión necesaria antes de apply**: No (decidido por el usuario 2026-06-03)

---

## Out of scope (recordatorio)

- ❌ RB15 badge / "Ficha completada hace X" banner en pantallas de nutricionista (`TurnosProfesional.tsx`, `ConsultaProfesionalPage.tsx`)
- ❌ Notificaciones a nutricionistas vinculados (ni in-app ni email)
- ❌ **Emails de `FICHA_COMPLETADA` / `FICHA_ACTUALIZADA`** (decidido 2026-06-03)
- ❌ `TipoNotificacion.FICHA_COMPLETADA` / `FICHA_ACTUALIZADA` en el enum compartido
- ❌ Integración con `NotificacionesService.crear()` en `UpsertFichaSaludSocioUseCase`
- ❌ EmailService calls de cualquier tipo
- ❌ Notificación events de cualquier tipo para este change
- ❌ Rate-limiting de versiones
- ❌ Archivado/purgado de versiones viejas
- ❌ Refactor de `FrecuenciaComidas` a códigos (queda como strings libres en esta iteración)
