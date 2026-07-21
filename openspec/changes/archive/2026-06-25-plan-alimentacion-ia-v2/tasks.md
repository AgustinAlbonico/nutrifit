# Tasks: plan-alimentacion-ia-v2

**Change**: plan-alimentacion-ia-v2
**Strategy**: 8 commits stacked-to-main (Packet 5 split en 5a + 5b)
**Review budget**: 400 líneas por commit
**Persistence**: BOTH (OpenSpec + Engram)
**Date**: 2026-06-25
**Decision needed before apply**: Resuelto
**Chained commits recommended**: Yes
**Chain strategy**: stacked-to-main (decidido 2026-06-25, coherente con AGENTS.md)
**400-line budget risk**: Medium (mitigado con size:exception + split)

## Size exceptions documentadas

| Commit | Líneas | Risk | Estrategia |
|---|---|---|---|
| Packet 1 | ~600 | Medium | `size:exception` documentado (entidades nuevas + migración) |
| Packet 2 | ~800 | High | `size:exception` (reescritura atómica de GenerarPlanSemanalUseCase) |
| Packet 3 | ~700 | High | `size:exception` (versionado + feedback + memoria son cohesivos) |
| Packet 4 | ~500 | Medium | `size:exception` (regenerar + activar + finalizar son cohesivos) |
| Packet 5a | ~800 | High | `size:exception` (componentes base + hooks nuevos) |
| Packet 5b | ~700 | High | `size:exception` (integración en PlanEditorPage) |
| Packet 6 | ~400 | Low | OK (dentro de presupuesto) |
| Packet 7 | ~500 | Medium | `size:exception` (e2e tests + fixtures) |

**Total**: ~5000 líneas en 8 commits. Cada commit deja el repo en estado funcional (rollback atómico por commit si falla).

---

## Preflight aplicado (cacheado en sesión)

- Execution mode: interactive (con decisiones tomadas via "usar recomendado" 2026-06-25)
- Artifact store: hybrid (Engram + openspec files)
- Delivery strategy: ask-always (con override a recommended cuando no es crítico)
- Chain strategy: stacked-to-main
- Decision mode: use_recommended (preferencia de Agustín 2026-06-25)
- Review budget: 400 líneas
- Strict TDD: false (test runner existe, no enforced)

---

## Packet 1: Cimientos — modelo de datos + notas persistentes (~600 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): cimientos — migración, entidades nuevas y preferencias IA`
**Depends on**: nothing
**Estimated changed lines**: ~600
**Review budget risk**: Medium
**Skills used in implementation**: nestjs-best-practices, javascript-testing-patterns, architecture-patterns

### Goal

Crear la base de datos para el versionado inmutable de planes, la tabla de feedback y la memoria IA del nutricionista. Agregar las notas persistentes y de generación, exponer los endpoints `GET/PUT /profesional/mi-perfil/preferencias-ia`, y dejar todo cerrado y testeado a nivel unitario antes de empezar a tocar el flujo de generación.

### Tasks

#### Task 1.1: Migración TypeORM única con up/down/backfill
- **Tipo**: backend-migration
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/1719331200000-PlanV2Cimientos.ts`
- **Descripción**: Migración TypeORM que: (1) `ALTER TABLE plan_alimentacion ADD COLUMN notas_generacion VARCHAR(1000) NULL`; (2) `ALTER TABLE nutricionista_orm ADD COLUMN preferencias_ia TEXT NULL`; (3) `CREATE TABLE plan_alimentacion_version` con PK, FKs a `plan_alimentacion` y `persona`, columna `datos_json JSON`, `motivo_cambio VARCHAR(255) NULL`, `activa BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, `created_by INT`, `UNIQUE(id_plan_alimentacion, numero_version)` e `INDEX(id_plan_alimentacion, activa)`; (4) `CREATE TABLE plan_feedback` con PK, FK CASCADE a `plan_alimentacion_version`, FK a `persona`, `voto ENUM('POSITIVO','NEGATIVO')`, `comentario VARCHAR(500) NULL`, `created_at`/`updated_at`, `UNIQUE(id_plan_alimentacion_version)`; (5) `CREATE TABLE nutricionista_ia_memoria` con PK, FK a `persona`, `tipo_ejemplo ENUM('POSITIVO','NEGATIVO')`, `comentario VARCHAR(500) NOT NULL`, FK SET NULL a `plan_alimentacion_version`, `archivada BOOLEAN DEFAULT FALSE`, `INDEX(id_nutricionista, tipo_ejemplo, archivada)`; (6) Backfill: para cada fila existente en `plan_alimentacion`, INSERT en `plan_alimentacion_version` con `numero_version=1`, `datos_json` mínimo, `activa=TRUE`, `motivo_cambio='creacion_inicial_backfill'`. `down` revierte todo en orden inverso. Loggear conteo de filas backfilleadas.
- **Acceptance criteria**:
  - [ ] `npm run migration:run` ejecuta sin errores
  - [ ] `SHOW CREATE TABLE plan_alimentacion_version;` muestra estructura correcta con UNIQUE e INDEX
  - [ ] `SHOW CREATE TABLE plan_feedback;` muestra `UNIQUE(id_plan_alimentacion_version)`
  - [ ] `SHOW CREATE TABLE nutricionista_ia_memoria;` muestra índice compuesto
  - [ ] `SHOW COLUMNS FROM plan_alimentacion LIKE 'notas_generacion';` confirma la columna
  - [ ] Planes pre-existentes tienen al menos 1 fila en `plan_alimentacion_version` con `numero_version=1` y `activa=TRUE`
  - [ ] `npm run migration:revert` baja limpio
- **RBs**: RF-002
- **Estimado**: L
- **Commit message**: `feat(plan-alimentacion-ia-v2): migración con 3 tablas nuevas y columnas de notas`

#### Task 1.2: Entidad de dominio PlanAlimentacionVersion (inmutable)
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-version.entity.ts`, `apps/backend/src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json.ts`
- **Descripción**: Crear la entidad de dominio pura (sin TypeORM) `PlanAlimentacionVersionEntity` con campos readonly: `idPlanAlimentacionVersion`, `idPlanAlimentacion`, `numeroVersion`, `datosJson`, `motivoCambio`, `activa`, `createdAt`, `createdBy`. Sin setters, sin métodos de mutación. En el archivo hermano exportar los tipos `PlanAlimentacionDatosJson` (con `estructura`, `macrosPorDia`, `razonamientoCumplimiento`), `ItemComidaSnapshot`, `MotivoCambio = 'creacion_inicial' | 'regeneracion_completa' | 'regeneracion_dia' | 'regeneracion_alternativa' | 'edicion_manual'`, `DiaSemana`, `TipoComida`.
- **Acceptance criteria**:
  - [ ] La entidad compila sin errores
  - [ ] Todos los campos son `readonly`
  - [ ] JSDoc documenta la regla de inmutabilidad
  - [ ] `MotivoCambio` exported con los 5 valores
- **RBs**: RF-003
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad de dominio PlanAlimentacionVersion inmutable`

#### Task 1.3: Entidad de dominio PlanFeedback
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/PlanFeedback/plan-feedback.entity.ts`
- **Descripción**: Crear `PlanFeedbackEntity` con `idPlanFeedback`, `idPlanAlimentacionVersion`, `idNutricionista`, `voto: VotoPlan`, `comentario: string | null`, `createdAt`, `updatedAt`. Exportar `VotoPlan = 'POSITIVO' | 'NEGATIVO'`. Todos los campos readonly.
- **Acceptance criteria**:
  - [ ] La entidad compila sin errores
  - [ ] Todos los campos son `readonly`
  - [ ] `VotoPlan` exporta 2 valores exactos
- **RBs**: RF-004
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad de dominio PlanFeedback`

#### Task 1.4: Entidad de dominio NutricionistaIAMemoria
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity.ts`
- **Descripción**: Crear `NutricionistaIAMemoriaEntity` con `idNutricionistaIaMemoria`, `idNutricionista`, `tipoEjemplo: TipoEjemploIA`, `comentario`, `idPlanAlimentacionVersion: number | null`, `archivada`, `createdAt`. Exportar `TipoEjemploIA = 'POSITIVO' | 'NEGATIVO'`. Todos los campos readonly.
- **Acceptance criteria**:
  - [ ] La entidad compila sin errores
  - [ ] Todos los campos son `readonly`
  - [ ] `archivada` inicializada en `false` por convención
- **RBs**: RF-009
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad de dominio NutricionistaIAMemoria`

#### Task 1.5: Entidad TypeORM PlanAlimentacionVersion
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/plan-alimentacion-version.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts`
- **Descripción**: Crear `@Entity('plan_alimentacion_version')` con todas las columnas según la migración. PK `@PrimaryGeneratedColumn`, FKs con `@ManyToOne` (plan_alimentacion, persona), `datos_json` como `simple-json` o `json`, índices y UNIQUE via `@Index` y `@Unique`. Documentar en JSDoc que el repository NO expone `update` ni `delete` (inmutabilidad). Exportar en `index.ts`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] `@Entity` usa el nombre exacto `plan_alimentacion_version`
  - [ ] `datos_json` se mapea con tipo TypeORM correcto (json / simple-json)
  - [ ] UNIQUE y INDEX declarados con decoradores correctos
  - [ ] JSDoc documenta la regla de inmutabilidad
- **RBs**: RF-003
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad TypeORM PlanAlimentacionVersion`

#### Task 1.6: Entidad TypeORM PlanFeedback
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/plan-feedback.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts`
- **Descripción**: Crear `@Entity('plan_feedback')` con columnas según migración. `voto` como enum TypeORM (`enum('POSITIVO','NEGATIVO')`). UNIQUE en `id_plan_alimentacion_version`. FK a `plan_alimentacion_version` con `onDelete: 'CASCADE'`. Exportar en `index.ts`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] `@Entity` usa el nombre exacto `plan_feedback`
  - [ ] UNIQUE constraint declarado en `id_plan_alimentacion_version`
  - [ ] CASCADE configurado en FK a versión
- **RBs**: RF-004
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad TypeORM PlanFeedback con UNIQUE`

