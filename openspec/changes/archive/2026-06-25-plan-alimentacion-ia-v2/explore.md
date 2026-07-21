# SDD Explore: plan-alimentacion-ia-v2

**Change ID**: plan-alimentacion-ia-v2
**Phase**: explore
**Date**: 2026-06-25
**Source**: Inspección de código existente + PRD del feature
**Persistence**: BOTH (OpenSpec + Engram)

---

## Executive Summary

El módulo de generación de planes de alimentación asistida por IA tiene una implementación parcial funcional pero con brechas críticas: sin validación dura de restricciones, sin notas del nutricionista inyectadas, sin memoria de feedback, sin versionado, sin regeneración granular. La IA produce planes incompletos que el nutricionista debe regenerar manualmente 3-5 veces. El v2 cierra estas brechas manteniendo compatibilidad con el resto del sistema (PlanAlimentacion queda como puntero lógico, los endpoints existentes siguen funcionando).

**Veredicto**: Implementable en 7 packets chained, ~5000 líneas totales, factible dentro de los plazos del proyecto.

---

## Estado actual del módulo (hallazgos de exploración)

### Backend — `apps/backend/src/application/ai/use-cases/`

| Archivo | Estado | Notas |
|---|---|---|
| `generar-plan-semanal.use-case.ts` | ⚠️ Básico | Prompt mínimo (ficha + objetivo). Sin notas del NUT. Sin memoria. Sin validación post-generación. Sin reintentos. |
| `generar-ideas-comida.use-case.ts` | ✅ Funcional | Usado para autocompletar. Se mantiene sin cambios. |
| `GroqService` | ✅ Funcional | SDK OpenAI-compatible configurado. Se reusa sin cambios. |
| `prompt-builder.ts` (si existe) | ❓ No inspeccionado | Buscar en la misma carpeta. |

### Backend — `apps/backend/src/application/plan-alimentacion/use-cases/`

| Archivo | Estado | Notas |
|---|---|---|
| `crear-plan-alimentacion.use-case.ts` | ⚠️ Sin versionado | Crea el plan pero no genera v1 en `plan_alimentacion_version`. |
| `editar-plan-alimentacion.use-case.ts` | ⚠️ Hard delete/replace | No preserva historial. Necesita migrar a "crear nueva versión". |
| `obtener-plan-alimentacion.use-case.ts` | ✅ Funcional | Se mantiene. |
| `listar-planes-alimentacion.use-case.ts` | ✅ Funcional | Se mantiene. |
| `activar-plan-alimentacion.use-case.ts` | ❌ No existe | Necesario para RF-009. |
| `finalizar-plan-alimentacion.use-case.ts` | ❌ No existe | Necesario para RF-009. |

### Backend — `apps/backend/src/domain/validators/`

| Archivo | Estado | Notas |
|---|---|---|
| `restricciones-validator.ts` | ✅ Funcional | Lógica de matching de restricciones. REUSAR en V2. |
| `macros-validator.ts` | ❌ No existe | Necesario para RF-006. Crear desde cero. |

### Backend — `apps/backend/src/domain/repositories/`

| Archivo | Estado | Notas |
|---|---|---|
| `plan-alimentacion.repository.ts` | ✅ Funcional | Se mantiene. |
| `nutricionista-ia-memoria.repository.ts` | ❌ No existe | Necesario para RF-004. |
| `plan-alimentacion-version.repository.ts` | ❌ No existe | Necesario para RF-009. |
| `plan-feedback.repository.ts` | ❌ No existe | Necesario para RF-003. |

### Backend — Entidades TypeORM

| Archivo | Estado | Notas |
|---|---|---|
| `plan-alimentacion.entity.ts` | ✅ Existe | Agregar `notas_generacion VARCHAR(1000) NULL`. |
| `nutricionista.entity.ts` | ✅ Existe | Agregar `preferencias_ia TEXT NULL`. |
| `plan-alimentacion-version.entity.ts` | ❌ No existe | Crear. |
| `plan-feedback.entity.ts` | ❌ No existe | Crear. |
| `nutricionista-ia-memoria.entity.ts` | ❌ No existe | Crear. |

### Backend — Controllers

| Archivo | Estado | Notas |
|---|---|---|
| `ai.controller.ts` | ⚠️ Básico | `POST /ia/plan-semanal` con payload simple. Ampliar + agregar `POST /ia/plan-semanal/regenerar`. |
| `planes-alimentacion.controller.ts` | ⚠️ Básico | Agregar endpoints de versiones, feedback, activar, finalizar. |
| `profesional.controller.ts` | ⚠️ Básico | Agregar endpoints de preferencias IA. |
| `nutricionista-ia-memoria.controller.ts` | ❌ No existe | Crear. |

### Backend — Guards y módulos

- `ActionsGuard` existe pero el código actual NO aplica `@Actions(...)` en los endpoints de plan → gap a cerrar en este feature.
- `NutricionistaOwnershipGuard` existe → se mantiene y se aplica en endpoints nuevos.
- `SocioResourceAccessGuard` existe → se mantiene.
- `planes-alimentacion.module.ts` y `ai.module.ts` necesitan registrar los nuevos use-cases.

### Frontend — `apps/frontend/src/pages/`

