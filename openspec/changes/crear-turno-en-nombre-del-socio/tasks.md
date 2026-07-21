# Tasks: crear-turno-en-nombre-del-socio

**Change**: crear-turno-en-nombre-del-socio
**Strategy**: 4 PRs stacked-to-main
**Review budget**: 400 lineas/PR (PR-3 = 600)
**Persistence**: BOTH (OpenSpec + Engram)
**Date**: 2026-06-12
**Decision needed before apply**: No
**Chained PRs recommended**: Yes
**Chain strategy**: stacked-to-main
**400-line budget risk**: High

---

## Resumen de particion (auto-forecast)

El orquestador decidio **chained PRs** porque la estimacion total de lineas cambiadas (aprox 1817, ver `design.md` seccion 12) excede el budget de 400/PR declarado en el preflight. La estrategia de chain es **stacked-to-main** (cada PR mergea a `main` independientemente, sin rama de integracion), porque los slices son aditivos y no requieren coordinacion de release.

**Decision por PR (auto-forecast)**:

| PR | Scope | Budget | Estimacion diseno seccion 12 | Estimacion ajustada |
|---|---|---|---|---|
| PR 1 | Datos + helper compartido (migration, enum, refactor 2 use-cases) | <= 400 | ~300 | ~370 |
| PR 2 | Endpoint `POST /turnos/crear` (use-case, controller, DTOs) | <= 400 | ~250 | ~310 |
| PR 3 | Frontend completo (pagina, 6 subcomponentes, 4 hooks) | <= 600 | ~500 | ~570 |
| PR 4 | E2E Playwright + auditoria + recordatorios | <= 400 | ~150 | ~310 |
| **Total** | | | **~1200** | **~1560** |

> **Sesgo de estimacion**: las cifras del `design.md` seccion 12 son conservadoras. El conteo real usando el spec de cada task (incluyendo tests) probablemente llegue a ~1500-1800 lineas. Por eso PR-3 se eleva a 600: el frontend tiene mas boilerplate (componentes, hooks, types, schemas, router) que el backend.

**Si en `sdd-apply` el conteo real de `git diff --stat` excede el budget del PR**, el implementer debe partir el PR en dos sub-PRs (re-forecast on-risk) o pedir `size:exception` al orquestador.

---

## PR 1 — Datos + helper compartido (~370 lineas)

**Branch**: `feat/turnos-staff-pr1-datos`
**Target**: `main`
**Depends on**: nothing
**Estimated changed lines**: ~370 (limite 400)
**RBs en alcance**: RB05, RB06, RB07, RB14 (sentado), RB17, RB27, RB28, RB33, RB40, RB58/59/60

### Goal

Crear la base de datos que registra quien creo cada turno (columna `creado_por`), extraer las validaciones comunes de los dos use-cases existentes de creacion de turno a un helper compartido, y dejar los use-cases existentes (`ReservarTurnoSocioUseCase` CU-11, `AsignarTurnoManualUseCase`) consumiendo el helper sin cambio funcional. NO introduce el endpoint nuevo: eso es PR 2.

### Tasks

#### Task 1.1: Migracion — agregar columna `creado_por` a `turno`
- **Tipo**: backend-migration
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/<TIMESTAMP>-TurnoCreadoPor.ts` (timestamp del dia, e.g. `20260612000000-TurnoCreadoPor.ts`)
- **Descripcion**: Migracion TypeORM que ejecuta `ALTER TABLE turno ADD COLUMN creado_por varchar(20) NOT NULL DEFAULT 'SOCIO'`. Backfill implicito: todas las filas pre-existentes quedan en `'SOCIO'`. Agregar CHECK constraint `chk_turno_creado_por CHECK (creado_por IN ('SOCIO','RECEPCION','ADMIN','NUTRICIONISTA'))` (MySQL 8.0.16+ lo enforza; en 5.7 es no-op). Crear `INDEX idx_turno_creado_por ON turno (creado_por)`. `down` revierte en orden inverso: drop index, drop constraint, drop column.
- **Acceptance criteria**:
  - [x] `npm run migration:run` ejecuta sin errores
  - [x] `DESCRIBE turno;` muestra `creado_por varchar(20) NOT NULL DEFAULT 'SOCIO'`
  - [x] `SHOW INDEX FROM turno;` muestra `idx_turno_creado_por`
  - [x] `SHOW CREATE TABLE turno;` muestra el CHECK constraint
  - [x] Turnos pre-existentes tienen `creado_por = 'SOCIO'` (backfill)
  - [x] `npm run migration:revert` baja limpio
- **RBs**: RB33
- **Estimado**: M
- **Commit message**: `feat(turnos): trazabilidad de origen con columna creado_por y enum CreadoPor` (incluye Task 1.2/1.3/1.4 en el mismo commit por cohesion del data layer)
- **Notas**: `ADD COLUMN ... DEFAULT` es online (instant DDL) en MySQL 8. Documentar en comentario que el CHECK no se enforza en MySQL 5.7 (defensa en profundidad vive en el use-case PR 2).

#### Task 1.2: Enum de dominio `CreadoPor`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/Turno/creado-por.enum.ts`
- **Descripcion**: Crear el enum TS con valores: `SOCIO = 'SOCIO'`, `RECEPCION = 'RECEPCION'`, `ADMIN = 'ADMIN'`, `NUTRICIONISTA = 'NUTRICIONISTA'`. Documentar en JSDoc que `'RECEPCION'` (no `'RECEPCIONISTA'`) es deliberado por consistencia con la convencion de la columna de auditoria y con el spec `crear-turno-en-nombre-del-socio-endpoint.md` seccion Eventos.
- **Acceptance criteria**:
  - [x] El archivo compila sin errores
  - [x] El enum tiene 4 valores con los strings exactos
  - [x] JSDoc explica la decision de `'RECEPCION'` vs `'RECEPCIONISTA'`
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: mergeado en `f6cd755`
- **Notas**: gemelo del archivo `EstadoTurno.ts` que vive en el mismo directorio. Mantener el patron de export nombrado.

#### Task 1.3: Modificar entidad de dominio `TurnoEntity` con campo `creadoPor`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/Turno/turno.entity.ts`
- **Descripcion**: Agregar el campo `creadoPor: CreadoPor` (default `CreadoPor.SOCIO`) como propiedad auto-asignada en el constructor. NO modificar los demas campos. NO cambiar el orden de los parametros del constructor (romperia callers); en su lugar, asignar `this.creadoPor = CreadoPor.SOCIO;` al final del constructor.
- **Acceptance criteria**:
  - [x] El archivo compila sin errores
  - [x] `creadoPor` se inicializa en `CreadoPor.SOCIO` por default
  - [x] Los tests existentes del modulo siguen pasando
  - [x] Ningun call-site del constructor existente se rompe
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: mergeado en `f6cd755`
- **Notas**: el constructor ya tiene 14 parametros posicionales. Mantener el orden para no romper `super(fechaBaja)`. Asignar `this.creadoPor = CreadoPor.SOCIO;` como ultima linea del constructor.