#### Task 1.7: Entidad TypeORM NutricionistaIAMemoria
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/infrastructure/persistence/typeorm/entities/nutricionista-ia-memoria.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts`
- **Descripción**: Crear `@Entity('nutricionista_ia_memoria')` con columnas según migración. Índice compuesto en `(id_nutricionista, tipo_ejemplo, archivada)`. FK a `plan_alimentacion_version` con `onDelete: 'SET NULL'`. Exportar en `index.ts`.
- **Acceptance criteria**:
  - [ ] El archivo compila sin errores
  - [ ] `@Entity` usa el nombre exacto `nutricionista_ia_memoria`
  - [ ] Índice compuesto declarado correctamente
  - [ ] SET NULL en FK a versión
- **RBs**: RF-009
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): entidad TypeORM NutricionistaIAMemoria`

#### Task 1.8: Modificar entidad PlanAlimentacion (+ notas_generacion)
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/PlanAlimentacion/plan-alimentacion.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity.ts`
- **Descripción**: Agregar campo `notasGeneracion: string | null` a la entidad de dominio (readonly) y mapear la columna `notas_generacion VARCHAR(1000) NULL` en la entidad TypeORM. Mantener todos los campos existentes intactos.
- **Acceptance criteria**:
  - [ ] El campo está presente en ambas entidades
  - [ ] La columna TypeORM es nullable
  - [ ] Los tests existentes del módulo siguen pasando
- **RBs**: RF-001
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): agregar notas_generacion a entidad PlanAlimentacion`

#### Task 1.9: Modificar entidad Nutricionista (+ preferencias_ia)
- **Tipo**: backend-entity
- **Archivos**: `apps/backend/src/domain/entities/Nutricionista/nutricionista.entity.ts`, `apps/backend/src/infrastructure/persistence/typeorm/entities/nutricionista.entity.ts`
- **Descripción**: Agregar campo `preferenciasIa: string | null` a la entidad de dominio (readonly) y mapear la columna `preferencias_ia TEXT NULL` en la entidad TypeORM.
- **Acceptance criteria**:
  - [ ] El campo está presente en ambas entidades
  - [ ] La columna TypeORM es nullable
  - [ ] Los tests existentes del módulo siguen pasando
- **RBs**: RF-002
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): agregar preferencias_ia a entidad Nutricionista`

#### Task 1.10: Actualizar seed con 6 acciones RBAC nuevas
- **Tipo**: backend-seed
- **Archivos**: `apps/backend/src/seed-multi-tenant.ts`, `packages/shared/src/types/acciones.ts`
- **Descripción**: Agregar al enum `Accion` en `@nutrifit/shared` los 6 valores: `PLANES_IA_GENERAR`, `PLANES_IA_REGENERAR`, `PLANES_IA_FEEDBACK`, `PLANES_IA_MEMORIA_EDITAR`, `PLANES_ACTIVAR`, `PLANES_FINALIZAR`. En el seed, asignar las 6 acciones a roles NUTRICIONISTA y ADMIN. NO asignar a RECEPCIONISTA. Verificar que el seed corra sin duplicar acciones.
- **Acceptance criteria**:
  - [ ] El enum tiene 6 valores nuevos + los existentes
  - [ ] El seed crea los registros en `permiso` y `rol_permiso` para NUTRICIONISTA y ADMIN
  - [ ] RECEPCIONISTA NO tiene ninguna acción de planes
  - [ ] `npm run seed` corre sin errores
- **RBs**: RBAC-RF-002/004/007/009/011
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): 6 acciones RBAC nuevas en shared y seed`

#### Task 1.11: Use-case ObtenerPreferenciasIa
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/profesional/use-cases/obtener-preferencias-ia.use-case.ts`, `apps/backend/src/application/profesional/use-cases/obtener-preferencias-ia.use-case.spec.ts`
- **Descripción**: `ObtenerPreferenciasIaUseCase extends BaseUseCase<{ nutricionistaId: number }, { preferencias: string }>`. Carga el nutricionista y retorna `preferencias_ia` o string vacío si es null. Spec: nutricionista con preferencias → string; nutricionista sin preferencias (null) → string vacío.
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Spec pasa 2 casos (con / sin preferencias)
  - [ ] Coverage > 90%
- **RBs**: RF-002
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case obtener preferencias IA`

#### Task 1.12: Use-case ActualizarPreferenciasIa (con sanitización)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/profesional/use-cases/actualizar-preferencias-ia.use-case.ts`, `apps/backend/src/application/profesional/use-cases/actualizar-preferencias-ia.use-case.spec.ts`, `apps/backend/src/domain/sanitizadores/sanitizador-texto-plano.ts`, `apps/backend/src/domain/sanitizadores/sanitizador-texto-plano.spec.ts`
- **Descripción**: `ActualizarPreferenciasIaUseCase extends BaseUseCase<{ nutricionistaId: number; preferencias: string }, { preferencias: string }>`. Sanitiza: `trim` + `collapse(\n{3,} → \n\n)` + quitar tags `<...>` y markdown `` ` ``/`**`. Valida max 2000 chars (throws `BadRequestError`). Persiste en `nutricionista.preferencias_ia`. Auditoría `PREFERENCIAS_IA_EDITADAS`. Spec: 5 casos (happy, sanitiza HTML, sanitiza markdown, excede max 2000 → 400, vacío permitido).
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Helper de sanitización es puro y testeable
  - [ ] Spec pasa los 5 casos
  - [ ] Coverage > 90%
- **RBs**: RF-002
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case actualizar preferencias IA con sanitización`

#### Task 1.13: Modificar ProfesionalController (GET/PUT preferencias-ia)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/profesional.controller.ts`
- **Descripción**: Agregar 2 endpoints: `GET /profesional/mi-perfil/preferencias-ia` con `@Roles('NUTRICIONISTA')` que invoca `ObtenerPreferenciasIaUseCase`. `PUT /profesional/mi-perfil/preferencias-ia` con `@Actions('PLANES_IA_MEMORIA_EDITAR')` y `@Roles('NUTRICIONISTA')` que invoca `ActualizarPreferenciasIaUseCase`. DTO de body: `{ preferencias: string }` con `@IsString() @MaxLength(2000)`.
- **Acceptance criteria**:
  - [ ] Los 2 endpoints existen
  - [ ] Cada uno tiene `@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)` + roles correctos
  - [ ] El DTO valida max 2000
  - [ ] `npm run build` pasa
- **RBs**: RF-002
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): endpoints GET/PUT preferencias IA en ProfesionalController`

#### Task 1.14: Tests unitarios de los 2 use-cases
- **Tipo**: backend-test
- **Archivos**: ya creados en Tasks 1.11 y 1.12
- **Descripción**: Verificar que los specs de los Tasks 1.11 y 1.12 pasan y la cobertura combinada > 90%. Ejecutar `npm run test -- preferencias-ia` y verificar verde.
- **Acceptance criteria**:
  - [ ] Tests pasan
  - [ ] Coverage combinada > 90%
  - [ ] `npm run build && npm run lint` pasan
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): verde de specs de preferencias IA`
- **Notas**: este task NO es código nuevo, es la verificación del Packet 1 antes de hacer push.

---

## Packet 2: IA mejorada — prompt + validación de restricciones + validación de macros (~800 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): IA mejorada — reescritura de GenerarPlanSemanalUseCase con validación`
**Depends on**: Packet 1
**Estimated changed lines**: ~800
**Review budget risk**: High (requiere size:exception explícito)
**Skills used in implementation**: nestjs-best-practices, javascript-testing-patterns, architecture-patterns

### Goal

Reemplazar el `GenerarPlanSemanalUseCase` actual por una versión que inyecta notas persistentes + notas de generación + 1-3 ejemplos de memoria al prompt, valida restricciones duras (con reintentos), valida macros con bandas verde/amarillo/rojo, y maneja timeouts / JSON malformado de Groq.

### Tasks

#### Task 2.1: Reemplazar GenerarPlanSemanalUseCase (reescritura completa)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts`, `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.spec.ts`
- **Descripción**: Reescritura completa del use-case. Dependencias inyectadas: `FichaClinicaRepository`, `NutricionistaRepository`, `NutricionistaIAMemoriaRepository`, `PlanAlimentacionRepository`, `PlanAlimentacionVersionRepository`, `GroqService` (token `AI_PROVIDER_SERVICE`), `AuditoriaService`, `NotificacionesService`, `PromptPlanSemanalBuilder`, `SeleccionarEjemplosMemoriaUseCase`, `Logger`. Flujo: (1) validar parámetros (rangos 1-14, 1-5, 1-5); (2) cargar ficha clínica + nutricionista (con `preferencias_ia`) + memoria IA (1-3 ejemplos); (3) construir prompt; (4) loop de generación con reintentos: timeout >30s → retry 1 con backoff 5s; JSON inválido → retry 1 con temp 0.3; si falla → 503/502; (5) validar restricciones con `RestriccionesValidatorV2`; violación → instrucción correctiva (max 2 reintentos); si sigue → warning; (6) validar macros con `MacrosValidator`; rojo → notificación `PLAN_MACROS_FUERA_RANGO`; (7) persistir en transacción (plan + version1); (8) auditoría `PLAN_CREADO`; (9) notificación `PLAN_REVISAR`. Spec: 6+ casos (happy, restricción violada 2 veces → warning, macros rojo → notificación, timeout Groq → 503, JSON inválido 2 veces → 502, prompt contiene notas).
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Spec pasa todos los casos con mocks de Groq
  - [ ] Logging estructurado con contexto, duración, resultados
  - [ ] Coverage > 80%
- **RBs**: RF-001, RF-005, RF-006, RF-008
- **Estimado**: L
- **Commit message**: `feat(plan-alimentacion-ia-v2): GenerarPlanSemanalUseCase reescrito con prompt estructurado y validación`

