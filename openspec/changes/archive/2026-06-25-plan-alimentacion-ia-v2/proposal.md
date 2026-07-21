# SDD Proposal: plan-alimentacion-ia-v2

**Change ID**: plan-alimentacion-ia-v2
**Phase**: propose
**Date**: 2026-06-25
**Source**: PRD + Plan técnico provisto por Agustín (conversación de shaping 2026-06-24/25)
**Persistence**: BOTH (OpenSpec + Engram)

---

## 1. Resumen ejecutivo

Reescritura integral del módulo de generación de planes de alimentación asistida por IA del sistema NutriFit Supervisor. La IA actual produce planes incompletos, repite comidas e ignora restricciones declaradas del socio y directrices del nutricionista, obligando al profesional a re-trabajar cada plan casi desde cero. El v2 entrega planes semanales completos, validados contra restricciones duras y directrices del nutricionista, con versionado completo, feedback del profesional y regeneración granular por scope (plan / día / alternativa individual).

**KPIs objetivo**:
- Tasa de regeneración manual < 10% a 30 días del lanzamiento.
- 100% de cumplimiento de restricciones duras declaradas por el socio (medido en tests con fixtures de socios veganos, diabéticos, celíacos, multi-restricción).
- Generación completa < 15 s, regeneración parcial < 5 s, GET de historial < 500 ms.

---

## 2. Motivación

**Problema raíz**: el `GenerarPlanSemanalUseCase` actual (en `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts`) invoca Groq con un prompt mínimo (ficha + objetivo), sin restricciones duras validadas post-generación, sin notas del nutricionista inyectadas al prompt, sin memoria de feedback previa, sin versionado del plan, sin regeneración granular. Resultado: el nutricionista regenera 3-5 veces cada plan manualmente antes de aprobarlo.

**Por qué ahora**:
- El feature tiene tráfico real (nutricionistas usan la IA diariamente) y el costo de oportunidad es alto.
- La memoria de feedback existe conceptualmente pero nunca se implementó → cada profesional "reinicia la rueda" en cada generación.
- La auditoría clínica del módulo actual es débil (no hay registro de qué notas generaron qué plan).

**Qué NO se puede hacer sin este cambio**:
- Cumplir promesa de "planes usables desde el primer intento".
- Escalar el equipo de nutricionistas sin que la calidad del plan caiga.
- Tener trazabilidad clínica de qué IA propuso qué (auditoría / responsabilidad profesional).

---

## 3. Alcance (IN SCOPE)

### 3.1 Backend (~2500-3500 líneas)

**Modelo de datos nuevo:**
- Tabla `plan_alimentacion_version` (snapshot inmutable con `numero_version`, `datos_json`, `motivo_cambio`, `activa`, FK a `plan_alimentacion`).
- Tabla `plan_feedback` (voto 👍/👎 único por versión).
- Tabla `nutricionista_ia_memoria` (memoria de feedback por nutricionista, rotación FIFO a 100).
- Columnas nuevas: `plan_alimentacion.notas_generacion` (VARCHAR 1000), `nutricionista.preferencias_ia` (TEXT).

**Migración TypeORM única** con up + down + backfill de planes existentes (crear v1 desde la fila actual).

**Reescritura de `GenerarPlanSemanalUseCase`:**
- Prompt builder estructurado: ficha clínica + notas persistentes + notas de generación + 1-3 ejemplos de memoria.
- RestriccionesValidatorV2 (extiende el existente, no duplica).
- MacrosValidator (lógica pura, indicador verde/amarillo/rojo).
- Lógica de reintentos con instrucción correctiva (max 2 para restricciones, max 1 para JSON malformado).
- Manejo de timeouts (backoff 5 s, max 1 reintento) y JSON malformado (temperature 0.3, max 1 reintento).

**Nuevo `RegenerarPlanSemanalUseCase`** con scope PLAN/DIA/ALTERNATIVA y merge quirúrgico del `datos_json`.