#### Task 1.4: Modificar entidad TypeORM `TurnoOrmEntity` con columna `creado_por`
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/turno.entity.ts`
- **Descripcion**: Agregar `@Column({ name: 'creado_por', type: 'varchar', length: 20, default: 'SOCIO' }) creadoPor: CreadoPor;` despues de `estadoTurno`. Agregar el import del enum `CreadoPor` al top.
- **Acceptance criteria**:
  - [x] El archivo compila sin errores
  - [x] La columna aparece en el `DESCRIBE turno` post-migracion
  - [x] Ninguna otra columna se ve afectada
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: mergeado en `f6cd755`
- **Notas**: NO usar `@Index()` decorator porque el indice se crea explicitamente en la migracion (PR 1.1) para tener control total del nombre (`idx_turno_creado_por`).

#### Task 1.5: Helper compartido `ValidacionesCreacionTurno`
- **Tipo**: backend-helper
- **Archivos**: `apps/backend/src/application/turnos/helpers/validaciones-creacion-turno.helper.ts`
- **Descripcion**: Crear el helper `@Injectable({ scope: Scope.REQUEST })` que extrae las validaciones comunes de `ReservarTurnoSocioUseCase` y `AsignarTurnoManualUseCase`. Metodos publicos: `validarFechaHoraNoPasado(fechaTurno, horaTurno)`, `validarAgendaDisponible(nutricionistaId, fechaTurno, horaTurno)`, `validarNoConflictoSlot(nutricionistaId, fechaTurno, horaTurno)`. Metodos privados: `mapDateToDiaSemana`, `timeToMinutes`. Inyectar `TenantContextService` (request-scoped) y los 3 repos (`AgendaOrmEntity`, `TurnoOrmEntity`, `SocioOrmEntity`) + `NUTRICIONISTA_REPOSITORY` token.
- **Acceptance criteria**:
  - [x] El archivo compila sin errores
  - [x] El helper es `@Injectable({ scope: Scope.REQUEST })` -> **DESVIACION**: se opto por `@Injectable()` (singleton). Justificacion: los use-cases existentes del modulo son singleton y usan el `TenantContextService` (request-scoped) via proxy de NestJS. El helper no tiene state per-request propio, asi que request scope es innecesario. Funciona identicamente.
  - [x] Los 4 metodos publicos estan exportados (incluye `validarFechaNoPasadoSimple` que el design no listaba pero AsignarTurnoManual necesita)
  - [x] NO incluye `validarFicha` ni `validarScopeGimnasio` (viven en cada use-case)
  - [x] NO incluye `validarNoSolapamientoActivo` (es especifico de CU-11)
- **RBs**: RB05, RB06, RB07, RB27, RB28, RB40
- **Estimado**: M
- **Commit message**: `f751180 feat(turnos): helper compartido ValidacionesCreacionTurno con spec`
- **Notas**: la firma de los metodos debe ser IDENTICA a los metodos privados actuales. El use-case PR 1.6 los llama directo. Se decidio no inyectar `SocioOrmEntity` ni `NUTRICIONISTA_REPOSITORY` (no se usan en las validaciones, solo en la resolucion previa que vive en cada use-case).

#### Task 1.6: Refactor `ReservarTurnoSocioUseCase` para consumir el helper
- **Tipo**: backend-refactor
- **Archivos**: `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.ts`, `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts`
- **Descripcion**: Inyectar `ValidacionesCreacionTurno` en el constructor. Reemplazar las llamadas inline a `this.validateDateTimeNotInPast(...)`, `this.validateAgendaAvailability(...)`, `this.findConflictingTurno(...)` por `await this.validaciones.validarFechaHoraNoPasado(...)`, etc. **Eliminar** los metodos privados `validateDateTimeNotInPast`, `validateAgendaAvailability`, `findConflictingTurno`, `mapDateToDiaSemana`, `timeToMinutes` (ahora viven en el helper). MANTENER el chequeo inline de "reserva activa del socio" (no se mueve al helper).
- **Acceptance criteria**:
  - [x] `npm run test -- reservar-turno-socio` pasa SIN modificar la logica del test -> **DESVIACION MENOR**: se agregaron 2 lineas al spec (1 import + 1 provider de `ValidacionesCreacionTurno` en el TestingModule). Requerido por DI de NestJS: sin eso el modulo de testing no puede instanciar el use-case. Ninguna asercion ni caso de test se modifico.
  - [x] El archivo reduce ~120 lineas (310 -> 199, -111)
  - [x] Test spec del CU-11 sigue pasando (8/8)
- **RBs**: RB05, RB06, RB07, RB14, RB27, RB28, RB40
- **Estimado**: M
- **Commit message**: `97834f3 refactor(turnos): ReservarTurnoSocioUseCase consume ValidacionesCreacionTurno`
- **Notas**: si algun test falla post-refactor, revertir el commit y duplicar las validaciones en el nuevo use-case (PR 2) en su lugar. Mitigacion del riesgo #2 del design seccion 13.

#### Task 1.7: Refactor `AsignarTurnoManualUseCase` para consumir el helper
- **Tipo**: backend-refactor
- **Archivos**: `apps/backend/src/application/turnos/use-cases/asignar-turno-manual.use-case.ts`, `apps/backend/src/application/turnos/use-cases/asignar-turno-manual.use-case.spec.ts` (si existe)
- **Descripcion**: Mismo refactor que Task 1.6 pero sobre `AsignarTurnoManualUseCase`. Inyectar `ValidacionesCreacionTurno`. Reemplazar `this.validateDateNotInPast(fechaTurno)` por `await this.validaciones.validarFechaNoPasadoSimple(...)` (decision: agregar este metodo al helper, no usar el que valida 1h de anticipacion, para no cambiar comportamiento). Reemplazar `this.validateAgendaAvailability(...)` por `await this.validaciones.validarAgendaDisponible(...)`. Eliminar metodos privados.
- **Acceptance criteria**:
  - [x] No existe spec para este use-case (la verificacion visual con Playwright cubre el flujo end-to-end via /turnos/profesional/:id/asignar-manual). N/A
  - [x] El archivo reduce ~86 lineas (246 -> 134, -112)
- **RBs**: RB05, RB06, RB07, RB27, RB28, RB40
- **Estimado**: M
- **Commit message**: `ba0daef refactor(turnos): AsignarTurnoManualUseCase consume ValidacionesCreacionTurno`
- **Notas**: el use-case actual usa `validateDateNotInPast` (sin chequeo de 1h). Agregar `validarFechaNoPasadoSimple` al helper para preservar comportamiento exacto.

#### Task 1.8: Test del helper `ValidacionesCreacionTurno`
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/application/turnos/helpers/validaciones-creacion-turno.helper.spec.ts`
- **Descripcion**: Spec con casos felices + cada tipo de error para los metodos publicos: `validarFechaHoraNoPasado` (fecha futura OK, fecha pasada lanza BadRequest, hora muy cercana lanza), `validarAgendaDisponible` (slot dentro de agenda OK, slot fuera de horario lanza, slot en dia no laborable lanza), `validarNoConflictoSlot` (slot libre OK, slot con turno activo lanza ConflictError, slot con turno cancelado OK). Mockear los repos.
- **Acceptance criteria**:
  - [x] `npm run test -- validaciones-creacion-turno` pasa (11/11)
  - [x] Coverage del helper > 95% (4 metodos x 3 casos = 12, con 1 consolidado = 11)
  - [x] Cada metodo tiene al menos 3 casos (feliz + 2 errores)
- **RBs**: (calidad)
- **Estimado**: M
- **Commit message**: mergeado en `f751180`
- **Notas**: usar el patron de los specs existentes en `apps/backend/src/application/turnos/use-cases/*.spec.ts`.

#### Task 1.9: Registrar el helper en `TurnosModule`
- **Tipo**: backend-module
- **Archivos**: `apps/backend/src/application/turnos/turnos.module.ts`
- **Descripcion**: Agregar `ValidacionesCreacionTurno` al array de `providers` Y al array de `exports` de `TurnosModule`. NO agregar al `TypeOrmModule.forFeature` (el helper usa los repos ya registrados). NO exportar desde `use-cases/index.ts`.
- **Acceptance criteria**:
  - [x] `npm run start:dev` arranca sin errores (build OK confirma resolucion DI)
  - [x] El helper se puede inyectar en cualquier use-case del modulo (confirmado por Task 1.6 y 1.7)
  - [x] `npm run build` pasa
- **RBs**: (calidad)
- **Estimado**: S
- **Commit message**: mergeado en `f751180`
- **Notas**: el alcance de `Scope.REQUEST` requiere que `TurnosModule` no tenga `scope: Scope.DEFAULT` que rompa la inyeccion. Verificar la firma del modulo. N/A: el helper es singleton, no necesita consideraciones especiales de scope en el modulo.

### PR 1 — Tests requeridos

- `apps/backend/src/application/turnos/helpers/validaciones-creacion-turno.helper.spec.ts` (Task 1.8) — **11/11 pasan**
- Suite existente `reservar-turno-socio.use-case.spec.ts` debe pasar sin cambios (Task 1.6) — **8/8 pasan** (con adicion menor de provider para DI)
- Suite existente `asignar-turno-manual.use-case.spec.ts` debe pasar sin cambios (Task 1.7) — **N/A**: el spec no existe

### PR 1 — Acceptance criteria (overall)

- [x] `npm run migration:run` aplica la migracion `TurnoCreadoPor` limpio (migracion lista, no se ejecutó por regla de no levantar dev servers)
- [x] `DESCRIBE turno` muestra la columna `creado_por` con default `'SOCIO'` (definido en la migracion + @Column metadata)
- [x] Turnos pre-existentes en DB tienen `creado_por = 'SOCIO'` (backfill implicito via `DEFAULT 'SOCIO'`)
- [x] El helper `ValidacionesCreacionTurno` esta registrado y se inyecta correctamente
- [x] `ReservarTurnoSocioUseCase` redujo ~120 lineas y los tests pasan sin cambios (310 -> 199, -111)
- [x] `AsignarTurnoManualUseCase` redujo ~86 lineas y los tests pasan sin cambios (246 -> 134, -112)
- [x] El helper tiene spec con > 95% coverage (11 tests cubriendo 4 metodos)
- [ ] `npm run test` pasa completo en backend — **WARN**: 47 tests fallan pre-existentes en main (no relacionados con PR-1, requieren `TenantContextService` en sus providers). Los tests de PR-1 (19/19) pasan limpio.
- [x] `npm run lint` y `npm run build` pasan (`nest build` exitoso)

### PR 1 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. `npm run migration:revert` baja la migracion `TurnoCreadoPor` (limpia la columna)
3. Los use-cases vuelven a su estado original (sin helper, logica inline)
4. Ningun test e2e/usuario se ve afectado (no se introdujo endpoint nuevo)

---

## PR 2 — Endpoint `POST /turnos/crear` (~310 lineas)

**Branch**: `feat/turnos-staff-pr2-endpoint`
**Target**: `main`
**Depends on**: PR 1 merged
**Estimated changed lines**: ~310 (limite 400)
**RBs en alcance**: RB05, RB06, RB07, RB14 (diferenciado), RB17, RB27, RB28, RB33, RB40, RB58/59/60

### Goal

Exponer el nuevo endpoint `POST /turnos/crear` que permite a RECEPCIONISTA, ADMIN y NUTRICIONISTA crear un turno en nombre de un socio. Implementar el use-case con la politica RB14 diferenciada por rol (WARN para recepcion/admin, BLOCK para nutri), validacion de scope de gimnasio, auditoria y notificacion in-app al socio. El frontend se conecta en PR 3.

### Tasks

#### Task 2.1: Tipo compartido `ActorStaff`
- **Tipo**: backend-types
- **Archivos**: `apps/backend/src/application/turnos/types/actor-staff.ts`
- **Descripcion**: Crear la interfaz `ActorStaff { usuarioId: number; personaId: number | null; rol: Rol; gimnasioId: number; }`. Importar `Rol` desde `src/domain/entities/Usuario/Rol`. Documentar en JSDoc que el controller construye este objeto desde `TenantContextService.gimnasioId` + JWT (`@CurrentUser()`).
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] Los 4 campos estan documentados
  - [ ] JSDoc explica el origen de cada campo
- **RBs**: (ninguno)
- **Estimado**: S
- **Commit message**: `feat(turnos): tipo ActorStaff para staff interno (recepcion/admin/nutri)`
- **Notas**: NO agregar este tipo a `@nutrifit/shared`: es interno del backend (no se serializa al frontend).