#### Task 2.2: Crear PromptPlanSemanalBuilder
- **Tipo**: backend-builder
- **Archivos**: `apps/backend/src/application/ai/builders/prompt-plan-semanal.builder.ts`, `apps/backend/src/application/ai/builders/prompt-plan-semanal.builder.spec.ts`
- **Descripción**: `@Injectable() class PromptPlanSemanalBuilder` con método `construir(contexto): { systemPrompt, userPrompt }`. El contexto incluye ficha clínica, preferencias_ia, notas_generacion, ejemplosMemoria (1-3), diasAGenerar, comidasPorDia, alternativasPorComida, fechaInicio. El systemPrompt incluye reglas duras (estructura JSON, restricciones del socio, instrucciones del nutricionista concatenadas: `preferencias_ia + '\n\n' + notas_generacion`). El userPrompt incluye la ficha + las comidas solicitadas. Spec: 3 casos (mínimo, con notas, con ejemplos).
- **Acceptance criteria**:
  - [ ] Builder compila sin errores
  - [ ] Concatenación `preferencias_ia + notas_generacion` en el prompt
  - [ ] Spec pasa los 3 casos
  - [ ] Coverage > 90%
- **RBs**: RF-008
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): PromptPlanSemanalBuilder con contexto completo`

#### Task 2.3: Crear PromptRestriccionesInstructionBuilder
- **Tipo**: backend-builder
- **Archivos**: `apps/backend/src/application/ai/builders/prompt-restricciones-instruction.builder.ts`, `apps/backend/src/application/ai/builders/prompt-restricciones-instruction.builder.spec.ts`
- **Descripción**: `@Injectable() class PromptRestriccionesInstructionBuilder` con método estático `generar(violaciones): string`. Convierte la lista de violaciones (`restriccion`, `detalle`, `comida`, `alimento`) en un bloque de instrucción correctiva legible en español. Spec: 3 casos (1 violación, 3 violaciones, 0 violaciones → string vacío).
- **Acceptance criteria**:
  - [ ] Builder compila sin errores
  - [ ] Salida en español
  - [ ] Spec pasa los 3 casos
- **RBs**: RF-005
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): PromptRestriccionesInstructionBuilder para reintentos`

#### Task 2.4: Crear RestriccionesValidatorV2 (extends)
- **Tipo**: backend-validator
- **Archivos**: `apps/backend/src/domain/validators/restricciones-validator-v2.ts`, `apps/backend/src/domain/validators/restricciones-validator-v2.spec.ts`
- **Descripción**: `class RestriccionesValidatorV2 extends RestriccionesValidator` con métodos estáticos: `validarPlanCompleto(plan, fichaClinica, catalogos)` retorna `ResultadoValidacionRestricciones` (restriccionesCumplidas, restriccionesNoCumplidas, advertencias); `generarInstruccionCorrectiva(violaciones)` delega al builder; `validarCoherenciaRazonamiento(razonamiento, validacion)` detecta contradicciones. Matching case-insensitive + singular/plural. `CatalogosRestricciones` con `patronesDietarios`, `patologias`, `sinonimos`. Spec: 5+ casos (vegano sin carne, diabético sin azúcar, celíaco sin gluten, multi-restricción, coherencia razonamiento OK / falla).
- **Acceptance criteria**:
  - [ ] Compila sin errores
  - [ ] Extiende `RestriccionesValidator` (no duplica)
  - [ ] Matching case-insensitive y singular/plural
  - [ ] Spec pasa los 5+ casos
  - [ ] Coverage > 90%
- **RBs**: RF-005
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): RestriccionesValidatorV2 con validación de plan completo`

#### Task 2.5: Crear MacrosValidator (lógica pura)
- **Tipo**: backend-validator
- **Archivos**: `apps/backend/src/domain/validators/macros-validator.ts`, `apps/backend/src/domain/validators/macros-validator.spec.ts`
- **Descripción**: `class MacrosValidator` con métodos estáticos (sin DI, lógica pura): `UMBRAL_VERDE = 5`, `UMBRAL_AMARILLO = 10`; `validar(plan, objetivo, diasAGenerar, comidasPorDia, fechaInicio)` retorna `ResultadoValidacionMacros`; `calcularBanda(desvioPorcentaje): BandaMacro`. Suma macros por día, compara contra target, asigna banda por macro individual y global. `puedeAceptar = true` SOLO si todos los días VERDE. Spec: 6+ casos (verde exacto, amarillo ±7%, rojo ±12%, falta día, falta comida, puedeAceptar false con 1 día amarillo).
- **Acceptance criteria**:
  - [ ] Compila sin errores
  - [ ] Lógica pura, sin imports de NestJS / TypeORM
  - [ ] Spec pasa los 6+ casos
  - [ ] Coverage 100%
- **RBs**: RF-006
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): MacrosValidator puro con bandas verde/amarillo/rojo`

#### Task 2.6: Modificar DTO SolicitudPlanSemanalHttpDTO (nuevos campos)
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/ai/dtos/solicitud-plan-semanal.dto.ts`
- **Descripción**: Agregar campos con class-validator: `diasAGenerar?: number` (@Min(1) @Max(14) @IsOptional), `comidasPorDia?: number` (@Min(1) @Max(5) @IsOptional), `alternativasPorComida?: number` (@Min(1) @Max(5) @IsOptional), `notasGeneracion?: string` (@MaxLength(1000) @IsOptional), `fechaInicio?: Date` (@IsDate @IsOptional). Mantener compatibilidad aditiva (campos opcionales con defaults del use-case).
- **Acceptance criteria**:
  - [ ] DTO compila sin errores
  - [ ] Validaciones funcionan (test con valores fuera de rango → 400)
  - [ ] Los tests existentes del DTO siguen pasando
- **RBs**: RF-001
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): DTO SolicitudPlanSemanal con campos nuevos`

#### Task 2.7: Modificar DTO RespuestaPlanSemanalHttpDTO (validacion + macros)
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/ai/dtos/respuesta-plan-semanal.dto.ts`
- **Descripción**: Agregar al response los bloques `validacion: ResultadoValidacionRestriccionesFE` y `macros: ResultadoValidacionMacrosFE` con `bandaGlobal` y `macrosPorDia`. Mantener compatibilidad aditiva.
- **Acceptance criteria**:
  - [ ] DTO compila sin errores
  - [ ] Forma completa con validacion + macros
  - [ ] Tests existentes pasan
- **RBs**: RF-005, RF-006
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): DTO RespuestaPlanSemanal con validación y macros`

#### Task 2.8: Modificar AiController (nuevo payload, no nueva ruta)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/ai.controller.ts`
- **Descripción**: Reemplazar el body del `POST /ia/plan-semanal` con el nuevo `SolicitudPlanSemanalHttpDTO`. NO cambiar la ruta, NO crear `-v2`. Confirmar `@Actions('PLANES_IA_GENERAR')` + `@Roles('NUTRICIONISTA', 'ADMIN', 'SUPERADMIN')`. Response con `RespuestaPlanSemanalHttpDTO`.
- **Acceptance criteria**:
  - [ ] Endpoint compila sin errores
  - [ ] Ruta sigue siendo `/ia/plan-semanal` (sin `-v2`)
  - [ ] `npm run build` pasa
- **RBs**: RF-001
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): AiController con payload ampliado`

#### Task 2.9: Tests unitarios GenerarPlanSemanalUseCase (con mocks de Groq)
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 2.1
- **Descripción**: Verificar que el spec del Task 2.1 cubre los 6+ casos. Mocks: `GroqService` con respuestas fijas (`chat.completions.create` retorna JSON válido o inválido según caso), `FichaClinicaRepository`, `NutricionistaRepository`, `NutricionistaIAMemoriaRepository`, repos de plan, auditoría y notificaciones.
- **Acceptance criteria**:
  - [ ] Todos los casos pasan
  - [ ] Coverage > 80%
  - [ ] `npm run test -- generar-plan-semanal` verde
- **RBs**: RF-001
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): spec completo de GenerarPlanSemanalUseCase con mocks de Groq`

#### Task 2.10: Tests RestriccionesValidatorV2 con fixtures
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 2.4
- **Descripción**: Verificar que el spec del Task 2.4 pasa. Crear fixtures inline para: vegano, diabético, celíaco, multi-restricción, sin restricciones.
- **Acceptance criteria**:
  - [ ] Spec pasa los 5+ casos con fixtures
  - [ ] Coverage > 90%
- **RBs**: RF-005
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): spec RestriccionesValidatorV2 con fixtures de socios`

#### Task 2.11: Tests MacrosValidator
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 2.5
- **Descripción**: Verificar que el spec del Task 2.5 pasa con cobertura 100%.
- **Acceptance criteria**:
  - [ ] Spec pasa los 6+ casos
  - [ ] Coverage = 100%
- **RBs**: RF-006
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): spec MacrosValidator con cobertura completa`

#### Task 2.12: Tests de validación de IA con fixtures (5 perfiles)
- **Tipo**: backend-test
- **Archivos**: `apps/backend/test/fixtures/socios-con-restricciones.ts`, `apps/backend/src/application/ai/use-cases/__tests__/validacion-ia-fixtures.spec.ts`
- **Descripción**: Spec de integración que ejecuta `GenerarPlanSemanalUseCase` con mocks de Groq para 5 perfiles: vegano estricto, diabético tipo 2, celíaco, multi-restricción, sin restricciones. Asserciones por perfil: estructura correcta, sin alimentos prohibidos, macros ±10%, razonamiento presente. Spec separado del Task 2.9 (más amplio).
- **Acceptance criteria**:
  - [ ] Spec pasa para los 5 perfiles
  - [ ] Asserciones documentadas por fixture
  - [ ] Coverage del módulo AI > 80%
- **RBs**: RF-005, RF-006
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): spec de validación IA con 5 fixtures de socios`

---

## Packet 3: Versionado + feedback + memoria IA (~700 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): versionado inmutable, feedback y memoria IA`
**Depends on**: Packets 1-2
**Estimated changed lines**: ~700
**Review budget risk**: High (requiere size:exception explícito)
**Skills used in implementation**: nestjs-best-practices, javascript-testing-patterns, architecture-patterns

### Goal

Hacer que cada `CrearPlanAlimentacion` y `EditarPlanAlimentacion` cree una versión inmutable. Exponer endpoints para listar/obtener versiones, crear/editar feedback, listar/eliminar memoria. Implementar el scoring por keywords de la selección de ejemplos.