**Modificación de use-cases existentes:**
- `CrearPlanAlimentacionUseCase` → crea v1 al persistir el plan.
- `EditarPlanAlimentacionUseCase` → crea nueva versión en vez de hard-delete.
- `ActivarPlanAlimentacionUseCase` (NUEVO) → transacción que pone activa=false a todas las versiones del plan y activa=true a la seleccionada.
- `FinalizarPlanAlimentacionUseCase` (NUEVO) → transiciona plan a FINALIZADO.
- `CrearFeedbackPlanUseCase` (NUEVO) + `EditarFeedbackPlanUseCase` (NUEVO) → con UNIQUE constraint en feedback.

**Validadores nuevos:**
- `RestriccionesValidatorV2` (extiende `RestriccionesValidator`, matching case-insensitive + singular/plural).
- `MacrosValidator` (suma por día, compara contra target con bandas ±5% / ±10%).

**Notificaciones in-app:**
- Extensión del enum `TipoNotificacion` con `PLAN_REVISAR`, `PLAN_ACTIVO`, `PLAN_FINALIZADO`, `PLAN_VALIDACION_WARNING`, `PLAN_MACROS_FUERA_RANGO`.
- Emisión en cada transición de estado vía `NotificacionesService` (patrón existente).

**RBAC granular:**
- Acciones nuevas en `packages/shared/src/types/acciones.ts`: `PLANES_IA_GENERAR`, `PLANES_IA_REGENERAR`, `PLANES_IA_FEEDBACK`, `PLANES_IA_MEMORIA_EDITAR`, `PLANES_ACTIVAR`, `PLANES_FINALIZAR`.
- Aplicación de `@Actions(...)` en todos los endpoints nuevos (cierra gap actual del `ActionsGuard`).
- Seed actualizado con las nuevas acciones.

**Auditoría:**
- `AuditoriaService.registrar(...)` en cada acción clínica: crear, regenerar, activar, finalizar, votar, editar preferencias.

### 3.2 Frontend (~1800-2500 líneas)

**Refactor de `PlanEditorPage`:**
- Form V2 con campos: diasAGenerar, comidasPorDia, alternativasPorComida, notasGeneracion.
- Panel inline de validación (verde/amarillo/rojo) por día con tooltips de macros.
- Botones de regeneración por scope (PLAN/DÍA/ALTERNATIVA).
- Modal de feedback con voto + comentario.
- Selector de versiones (`VersionHistory`).
- Razonamiento de cumplimiento colapsable.
- Confirm al regenerar comida editada manualmente.
- Deshabilitar "Generar" tras 1er click.

**Componentes nuevos:**
- `GeneradorPlanSemanal` (REHECHO): form V2.
- `WeeklyPlanGrid` (extendido): badges macros, regen por scope.
- `MacrosBadge` (NUEVO): indicador verde/amarillo/rojo.
- `FeedbackModal` (NUEVO): 👍/👎 + comentario.
- `VersionHistory` (NUEVO): selector de versiones.
- `RazonamientoCumplimiento` (NUEVO): colapsable.
- `PreferenciasIASection` (NUEVO): edición de notas persistentes en perfil.

**Hooks nuevos:**
- `usePreferenciasIa`, `useFeedbackPlan`, `useVersionesPlan`.
- `useIa.ts` extendido con `generarPlanSemanalV2`, `regenerarPlanSemanal`.

**Refactor de `MiPlanPage` (socio):**
- Empty state "está en preparación" cuando no hay versión ACTIVA.
- N cards (uno por nutricionista si el socio tiene varios).
- Mostrar razonamiento colapsable.
- Read-only puro (sin voto, sin edición).

**Componentes nuevos MiPlanPage:**
- `PlanSocioCard` (NUEVO).
- `EmptyStatePlanEnPreparacion` (NUEVO).

**Tipos / schemas:**
- `apps/frontend/src/types/ia.ts` extendido (validación, razonamiento, regeneracion).
- `apps/frontend/src/schemas/ia-plan-semanal.schema.ts` (Zod).