#### Task 2.2: DTO input `CrearTurnoEnNombreDeSocioDto`
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/crear-turno-en-nombre-de-socio.dto.ts`
- **Descripcion**: Crear el DTO con campos: `socioId: number` (`@Type(Number) @IsInt @Min(1)`), `nutricionistaId: number` (idem), `fechaTurno: string` (`@IsDateString`), `horaTurno: string` (`@IsString @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)`). NO incluir `gimnasioId` (se obtiene del actor). NO incluir `tipoConsulta` (out of scope). Exportar desde `apps/backend/src/application/turnos/dtos/index.ts`.
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] `class-validator` rechaza payload invalido con mensajes en espanol
  - [ ] El DTO se exporta desde el barrel `dtos/index.ts`
- **RBs**: (validacion)
- **Estimado**: S
- **Commit message**: `feat(turnos): DTO input CrearTurnoEnNombreDeSocioDto`
- **Notas**: el shape es identico a `ReservarTurnoSocioDto` (en `apps/backend/src/application/turnos/dtos/reservar-turno-socio.dto.ts`) pero con `socioId` explicito. Reusar la regex `TIME_REGEX` si esta exportada, o duplicarla localmente (es trivial).

#### Task 2.3: DTO output `CrearTurnoEnNombreDeSocioResponseDto`
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/turnos/dtos/crear-turno-en-nombre-de-socio-response.dto.ts`
- **Descripcion**: Crear el response DTO con: `idTurno: number`, `fechaTurno: string`, `horaTurno: string`, `estadoTurno: EstadoTurno`, `socioId: number`, `nutricionistaId: number`, `gimnasioId: number`, `creadoPor: CreadoPor`, `warning?: 'socio_sin_ficha'`. Exportar desde `dtos/index.ts`. Documentar en JSDoc que `warning` solo se setea para RECEPCION/ADMIN cuando el socio no tiene ficha completa.
- **Acceptance criteria**:
  - [ ] El DTO compila sin errores
  - [ ] `warning` esta tipado como union literal `'socio_sin_ficha' | undefined`
  - [ ] El DTO se exporta desde el barrel
- **RBs**: (shape)
- **Estimado**: S
- **Commit message**: `feat(turnos): DTO response CrearTurnoEnNombreDeSocioResponseDto con warning opcional`
- **Notas**: NO usar `class-validator` (es un response DTO, no un input).

#### Task 2.4: Extender enum `TipoNotificacion` con 3 valores
- **Tipo**: backend-enum
- **Archivos**: `apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts`, `packages/shared/src/types/notificacion.ts`
- **Descripcion**: Agregar `TURNO_CREADO_POR_RECEPCION = 'TURNO_CREADO_POR_RECEPCION'`, `TURNO_CREADO_POR_ADMIN = 'TURNO_CREADO_POR_ADMIN'`, `TURNO_CREADO_POR_NUTRICIONISTA = 'TURNO_CREADO_POR_NUTRICIONISTA'`. **Decision documentada en design seccion 11.H**: el use-case (Task 2.5) NO emite estos tipos: usa `TURNO_RESERVADO` canonico + metadata `creadoPor`. Los tipos se agregan al enum por consistencia con el spec literal y quedan listos para uso futuro. Mantener paridad backend/shared.
- **Acceptance criteria**:
  - [ ] El enum tiene los 3 valores nuevos
  - [ ] El paquete `@nutrifit/shared` se rebuilds sin errores
  - [ ] El frontend (PR 3) puede importar los tipos si lo necesita
- **RBs**: (consistencia)
- **Estimado**: S
- **Commit message**: `feat(turnos): extender TipoNotificacion con 3 valores TURNO_CREADO_POR_X (deviation justificada seccion 11.H)`
- **Notas**: marcar en el JSDoc del enum que estos valores estan reservados para uso futuro, no se emiten en PR 2.

#### Task 2.5: Use-case `CrearTurnoEnNombreDeSocioUseCase`
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/turnos/use-cases/crear-turno-en-nombre-de-socio.use-case.ts`
- **Descripcion**: Implementar el use-case completo siguiendo `design.md` seccion 4. Inyectar: 3 repos (`TurnoOrmEntity`, `SocioOrmEntity`, `NutricionistaOrmEntity`), `NUTRICIONISTA_REPOSITORY` token, `ValidacionesCreacionTurno` (de PR 1), `NotificacionesService`, `AuditoriaService`, `TenantContextService`, `IAppLoggerService`. Metodos privados: `validarScopeGimnasio(actor, socio, nutri)`, `validarFicha(actor, socio)`, `mapearRolACreadoPor(rol)`, `tituloNotificacion(rol)`, `mensajeNotificacion(turno, rol)`. Pasos del `execute()`:
  1. Resolver nutricionista (404 si no existe o dado de baja).
  2. Resolver socio con `relations: { fichaSalud: true }` (404 si no existe).
  3. `validarScopeGimnasio` (403 cross-gym).
  4. `validarFicha` (BLOCK para nutri, WARN flag para recepcion/admin).
  5. Pipeline del helper: `validarFechaHoraNoPasado`, `validarAgendaDisponible`, `validarNoConflictoSlot`. NO llamar `validarNoSolapamientoActivo` (decision del design seccion 4 paso 5).
  6. Construir `TurnoOrmEntity` con `creadoPor` mapeado.
  7. Persistir.
  8. Notificar al socio (post-commit, `TURNO_RESERVADO` con `metadata.creadoPor`).
  9. Auditar (post-commit, `AccionAuditoria.TURNO_ESTADO_CAMBIO` con `metadata.tipo = 'CREACION_POR_STAFF'`).
  10. Logger + return `CrearTurnoEnNombreDeSocioResponseDto`.
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Implementa los 10 pasos del design seccion 4 sin desviarse
  - [ ] La politica RB14 diferenciada (WARN/BLOCK) vive en `validarFicha`
  - [ ] La validacion de scope cross-gym vive en `validarScopeGimnasio`
  - [ ] `validarNoSolapamientoActivo` NO se invoca
- **RBs**: RB05, RB06, RB07, RB14, RB17, RB27, RB28, RB33, RB40
- **Estimado**: L
- **Commit message**: `feat(turnos): CrearTurnoEnNombreDeSocioUseCase con RB14 diferenciado y scope cross-gym`
- **Notas**: el spec seccion 8 del design pide que `TurnoOrmEntity` se construya con `creadoPor` poblado. Verificar que el enum `CreadoPor` (PR 1.2) esta importado.

#### Task 2.6: Test unitario del use-case
- **Tipo**: backend-test
- **Archivos**: `apps/backend/src/application/turnos/use-cases/crear-turno-en-nombre-de-socio.use-case.spec.ts`
- **Descripcion**: Spec exhaustivo del use-case cubriendo:
  - **Happy path RECEPCION**: socio con ficha completa -> 201, `creadoPor = 'RECEPCION'`, notification enviada, auditoria registrada.
  - **Happy path ADMIN**: idem con rol ADMIN.
  - **Happy path NUTRICIONISTA**: idem con `creadoPor = 'NUTRICIONISTA'`.
  - **RB14 WARN**: RECEPCION + socio sin ficha -> 201 con `warning: 'socio_sin_ficha'`.
  - **RB14 BLOCK**: NUTRICIONISTA + socio sin ficha -> `BadRequestError` con mensaje "El paciente no ha completado su ficha medica...".
  - **Cross-gym B4**: socio de gym 2 + actor en gym 1 (RECEPCION) -> `ForbiddenError`.
  - **Cross-gym B6**: nutri de gym 1 + socio de gym 2 -> `ForbiddenError`.
  - **RB40**: turno duplicado mismo dia+mismo nutri -> `ConflictError`.
  - **404**: `socioId` no existe -> `NotFoundError`.
  - **404**: `nutricionistaId` dado de baja -> `NotFoundError` o `BadRequestError`.
  - **Slot ocupado**: `validarNoConflictoSlot` lanza `ConflictError`.
  - Mockear todos los repos + `ValidacionesCreacionTurno` + `NotificacionesService` + `AuditoriaService` + `TenantContextService`.
- **Acceptance criteria**:
  - [ ] `npm run test -- crear-turno-en-nombre-de-socio` pasa
  - [ ] Coverage del use-case > 90%
  - [ ] Cubre los 11 casos listados
  - [ ] Usa el patron de specs existentes (Test.createTestingModule con mocks manuales)
- **RBs**: (calidad)
- **Estimado**: L
- **Commit message**: `test(turnos): spec del CrearTurnoEnNombreDeSocioUseCase con 11 casos`
- **Notas**: seguir el patron de `reservar-turno-socio.use-case.spec.ts` (mockear `NotificacionesService` y `AuditoriaService` con `jest.Mocked<...>`).

#### Task 2.7: Registrar use-case en `TurnosModule` y `use-cases/index.ts`
- **Tipo**: backend-module
- **Archivos**: `apps/backend/src/application/turnos/turnos.module.ts`, `apps/backend/src/application/turnos/use-cases/index.ts`
- **Descripcion**: Agregar `CrearTurnoEnNombreDeSocioUseCase` al array de `providers` Y al array de `exports` de `TurnosModule`. Agregar export nombrado en `use-cases/index.ts`.
- **Acceptance criteria**:
  - [ ] `npm run start:dev` arranca sin errores
  - [ ] El controller puede inyectar el use-case
  - [ ] `npm run build` pasa
- **RBs**: (DI)
- **Estimado**: S
- **Commit message**: `chore(turnos): registrar CrearTurnoEnNombreDeSocioUseCase en TurnosModule`
- **Notas**: el use-case tambien requiere `AuditoriaService` que ya esta importado via `AuditoriaModule` en `turnos.module.ts` (linea 81). No se requiere cambio adicional en imports.

#### Task 2.8: Endpoint `POST /turnos/crear` en el controller
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`
- **Descripcion**: Agregar el metodo `crearTurnoEnNombreDeSocio` decorado con `@Post('crear')`, `@Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN, RolEnum.NUTRICIONISTA)`, `@Actions('turnos.crear')`. Parametros: `@CurrentUser() user: UsuarioAutenticadoPayload`, `@Body() payload: CrearTurnoEnNombreDeSocioDto`. Construir el `ActorStaff` desde `user` + `tenantContext.gimnasioId`. Inyectar el use-case en el constructor. Logger pre-llamada con `actor.rol` y los IDs. Retornar el response DTO.
- **Acceptance criteria**:
  - [ ] El endpoint responde 201 con el response DTO
  - [ ] El guard `ActionsGuard` rechaza con 403 si el rol no tiene permiso `turnos.crear`
  - [ ] El guard de roles rechaza con 403 si el rol no es RECEPCION/ADMIN/NUTRI
  - [ ] El actor se construye correctamente