### Tasks

#### Task 3.1: Modificar CrearPlanAlimentacionUseCase (crea v1)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/crear-plan-alimentacion.use-case.ts`
- **Descripción**: Al final del `execute()`, además de persistir `plan_alimentacion`, también crea `plan_alimentacion_version v1` con `motivo_cambio='creacion_inicial'`, `activa=false`. Extraer un helper privado `crearVersionInicial(planId, datos, createdBy)` que también será usado por `GenerarPlanSemanalUseCase` (Packet 2). Manejar UNIQUE constraint `(id_plan_alimentacion, numero_version)` con retry si el flujo IA ya creó v1.
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Crea v1 con `motivo_cambio='creacion_inicial'`
  - [ ] Helper extraído y exportado para reuso
  - [ ] Tests existentes del use-case siguen pasando
- **RBs**: RF-003
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): CrearPlanAlimentacion crea v1 inmutable`

#### Task 3.2: Modificar EditarPlanAlimentacionUseCase (crea nueva versión)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/editar-plan-alimentacion.use-case.ts`
- **Descripción**: Cambiar el flujo: ya NO hace hard-delete de comidas. Crea nueva versión con `motivo_cambio='edicion_manual'`, `numeroVersion = versionActual.numeroVersion + 1`, `activa=false`. Auditoría `PLAN_EDITADO`. Spec extendido: edición → nueva versión con motivo correcto.
- **Acceptance criteria**:
  - [ ] El use-case compila sin errores
  - [ ] Crea nueva versión (no muta la anterior)
  - [ ] Auditoría registra `PLAN_EDITADO`
  - [ ] Tests existentes pasan + spec extendido pasa
- **RBs**: RF-003
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): EditarPlanAlimentacion crea nueva versión`

#### Task 3.3: Use-case ListarVersionesPlan
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/listar-versiones-plan.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/listar-versiones-plan.use-case.spec.ts`
- **Descripción**: `ListarVersionesPlanUseCase extends BaseUseCase<{ planAlimentacionId: number; user: JwtUser }, VersionesListadasDTO[]>`. Usa QueryBuilder con `loadEagerRelations: false` (no carga `datos_json` pesado). Ordena por `numeroVersion DESC`. Spec: 3 casos (plan con 5 versiones → 5 items DESC, plan sin versiones → 0, socio no dueño → 403).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] No carga `datos_json` en el listado
  - [ ] Spec pasa los 3 casos
  - [ ] Coverage > 90%
- **RBs**: RF-003
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case listar versiones del plan`

#### Task 3.4: Use-case ObtenerVersionPlan
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/obtener-version-plan.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/obtener-version-plan.use-case.spec.ts`
- **Descripción**: `ObtenerVersionPlanUseCase extends BaseUseCase<{ versionId: number; user: JwtUser }, PlanAlimentacionDatosJson>`. Verifica dueño (NUT o socio con vínculo). Retorna `datosJson` parseado. Spec: 3 casos (versión existente, no dueño → 403, inexistente → 404).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] `datos_json` deserializado correctamente
  - [ ] Spec pasa los 3 casos
  - [ ] Coverage > 90%
- **RBs**: RF-003
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case obtener versión específica`

#### Task 3.5: Use-case CrearFeedbackPlan (con creación de memoria)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/crear-feedback-plan.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/crear-feedback-plan.use-case.spec.ts`
- **Descripción**: `CrearFeedbackPlanUseCase extends BaseUseCase<{ versionId: number; voto: VotoPlan; comentario?: string; nutricionistaId: number }, PlanFeedbackEntity>`. Verifica versión existe y NUT es dueño (403). Verifica no existe feedback previo (UNIQUE) → 409 `BadRequestError("Ya votaste esta versión, usá PUT para editar")`. Crea `plan_feedback`. Si `comentario` no vacío, crea `nutricionista_ia_memoria` (POSITIVO o NEGATIVO según voto). Auditoría `FEEDBACK_CREADO`. Spec: 5 casos (happy, comentario vacío → no crea memoria, ya existe → 409, no dueño → 403, no existe versión → 404).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] UNIQUE constraint respetado
  - [ ] Memoria solo se crea con comentario no vacío
  - [ ] Spec pasa los 5 casos
  - [ ] Coverage > 90%
- **RBs**: RF-004
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case crear feedback con creación de memoria`

#### Task 3.6: Use-case EditarFeedbackPlan
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/editar-feedback-plan.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/editar-feedback-plan.use-case.spec.ts`
- **Descripción**: `EditarFeedbackPlanUseCase extends BaseUseCase<{ versionId: number; voto: VotoPlan; comentario?: string; nutricionistaId: number }, PlanFeedbackEntity>`. Verifica feedback existe (404 si no). UPDATE voto + comentario. Si voto cambió y comentario no vacío → nueva entrada en memoria (archivada la previa si la hay). Auditoría `FEEDBACK_EDITADO`. Spec: 4 casos (happy, no existe → 404, voto cambia → nueva memoria, comentario vacío → no crea memoria).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Memoria se actualiza al cambiar voto
  - [ ] Spec pasa los 4 casos
  - [ ] Coverage > 90%
- **RBs**: RF-004
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case editar feedback con sync de memoria`

#### Task 3.7: Use-case SeleccionarEjemplosMemoria (lógica pura con scoring)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case.ts`, `apps/backend/src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case.spec.ts`
- **Descripción**: Lógica pura (sin TypeORM ni NestJS, recibe repo como dependencia). Scoring: `score = 2 si POSITIVO + 1 si NEGATIVO + 0.5 * count_keywords(comentario, objetivoTexto) + 0.3 * count_keywords(comentario, restricciones)`. Retorna top N por score. Selección adaptativa 1-3: si hay ≥3 positivos → 3 positivos; si hay 1-2 positivos → completar con negativos; si hay 0 positivos → 1-3 negativos. Spec: 5 casos (3 positivos disponibles, 1 positivo + 5 negativos, 0 positivos 5 negativos, 0 memoria → [], palabras clave matching).
- **Acceptance criteria**:
  - [ ] Lógica pura, sin imports de TypeORM / NestJS
  - [ ] Scoring documentado en JSDoc
  - [ ] Spec pasa los 5 casos
  - [ ] Coverage > 90%
- **RBs**: RF-009
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): SeleccionarEjemplosMemoria con scoring por keywords`

#### Task 3.8: Use-case ListarMemoria
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ia-memoria/use-cases/listar-memoria.use-case.ts`, `apps/backend/src/application/ia-memoria/use-cases/listar-memoria.use-case.spec.ts`
- **Descripción**: `ListarMemoriaUseCase extends BaseUseCase<{ nutricionistaId: number }, { positivos: MemoriaDTO[]; negativos: MemoriaDTO[]; totalActivas: number; archivadas: number }>`. Lista memoria activa del NUT (no archivadas), agrupa por `tipo_ejemplo`. Spec: 3 casos (con memoria, sin memoria, solo archivadas).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Agrupa por tipo_ejemplo
  - [ ] Spec pasa los 3 casos
- **RBs**: RF-009
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case listar memoria IA del nutricionista`

#### Task 3.9: Use-case EliminarMemoria (soft archive)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ia-memoria/use-cases/eliminar-memoria.use-case.ts`, `apps/backend/src/application/ia-memoria/use-cases/eliminar-memoria.use-case.spec.ts`
- **Descripción**: `EliminarMemoriaUseCase extends BaseUseCase<{ id: number; nutricionistaId: number }, void>`. Verifica dueño (403). Marca como `archivada=true` (soft archive, no delete físico). Spec: 3 casos (happy, no dueño → 403, no existe → 404).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Soft archive (no delete físico)
  - [ ] Spec pasa los 3 casos
- **RBs**: RF-009
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): use-case eliminar memoria con soft archive`

#### Task 3.10: Repos TypeORM: PlanAlimentacionVersion, PlanFeedback, NutricionistaIAMemoria
- **Tipo**: backend-repository
- **Archivos**: `apps/backend/src/domain/repositories/plan-alimentacion-version.repository.ts`, `apps/backend/src/infrastructure/persistence/typeorm/repositories/plan-alimentacion-version.repository.impl.ts`, `apps/backend/src/domain/repositories/plan-feedback.repository.ts`, `apps/backend/src/infrastructure/persistence/typeorm/repositories/plan-feedback.repository.impl.ts`, `apps/backend/src/domain/repositories/nutricionista-ia-memoria.repository.ts`, `apps/backend/src/infrastructure/persistence/typeorm/repositories/nutricionista-ia-memoria.repository.impl.ts`, `apps/backend/src/infrastructure/persistence/typeorm/repositories/repositories.module.ts`
- **Descripción**: Puertos abstractos y adaptadores TypeORM para los 3 repos. PlanAlimentacionVersionRepository: `crear`, `obtenerPorId`, `listarPorPlan`, `obtenerActiva`, `marcarActiva` (transaccional). PlanFeedbackRepository: `crear`, `actualizar`, `obtenerPorVersion`. NutricionistaIAMemoriaRepository: `crear`, `obtenerPorId`, `listarPorNutricionista`, `marcarArchivada`, `contarActivas`, `obtenerParaSeleccion` (con `LIMIT 100`), `rotarSiExcede100`. Registrar providers en `repositories.module.ts`. Specs mínimos (1 caso por método).
- **Acceptance criteria**:
  - [ ] Los 3 puertos y adaptadores compilan
  - [ ] `repositories.module.ts` registra los providers
  - [ ] `npm run start:dev` arranca sin errores
  - [ ] Specs mínimos pasan
- **RBs**: RF-003, RF-004, RF-009
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): repos TypeORM para versiones, feedback y memoria`