### 3.3 E2E (~300-500 líneas)

- `e2e/flujos/plan-alimentacion-v2.spec.ts`: flujo completo (NUT configura notas → genera → valida → regenera día → regenera alternativa → vota → activa → SOCIO ve plan → verifica historial).
- `e2e/fixtures/socios-con-restricciones.fixture.ts`: vegano + alergias + diabético + multi-restricción + sin restricciones.
- `e2e/fixtures/notas-nutricionista.fixture.ts`: notas de prueba.

### 3.4 Tests unitarios (~600-900 líneas)

- `GenerarPlanSemanalUseCase` (prompt builder, reintentos, validaciones).
- `RestriccionesValidatorV2` (matching de restricciones con fixtures).
- `MacrosValidator` (suma, comparación, colores).
- `ActivarPlanAlimentacionUseCase` (transacciones, UNIQUE activa).
- `SeleccionarEjemplosMemoriaUseCase` (adaptativo 1-3, FIFO).
- Mock de `GroqService` con respuestas fijas en tests de validación de IA.

### 3.5 Documentación

- Updates a `docs/` solo si surge necesidad durante el apply (no se crean docs proactivamente).

---

## 4. Fuera de alcance (OUT OF SCOPE)

- **Embeddings para memoria IA**: matching por keywords simple. Embeddings se evalúan en una iteración posterior.
- **Email notifications**: solo in-app. Email queda como follow-up futuro.
- **Migración del proveedor IA**: se mantiene Groq (`llama-3.3-70b-versatile`). El SDK OpenAI-compatible permite cambiar `baseURL` sin tocar código.
- **Reporte admin de auditoría de planes**: UI admin queda fuera (existe `auditoria` en BD, pero no se construye vista nueva).
- **Descarga PDF del plan**: ya existe, no se toca.
- **Consolidación de planes entre nutricionistas del mismo socio**: cada NUT mantiene su plan independiente.
- **Rate limiting de generaciones**: no se aplica. Agustín puede regenerar N veces.
- **Purga de versiones viejas**: las versiones se guardan para siempre (auditoría clínica completa).
- **Tests de carga / performance**: no se solicita explícitamente. Los RNF se miden manualmente.
- **Internacionalización de prompts**: prompts en español fijo.
- **Voto del socio sobre el plan**: explícitamente fuera de alcance (RF-010 A: solo el NUT vota).
- **Acciones del recepcionista sobre planes**: bloqueadas por `SocioResourceAccessGuard` (no se cambia este comportamiento).

---

## 5. Enfoque / Approach

### 5.1 Arquitectura: Clean Architecture en 4 capas
Se mantiene la convención existente del proyecto. Nuevos use-cases extienden `BaseUseCase`. Repositorios abstractos en `domain/` con implementación TypeORM en `infrastructure/`. DTOs con `class-validator`. La presentación solo orquesta; la lógica vive en use-cases.

### 5.2 Versionado: tabla separada con snapshot JSON
Se eligió tabla separada (`plan_alimentacion_version`) en vez de JSON en `plan_alimentacion.datos_json` por:
- Inmutabilidad real (constraint UNIQUE + sin UPDATEs a versiones).
- Queries eficientes (índice en `(plan_alimentacion_id, activa)`).
- Auditoría natural (cada fila es una versión fechada y firmada por `created_by`).
- Backfill simple (planes existentes se migran a v1 con sus datos actuales).

`plan_alimentacion` queda como "puntero lógico" al estado actual (versión activa).

### 5.3 Memoria IA: matching por keywords sin embeddings
Selección adaptativa 1-3 ejemplos basada en:
- Match por palabras del comentario vs palabras del objetivo del socio.
- Match por tipo_ejemplo (POSITIVO primero, NEGATIVO si no hay positivos suficientes).
- FIFO a 100 entradas activas por nutricionista (al exceder, la más vieja se archiva).