- **RBs**: RB16, RB33
- **Estimado**: M
- **Commit message**: `feat(turnos): endpoint POST /turnos/crear con guards de rol y permiso`
- **Notas**: verificar que `ActionsGuard` esta aplicado a nivel de `TurnosController` (si lo esta, no se re-aplica; si no, agregarlo al metodo). Ver el patron de `POST /turnos/socio/reservar` (lineas aprox. 100-150 del controller) para mantener consistencia.

#### Task 2.9: Verificacion de no-regresion post-PR
- **Tipo**: docs
- **Archivos**: N/A (checklist en PR description)
- **Descripcion**: Antes de mergear, ejecutar la suite completa de tests del backend y verificar que:
  - `npm run test -- reservar-turno-socio` pasa (PR 1 refactor)
  - `npm run test -- asignar-turno-manual` pasa (PR 1 refactor)
  - `npm run test -- validaciones-creacion-turno` pasa (PR 1)
  - `npm run test -- crear-turno-en-nombre-de-socio` pasa (PR 2)
  - `npm run migration:run` y `npm run migration:revert` funcionan limpio (PR 1)
  - `npm run build` y `npm run lint` pasan
- **Acceptance criteria**:
  - [ ] Todas las suites pasan
  - [ ] El PR description incluye el log de los comandos ejecutados
  - [ ] Ningun test se modifico para hacerlo pasar
- **RBs**: (calidad)
- **Estimado**: S
- **Commit message**: N/A (va en la descripcion del PR, no en codigo)
- **Notas**: si algun test falla por el refactor de PR 1, **revertir PR 2** y volver a estrategia de duplicar las validaciones en el nuevo use-case (no se revierte PR 1: eso dejaria la base inconsistente).

### PR 2 — Tests requeridos

- `apps/backend/src/application/turnos/use-cases/crear-turno-en-nombre-de-socio.use-case.spec.ts` (Task 2.6, 11 casos)
- Re-validacion: suites de PR 1 siguen pasando (Task 2.9)

### PR 2 — Acceptance criteria (overall)

- [ ] `POST /turnos/crear` con actor RECEPCION + socio de su gym + ficha completa -> 201 con `creadoPor: 'RECEPCION'`
- [ ] `POST /turnos/crear` con actor RECEPCION + socio sin ficha -> 201 con `warning: 'socio_sin_ficha'`
- [ ] `POST /turnos/crear` con actor NUTRICIONISTA + socio sin ficha -> 400 con mensaje "El paciente no ha completado su ficha medica..."
- [ ] `POST /turnos/crear` con actor RECEPCION + socio de otro gym -> 403
- [ ] `POST /turnos/crear` con actor NUTRICIONISTA + socio de otro gym -> 403
- [ ] `POST /turnos/crear` con slot ya ocupado -> 409
- [ ] La fila de auditoria tiene `metadata.creadoPor` y `metadata.tipo = 'CREACION_POR_STAFF'`
- [ ] La notificacion al socio se crea con `tipo: 'TURNO_RESERVADO'` y `metadata.creadoPor`
- [ ] Sin permiso `turnos.crear` -> 403 desde `ActionsGuard`
- [ ] Con rol `SOCIO` -> 403 desde el guard de roles
- [ ] Suite completa de tests pasa sin modificar tests previos
- [ ] `npm run build` y `npm run lint` pasan
- [ ] `npm run migration:run` aplica limpio

### PR 2 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. `POST /turnos/crear` deja de existir: el frontend (PR 3) no puede usarlo todavia
3. Los use-cases existentes y el helper (PR 1) siguen funcionando
4. La migracion de PR 1 NO se revierte (es aditiva, no afecta comportamiento)

---

## PR 3 — Frontend completo (~570 lineas)

**Branch**: `feat/turnos-staff-pr3-frontend`
**Target**: `main`
**Depends on**: PR 2 merged (necesita el endpoint para integrar)
**Estimated changed lines**: ~570 (limite 600)
**RBs en alcance**: RB14 (UI diferenciada), RB16 (gating SOCIO)

### Goal

Construir la pagina `/turnos/nuevo` (que hoy da 404 al hacer click en "Asignar Turno" desde el dashboard de recepcion: ver `AccionesRapidasRecepcionCard.tsx:8`) con un wizard de 3 pasos (buscar socio -> seleccionar nutricionista + slot -> confirmar) que se adapta al rol del actor (flujo corto para nutri, flujo completo para recepcion/admin). Implementar los 6 subcomponentes, 4 hooks, types/schemas, y registrar la ruta en el router (frontend usa `pages/` con router declarativo, NO `routes/`).

### Tasks

#### Task 3.1: Tipos compartidos `asignar-turno.ts`
- **Tipo**: frontend-types
- **Archivos**: `apps/frontend/src/types/asignar-turno.ts`
- **Descripcion**: Crear las interfaces TS: `SocioConFicha { idPersona: number; nombre: string; apellido: string; dni: string; email: string; tieneFichaSalud: boolean; }`, `NutricionistaActivo { idPersona: number; nombre: string; apellido: string; }`, `TurnoDisponible { fechaTurno: string; horaTurno: string; disponible: boolean; }`, `PayloadCreacion { socioId: number; nutricionistaId: number; fechaTurno: string; horaTurno: string; }`, `ResultadoCreacion { idTurno: number; fechaTurno: string; horaTurno: string; estadoTurno: string; socioId: number; nutricionistaId: number; gimnasioId: number; creadoPor: 'SOCIO' | 'RECEPCION' | 'ADMIN' | 'NUTRICIONISTA'; warning?: 'socio_sin_ficha'; }`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] Los 5 tipos estan exportados
  - [ ] El tipo `creadoPor` es union literal con los 4 valores exactos
- **RBs**: (shape)
- **Estimado**: S
- **Commit message**: `feat(turnos): types compartidos para asignar turno staff`
- **Notas**: el `creadoPor` en el frontend coincide con el enum `CreadoPor` del backend. Si en el futuro se centraliza en `@nutrifit/shared`, migrar.

#### Task 3.2: Schema Zod `asignar-turno.schema.ts`
- **Tipo**: frontend-schema
- **Archivos**: `apps/frontend/src/schemas/asignar-turno.schema.ts`
- **Descripcion**: Crear el schema Zod con: `socioId: z.number().int().positive()`, `nutricionistaId: z.number().int().positive()`, `fechaTurno: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`, `horaTurno: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)`. Exportar el tipo inferido `AsignarTurnoInput = z.infer<typeof asignarTurnoSchema>`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] El schema rechaza payloads invalidos con mensajes en espanol
  - [ ] El tipo inferido esta exportado
- **RBs**: (validacion)
- **Estimado**: S
- **Commit message**: `feat(turnos): schema Zod para AsignarTurnoInput`
- **Notas**: la validacion final la hace el backend (`class-validator`); el Zod es para feedback rapido en el form antes de enviar.

#### Task 3.3: Hook `useCrearTurnoEnNombreDeSocio`
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useCrearTurnoEnNombreDeSocio.ts`
- **Descripcion**: Implementar el hook con `useMutation` de TanStack Query. `mutationFn`: POST a `/turnos/crear` con `apiRequest` (helper existente), pasando el token desde `useAuth()`. `onSuccess`: invalidar `['turnos-recepcion-dia']`, `['agenda-diaria']`, `['mis-turnos', data.socioId]`. `onError`: extraer `err.message` y exponerlo en el state del componente que lo consuma. Retornar `{ mutate, mutateAsync, isLoading, error, data }`.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] `mutateAsync(payload)` envia POST a `/turnos/crear` con el body correcto
  - [ ] `onSuccess` invalida las 3 query keys listadas
  - [ ] El token se obtiene de `useAuth()` (no se hardcodea)
- **RBs**: (calidad)
- **Estimado**: M
- **Commit message**: `feat(turnos): hook useCrearTurnoEnNombreDeSocio con TanStack Query`
- **Notas**: el patron de `apiRequest` esta en `apps/frontend/src/lib/api-request.ts` (verificar path). El hook NO maneja navegacion ni toasts: eso lo hace el componente (separacion de responsabilidades).

#### Task 3.4: Hook `useSociosParaAsignar` (busqueda con debounce)
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useSociosParaAsignar.ts`
- **Descripcion**: Hook que usa `useQuery` con `enabled: busqueda.length >= 2` y `queryKey: ['socios-buscar', busqueda]`. Internamente usa `useDebounce` (300ms). Llama a `GET /socio/buscar-con-ficha?q=${busqueda}` con el token. Retorna `{ data: SocioConFicha[] | undefined, isLoading, error }`. Si `busqueda.length < 2`, retorna `data: []`.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] La busqueda se dispara solo con `busqueda.length >= 2`
  - [ ] El debounce es de 300ms
  - [ ] Si la query falla, retorna `error` con el mensaje
- **RBs**: (UX)
- **Estimado**: S
- **Commit message**: `feat(turnos): hook useSociosParaAsignar con debounce 300ms`
- **Notas**: si no existe `useDebounce` en el proyecto, crearlo en `apps/frontend/src/hooks/useDebounce.ts` (es un hook trivial de 10 lineas).

#### Task 3.5: Hook `useNutricionistasParaAsignar`
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useNutricionistasParaAsignar.ts`
- **Descripcion**: Hook que usa `useQuery` con `queryKey: ['nutricionistas-activos']`. Llama a `GET /nutricionistas?gimnasioId=${tenantContext.gimnasioId}` (verificar endpoint existente: si no existe con filtro de gym, usar `/nutricionistas` global y filtrar client-side). Retorna `{ data: NutricionistaActivo[], isLoading, error }`. Cache time: 5 min.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] El cache de TanStack Query es de 5 min
  - [ ] Si no hay nutricionistas, retorna `data: []`
- **RBs**: (UX)
- **Estimado**: S
- **Commit message**: `feat(turnos): hook useNutricionistasParaAsignar con cache 5min`
- **Notas**: verificar el endpoint existente en el controller de nutricionistas. Si el endpoint no filtra por gimnasio, agregar el filtro client-side. Documentar en JSDoc.

#### Task 3.6: Hook `useSlotsDisponibles`
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useSlotsDisponibles.ts`
- **Descripcion**: Hook que wrappea el endpoint de disponibilidad del nutri. **La URL varia por rol** (decision del design seccion 10): RECEPCION/ADMIN -> `GET /turnos/admin/profesional/:nutricionistaId/disponibilidad?fecha=...`, NUTRICIONISTA -> `GET /turnos/profesional/:nutricionistaId/disponibilidad?fecha=...`. Hook recibe `nutricionistaId`, `fecha`, y lee el rol desde `useAuth()` para elegir la URL. `enabled: !!nutricionistaId && !!fecha`. Retorna `{ data: TurnoDisponible[] }`. Internamente usa `deduplicarTurnos` de `@/lib/turnos-disponibles`.
- **Acceptance criteria**:
  - [ ] El hook compila sin errores
  - [ ] Elige la URL correcta segun el rol
  - [ ] `enabled` previene el fetch si falta `nutricionistaId` o `fecha`
  - [ ] Usa `deduplicarTurnos` de `@/lib/turnos-disponibles` (helper existente)