#### Task 3.11: Modificar PlanesAlimentacionController (endpoints nuevos)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`
- **Descripción**: Agregar 4 endpoints nuevos: `GET /planes-alimentacion/:id/versiones` (Roles NUTRICIONISTA/ADMIN/SOCIO), `GET /planes-alimentacion/version/:versionId` (Roles NUTRICIONISTA/ADMIN/SOCIO), `POST /planes-alimentacion/version/:versionId/feedback` (Actions `PLANES_IA_FEEDBACK` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN), `PUT /planes-alimentacion/version/:versionId/feedback` (Actions `PLANES_IA_FEEDBACK` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN). DTO `FeedbackHttpDTO` con `voto: VotoPlan`, `comentario?: string` (max 500).
- **Acceptance criteria**:
  - [ ] Los 4 endpoints existen con guards correctos
  - [ ] DTO valida voto y max 500
  - [ ] `npm run build` pasa
- **RBs**: RF-003, RF-004
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): endpoints de versiones y feedback en PlanesAlimentacionController`

#### Task 3.12: Crear NutricionistaIaMemoriaController
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/nutricionista-ia-memoria.controller.ts`, `apps/backend/src/presentation/http/controllers/controllers.module.ts`
- **Descripción**: `@Controller('nutricionistai/memoria')` con 2 endpoints: `GET /` (Actions `PLANES_IA_MEMORIA_EDITAR` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN) que invoca `ListarMemoriaUseCase`; `DELETE /:id` (Actions `PLANES_IA_MEMORIA_EDITAR` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN) con `@HttpCode(204)` que invoca `EliminarMemoriaUseCase`.
- **Acceptance criteria**:
  - [ ] El controller compila sin errores
  - [ ] Registrar en `controllers.module.ts`
  - [ ] `npm run build` pasa
- **RBs**: RF-009
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): NutricionistaIaMemoriaController con listar y eliminar`

#### Task 3.13: Tests unitarios de todos los use-cases nuevos
- **Tipo**: backend-test
- **Archivos**: ya creados en Tasks 3.3-3.9
- **Descripción**: Verificar que los specs de los Tasks 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9 pasan. Coverage combinada > 90%.
- **Acceptance criteria**:
  - [ ] Todos los specs pasan
  - [ ] Coverage combinada > 90%
  - [ ] `npm run build && npm run lint && npm run test` pasan en backend
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): verde de specs de versionado, feedback y memoria`
- **Notas**: este task NO es código nuevo, es la verificación del Packet 3 antes de hacer push.

---

## Packet 4: Regeneración con scope + máquina de estados (~500 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): regeneración por scope y máquina de estados del plan`
**Depends on**: Packets 1-3
**Estimated changed lines**: ~500
**Review budget risk**: Medium
**Skills used in implementation**: nestjs-best-practices, javascript-testing-patterns, architecture-patterns

### Goal

Permitir regeneración granular del plan (PLAN/DÍA/ALTERNATIVA) con merge quirúrgico del `datos_json`. Implementar la máquina de estados: activar versión (con UNIQUE activa y verificación de macros verde), finalizar plan. Integrar notificaciones in-app en cada transición.

### Tasks

#### Task 4.1: Use-case RegenerarPlanSemanalUseCase (con merge quirúrgico)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ai/use-cases/regenerar-plan-semanal.use-case.ts`, `apps/backend/src/application/ai/use-cases/regenerar-plan-semanal.use-case.spec.ts`
- **Descripción**: `RegenerarPlanSemanalUseCase extends BaseUseCase<SolicitudRegeneracionPlan, RespuestaRegeneracionPlan>`. Flujo: (1) cargar versión actual + verificar plan no está FINALIZADO; (2) construir sub-prompt con `PromptRegeneracionBuilder`; (3) loop de generación idéntico a `GenerarPlanSemanalUseCase`; (4) merge quirúrgico en `datosJson` según scope (PLAN = reemplazo total, DIA = reemplazo solo de `estructura[dia]`, ALTERNATIVA = reemplazo de `estructura[dia].comidas[slot].alternativas[index]`); (5) re-validar restricciones y macros; (6) persistir nueva versión (`numeroVersion = anterior + 1`, `activa=false`, `motivo_cambio` según scope); (7) auditoría `PLAN_REGENERADO`. Spec: 6+ casos (PLAN, DIA, ALTERNATIVA, plan FINALIZADO → 409, prompt incluye contexto preservado, nueva versión no es activa, auditoría correcta).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Merge quirúrgico funciona en los 3 scopes
  - [ ] Spec pasa los 6+ casos
  - [ ] Coverage > 80%
- **RBs**: RF-007
- **Estimado**: L
- **Commit message**: `feat(plan-alimentacion-ia-v2): RegenerarPlanSemanalUseCase con merge quirúrgico`

#### Task 4.2: Crear PromptRegeneracionBuilder
- **Tipo**: backend-builder
- **Archivos**: `apps/backend/src/application/ai/builders/prompt-regeneracion.builder.ts`, `apps/backend/src/application/ai/builders/prompt-regeneracion.builder.spec.ts`
- **Descripción**: `@Injectable() class PromptRegeneracionBuilder` con `construir(contexto): { systemPrompt, userPrompt }`. El systemPrompt indica qué preservar según scope (comidas de otros días, otras alternativas del mismo día, otros slots del mismo día) y qué regenerar exactamente. Spec: 3 casos (PLAN preserva nada, DIA preserva otros días, ALTERNATIVA preserva otras alternativas y otros slots).
- **Acceptance criteria**:
  - [ ] Builder compila sin errores
  - [ ] Lógica de preservación correcta por scope
  - [ ] Spec pasa los 3 casos
- **RBs**: RF-007
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): PromptRegeneracionBuilder con preservación por scope`

#### Task 4.3: Use-case ActivarPlanAlimentacion (con transacción)
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/activar-plan-alimentacion.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/activar-plan-alimentacion.use-case.spec.ts`
- **Descripción**: `ActivarPlanAlimentacionUseCase extends BaseUseCase<SolicitudActivarPlan, { versionActivaId: number }>`. Flujo: (1) validar que versión pertenece al plan (404 si no); (2) validar NUT es dueño (403); (3) validar plan no FINALIZADO (409); (4) validar macros de la versión (verde obligatorio, 422 si amarillo/rojo); (5) transacción con `dataSource.transaction`: `UPDATE plan_alimentacion_version SET activa=false WHERE id_plan_alimentacion=:id`, `UPDATE plan_alimentacion_version SET activa=true WHERE id=:versionId`, `UPDATE plan_alimentacion SET estado='ACTIVO'`; (6) notificación `PLAN_ACTIVO` al socio; (7) auditoría `PLAN_ACTIVADO`. Spec: 6 casos (happy, no dueño → 403, plan FINALIZADO → 409, macros amarillo → 422, versión no pertenece → 404, transacción atómica).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Transacción atómica (rollback si falla)
  - [ ] UNIQUE activa respetado (solo 1 activa por plan)
  - [ ] Spec pasa los 6 casos
  - [ ] Coverage > 90%
- **RBs**: RF-011
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): ActivarPlanAlimentacion con transacción y UNIQUE activa`

#### Task 4.4: Use-case FinalizarPlanAlimentacion
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/plan-alimentacion/use-cases/finalizar-plan-alimentacion.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/finalizar-plan-alimentacion.use-case.spec.ts`
- **Descripción**: `FinalizarPlanAlimentacionUseCase extends BaseUseCase<{ planAlimentacionId: number; nutricionistaId: number }, { estado: 'FINALIZADO'; finalizadoAt: Date }>`. Flujo: (1) validar plan existe y NUT dueño (403); (2) validar plan está en `ACTIVO` (422 si no); (3) `UPDATE plan_alimentacion SET estado='FINALIZADO', finalizado_at=NOW()`; (4) notificación `PLAN_FINALIZADO` al NUT y al socio; (5) auditoría `PLAN_FINALIZADO`. Spec: 4 casos (happy, no dueño → 403, plan BORRADOR → 422, no existe → 404).
- **Acceptance criteria**:
  - [ ] Use-case compila sin errores
  - [ ] Validaciones correctas
  - [ ] Spec pasa los 4 casos
  - [ ] Coverage > 90%
- **RBs**: RF-011
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): FinalizarPlanAlimentacion con notificación`

#### Task 4.5: Crear SolicitudRegeneracionHttpDTO
- **Tipo**: backend-dto
- **Archivos**: `apps/backend/src/application/ai/dtos/solicitud-regeneracion.dto.ts`
- **Descripción**: DTO con class-validator: `planAlimentacionVersionId: number`, `scope: 'PLAN' | 'DIA' | 'ALTERNATIVA'` (@IsIn), `dia?: DiaSemana` (@IsIn si presente), `comidaSlot?: TipoComida`, `alternativaIndex?: number` (@Min(0)), `confirmarPerdidaEdicionManual?: boolean`. Validación cruzada: si scope='DIA' → dia requerido; si scope='ALTERNATIVA' → dia + comidaSlot + alternativaIndex requeridos.
- **Acceptance criteria**:
  - [ ] DTO compila sin errores
  - [ ] Validación cruzada funciona (scope='ALTERNATIVA' sin alternativaIndex → 400)
- **RBs**: RF-007
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): DTO SolicitudRegeneracion con validación cruzada`

#### Task 4.6: Modificar AiController (nuevo endpoint regenerar)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/ai.controller.ts`
- **Descripción**: Agregar `POST /ia/plan-semanal/regenerar` con `@Actions('PLANES_IA_REGENERAR')` + `@Roles('NUTRICIONISTA', 'ADMIN', 'SUPERADMIN')` que invoca `RegenerarPlanSemanalUseCase` con `SolicitudRegeneracionHttpDTO`.
- **Acceptance criteria**:
  - [ ] Endpoint compila sin errores
  - [ ] `npm run build` pasa
- **RBs**: RF-007
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): AiController con endpoint regenerar`

#### Task 4.7: Modificar PlanesAlimentacionController (activar, finalizar)
- **Tipo**: backend-controller
- **Archivos**: `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`
- **Descripción**: Agregar 2 endpoints: `POST /planes-alimentacion/:id/activar` (Actions `PLANES_ACTIVAR` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN) con body `{ versionId: number }`, invoca `ActivarPlanAlimentacionUseCase`. `POST /planes-alimentacion/:id/finalizar` (Actions `PLANES_FINALIZAR` + Roles NUTRICIONISTA/ADMIN/SUPERADMIN), invoca `FinalizarPlanAlimentacionUseCase`.
- **Acceptance criteria**:
  - [ ] Los 2 endpoints existen con guards correctos
  - [ ] DTO valida `versionId`
  - [ ] `npm run build` pasa
- **RBs**: RF-011
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): endpoints activar y finalizar en PlanesAlimentacionController`