Embeddings quedan para una iteración posterior cuando haya volumen suficiente para justificar la inversión.

### 5.4 Validación: dos capas, sin bloquear de forma rígida
- **Restricciones**: reintenta con instrucción correctiva (max 2) → si no cumple, warning visible al NUT, plan igual devuelto (NO se rechaza la creación). Esto evita que un fallo de la IA deje al NUT sin plan.
- **Macros**: amarillo y rojo BLOQUEAN la transición a `ACEPTADO` (RF-006), pero NO bloquean la creación del plan. El NUT puede regenerar.

### 5.5 Validación reusa `RestriccionesValidator`
`RestriccionesValidatorV2` extiende la lógica existente en vez de duplicarla. Solo agrega:
- Validación del plan completo (no solo del input).
- Matching case-insensitive + singular/plural.
- Reporte de qué restricción no se cumplió en qué comida.

### 5.6 Reemplazo directo de endpoint (NO se mantiene v1)
Misma ruta `POST /ia/plan-semanal`, payload ampliado. El frontend se actualiza en el mismo cambio. Esto evita mantener dos versiones del endpoint durante meses y reduce la superficie de auditoría.

### 5.7 Notificaciones in-app
Se reusa `NotificacionesService` existente (patrón de `ReservarTurnoSocioUseCase` → `TURNO_RESERVADO`). NO se introduce un DomainEvent base; emisión directa.

### 5.8 Idioma y convenciones
Código 100% en español (variables, funciones, componentes, mensajes de error, UI). Nombres en `camelCase` para variables/funciones, `PascalCase` para componentes. Imports con `@/` en frontend, paths absolutos desde `src/` en backend.

---

## 6. Plan de entrega (Chained commits / PRs)

Estrategia: **stacked-to-main** con commits atómicos por packet (cada packet → 1 commit en `main`). Esto permite rollback quirúrgico si un packet falla.

| Commit | Alcance | Líneas estimadas | RBs | Dependencias |
|---|---|---|---|---|
| **Packet 1** — Cimientos (BD + notas persistentes) | ~600 | Migración, 3 entidades nuevas, 2 use-cases de preferencias, 2 endpoints | RF-002 | — |
| **Packet 2** — IA mejorada (prompt + validadores) | ~800 | Reescritura `GenerarPlanSemanalUseCase`, 2 validadores, 2 builders, DTOs | RF-001, RF-005, RF-006, RF-008 | Packet 1 |
| **Packet 3** — Versionado + feedback + memoria | ~700 | Modificaciones a `Crear`/`Editar` use-cases, 4 use-cases nuevos, 2 controllers modificados | RF-003, RF-004, RF-009 | Packets 1-2 |
| **Packet 4** — Regeneración scope + máquina de estados | ~500 | 3 use-cases nuevos, 1 builder, 2 endpoints | RF-007, RF-009, RF-011 | Packets 1-3 |
| **Packet 5** — Frontend PlanEditorPage refactor | ~1500 | Refactor de página, 5 componentes nuevos, 4 hooks, schemas | (frontend) | Packets 1-4 |
| **Packet 6** — Frontend MiPlanPage | ~400 | Refactor de página, 2 componentes nuevos | (frontend) | Packet 5 |
| **Packet 7** — E2E test completo | ~500 | 1 spec, 2 fixtures | (e2e) | Packets 1-6 |
| **Total estimado** | **~5000** | — | — | — |

**Por qué chained en vez de single PR**: cada packet es funcionalmente testeable de forma independiente. Si Packet 5 (frontend refactor) tiene un bug visual, se puede rollbackear sin perder Packet 4 (backend regenerar). El cumulative diff sigue manteniéndose manejable para code review.

**Review workload guard**: si la estimación de un packet individual supera 400 líneas, el orquestador debe aplicar `ask-on-risk` y consultar a Agustín antes de continuar.

---

## 7. Decisiones arquitectónicas clave