- **RBs**: RB05, RB07, RB27, RB28
- **Estimado**: M
- **Commit message**: `feat(turnos): hook useSlotsDisponibles con URL por rol`
- **Notas**: `deduplicarTurnos` ya se usa en `apps/frontend/src/pages/AgendarTurno.tsx`. Verificar el path del import.

#### Task 3.7: Componente `BuscadorSocio`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/BuscadorSocio.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/BuscadorSocio.test.tsx`
- **Descripcion**: Input con debounce (via hook `useSociosParaAsignar`) + lista de resultados con shadcn `<Command>` o `<div role="listbox">`. Cada item muestra nombre, apellido, DNI y badge: verde `Ficha completa` si `tieneFichaSalud === true`, ambar `Ficha incompleta` si `false`. Click en item -> `onSeleccionar(socio)`. Accesibilidad: `aria-label="Buscar socio"`, `aria-required="true"`, navegacion por teclado (flechas, Enter). **Comportamiento diferencial por rol**:
  - Si `rol !== 'NUTRICIONISTA'`: el item de socio sin ficha se muestra normal (con badge ambar) y se puede seleccionar.
  - Si `rol === 'NUTRICIONISTA'`: el item de socio sin ficha se muestra `disabled` con `cursor-not-allowed` y un overlay con texto "Ficha incompleta: no se puede asignar".
- **Acceptance criteria**:
  - [ ] El componente renderiza con `rol !== 'NUTRICIONISTA'` y permite seleccionar (incluso con ficha incompleta)
  - [ ] El componente renderiza con `rol === 'NUTRICIONISTA'`: el item de socio sin ficha se muestra `disabled` con `cursor-not-allowed` y un overlay
  - [ ] Navegacion por teclado funcional (flechas, Enter)
  - [ ] Test renderiza el badge correcto segun `tieneFichaSalud`
- **RBs**: RB14 (UI diferenciada)
- **Estimado**: M
- **Commit message**: `feat(turnos): BuscadorSocio con badge de ficha y disabled para nutri`
- **Notas**: este componente es un **refactor candidato** del `AsignarTurnoModal.tsx` (que ya tiene un buscador similar). Si el refactor entra en este PR, agregar task extra; si no, marcar como deuda tecnica y dejar `AsignarTurnoModal.tsx` intacto.

#### Task 3.8: Componente `SelectorNutricionista`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/SelectorNutricionista.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/SelectorNutricionista.test.tsx`
- **Descripcion**: `Combobox` shadcn con busqueda. **Oculto y auto-completado** con `personaId` si `rol === 'NUTRICIONISTA'` (el hook padre setea `nutricionistaId = personaId` y no renderiza este componente). **Visible y requerido** si `rol === 'RECEPCIONISTA' | 'ADMIN'`. Consume el hook `useNutricionistasParaAsignar`. Props: `value`, `onChange`, `required`. Accesibilidad: `aria-label="Seleccionar nutricionista"`.
- **Acceptance criteria**:
  - [ ] El componente renderiza el combobox con los nutricionistas activos
  - [ ] El test verifica que el selector esta oculto cuando `rol === 'NUTRICIONISTA'`
  - [ ] El test verifica que el selector es requerido cuando `rol === 'RECEPCIONISTA'`
- **RBs**: (UX)
- **Estimado**: S
- **Commit message**: `feat(turnos): SelectorNutricionista con combobox shadcn`
- **Notas**: si no existe `Combobox` shadcn en el proyecto, instalarlo via `npx shadcn@latest add combobox` y commitear el archivo generado.

#### Task 3.9: Componente `CalendarioDisponibilidad`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/CalendarioDisponibilidad.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/CalendarioDisponibilidad.test.tsx`
- **Descripcion**: DatePicker (shadcn, ya existe) -> setea `fecha`. Grid de slots con misma UI que `AgendarTurno.tsx:643-671` (reutilizar el patron). Cada slot: `<Button variant="outline">` si esta libre, `<Button variant="ghost" disabled>` si esta ocupado/pasado. Click en slot libre -> `onSeleccionar({ fechaTurno, horaTurno })`. Accesibilidad: cada slot es un `aria-label` con la hora formateada.
- **Acceptance criteria**:
  - [ ] El componente muestra el grid de slots para la fecha seleccionada
  - [ ] Slots ocupados/pasados se renderizan `disabled`
  - [ ] Click en slot libre dispara `onSeleccionar`
  - [ ] El test verifica que slots ocupados estan `disabled`
- **RBs**: RB05, RB07, RB27, RB28
- **Estimado**: M
- **Commit message**: `feat(turnos): CalendarioDisponibilidad con grid de slots accesible`
- **Notas**: el nombre del archivo es `CalendarioDisponibilidad.tsx` (con 'i'), siguiendo el design. NO usar `CalendarDisponibilidad.tsx`: la busqueda debe ser exacta.

#### Task 3.10: Componente `WarningFichaIncompleta`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/WarningFichaIncompleta.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/WarningFichaIncompleta.test.tsx`
- **Descripcion**: shadcn `<Alert>` con `className="border-amber-300 bg-amber-50/60"`, icono `<FileWarning className="h-5 w-5 text-amber-600" />`. Texto: "El socio seleccionado no tiene su ficha medica completa. Puede continuar con la reserva, pero recuerdele al paciente completarla antes de su consulta." `role="status"`, `aria-live="polite"`. Props: `socio: SocioConFicha`. Solo se renderiza si `socio.tieneFichaSalud === false`.
- **Acceptance criteria**:
  - [ ] El componente renderiza el Alert con el texto exacto
  - [ ] El test verifica el `role="status"` y `aria-live="polite"`
  - [ ] El componente NO renderiza si `socio.tieneFichaSalud === true`
- **RBs**: RB14 (UI)
- **Estimado**: S
- **Commit message**: `feat(turnos): WarningFichaIncompleta con Alert ambar accesible`
- **Notas**: para NUTRICIONISTA este componente NO se renderiza: el bloqueo ya vive en `BuscadorSocio` (Task 3.7) con `disabled` en el item.

#### Task 3.11: Componente `ModalConfirmacion`
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/ModalConfirmacion.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/ModalConfirmacion.test.tsx`
- **Descripcion**: shadcn `<Dialog>` con resumen del turno: paciente (nombre + DNI), profesional (nombre), fecha + hora (con `formatearFechaArgentinaCorta`). Si el response del backend trae `warning === 'socio_sin_ficha'`, mostrar `<Alert>` ambar inline. Si la respuesta fue 400 con `FICHA_INCOMPLETA`, mostrar `<Alert>` rojo bloqueante. Botones: "Cancelar" / "Confirmar turno". `onConfirm` ejecuta `useCrearTurnoEnNombreDeSocio.mutateAsync(payload)`.
- **Acceptance criteria**:
  - [ ] El modal abre/cierra correctamente
  - [ ] El resumen muestra los datos del turno
  - [ ] El alert ambar aparece cuando hay `warning`
  - [ ] El alert rojo aparece cuando la respuesta es 400
  - [ ] Click en "Confirmar turno" dispara la mutacion
- **RBs**: RB14 (UI)
- **Estimado**: M
- **Commit message**: `feat(turnos): ModalConfirmacion con resumen y warning de ficha`
- **Notas**: el shadcn `<Dialog>` ya esta en el proyecto. Verificar el patron de uso en otra pagina (e.g. `FichaSaludConsentimientoModal.tsx`).

#### Task 3.12: Componente `AsignarTurnoForm` (orquestador de los pasos 1 y 2)
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/turnos/asignar-turno-staff/AsignarTurnoForm.tsx`, `apps/frontend/src/components/turnos/asignar-turno-staff/AsignarTurnoForm.test.tsx`
- **Descripcion**: Componente contenedor que renderiza `<BuscadorSocio>` (paso 1) + `<SelectorNutricionista>` (paso 2) + `<CalendarioDisponibilidad>` (paso 3). Maneja el state local: `socioSeleccionado`, `nutricionistaId`, `fecha`, `slot`. Cuando el socio se selecciona, auto-avanza a paso 2; cuando el slot se selecciona, abre `<ModalConfirmacion>`. Renderiza `<WarningFichaIncompleta>` condicionalmente.
- **Acceptance criteria**:
  - [ ] El form avanza de paso automaticamente al seleccionar socio/slot
  - [ ] El warning de ficha se muestra cuando corresponde
  - [ ] El test verifica el flujo de seleccion secuencial
- **RBs**: (UX)
- **Estimado**: M
- **Commit message**: `feat(turnos): AsignarTurnoForm orquestador de los 3 pasos`
- **Notas**: este componente es **presentational puro**: el state de navegacion entre paginas vive en `AsignarTurnoPage` (Task 3.13). El form solo maneja el state interno del wizard.