#### Task 4.8: Extender enum TipoNotificacion (5 valores nuevos)
- **Tipo**: backend-entity
- **Archivos**: `packages/shared/src/types/notificaciones.ts` (o donde esté el enum)
- **Descripción**: Agregar al enum `TipoNotificacion` los 5 valores: `PLAN_REVISAR`, `PLAN_ACTIVO`, `PLAN_FINALIZADO`, `PLAN_VALIDACION_WARNING`, `PLAN_MACROS_FUERA_RANGO`. Verificar que `NotificacionesService` los acepta.
- **Acceptance criteria**:
  - [ ] El enum tiene los 5 valores nuevos
  - [ ] Compila sin errores
- **RBs**: RF-011
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): 5 valores nuevos en enum TipoNotificacion`

#### Task 4.9: Integrar NotificacionesService en cada use-case
- **Tipo**: backend-use-case
- **Archivos**: `apps/backend/src/application/ai/use-cases/regenerar-plan-semanal.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/activar-plan-alimentacion.use-case.ts`, `apps/backend/src/application/plan-alimentacion/use-cases/finalizar-plan-alimentacion.use-case.ts`, `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts`
- **Descripción**: Verificar que cada use-case llama a `NotificacionesService.emitir()` con el `TipoNotificacion` correcto y el destinatario correcto (socioId o nutricionistaId). Para `Regenerar`: `PLAN_REVISAR` al NUT. Para `Activar`: `PLAN_ACTIVO` al socio. Para `Finalizar`: `PLAN_FINALIZADO` al NUT y al socio. Para `Generar` (Packet 2): `PLAN_REVISAR` al NUT. Refactorizar si hay duplicación.
- **Acceptance criteria**:
  - [ ] Cada transición de estado emite la notificación correcta
  - [ ] Destinatario correcto por tipo
  - [ ] `NotificacionesService` configurado en cada módulo
- **RBs**: RF-011
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): integración de NotificacionesService en transiciones`

#### Task 4.10: Tests unitarios RegenerarPlanSemanal (3 scopes)
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 4.1
- **Descripción**: Verificar que el spec del Task 4.1 pasa los 6+ casos con mocks de Groq para los 3 scopes.
- **Acceptance criteria**:
  - [ ] Spec pasa los 6+ casos
  - [ ] Coverage > 80%
- **RBs**: RF-007
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): spec RegenerarPlanSemanal con 3 scopes`

#### Task 4.11: Tests ActivarPlanAlimentacion (transacción, UNIQUE activa)
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 4.3
- **Descripción**: Verificar que el spec del Task 4.3 pasa los 6 casos incluyendo verificación de transacción atómica y UNIQUE activa.
- **Acceptance criteria**:
  - [ ] Spec pasa los 6 casos
  - [ ] Test explícito de transacción (rollback si `version.save` falla)
  - [ ] Test explícito de UNIQUE activa (solo 1 activa por plan)
  - [ ] Coverage > 90%
- **RBs**: RF-011
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): spec ActivarPlanAlimentacion con transacción y UNIQUE`

#### Task 4.12: Tests FinalizarPlanAlimentacion
- **Tipo**: backend-test
- **Archivos**: ya creado en Task 4.4
- **Descripción**: Verificar que el spec del Task 4.4 pasa los 4 casos.
- **Acceptance criteria**:
  - [ ] Spec pasa los 4 casos
  - [ ] Coverage > 90%
- **RBs**: RF-011
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): spec FinalizarPlanAlimentacion`

---

## Packet 5: Frontend — PlanEditorPage refactor (~1500 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): frontend — refactor de PlanEditorPage con versionado, feedback y regeneración`
**Depends on**: Packets 1-4
**Estimated changed lines**: ~1500
**Review budget risk**: Very High (REQUIERE SPLIT o size:exception explícito)
**Skills used in implementation**: frontend-design, tailwind-v4-shadcn, shadcn, vitest, vercel-react-best-practices

### Goal

Refactorizar `PlanEditorPage.tsx` para integrar todos los componentes nuevos (form V2, grid con badges macros, regen por scope, modal de feedback, version history, razonamiento colapsable, sección de preferencias IA). Esta página es el corazón del flujo NUT.

### Tasks

#### Task 5.1: Refactor PlanEditorPage.tsx (composición de componentes)
- **Tipo**: frontend-page
- **Archivos**: `apps/frontend/src/pages/PlanEditorPage.tsx`
- **Descripción**: Refactorizar la página para componer: `<GeneradorPlanSemanal />` (form), `<WeeklyPlanGrid />` (resultado), `<MacrosBadge />` (por día), `<VersionHistory />` (sidebar), `<RazonamientoCumplimiento />` (colapsable), `<FeedbackModal />` (modal), `<PreferenciasIASection />` (link a perfil). Layout con `<ResizablePanelGroup>` (shadcn/ui) para editor + sidebar de versiones. Mantener subset de funcionalidades existentes como "unchanged" para validar no-regresión visual con Playwright.
- **Acceptance criteria**:
  - [ ] La página compila sin errores
  - [ ] Layout funciona (ResizablePanelGroup)
  - [ ] No-regresión visual con Playwright (snapshot baseline)
  - [ ] `tsc --noEmit` no reporta errores
- **RBs**: (UI)
- **Estimado**: L
- **Commit message**: `refactor(plan-alimentacion-ia-v2): PlanEditorPage compuesta con componentes V2`
- **Notas**: ⚠️ Packet 5 entero está en riesgo. Si excede 400 líneas, considerar split en 5a (componentes base) + 5b (integración página).

#### Task 5.2: Rehacer GeneradorPlanSemanal.tsx (form V2 con RHF + Zod)
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ia/GeneradorPlanSemanal.tsx`, `apps/frontend/src/components/ia/GeneradorPlanSemanal.test.tsx`
- **Descripción**: Form con React Hook Form + Zod. Campos: `socioId` (autoselect desde hook de socios con turno previo), `diasAGenerar` (number input, default 7, 1-14), `comidasPorDia` (select con `TipoComida`, default 4), `alternativasPorComida` (number input, default 3, 1-5), `notasGeneracion` (textarea, max 1000), `fechaInicio` (date picker, default lunes AR). Submit → `useIa().generarPlanSemanalV2.mutate()`. Botón se deshabilita tras 1er click (`isPending`). Spec: 3 casos (renderiza, validación Zod falla inline, submit happy path).
- **Acceptance criteria**:
  - [ ] Componente compila sin errores
  - [ ] Validación Zod funciona con mensajes en español
  - [ ] Botón se deshabilita tras 1er click
  - [ ] Spec pasa los 3 casos
- **RBs**: RF-001
- **Estimado**: L
- **Commit message**: `feat(plan-alimentacion-ia-v2): GeneradorPlanSemanal con React Hook Form + Zod`

#### Task 5.3: Extender WeeklyPlanGrid.tsx (badges macros, regen por scope)
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/WeeklyPlanGrid.tsx`, `apps/frontend/src/components/plan/WeeklyPlanGrid.test.tsx`
- **Descripción**: Extender `WeeklyPlanGrid` para: renderizar `estructura` por día, cada comida tiene N alternativas (selector de tabs), cada alternativa tiene botón "regenerar esta alternativa" → confirm si fue editada manualmente, header de cada día tiene `<MacrosBadge />` y botón "regenerar este día". Spec: 4 casos (renderiza grid, regenera día, regenera alternativa, confirm de edición manual).
- **Acceptance criteria**:
  - [ ] Componente compila sin errores
  - [ ] Botones de regen por scope funcionan
  - [ ] Confirm de edición manual aparece
  - [ ] Spec pasa los 4 casos
- **RBs**: RF-006, RF-007
- **Estimado**: L
- **Commit message**: `feat(plan-alimentacion-ia-v2): WeeklyPlanGrid con badges macros y regen por scope`