| Archivo | Estado | Notas |
|---|---|---|
| `PlanEditorPage.tsx` | ⚠️ Básico | Form simple. Refactor mayor. |
| `MiPlanPage.tsx` | ⚠️ Básico | Sin empty state. Sin N cards. Refactor. |

### Frontend — `apps/frontend/src/components/`

| Carpeta | Estado | Notas |
|---|---|---|
| `ia/GeneradorPlanSemanal.tsx` | ⚠️ Básico | Form V1. REHACER. |
| `plan/WeeklyPlanGrid.tsx` | ⚠️ Básico | Extender con badges macros + regen scope. |
| `ia/FeedbackModal.tsx` | ❌ No existe | Crear. |
| `plan/VersionHistory.tsx` | ❌ No existe | Crear. |
| `plan/MacrosBadge.tsx` | ❌ No existe | Crear. |
| `plan/RazonamientoCumplimiento.tsx` | ❌ No existe | Crear. |
| `profesional/PreferenciasIASection.tsx` | ❌ No existe | Crear. |
| `plan/PlanSocioCard.tsx` | ❌ No existe | Crear. |
| `plan/EmptyStatePlanEnPreparacion.tsx` | ❌ No existe | Crear. |

### Frontend — Hooks

| Hook | Estado | Notas |
|---|---|---|
| `useIa.ts` | ⚠️ Básico | Extender con `generarPlanSemanalV2`, `regenerarPlanSemanal`. |
| `usePreferenciasIa.ts` | ❌ No existe | Crear. |
| `useFeedbackPlan.ts` | ❌ No existe | Crear. |
| `useVersionesPlan.ts` | ❌ No existe | Crear. |

### Shared — `packages/shared/src/types/`

| Archivo | Estado | Notas |
|---|---|---|
| `acciones.ts` | ⚠️ Incompleto | Agregar 6 acciones nuevas de planes IA. |
| `ai.ts` | ⚠️ Básico | Extender con validación, razonamiento, regeneracion. |

### Shared — Enums

| Enum | Estado | Notas |
|---|---|---|
| `TipoNotificacion` | ⚠️ Básico | Agregar 5 valores nuevos. |

### E2E — `e2e/flujos/`

| Archivo | Estado | Notas |
|---|---|---|
| `crear-plan.spec.ts` | ✅ Existe | Reusar setup. |
| `plan-alimentacion-v2.spec.ts` | ❌ No existe | Crear. |

### E2E — `e2e/fixtures/`

| Archivo | Estado | Notas |
|---|---|---|
| `socios-con-restricciones.fixture.ts` | ❌ No existe | Crear. |
| `notas-nutricionista.fixture.ts` | ❌ No existe | Crear. |

---

## Brechas identificadas (gap análisis)

### Funcionales
1. **RF-005** (validación restricciones): no implementada.
2. **RF-006** (validación macros): no implementada.
3. **RF-002** (notas del NUT): parcialmente — campo `presentacion` existe pero es pública.
4. **RF-003** (feedback): no implementado.
5. **RF-004** (memoria IA): no implementado.
6. **RF-007** (regeneración por scope): no implementado.
7. **RF-008** (razonamiento): parcialmente — la IA lo emite pero no se valida ni se persiste formalmente.
8. **RF-009** (versionado): no implementado.
9. **RF-010** (permisos granulares): parcialmente — RBAC básico, falta `ActionsGuard` declarado.

### Técnicas
1. Sin UNIQUE constraint en feedback.
2. Sin lógica transaccional para "activar versión" (riesgo de inconsistencia).
3. Sin backfill de planes existentes a v1 (riesgo de romper lectura).
4. Sin tests de validación de IA con fixtures.
5. Sin cobertura de los errores de borde documentados (RF-001: timeout, JSON malformado).

### Deuda técnica cerrada en este PR
1. Cerrar el gap del `ActionsGuard` (aplicar `@Actions(...)` en endpoints).
2. Logging estructurado en generación (socioId, nutricionistaId, duración, versionId, validacionResultado).
3. Mocks de GroqService para tests reproducibles.

---

## Dependencias externas confirmadas

- **Groq**: API key y model configurados. No se requieren cambios.
- **MySQL**: 8.x. Migración TypeORM única con up + down + backfill.
- **React Query**: ya configurado. Hooks nuevos siguen el patrón.
- **Zod**: ya instalado. Schemas nuevos siguen el patrón.
- **shadcn/ui**: ya configurado. Componentes nuevos siguen el patrón.
- **Playwright**: ya configurado. Spec nuevo reusa setup existente.

---

## Contexto histórico relevante

- Cambios previos en `openspec/changes/`: `ficha-salud`, `crear-turno-...`, `superadmin-panel`, `acceso-roles-...`. Patrón consistente: stacked PRs, tasks por fase, verify report, archive.
- Shaping del feature fue conversacional (PRD en memoria de sesión #1064 de engram). Los archivos físicos del shaping NO se persistieron en `docs/features/` — el contenido del prompt del usuario es la fuente de verdad.
- AGENTS.md del repo: regla absoluta de NO levantar dev servers. Si los puertos están abajo, preguntar a Agustín.

---

## Próximo paso

Proceder con la fase `sdd-spec` para escribir los specs detallados (uno por RF principal) en `openspec/changes/plan-alimentacion-ia-v2/specs/`.