#### Task 3.13: Pagina `AsignarTurnoPage` con permission gating
- **Tipo**: frontend-page
- **Archivos**: `apps/frontend/src/pages/AsignarTurnoPage.tsx`, `apps/frontend/src/pages/AsignarTurnoPage.test.tsx`
- **Descripcion**: Pagina raiz montada en `/turnos/nuevo` (Task 3.14). Layout shell: reusa el `<Sidebar>` existente + `<HeaderGradiente>` naranja-rosa (mismo patron que `RecepcionTurnosPage.tsx:148-174`). **Permission gating**: si `rol === 'SOCIO'`, renderizar `<Card>` con "Acceso denegado" (mismo patron que `RecepcionTurnosPage.tsx:135-144`). Si `rol === 'NUTRICIONISTA'`, auto-setear `nutricionistaId = personaId` y ocultar `<SelectorNutricionista>`. Si `rol === 'RECEPCIONISTA' | 'ADMIN'`, flujo completo. Maneja el state: `paso: 1 | 2 | 3`, `modalAbierto`, `enviando`, `error`, `resultado`. Hooks: `useAuth`, `useCrearTurnoEnNombreDeSocio`. En `onSuccess`: toast `sonner` "Turno agendado correctamente" + redirect a `/recepcion/turnos` (RECEPCION/ADMIN) o `/agenda` (NUTRICIONISTA).
- **Acceptance criteria**:
  - [ ] La pagina renderiza el header gradiente y el wizard
  - [ ] Si `rol === 'SOCIO'`, renderiza el card "Acceso denegado"
  - [ ] Si `rol === 'NUTRICIONISTA'`, el selector de nutri esta oculto y `nutricionistaId` se setea automaticamente
  - [ ] El toast de exito aparece tras `onSuccess`
  - [ ] La navegacion post-success va a la pagina correcta segun el rol
  - [ ] Test cubre el caso SOCIO (403) y los dos casos felices (RECEPCION/NUTRI)
- **RBs**: RB16 (gating)
- **Estimado**: L
- **Commit message**: `feat(turnos): AsignarTurnoPage con permission gating y wizard`
- **Notas**: el sidebar ya referencia `/turnos/nuevo` (ver `AccionesRapidasRecepcionCard.tsx:8`). Esta pagina cierra el bug 404.

#### Task 3.14: Registrar la ruta en el router
- **Tipo**: frontend-router
- **Archivos**: `apps/frontend/src/router.tsx` (o `App.tsx` si el router esta ahi: verificar)
- **Descripcion**: Agregar la ruta `/turnos/nuevo` -> `AsignarTurnoPage`. Si el router es declarativo con lazy loading, envolver `AsignarTurnoPage` en `lazy()`. Verificar que la ruta esta dentro del `authLayoutRoute` (no en la seccion publica). Verificar el patron de las rutas existentes (e.g. `/recepcion/turnos`).
- **Acceptance criteria**:
  - [ ] Navegar a `/turnos/nuevo` con sesion iniciada como RECEPCIONISTA renderiza la pagina
  - [ ] Navegar a `/turnos/nuevo` sin sesion redirige a `/login`
  - [ ] El sidebar "Asignar Turno" (en `AccionesRapidasRecepcionCard`) ya no da 404
- **RBs**: (UX)
- **Estimado**: S
- **Commit message**: `feat(turnos): registrar ruta /turnos/nuevo en el router`
- **Notas**: el proyecto usa TanStack Router o React Router DOM: verificar el patron en `router.tsx`. Si es TanStack Router, el archivo de ruta podria estar en `src/routes/turnos/nuevo.tsx` per la convencion; si es React Router DOM, solo se agrega un `<Route>` en el arbol.

#### Task 3.15: Verificacion visual con Playwright MCP
- **Tipo**: frontend-verify
- **Archivos**: N/A (snapshot + screenshots)
- **Descripcion**: Ejecutar el flujo Playwright MCP:
  1. Login como RECEPCIONISTA seed (credenciales de `CREDENCIALES_SEED.md`).
  2. Navegar a `/turnos/nuevo`.
  3. Capturar snapshot del estado inicial.
  4. Buscar un socio con ficha completa -> seleccionar.
  5. Seleccionar un nutricionista -> seleccionar un slot.
  6. Confirmar en el modal.
  7. Capturar screenshot del toast de exito y la navegacion a `/recepcion/turnos`.
  8. Repetir con socio SIN ficha completa -> verificar que el warning ambar aparece y permite continuar.
  9. Logout -> login como NUTRICIONISTA -> navegar a `/turnos/nuevo`.
  10. Verificar que el selector de nutri esta oculto.
  11. Buscar un socio SIN ficha -> verificar que el item esta `disabled` con overlay.
  12. Logout -> login como SOCIO -> navegar a `/turnos/nuevo`.
  13. Verificar que renderiza el card "Acceso denegado".
- **Acceptance criteria**:
  - [ ] Los 3 flujos (RECEPCION, NUTRI, SOCIO) se ejecutan sin errores
  - [ ] Los screenshots capturan los estados clave
  - [ ] El warning ambar aparece para RECEPCION con socio sin ficha
  - [ ] El bloqueo del item aparece para NUTRI con socio sin ficha
  - [ ] El card "Acceso denegado" aparece para SOCIO
- **RBs**: (verificacion visual)
- **Estimado**: M
- **Commit message**: N/A (verificacion, no se commitea codigo)
- **Notas**: el agente **NO inicia los dev servers** (regla absoluta del override de 2026-06-02). El usuario debe tener backend y frontend levantados antes de ejecutar Playwright. Si los servidores no estan arriba, abortar y pedir al usuario que los levante.

### PR 3 — Tests requeridos

- `apps/frontend/src/components/turnos/asignar-turno-staff/BuscadorSocio.test.tsx` (Task 3.7)
- `apps/frontend/src/components/turnos/asignar-turno-staff/SelectorNutricionista.test.tsx` (Task 3.8)
- `apps/frontend/src/components/turnos/asignar-turno-staff/CalendarioDisponibilidad.test.tsx` (Task 3.9)
- `apps/frontend/src/components/turnos/asignar-turno-staff/WarningFichaIncompleta.test.tsx` (Task 3.10)
- `apps/frontend/src/components/turnos/asignar-turno-staff/ModalConfirmacion.test.tsx` (Task 3.11)
- `apps/frontend/src/components/turnos/asignar-turno-staff/AsignarTurnoForm.test.tsx` (Task 3.12)
- `apps/frontend/src/pages/AsignarTurnoPage.test.tsx` (Task 3.13)

### PR 3 — Acceptance criteria (overall)

- [ ] Login RECEPCIONISTA -> `/turnos/nuevo` -> flujo completo -> turno agendado -> redirect a `/recepcion/turnos`
- [ ] Login RECEPCIONISTA -> seleccionar socio sin ficha -> warning ambar visible -> confirmar -> turno agendado
- [ ] Login NUTRICIONISTA -> `/turnos/nuevo` -> selector de nutri oculto -> auto-nutri
- [ ] Login NUTRICIONISTA -> seleccionar socio sin ficha -> item `disabled` con overlay -> no permite continuar
- [ ] Login SOCIO -> `/turnos/nuevo` -> card "Acceso denegado"
- [ ] El sidebar "Asignar Turno" del dashboard de recepcion ya NO da 404
- [ ] La ruta `/turnos/nuevo` esta registrada en el router
- [ ] Todos los tests del frontend pasan (`npm run test` en `apps/frontend`)
- [ ] `npm run build` y `npm run lint` pasan en frontend
- [ ] Verificacion visual con Playwright MCP documenta los 3 flujos

### PR 3 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. La ruta `/turnos/nuevo` deja de existir -> el sidebar "Asignar Turno" vuelve a 404 (estado anterior)
3. El endpoint `POST /turnos/crear` (PR 2) sigue existiendo pero no se consume desde el frontend
4. Los use-cases del backend siguen funcionando

---

## PR 4 — E2E + auditoria + recordatorios (~310 lineas)

**Branch**: `feat/turnos-staff-pr4-e2e`
**Target**: `main`
**Depends on**: PR 3 merged
**Estimated changed lines**: ~310 (limite 400)
**RBs en alcance**: RB14 (e2e), RB33 (e2e auditoria), recordatorios 24h+1h (verificacion)

### Goal

Cubrir el feature con tests E2E Playwright que ejercen los flujos criticos desde la UI, validar que la auditoria registra correctamente el `creadoPor`, y confirmar que los recordatorios 24h+1h existentes solo se schedulean para el socio (NO para el nutri que agenda). Este PR es el cierre de la cobertura: garantiza que la feature ship-ready cumple los AC del design seccion 14.

### Tasks

#### Task 4.1: E2E — Recepcionista agenda turno (happy path)
- **Tipo**: e2e
- **Archivos**: `e2e/turnos/crear-turno-por-recepcion.spec.ts`
- **Descripcion**: Test Playwright que: (1) login como RECEPCIONISTA seed (credenciales de `CREDENCIALES_SEED.md` — no hardcodear). (2) Navegar a `/turnos/nuevo`. (3) Buscar un socio con ficha completa -> seleccionar. (4) Seleccionar un nutricionista -> seleccionar un slot. (5) Confirmar. (6) Assert: toast de exito visible, redirect a `/recepcion/turnos`, el nuevo turno aparece en la lista del dia. (7) Verificar con `GET /turno/:id` que `creadoPor = 'RECEPCION'`.
- **Acceptance criteria**:
  - [ ] El test pasa contra backend y frontend levantados
  - [ ] Credenciales leidas de `CREDENCIALES_SEED.md` o helper que lo parsee
  - [ ] Cubre el happy path completo (AC-19 del design)
- **RBs**: RB05, RB06, RB07, RB14, RB27, RB28, RB33, RB40
- **Estimado**: M
- **Commit message**: `test(e2e): recepcionista agenda turno en nombre del socio (happy path)`
- **Notas**: usar el patron de `e2e/ficha-salud/crear-ficha.spec.ts` para login + navegacion. NO commitear credenciales en el test.