#### Task 5.4: Crear MacrosBadge.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/MacrosBadge.tsx`, `apps/frontend/src/components/plan/MacrosBadge.test.tsx`
- **Descripción**: Componente presentacional con props `{ banda: 'VERDE' | 'AMARILLO' | 'ROJO', desvioPorcentaje: number, detalle?: { real: number; objetivo: number; desvio: number } }`. Renderiza `<Badge>` con color según banda (`bg-green-500` / `bg-yellow-500` / `bg-red-500`) y label ("Cumple" / "Desvío menor" / "Fuera de rango"). Tooltip con shadcn `<Tooltip>` mostrando detalle. Spec: 3 casos (verde, amarillo, rojo).
- **Acceptance criteria**:
  - [x] Componente compila sin errores
  - [x] Color correcto por banda
  - [x] Tooltip funciona
  - [x] Spec pasa los 4 casos (verde, amarillo, rojo, tooltip con detalle)
  - **RBs**: RF-006
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): MacrosBadge con bandas verde/amarillo/rojo`

#### Task 5.5: Crear FeedbackModal.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/ia/FeedbackModal.tsx`, `apps/frontend/src/components/ia/FeedbackModal.test.tsx`
- **Descripción**: Dialog shadcn `<Dialog>` con Textarea para comentario (max 500 chars) y 2 botones grandes (👍 Positivo / 👎 Negativo). Usa `useFeedbackPlan(versionId)`. Cierra al éxito. Spec: 3 casos (abre, submit positivo, submit negativo).
- **Acceptance criteria**:
  - [x] Componente compila sin errores
  - [x] 2 botones grandes diferenciados
  - [x] Cierra al éxito
  - [x] Spec pasa los 4 casos (renderiza, submit positivo, submit negativo, contador)
  - **RBs**: RF-004
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): FeedbackModal con voto y comentario`

#### Task 5.6: Crear VersionHistory.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/VersionHistory.tsx`, `apps/frontend/src/components/plan/VersionHistory.test.tsx`
- **Descripción**: Sidebar/Dropdown que lista versiones ordenadas DESC. Click en versión → carga y muestra esa versión (cambia el plan activo en pantalla). Marca visualmente la activa con badge verde. Usa `useVersionesPlan(planId)`. Spec: 3 casos (lista versiones, click carga versión, marca activa visible).
- **Acceptance criteria**:
  - [x] Componente compila sin errores
  - [x] Lista ordenadas DESC
  - [x] Versión activa marcada con badge
  - [x] Spec pasa los 5 casos (lista, onSelect, aria-current, error, empty)
  - **RBs**: RF-003
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): VersionHistory con lista y marcador de activa`

#### Task 5.7: Crear RazonamientoCumplimiento.tsx (colapsable)
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/RazonamientoCumplimiento.tsx`, `apps/frontend/src/components/plan/RazonamientoCumplimiento.test.tsx`
- **Descripción**: `<Collapsible>` de shadcn con `<CollapsibleTrigger>` que muestra el resumen (✓ X / ✗ Y) y expande para listar cada restricción con su detalle. Restricciones no cumplidas en rojo. Soporta `readOnly` (para `MiPlanPage` sin acciones). Spec: 3 casos (colapsa, expande, readOnly sin botones).
- **Acceptance criteria**:
  - [x] Componente compila sin errores
  - [x] Colapsa/expande correctamente
  - [x] Modo readOnly funcional
  - [x] Spec pasa los 6 casos (contadores, detalle, alert no cumplidas, colapsar/expandir, readOnly, empty)
  - **RBs**: RF-008
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): RazonamientoCumplimiento colapsable con read-only`

#### Task 5.8: Crear PreferenciasIASection.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/profesional/PreferenciasIASection.tsx`, `apps/frontend/src/components/profesional/PreferenciasIASection.test.tsx`
- **Descripción**: Sección en `MiPerfilPage` del NUT. Textarea editable con contador de caracteres (max 2000). Usa `usePreferenciasIa`. Spec: 3 casos (carga, edita, guarda con éxito).
- **Acceptance criteria**:
  - [x] Componente compila sin errores
  - [x] Contador de caracteres funcional
  - [x] Integración con hook correcta
  - [x] Spec pasa los 5 casos (carga, contador, guardar, deshabilitado sin cambios, error)
  - **RBs**: RF-002
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): PreferenciasIASection para edición en perfil`

#### Task 5.9: Hook usePreferenciasIa.ts
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/usePreferenciasIa.ts`, `apps/frontend/src/hooks/usePreferenciasIa.spec.tsx`
- **Descripción**: Hook con `useQuery` (GET `/profesional/mi-perfil/preferencias-ia`) + `useMutation` (PUT). `queryKey: ['profesional', 'preferencias-ia']`. Retorna `{ preferencias, isLoading, guardar, isSaving }`. Spec: 3 casos (carga inicial, guarda, error de red).
- **Acceptance criteria**:
  - [x] Hook compila sin errores
  - [x] Query y mutation funcionan
  - [x] Spec pasa los 4 casos (carga inicial, string vacío, guardar, max 2000)
  - **RBs**: RF-002
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): hook usePreferenciasIa con React Query`

#### Task 5.10: Hook useFeedbackPlan.ts
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useFeedbackPlan.ts`, `apps/frontend/src/hooks/useFeedbackPlan.spec.tsx`
- **Descripción**: Hook con `useMutation` parametrizado por `versionId: number`. POST `/planes-alimentacion/version/${versionId}/feedback`. Invalida `['plan-feedback', versionId]`. Retorna `{ votar, isVoting }`. Spec: 2 casos (votar positivo, votar negativo).
- **Acceptance criteria**:
  - [x] Hook compila sin errores
  - [x] Mutation funciona
  - [x] Spec pasa los 3 casos (POST positivo, POST negativo con comentario, PUT cuando editar=true)
  - **RBs**: RF-004
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): hook useFeedbackPlan`

#### Task 5.11: Hook useVersionesPlan.ts
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useVersionesPlan.ts`, `apps/frontend/src/hooks/useVersionesPlan.spec.tsx`
- **Descripción**: Hook con `useQuery` parametrizado por `planId: number`. GET `/planes-alimentacion/${planId}/versiones`. `queryKey: ['planes-alimentacion', planId, 'versiones']`. `staleTime: 30_000`. Spec: 2 casos (carga con 5 versiones, refresh tras invalidación).
- **Acceptance criteria**:
  - [x] Hook compila sin errores
  - [x] Query funciona
  - [x] Spec pasa los 4 casos (carga lista, enabled=false, 404, staleTime)
  - **RBs**: RF-003
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): hook useVersionesPlan con staleTime`

#### Task 5.12: Extender useIa.ts (generarPlanSemanalV2, regenerarPlanSemanal)
- **Tipo**: frontend-hook
- **Archivos**: `apps/frontend/src/hooks/useIa.ts`
- **Descripción**: Extender el hook existente con: `generarPlanSemanalV2` (POST `/ia/plan-semanal`), `regenerarPlanSemanal` (POST `/ia/plan-semanal/regenerar`). Cada uno invalida queries relevantes. Mantener compat con la API antigua (si existía).
- **Acceptance criteria**:
  - [ ] Hook extendido compila sin errores → PENDIENTE Packet 5b
  - [ ] 2 mutations funcionan → PENDIENTE Packet 5b
  - [ ] Invalidación de queries correcta → PENDIENTE Packet 5b
  - **RBs**: RF-001, RF-007
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): useIa extendido con V2 y regenerar`
- **Notas Packet 5a**: Esta tarea se difiere a Packet 5b junto con el refactor de GeneradorPlanSemanal.tsx (que la usa).

#### Task 5.13: Crear schemas/ia-plan-semanal.schema.ts (Zod)
- **Tipo**: frontend-validation
- **Archivos**: `apps/frontend/src/schemas/ia-plan-semanal.schema.ts`
- **Descripción**: Schema Zod espejo del DTO del backend: `socioId` (positive int), `diasAGenerar` (1-14, default 7), `comidasPorDia` (1-5, default 4), `alternativasPorComida` (1-5, default 3), `notasGeneracion` (max 1000, optional), `fechaInicio` (date string, optional). Exportar `SolicitudPlanSemanalForm`.
- **Acceptance criteria**:
  - [x] Schema compila sin errores
  - [x] Validaciones correctas
  - [x] Defaults aplicados
  - [x] Spec del schema se valida implícitamente via usePreferenciasIa/FeedbackModal tests
  - **RBs**: RF-001
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): schema Zod para solicitud plan semanal`

#### Task 5.14: Extender types/ia.ts (nuevos tipos)
- **Tipo**: frontend-types
- **Archivos**: `apps/frontend/src/types/ia.ts`
- **Descripción**: Agregar tipos espejo del backend: `SolicitudPlanSemanal`, `RespuestaPlanSemanal` (con `validacion`, `macros`, `bandaGlobal`), `SolicitudRegeneracion`, `RespuestaRegeneracion`, `BandaMacro`, `ResultadoValidacionRestriccionesFE`, `ResultadoValidacionMacrosFE`, `ResumenMacrosDiaFE`, `VersionPlan`.
- **Acceptance criteria**:
  - [x] Tipos compilan sin errores
  - [x] Consistencia con DTOs del backend
  - [x] `tsc --noEmit` sin errores
  - **RBs**: (UI)
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): tipos TypeScript para V2`

#### Task 5.15: Tests Vitest hooks nuevos
- **Tipo**: frontend-test
- **Archivos**: ya creados en Tasks 5.9, 5.10, 5.11
- **Descripción**: Verificar que los specs de los Tasks 5.9, 5.10, 5.11 pasan. Coverage combinada > 70%.
- **Acceptance criteria**:
  - [ ] Specs pasan
  - [ ] Coverage combinada > 70%
- **RBs**: (validación)
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): verde de specs de hooks frontend`

#### Task 5.16: Tests Vitest componentes clave (MacrosBadge, FeedbackModal, VersionHistory)
- **Tipo**: frontend-test
- **Archivos**: ya creados en Tasks 5.4, 5.5, 5.6
- **Descripción**: Verificar que los specs de los Tasks 5.4, 5.5, 5.6 pasan. Adicional: verificar con Playwright MCP que PlanEditorPage renderiza sin errores visuales después del refactor (no-regresión).
- **Acceptance criteria**:
  - [ ] Specs pasan
  - [ ] Verificación visual con Playwright (snapshot baseline)
- **RBs**: (UI)
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): specs de componentes clave + verificación visual`
- **Notas**: si Packet 5 excede 400 líneas de review, considerar split 5a (componentes base 5.2-5.8) + 5b (integración 5.1) en 2 commits.

---

## Packet 6: Frontend — MiPlanPage del socio (~400 líneas)

**Commit message**: `feat(plan-alimentacion-ia-v2): frontend — MiPlanPage con empty state y N cards`
**Depends on**: Packet 5
**Estimated changed lines**: ~400
**Review budget risk**: Low
**Skills used in implementation**: frontend-design, tailwind-v4-shadcn, shadcn, vitest, vercel-react-best-practices

### Goal

Refactorizar `MiPlanPage.tsx` para que muestre el plan activo del socio (o empty state si está en preparación), con N cards si tiene varios nutricionistas. Read-only puro.

### Tasks

#### Task 6.1: Refactor MiPlanPage.tsx (empty state + N cards)
- **Tipo**: frontend-page
- **Archivos**: `apps/frontend/src/pages/MiPlanPage.tsx`
- **Descripción**: Query `useQuery` para `GET /planes-alimentacion/socio/:id/activo`. Si 0 resultados → `<EmptyStatePlanEnPreparacion />`. Si N resultados → renderiza N `<PlanSocioCard />` (uno por nutricionista). Read-only puro (sin voto, sin edición).
- **Acceptance criteria**:
  - [ ] La página compila sin errores
  - [ ] Empty state se muestra si 0 resultados
  - [ ] N cards se muestran si N resultados
  - [ ] Verificación visual con Playwright MCP
  - [ ] `tsc --noEmit` sin errores