| # | Decisión | Rationale | Alternativas descartadas |
|---|---|---|---|
| 1 | Tabla separada para versiones (no JSON en `plan_alimentacion`) | Inmutabilidad + queries eficientes + auditoría natural | JSON inline (queries lentas, sin UNIQUE fácil) |
| 2 | Matching por keywords en memoria IA | Simple, suficiente para v1, sin costo de embeddings | Embeddings (overhead, requiere vector store) |
| 3 | Restricciones: warning tras 2 reintentos, NO rechazo | Evitar dejar al NUT sin plan por fallo de IA | Rechazo rígido (UX peor) |
| 4 | Macros: amarillo/rojo BLOQUEAN `ACEPTADO` | Calidad del plan > velocidad del flujo | Warning sin bloqueo (planes malos pasan) |
| 5 | Reemplazo directo de endpoint (sin v1) | Menos superficie de auditoría, menos código a mantener | Versionar endpoint (-v2) (más deuda) |
| 6 | Notificaciones in-app solamente | Cero infra adicional, sigue patrón existente | Email (más dependencias, infra) |
| 7 | Código 100% en español | Convención del proyecto enforced en AGENTS.md | Inglés (romper convención) |
| 8 | Reusar `RestriccionesValidator` (V2 extiende) | No duplicar lógica de matching | Duplicar (riesgo de divergencia) |
| 9 | `PlanAlimentacion` queda como puntero lógico | Mantiene contrato de API existente | Mover todo a version (rompe integración con código existente) |

---

## 8. Riesgos y mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | La IA sigue sin cumplir restricciones tras 2 reintentos | Media | Medio | Warning visible al NUT, plan devuelto con detalle de qué falló. Tests con fixtures validan el comportamiento esperado. |
| R2 | Performance: generación > 15 s en producción | Media | Medio | Tests con mocks + medición manual post-deploy. `max_tokens: 4096` ya está limitado. Considerar reducir `diasAGenerar` default si es necesario. |
| R3 | Migración de BD con datos existentes falla | Baja | Alto | Backfill en batches, tests con BD de test antes de producción. `down` migration implementada. |
| R4 | Refactor de `PlanEditorPage` rompe UI existente | Media | Alto | Verificación visual con Playwright MCP después de cada cambio. Mantener subset de funcionalidades como "unchanged" para validar no-regresión. |
| R5 | Memoria IA inyecta ejemplos irrelevantes | Media | Bajo | Selección adaptativa + matching por keywords. Logging de qué ejemplos se inyectaron para ajustar. |
| R6 | Concurrencia: dos NUTs modifican mismo plan | N/A | N/A | RF-010: cada NUT solo opera sus planes. No aplica. |
| R7 | Tamaño del packet excede presupuesto de revisión | Alta | Medio | Review workload guard dispara `ask-on-risk`. Plan: split en 2 commits si supera 400 líneas. |
| R8 | Tests E2E flaky por dependencia de Groq | Media | Medio | Mockear Groq en tests E2E o usar respuestas cacheadas. Tests con timeout generoso + reintento. |

---

## 9. Estrategia de testing

| Capa | Cobertura target | Enfoque |
|---|---|---|
| **Unit (backend)** | 80% en use-cases core | Mockear GroqService con respuestas fijas. Cubrir happy path + edge cases. |
| **Unit (frontend)** | 70% en hooks + componentes core | Mockear API calls. Cubrir renderizado + interacciones. |
| **Integración backend** | Endpoints nuevos con BD de test | Probar endpoints REST contra BD efímera. Cubrir happy path + errores. |
| **Validación de IA** | Tests con fixtures de socios | Asertar invariantes: 4 comidas por día, macros ±10%, 0% alimentos prohibidos. |
| **E2E (Playwright)** | Flujo completo del feature | Reusar setup de e2e/flujos/crear-plan.spec.ts. Mockear Groq en test e2e para reproducibilidad. |