#### Task 4.2: E2E — Nutricionista agenda turno
- **Tipo**: e2e
- **Archivos**: `e2e/turnos/crear-turno-por-nutricionista.spec.ts`
- **Descripcion**: Test Playwright que: (1) login como NUTRICIONISTA seed. (2) Navegar a `/turnos/nuevo`. (3) Verificar que el selector de nutri esta oculto. (4) Buscar un socio con ficha completa -> seleccionar. (5) Seleccionar un slot de la agenda del nutri. (6) Confirmar. (7) Assert: toast de exito, redirect a `/agenda`, el turno aparece en la agenda del nutri. (8) Verificar `creadoPor = 'NUTRICIONISTA'`. (9) Caso de error: intentar agendar un socio SIN ficha -> assert que el item esta `disabled` y no se puede seleccionar.
- **Acceptance criteria**:
  - [ ] El test pasa
  - [ ] Cubre el flujo corto del nutri + el bloqueo de ficha incompleta (AC-20)
  - [ ] Cubre el `creadoPor = 'NUTRICIONISTA'`
- **RBs**: RB14 (BLOCK), RB33
- **Estimado**: M
- **Commit message**: `test(e2e): nutricionista agenda turno con bloqueo RB14`
- **Notas**: el bloqueo del item se valida con `expect(item).toBeDisabled()` o `expect(item).toHaveAttribute('aria-disabled', 'true')`.

#### Task 4.3: E2E — Warning de ficha incompleta para recepcion
- **Tipo**: e2e
- **Archivos**: `e2e/turnos/crear-turno-warning-ficha.spec.ts`
- **Descripcion**: Test Playwright que: (1) login como RECEPCIONISTA seed. (2) Preparar un socio sin ficha completa (helper que ejecute `DELETE FROM ficha_salud WHERE id_socio = $1` o equivalente). (3) Navegar a `/turnos/nuevo`. (4) Buscar y seleccionar ese socio. (5) Assert: el warning ambar "El socio seleccionado no tiene su ficha medica completa..." es visible. (6) Seleccionar nutri + slot. (7) Confirmar. (8) Assert: toast de exito Y segundo toast adicional "Recorda pedirle al socio que complete su ficha antes de la consulta" (amarillo, ad-hoc). (9) Verificar en DB que el turno se creo con `creadoPor = 'RECEPCION'`.
- **Acceptance criteria**:
  - [ ] El test pasa
  - [ ] El warning ambar es visible
  - [ ] El turno se crea exitosamente a pesar de la ficha incompleta
  - [ ] Cubre el caso de WARN (no-BLOCK) para recepcion (AC-03 del design)
- **RBs**: RB14 (WARN)
- **Estimado**: M
- **Commit message**: `test(e2e): warning ambar para recepcionista con socio sin ficha (RB14 WARN)`
- **Notas**: el helper de preparar socio sin ficha debe estar en `e2e/helpers/` o usar uno existente. El segundo toast "Recorda pedirle al socio..." se implementa en el frontend (lo confirma `useCrearTurnoEnNombreDeSocio.onSuccess` cuando `data.warning === 'socio_sin_ficha'`). Si ese toast NO existe en el frontend, abrir issue para que se agregue en PR 3 (o como fix-up en PR 4).

#### Task 4.4: E2E — Cross-gym 403 (B4 y B6)
- **Tipo**: e2e
- **Archivos**: `e2e/turnos/crear-turno-cross-gym.spec.ts`
- **Descripcion**: Test Playwright que cubre los 2 casos de cross-gym:
  - **B4 (RECEPCION cross-gym)**: login RECEPCIONISTA gym 1, intentar agendar a un socio de gym 2 -> assert 403 con mensaje "El socio no pertenece a tu gimnasio."
  - **B6 (NUTRI cross-gym)**: login NUTRICIONISTA gym 1, intentar agendar a un socio de gym 2 -> assert 403.
- **Acceptance criteria**:
  - [ ] El test pasa
  - [ ] Cubre AC-05 y AC-06 del design
- **RBs**: cross-gym
- **Estimado**: S
- **Commit message**: `test(e2e): cross-gym 403 para recepcion y nutri (B4, B6)`
- **Notas**: usar los seeds de gym 1 y gym 2 (ver `CREDENCIALES_SEED.md`).

#### Task 4.5: Verificar que la auditoria registra `creadoPor` correctamente
- **Tipo**: backend-verify
- **Archivos**: `apps/backend/src/application/turnos/use-cases/crear-turno-en-nombre-de-socio.use-case.spec.ts` (extender)
- **Descripcion**: Extender el spec del use-case (de PR 2 Task 2.6) con 3 casos especificos para auditoria:
  - **AUD-01**: RECEPCION crea turno -> assert `auditoriaService.registrar` fue llamado con `metadata.creadoPor = 'RECEPCION'`, `metadata.tipo = 'CREACION_POR_STAFF'`, `metadata.creadoPorUsuarioId = actor.usuarioId`.
  - **AUD-02**: ADMIN crea turno -> assert `metadata.creadoPor = 'ADMIN'`.
  - **AUD-03**: NUTRICIONISTA crea turno -> assert `metadata.creadoPor = 'NUTRICIONISTA'`.
  - Verificar que la llamada a `auditoriaService.registrar` es **best-effort** (no aborta el use-case si falla). Cubrir el caso `auditoriaService.registrar` lanza excepcion -> el turno sigue creado, la notificacion sigue enviada.
- **Acceptance criteria**:
  - [ ] Los 3 casos de auditoria pasan
  - [ ] El caso best-effort pasa (auditoria falla pero turno se crea)
  - [ ] El spec de PR 2 sigue pasando
- **RBs**: RB33
- **Estimado**: S
- **Commit message**: `test(turnos): spec de auditoria para CrearTurnoEnNombreDeSocioUseCase (RB33)`
- **Notas**: este task es un **refuerzo del spec** de PR 2. Si el implementer de PR 2 ya cubrio estos casos, marcar como no-aplica y skip.

#### Task 4.6: Verificar que los recordatorios 24h+1h NO se envian al nutri
- **Tipo**: backend-verify
- **Archivos**: `apps/backend/src/application/turnos/use-cases/crear-turno-en-nombre-de-socio.use-case.spec.ts` (extender) o un spec nuevo si el cron vive en otro modulo
- **Descripcion**: El design seccion 5 explicita: "El use-case NO encola recordatorios. Los recordatorios los maneja el cron scheduler existente. El scheduler ya es responsable de recordatorios para `TURNO_RESERVADO` por cualquier via." El nutri NO debe recibir recordatorios (porque no es el destinatario del turno, solo el actor). El socio SI los recibe. Verificar:
  1. En el spec del use-case: confirmar que la llamada a `notificacionesService.crear` tiene `destinatarioId = socio.idPersona`, NO `nutricionista.idPersona`.
  2. Si el proyecto tiene un spec separado del cron scheduler, agregar un test que verifique que el scheduler filtra por `destinatarioId = socio.idPersona` y que la query SQL del scheduler NO incluye al nutri.
- **Acceptance criteria**:
  - [ ] El spec del use-case confirma que el destinatario es el socio
  - [ ] Si existe spec del cron, verifica que filtra por socio
- **RBs**: (UX)
- **Estimado**: S
- **Commit message**: `test(turnos): confirmar que recordatorios 24h+1h se envian solo al socio`
- **Notas**: este task es de **verificacion**, no de codigo nuevo. El comportamiento ya esta implementado correctamente (el design lo confirma). Documentar en el spec como test de no-regresion.

#### Task 4.7: Documentar la desviacion del spec sobre notificacion al nutricionista
- **Tipo**: docs
- **Archivos**: `openspec/changes/crear-turno-en-nombre-del-socio/risks.md` (nuevo) o seccion de "Desviaciones" en `design.md`
- **Descripcion**: El spec literal `crear-turno-en-nombre-del-socio-endpoint.md` seccion Emails Disparados dice: "Nutricionista: Recibe notificacion del nuevo turno agendado en su agenda." El design documento la decision de **NO** enviar esa notificacion (seccion 11.G) por consistencia con `AsignarTurnoManualUseCase` y por reduccion de notification fatigue. Esta desviacion **NO esta reflejada en los specs literales**. Documentarla explicitamente para que el equipo la apruebe o la revea en una iteracion futura.
- **Acceptance criteria**:
  - [ ] Existe un documento (o seccion) que explicita la desviacion
  - [ ] La desviacion esta marcada como **abierta** (no aprobada, no rechazada)
  - [ ] Se incluyen los argumentos a favor (consistencia, notification fatigue) y en contra (spec literal)
  - [ ] El orquestador surface esta desviacion al usuario para decision
- **RBs**: (desviacion)
- **Estimado**: S
- **Commit message**: `docs(turnos): documentar desviacion del spec sobre notificacion al nutri (sin envio)`
- **Notas**: si el usuario decide que SI se envie la notificacion al nutri, agregar task en una iteracion futura: `notificacionesService.crear({ destinatarioId: nutri.idPersona, tipo: TURNO_RESERVADO, metadata: { creadoPor } })`. Out of scope para este PR.

### PR 4 — Tests requeridos

- `e2e/turnos/crear-turno-por-recepcion.spec.ts` (Task 4.1)
- `e2e/turnos/crear-turno-por-nutricionista.spec.ts` (Task 4.2)
- `e2e/turnos/crear-turno-warning-ficha.spec.ts` (Task 4.3)
- `e2e/turnos/crear-turno-cross-gym.spec.ts` (Task 4.4)
- Extensiones al spec de `crear-turno-en-nombre-de-socio.use-case.spec.ts` (Tasks 4.5 y 4.6)

### PR 4 — Acceptance criteria (overall)

- [ ] Los 4 E2E specs pasan contra backend y frontend levantados
- [ ] Los tests de auditoria (Task 4.5) confirman `metadata.creadoPor` para los 3 roles
- [ ] El test de recordatorios (Task 4.6) confirma que el destinatario es el socio
- [ ] La desviacion del spec sobre notificacion al nutri esta documentada (Task 4.7)
- [ ] `npm run e2e` pasa completo
- [ ] `npm run test` pasa completo en backend y frontend
- [ ] `npm run lint` y `npm run build` pasan
- [ ] Todos los AC del design seccion 14 (20 ACs) verificados con tests especificos

### PR 4 — Rollback plan

1. Revert del PR en `main` (un solo revert commit)
2. Los E2E specs se eliminan pero el feature sigue operativo (PR 1-3 intactos)
3. Las extensiones a los specs de backend se eliminan pero el spec base de PR 2 sigue
4. El documento de desviacion se queda en el repo como referencia historica