- **RBs**: RF-013
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): MiPlanPage refactor con empty state y N cards`

#### Task 6.2: Crear PlanSocioCard.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/PlanSocioCard.tsx`, `apps/frontend/src/components/plan/PlanSocioCard.test.tsx`
- **Descripción**: Card con info del nutricionista (nombre, gym), plan actual, `<WeeklyPlanGrid />` read-only (reusar el existente con prop `readOnly`), `<RazonamientoCumplimiento />` colapsable (reusar con `readOnly`). Botón "Descargar PDF" (existente). Spec: 2 casos (renderiza con plan, click en PDF).
- **Acceptance criteria**:
  - [ ] Componente compila sin errores
  - [ ] Reusa WeeklyPlanGrid y RazonamientoCumplimiento
  - [ ] Botón PDF funciona
  - [ ] Spec pasa los 2 casos
- **RBs**: RF-013
- **Estimado**: M
- **Commit message**: `feat(plan-alimentacion-ia-v2): PlanSocioCard para vista del socio`

#### Task 6.3: Crear EmptyStatePlanEnPreparacion.tsx
- **Tipo**: frontend-component
- **Archivos**: `apps/frontend/src/components/plan/EmptyStatePlanEnPreparacion.tsx`, `apps/frontend/src/components/plan/EmptyStatePlanEnPreparacion.test.tsx`
- **Descripción**: Mensaje amigable + ícono de espera. Si pasaron >7 días desde el alta del socio (prop `fechaAlta?: Date`), muestra "Contactá a tu nutricionista". Spec: 2 casos (estándar, con sugerencia de contacto).
- **Acceptance criteria**:
  - [ ] Componente compila sin errores
  - [ ] Lógica de >7 días correcta
  - [ ] Spec pasa los 2 casos
- **RBs**: RF-013
- **Estimado**: S
- **Commit message**: `feat(plan-alimentacion-ia-v2): EmptyStatePlanEnPreparacion con sugerencia`

#### Task 6.4: Reusar RazonamientoCumplimiento.tsx (read-only mode)
- **Tipo**: frontend-component
- **Archivos**: ya creado en Task 5.7
- **Descripción**: Reusar el componente del Task 5.7 con prop `readOnly={true}`. NO requiere código nuevo, solo confirmar que el modo funciona en el contexto de `PlanSocioCard`. Verificar accesibilidad (sin botones de acción, sin interacción).
- **Acceptance criteria**:
  - [ ] Componente reutilizado sin cambios
  - [ ] Modo readOnly verificado en contexto de MiPlanPage
- **RBs**: RF-008
- **Estimado**: S
- **Commit message**: `chore(plan-alimentacion-ia-v2): RazonamientoCumplimiento reusado en MiPlanPage`
- **Notas**: este task NO es código nuevo, es la verificación del reuso.

#### Task 6.5: Tests Vitest MiPlanPage (con mocks de QueryClient)
- **Tipo**: frontend-test
- **Archivos**: `apps/frontend/src/pages/MiPlanPage.test.tsx`
- **Descripción**: Spec con mocks de `QueryClient` que cubre: (1) renderiza con 1 plan activo → 1 PlanSocioCard; (2) renderiza con 2 planes activos → 2 PlanSocioCard; (3) renderiza con 0 planes → EmptyStatePlanEnPreparacion; (4) estado de carga; (5) estado de error. Usar `renderWithProviders` helper del proyecto.
- **Acceptance criteria**:
  - [ ] Spec pasa los 5 casos
  - [ ] Mocking de QueryClient correcto
  - [ ] Coverage > 70%
- **RBs**: RF-013
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): spec MiPlanPage con 5 escenarios`

---

## Packet 7: E2E test del flujo completo (~500 líneas)

**Commit message**: `test(plan-alimentacion-ia-v2): e2e del flujo completo de plan alimentacion V2`
**Depends on**: Packets 1-6
**Estimated changed lines**: ~500
**Review budget risk**: Medium
**Skills used in implementation**: playwright-best-practices, playwright-spec-verifier

### Goal

Spec Playwright que ejecuta el flujo completo: NUT configura notas → genera plan → valida → regenera día → regenera alternativa → vota → activa → SOCIO ve plan → verifica historial. Mockear Groq en `page.route()` para reproducibilidad.

### Tasks

#### Task 7.1: Crear e2e/fixtures/socios-con-restricciones.fixture.ts
- **Tipo**: e2e-fixture
- **Archivos**: `e2e/fixtures/socios-con-restricciones.fixture.ts`
- **Descripción**: Fixture con 5 perfiles: vegano estricto, diabético tipo 2, celíaco, multi-restricción, sin restricciones. Cada perfil incluye credenciales del socio y datos de la ficha clínica necesarios para el test.
- **Acceptance criteria**:
  - [ ] El archivo exporta los 5 perfiles
  - [ ] Credenciales leídas desde `CREDENCIALES_SEED.md` (no hardcoded)
  - [ ] Datos de ficha clínica completos
- **RBs**: RF-005
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): fixture de socios con restricciones`

#### Task 7.2: Crear e2e/fixtures/notas-nutricionista.fixture.ts
- **Tipo**: e2e-fixture
- **Archivos**: `e2e/fixtures/notas-nutricionista.fixture.ts`
- **Descripción**: Fixture con notas del nutricionista: notas persistentes (preferencias_ia), notas de generación (notas_generacion), comentarios de feedback (positivos y negativos para memoria). Datos en español.
- **Acceptance criteria**:
  - [ ] El archivo exporta los datos
  - [ ] Notas cubren los casos de uso del flujo
- **RBs**: RF-002
- **Estimado**: S
- **Commit message**: `test(plan-alimentacion-ia-v2): fixture de notas de nutricionista`

#### Task 7.3: Crear e2e/flujos/plan-alimentacion-v2.spec.ts (flujo completo)
- **Tipo**: e2e
- **Archivos**: `e2e/flujos/plan-alimentacion-v2.spec.ts`
- **Descripción**: Spec Playwright con 1 test largo (o varios `test()`) que ejecuta: (1) login NUT; (2) ir a MiPerfil y setear preferencias IA; (3) ir a PlanEditorPage; (4) seleccionar socio (vegano); (5) completar form V2 con notas; (6) generar plan; (7) verificar respuesta con badges macros y razonamiento; (8) regenerar un día; (9) regenerar una alternativa; (10) votar 👍 con comentario; (11) activar versión; (12) logout; (13) login SOCIO; (14) ir a MiPlanPage; (15) verificar plan activo visible; (16) logout. Reusar setup de `e2e/flujos/crear-plan.spec.ts`.
- **Acceptance criteria**:
  - [ ] Spec ejecuta el flujo completo
  - [ ] Pasa localmente con mock de Groq
  - [ ] Aserciones documentadas (15 puntos del acceptance criteria del proposal)
- **RBs**: (e2e)
- **Estimado**: L
- **Commit message**: `test(plan-alimentacion-ia-v2): spec e2e del flujo completo V2`

#### Task 7.4: Mockear Groq en Playwright con page.route()
- **Tipo**: e2e-mock
- **Archivos**: `e2e/helpers/mock-groq.helper.ts`, integrado en `e2e/flujos/plan-alimentacion-v2.spec.ts`
- **Descripción**: Helper que usa `page.route('https://api.groq.com/**', ...)` para interceptar llamadas a Groq y retornar JSON fijo (plan completo válido con estructura correcta, restricciones cumplidas, macros verde). Helper acepta overrides por scope (PLAN/DIA/ALTERNATIVA) y por perfil de socio.
- **Acceptance criteria**:
  - [ ] Helper compila sin errores
  - [ ] Mock funciona para los 3 scopes
  - [ ] Override por perfil funciona
- **RBs**: (e2e)
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): helper para mockear Groq en Playwright`

#### Task 7.5: Verificar acceptance criteria 1-15 con asserciones
- **Tipo**: e2e
- **Archivos**: integrado en `e2e/flujos/plan-alimentacion-v2.spec.ts`
- **Descripción**: Agregar al spec del Task 7.3 aserciones explícitas para los 15 acceptance criteria del proposal: (1) activar → 1 sola activa; (2) macros verde ≤5%, amarillo 5-10%, rojo >10%; (3) cobertura 100% restricciones; (4) estructura completa sin repetidos; (5) razonamiento se persiste y devuelve; (6) feedback duplicado → 409; (7) GET memoria mismos ejemplos; (8) regenerar alternativa crea nueva versión; (9) frontend badges macros; (10) MiPlanPage empty state o plan; (11) Groq 5xx → 503; (12) JSON inválido 2 veces → 502; (13) NUT A no ve planes de NUT B → 403; (14) SOCIO ve N cards si 2+ NUTs; (15) notas concatenadas en prompt.
- **Acceptance criteria**:
  - [ ] 15 aserciones documentadas en el spec
  - [ ] Cada una pasa (o tiene skip explícito documentado)
- **RBs**: (e2e)
- **Estimado**: M
- **Commit message**: `test(plan-alimentacion-ia-v2): aserciones explícitas para los 15 acceptance criteria`
- **Notas**: usar comentarios `// AC#X: ...` para mapear cada aserción al criterio.

---

## Review Workload Forecast

- **Total estimado**: ~5000 líneas
- **400-line budget risk per packet**:
  - Packet 1: ~600 líneas → **Riesgo medio** (requiere size:exception o split)
  - Packet 2: ~800 líneas → **Riesgo alto** (requiere size:exception)
  - Packet 3: ~700 líneas → **Riesgo alto** (requiere size:exception)
  - Packet 4: ~500 líneas → **Riesgo medio**
  - Packet 5: ~1500 líneas → **Riesgo muy alto** (REQUIERE SPLIT o size:exception explícito)
  - Packet 6: ~400 líneas → **OK**
  - Packet 7: ~500 líneas → **Riesgo medio**

- **Decision needed before apply**: Yes
  - Estrategia recomendada: chained commits stacked-to-main (1 commit por packet) con size:exception documentado por packet.
  - Alternativa: split Packet 5 (frontend editor) en 2 sub-commits: 5a (componentes base) + 5b (integración PlanEditorPage).
- **Chained commits recommended**: Yes
- **Chain strategy**: stacked-to-main