**Fixtures de validación de IA**:
- Socio vegano estricto (sin carne/lácteos/huevos/miel).
- Socio diabético tipo 2 (sin azúcar refinada, control de carbohidratos).
- Socio celíaco (sin gluten).
- Socio multi-restricción (vegano + alergia soja + intolerancia lactosa + diabético).
- Socio sin restricciones.
- Socio con notas del NUT "predominio de fibra".

Cada fixture valida: estructura del JSON, alimentos dentro del catálogo, cumplimiento de macros ±10%, razonamiento_cumplimiento presente.

---

## 10. Acceptance criteria (resumen — ver sección 10 del PRD completo)

Ver PRD original sección 10 para los 15 predicados testeables. Resumen:
1. Activar plan → `plan_alimentacion_version.activa == true` solo en una versión.
2. Macros verde: desvío ≤ ±5%; amarillo: ±5-10% (bloquea ACEPTADO); rojo: > ±10% (bloquea siempre).
3. Cobertura 100% de restricciones duras (tests con fixtures).
4. Estructura: exactamente `diasAGenerar × comidasPorDia` slots, sin repetidos.
5. Razonamiento se persiste y se devuelve en GET.
6. POST feedback duplicado → 409.
7. GET memoria devuelve mismos ejemplos usados en la última generación.
8. Regenerar scope=ALTERNATIVA crea nueva versión con cambio quirúrgico.
9. Frontend muestra indicador macros verde/amarillo/rojo por día.
10. Frontend `MiPlanPage` muestra plan ACTIVO o empty state.
11. Groq 5xx → 503 sin persistir.
12. JSON inválido 2 veces → 502.
13. NUT A no puede ver planes de NUT B → 403.
14. SOCIO ve N cards si tiene 2+ NUTs.
15. Notas persistentes + notas de generación se concatenan en prompt.

---

## 11. Archivos clave (referencia)

Ver detalle en PRD original. **Total**: ~40 archivos (nuevos + modificados) en backend, frontend, shared, e2e.

**Criticidad alta** (tocar con cuidado, alta superficie de impacto):
- `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts` (REEMPLAZA)
- `apps/backend/src/application/plan-alimentacion/use-cases/crear-plan-alimentacion.use-case.ts` (MODIFICADO)
- `apps/backend/src/application/plan-alimentacion/use-cases/editar-plan-alimentacion.use-case.ts` (MODIFICADO)
- `apps/frontend/src/pages/PlanEditorPage.tsx` (REFACTOR MAYOR)
- `apps/frontend/src/pages/MiPlanPage.tsx` (REFACTOR)

**Nuevos críticos**:
- `apps/backend/src/infrastructure/persistence/typeorm/migrations/<TIMESTAMP>-plan-v2.ts`
- `apps/backend/src/application/ai/builders/prompt-plan-semanal.builder.ts`
- `apps/backend/src/domain/validators/restricciones-validator-v2.ts`
- `apps/backend/src/domain/validators/macros-validator.ts`

---

## 12. Orden de ejecución recomendado

```
1. Packet 1 (BD + preferencias) →  commit 1 en main
2. Packet 2 (IA + validadores) →   commit 2 en main
3. Packet 3 (versionado) →         commit 3 en main
4. Packet 4 (regenerar scope) →   commit 4 en main
5. Packet 5 (frontend editor) →   commit 5 en main
6. Packet 6 (frontend socio) →    commit 6 en main
7. Packet 7 (E2E) →               commit 7 en main
8. Verify →                        veredicto
9. Archive →                       delta specs sincronizadas
```

Después de cada commit, ejecutar verificación visual con Playwright MCP (regla del proyecto para cambios de frontend).

---

## 13. Cierre

Este change transforma un módulo con ~60% de cumplimiento de requisitos en uno que cumple los 15 predicados del PRD. La estrategia chained-por-packet minimiza el riesgo de regresión y permite rollback quirúrgico. El review workload guard dispara consulta a Agustín si algún packet excede el presupuesto de 400 líneas.