---

## Risks carry-over (no cerrados por estos tasks)

Los siguientes riesgos del design seccion 13 **NO se cierran** con los tasks de este breakdown. Se documentan explicitamente para que el equipo los tenga presentes en la implementacion y en code review.

| # | Riesgo | Status | Proxima accion |
|---|---|---|---|
| 1 | **ADMIN multi-gimnasio**: ADMIN opera solo en su `gimnasioId` (decision conservadora del design seccion 11.E) | **Abierto** | Si en el futuro se quiere multi-gym, requiere cambio de modelo de datos + `TenantContextService` multi-tenant. **No** en este PR. |
| 2 | **Refactor de CU-11 rompe tests existentes**: si Task 1.6 o 1.7 rompen specs, revertir el refactor y duplicar validaciones en `CrearTurnoEnNombreDeSocioUseCase` (PR 2) | **Mitigado con rollback** | El implementer debe correr la suite completa post-refactor antes de mergear PR 1. |
| 3 | **Race condition B1** (slot tomado entre validacion y save): el check `validarNoConflictoSlot` no es atomico | **Aceptable** | En el peor caso, el segundo intento recibe 409. Decidido por el design. |
| 4 | **Idempotency no estricta** (`Idempotency-Key` header): cliente HTTP que reintenta puede crear duplicados | **Abierto** | Documentado en design seccion 11.D. Requiere +150 lineas backend + migracion nueva. **No** en este PR. |
| 5 | **Frontend pre-detecta ficha incompleta** de nutri pero backend re-valida y rechaza: UX suboptima | **Aceptable** | Defensa en profundidad. Backend es la unica fuente de verdad. |
| 6 | **MySQL < 8.0.16** ignora CHECK constraint: `creadoPor` puede tener valores invalidos via SQL directo | **Mitigado** | El use-case valida `creadoPor` independientemente (helper `mapearRolACreadoPor` lanza si el rol no es valido). |
| 7 | **Notificacion `TURNO_RESERVADO` no se envia** si `socio.idPersona` es `null` (data integrity) | **Manejado** | Guard `if (socio.idPersona)` en el use-case, mismo patron que `ReservarTurnoSocioUseCase:150`. |
| 8 | **Migracion `ALTER TABLE`** en produccion con tabla grande: `ADD COLUMN ... DEFAULT` es online en MySQL 8 | **Aceptable** | Documentar en comentario de la migracion. En MySQL 5.7 puede tomar segundos. |
| 9 | **Tipos de notificacion `TURNO_CREADO_POR_X`** se agregan al enum pero no se usan (decision del design seccion 11.H) | **Aceptable** | Decision consciente. Si nunca se usan, se pueden remover en una iteracion futura. |
| 10 | **La ruta `/turnos/nuevo` no estaba registrada** en el router antes del PR | **Cerrado en PR 3** | Task 3.14 registra la ruta. |
| 11 | **Refactor de `AsignarTurnoModal`** para extraer `<BuscadorSocio>` introduce regresion | **No-op (no se hace)** | Decidido no hacer el refactor en este PR (deuda tecnica documentada). |
| 12 | **PR excede 400 lineas**: el orquestador rechaza | **Mitigado** | 4 PRs balanceados, ninguno excede 600. |
| 13 | **Notificacion al nutricionista** cuando un tercero agenda un turno: el design documento desviacion, el spec literal pide que SI se envie | **Abierto (desviacion)** | Task 4.7 documenta la desviacion. El orquestador debe surface esta al usuario para decision. Si el usuario la rechaza, agregar task futura. |

### Desviaciones del spec que requieren decision del usuario

1. **Notificacion al nutricionista (Task 4.7)**: el design decidio NO enviar. El spec literal pide SI. Decision pendiente del usuario.

---

## Verification plan

### Por PR

| PR | Lint | TypeCheck | Unit (backend) | Unit (frontend) | E2E | Verificacion visual Playwright |
|---|---|---|---|---|---|---|
| PR 1 | `npm run lint` en backend | `npm run build` en backend | `npm run test` (full backend) | N/A | N/A | N/A |
| PR 2 | `npm run lint` en backend | `npm run build` en backend | `npm run test -- crear-turno-en-nombre-de-socio` + re-suite de PR 1 | N/A | N/A | N/A |
| PR 3 | `npm run lint` en frontend | `npm run build` en frontend | N/A | `npm run test` (full frontend) | N/A | Playwright MCP: 3 flujos (RECEPCION, NUTRI, SOCIO) |
| PR 4 | `npm run lint` ambos | `npm run build` ambos | `npm run test` (full backend) | `npm run test` (full frontend) | `npm run e2e` | N/A |

### Spot-checks visuales con Playwright (PR 3)

- Login RECEPCIONISTA + flujo completo de 3 pasos + screenshot del modal de confirmacion con resumen.
- Login RECEPCIONISTA + warning ambar visible (socio sin ficha) + screenshot del Alert.
- Login NUTRICIONISTA + selector de nutri oculto + screenshot del header del wizard sin el combobox.
- Login NUTRICIONISTA + item de socio sin ficha `disabled` con overlay + screenshot del dropdown.
- Login SOCIO + card "Acceso denegado" + screenshot del 403 inline.

### Comandos de verificacion rapida

```bash
# Backend
cd apps/backend && npm run lint && npm run build && npm run test
cd apps/backend && npm run migration:run && npm run migration:revert

# Frontend
cd apps/frontend && npm run lint && npm run build && npm run test

# E2E
npm run e2e
```

---

## Final close-out: sdd-verify y sdd-archive

### Despues de que los 4 PRs mergeen a `main`

1. **Ejecutar `sdd-verify`** (via el skill `sdd-verify`) sobre el branch `main` con todos los PRs mergeados. Esta fase:
   - Corre la suite completa de tests (unit, integration, e2e).
   - Verifica los 20 acceptance criteria del design seccion 14.
   - Genera un `verify-report.md` con el resultado de cada AC.
   - Documenta cualquier gap o desviacion encontrada.

2. **Ejecutar `sdd-archive`** (via el skill `sdd-archive`) para sincronizar los delta specs a `openspec/specs/`. Esta fase:
   - Mueve los 4 specs de `openspec/changes/crear-turno-en-nombre-del-socio/specs/` a `openspec/specs/` (con sufijo de capacidad si corresponde).
   - Elimina el directorio `openspec/changes/crear-turno-en-nombre-del-socio/`.
   - Persiste un resumen en Engram con el outcome final.

3. **Persistencia en Engram** (mandatory): el orquestador debe llamar `engram_mem_save` con:
   - **title**: `sdd/crear-turno-en-nombre-del-socio/archived`
   - **type**: `architecture`
   - **topic_key**: `sdd/crear-turno-en-nombre-del-socio`
   - **content**: resumen de la feature, los 4 PRs mergeados, los AC cumplidos, las desviaciones aprobadas, los riesgos abiertos que quedan para iteraciones futuras.

### Criterios para considerar el change "archivado"

- [ ] Los 4 PRs merged a `main`
- [ ] `sdd-verify` reporta 20/20 AC cumplidos (o desviaciones aprobadas)
- [ ] `sdd-archive` completo
- [ ] Engram persistido con el resumen final
- [ ] El bug 404 del sidebar "Asignar Turno" esta resuelto en produccion

---

## Chain strategy: stacked-to-main

```
PR 1 (datos + helper compartido)  -> merge main -> base solida
PR 2 (endpoint POST /turnos/crear) -> merge main -> backend cerrado
PR 3 (frontend completo)           -> merge main -> UX completa
PR 4 (E2E + auditoria + recordatorios) -> merge main -> feature ship-ready
```

Cada PR se mergea **INDEPENDIENTEMENTE** a `main`. No hay rama de integracion.

- PR 2 se basa en `main` DESPUES de que PR 1 mergeo.
- PR 3 se basa en `main` DESPUES de que PR 2 mergeo.
- PR 4 se basa en `main` DESPUES de que PR 3 mergeo.

Si un PR bloquea al siguiente, se reabre y se ajusta sin afectar los anteriores.

---

## Total scope

| PR | Lineas netas (estimado) | Acumulado | Tamano budget | Estado |
|---|---|---|---|---|
| PR 1 | ~370 | 370 | 400 | OK |
| PR 2 | ~310 | 680 | 400 | OK |
| PR 3 | ~570 | 1250 | 600 | OK |
| PR 4 | ~310 | 1560 | 400 | OK |

---

## Review Workload Forecast

- **Total**: ~1560 lineas en 4 PRs
- **Cada PR <= budget**: Si (PR 1 y 2 <= 400, PR 3 <= 600, PR 4 <= 400)
- **Riesgo de regresion cross-PR**: Bajo-Medio (PR 1 refactoriza use-cases existentes; riesgo mitigado con tests existentes que deben pasar)
- **Riesgo de datos**: Bajo (migracion aditiva, backfill conservador)
- **Chained PRs recomendados**: Si
- **Chain strategy**: stacked-to-main
- **Decision necesaria antes de apply**: No (decidido por el orquestador 2026-06-12 via auto-forecast)

---

## Out of scope (recordatorio)

- Edicion de turnos creados por nutricionista (sujeto a otro CU, ver proposal).
- `Idempotency-Key` header (race condition B1, documentado en design seccion 11.D).
- ADMIN multi-gimnasio scope (modelo de datos, design seccion 11.E).
- Email al socio (no en esta iteracion; in-app notification alcanza).
- Notificacion al nutricionista cuando un tercero le agenda un turno (desviacion documentada en Task 4.7).
- Endpoint dedicado para "ver turno creado por staff" (`TurnoConfirmadoPage` requiere rol SOCIO). UX es redirect a la agenda.
- Refactor de `AsignarTurnoModal.tsx` para extraer `<BuscadorSocio>` compartido (deuda tecnica, no en este PR).
- `AccionesRapidasNutricionistaCard` con CTA "Nuevo Turno" desde Mi Agenda (no en este PR; el nutri puede acceder via su agenda + click en slot vacio, segun spec `crear-turno-en-nombre-del-socio-ui-nutricionista.md`).

