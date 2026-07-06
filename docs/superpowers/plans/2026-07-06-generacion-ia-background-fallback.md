# Generación IA Background Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Gemini/OpenRouter fallback, persisted background meal-plan generation, fixed frontend status badge, and global edit lock while IA generation runs.

**Architecture:** Keep the existing synchronous generation use case as the core plan builder, wrap it with a persisted generation-job workflow, and move provider fallback below the existing `IAiProviderService` port. The frontend starts a generation job, polls its persisted status, shows a fixed badge, and disables all plan-editing paths while the backend reports an active job.

**Tech Stack:** NestJS, TypeORM, MySQL, React, Vite, TanStack Query, existing `apiRequest`, Playwright MCP for manual visual verification.

---

## Constraints

- Do not start or stop backend/frontend dev servers. If browser/API verification needs them and ports are down, ask Agustín to start them.
- Do not create automated tests unless Agustín explicitly asks.
- Keep code and UI copy in Spanish, matching project convention.
- Commit and push to `origin main` after the completed implementation.
- Work directly on `main`; do not create worktrees or feature branches.

## File map

### Backend provider fallback

- Modify: `apps/backend/src/domain/services/ai-provider.service.ts` — add provider metadata/error typing only if needed by adapters.
- Modify: `apps/backend/src/infrastructure/config/environment-config/environment-config.service.ts` — add Gemini/OpenRouter/chain getters.
- Modify: `apps/backend/src/infrastructure/services/groq/groq.module.ts` — bind `AI_PROVIDER_SERVICE` to the orchestrator instead of Groq directly.
- Create: `apps/backend/src/infrastructure/services/ai/ai-provider-orchestrator.service.ts` — provider chain and fallback logic.
- Create: `apps/backend/src/infrastructure/services/gemini/gemini.service.ts` — Gemini provider adapter.
- Create: `apps/backend/src/infrastructure/services/openrouter/openrouter.service.ts` — OpenRouter provider adapter.

### Backend background jobs and locking

- Create: `apps/backend/src/domain/entities/generacion-plan-ia.entity.ts` — domain shape or enum exports for generation jobs.
- Create: `apps/backend/src/infrastructure/database/entities/generacion-plan-ia.orm-entity.ts` — TypeORM entity.
- Create: `apps/backend/src/domain/repositories/generacion-plan-ia.repository.ts` — repository port.
- Create: `apps/backend/src/infrastructure/repositories/typeorm-generacion-plan-ia.repository.ts` — TypeORM repository implementation.
- Create: `apps/backend/src/application/ai/use-cases/iniciar-generacion-plan-ia.use-case.ts` — create job and trigger background execution.
- Create: `apps/backend/src/application/ai/use-cases/obtener-generacion-plan-ia.use-case.ts` — fetch job by ID.
- Create: `apps/backend/src/application/ai/use-cases/obtener-generacion-activa-plan-ia.use-case.ts` — fetch active job for socio/plan.
- Create: `apps/backend/src/application/ai/services/ejecutor-generacion-plan-ia.service.ts` — execute job and update state.
- Modify: `apps/backend/src/application/ai/ai.module.ts` — register new use cases/services/repository.
- Modify: `apps/backend/src/presentation/http/controllers/ai.controller.ts` — add async endpoints.
- Modify: manual plan mutation use cases/controllers under `apps/backend/src/application/planes-alimentacion/` and `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts` — reject edits while job is active.

### Frontend async generation UX

- Modify: `apps/frontend/src/types/ia.ts` — add job request/response/status types.
- Modify: `apps/frontend/src/hooks/useIa.ts` — add create/poll/active generation operations.
- Modify: `apps/frontend/src/components/ia/GeneradorPlanSemanal.tsx` — submit async job and return job data instead of final plan for the new flow.
- Create: `apps/frontend/src/components/ia/BadgeGeneracionPlanIa.tsx` — fixed status badge.
- Modify: `apps/frontend/src/pages/PlanEditorPage.tsx` — poll active job, render badge, disable editing, refresh plan on completion.

## Task 1: Add AI provider fallback configuration

**Files:**
- Modify: `apps/backend/src/infrastructure/config/environment-config/environment-config.service.ts`

- [ ] **Step 1: Add config getters**

Add methods matching the existing Groq getters:

```ts
getAiProviderChain(): string[] {
  const raw = this.configService.get<string>('AI_PROVIDER_CHAIN') ?? 'groq';
  return raw
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider) => provider.length > 0);
}

getGeminiApiKey(): string | undefined {
  return this.configService.get<string>('GEMINI_API_KEY');
}

getGeminiModel(): string {
  return this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';
}

getOpenRouterApiKey(): string | undefined {
  return this.configService.get<string>('OPENROUTER_API_KEY');
}

getOpenRouterBaseUrl(): string {
  return this.configService.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
}

getOpenRouterModel(): string {
  return this.configService.get<string>('OPENROUTER_MODEL') ?? 'google/gemini-2.0-flash-exp:free';
}
```

- [ ] **Step 2: Run diagnostics**

Run LSP diagnostics on the changed config file.

Expected: no TypeScript errors in `environment-config.service.ts`.

## Task 2: Add Gemini and OpenRouter adapters

**Files:**
- Create: `apps/backend/src/infrastructure/services/gemini/gemini.service.ts`
- Create: `apps/backend/src/infrastructure/services/openrouter/openrouter.service.ts`

- [ ] **Step 1: Implement OpenRouter adapter**

Use the same OpenAI SDK style as `GroqService`, with OpenRouter base URL/model/config. Implement `IAiProviderService`.

Required behavior:

- Build the same Spanish system/user prompt contract used by Groq.
- Use `chat.completions.create()` with JSON object response format.
- Parse JSON with the same strictness as Groq.
- Map rate limit/quota responses to the same provider-limit error category used by the orchestrator.

- [ ] **Step 2: Implement Gemini adapter**

Use the Gemini REST API through `fetch` or an installed official package if already present. Do not add a dependency unless package.json already includes one suitable for Gemini.

Required behavior:

- Same `IAiProviderService` contract.
- Same Spanish JSON-only generation instruction.
- Respect `temperature`, `maxTokens`, and timeout configuration where Gemini supports it.
- Parse Gemini text response into JSON.
- Map rate limit/quota responses to provider-limit errors.

- [ ] **Step 3: Run diagnostics**

Run LSP diagnostics on both new provider files.

Expected: no TypeScript errors.

## Task 3: Add provider orchestrator

**Files:**
- Create: `apps/backend/src/infrastructure/services/ai/ai-provider-orchestrator.service.ts`
- Modify: `apps/backend/src/infrastructure/services/groq/groq.module.ts`

- [ ] **Step 1: Implement provider registry**

Create a provider registry keyed by `groq`, `gemini`, and `openrouter`.

Required behavior:

- Read order from `getAiProviderChain()`.
- Skip providers without API key configured.
- Call each provider with the same prompt/configuration.
- Continue only when the error is quota/transient.
- Throw immediately for schema/JSON/validation errors.
- Include attempted provider names in the final error message if every provider fails due to quota/transient errors.

- [ ] **Step 2: Wire DI**

Update `GroqModule` so concrete services are providers and `AI_PROVIDER_SERVICE` resolves to `AiProviderOrchestratorService`.

- [ ] **Step 3: Run diagnostics**

Run LSP diagnostics on orchestrator and module files.

Expected: no TypeScript errors.

## Task 4: Persist IA generation jobs

**Files:**
- Create: `apps/backend/src/domain/entities/generacion-plan-ia.entity.ts`
- Create: `apps/backend/src/infrastructure/database/entities/generacion-plan-ia.orm-entity.ts`
- Create: `apps/backend/src/domain/repositories/generacion-plan-ia.repository.ts`
- Create: `apps/backend/src/infrastructure/repositories/typeorm-generacion-plan-ia.repository.ts`
- Modify: backend module where TypeORM entities are registered.

- [ ] **Step 1: Define statuses**

Create enum:

```ts
export enum EstadoGeneracionPlanIa {
  PENDIENTE = 'PENDIENTE',
  GENERANDO = 'GENERANDO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
}
```

- [ ] **Step 2: Create TypeORM entity**

Include IDs, status, provider/message/error/result fields, and timestamps described in the design doc.

- [ ] **Step 3: Create repository port and adapter**

Required repository methods:

```ts
crear(datos: CrearGeneracionPlanIa): Promise<GeneracionPlanIa>;
buscarPorId(id: number): Promise<GeneracionPlanIa | null>;
buscarActivaPorSocioPlan(params: BuscarGeneracionActivaParams): Promise<GeneracionPlanIa | null>;
marcarGenerando(id: number, proveedorActual?: string): Promise<void>;
marcarCompletada(id: number, resultado: ResultadoGeneracionPlanIa): Promise<void>;
marcarError(id: number, errorMensaje: string): Promise<void>;
actualizarEstado(id: number, cambios: ActualizarGeneracionPlanIa): Promise<void>;
```

- [ ] **Step 4: Run diagnostics**

Run LSP diagnostics on all created/modified backend files.

Expected: no TypeScript errors.

## Task 5: Add background generation use cases

**Files:**
- Create: `apps/backend/src/application/ai/use-cases/iniciar-generacion-plan-ia.use-case.ts`
- Create: `apps/backend/src/application/ai/use-cases/obtener-generacion-plan-ia.use-case.ts`
- Create: `apps/backend/src/application/ai/use-cases/obtener-generacion-activa-plan-ia.use-case.ts`
- Create: `apps/backend/src/application/ai/services/ejecutor-generacion-plan-ia.service.ts`
- Modify: `apps/backend/src/application/ai/ai.module.ts`

- [ ] **Step 1: Create iniciar use case**

Behavior:

- Validate no active generation exists for the socio/plan.
- Create `PENDIENTE` job.
- Trigger execution with `void ejecutor.ejecutar(job.id)` after persistence.
- Return job summary immediately.

- [ ] **Step 2: Create executor service**

Behavior:

- Mark job `GENERANDO`.
- Call existing `GenerarPlanSemanalUseCase.execute()` with stored request data.
- Mark `COMPLETADO` with `planAlimentacionId` and `versionId`.
- Catch errors, store message, and mark `ERROR`.

- [ ] **Step 3: Create query use cases**

Implement fetch-by-id and fetch-active use cases using the repository.

- [ ] **Step 4: Wire module**

Register the repository adapter, use cases, and executor in `AiModule`.

- [ ] **Step 5: Run diagnostics**

Run LSP diagnostics on all created/modified backend files.

Expected: no TypeScript errors.

## Task 6: Add async IA endpoints

**Files:**
- Modify: `apps/backend/src/presentation/http/controllers/ai.controller.ts`
- Add DTOs near existing IA DTOs if the project keeps them separate.

- [ ] **Step 1: Add POST endpoint**

Add:

```txt
POST /ia/plan-semanal/generaciones
```

It accepts the same request shape as current `POST /ia/plan-semanal`, adds current user IDs, starts a job, and returns job summary.

- [ ] **Step 2: Add status endpoints**

Add:

```txt
GET /ia/plan-semanal/generaciones/activa?socioId=:socioId&planAlimentacionId=:planId
GET /ia/plan-semanal/generaciones/:id
```

- [ ] **Step 3: Run diagnostics**

Run LSP diagnostics on controller and DTO files.

Expected: no TypeScript errors.

## Task 7: Block backend manual edits while generation is active

**Files:**
- Modify relevant manual plan mutation use cases/controllers under `apps/backend/src/application/planes-alimentacion/` and `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts`.

- [ ] **Step 1: Find mutation points**

Use codegraph to locate handlers for:

- `/planes-alimentacion/crear-manual/:socioId`
- `/planes-alimentacion/:planId/persistir-manual`
- `/planes-alimentacion/:planId/guardar-version`

- [ ] **Step 2: Inject generation repository/query service**

Before each mutation, check active generation for the relevant socio/plan.

- [ ] **Step 3: Throw conflict**

Use existing domain exception style:

```ts
throw new ConflictError(
  'Hay una generación de plan con IA en curso. Esperá a que finalice para editar el plan.',
);
```

- [ ] **Step 4: Run diagnostics**

Run LSP diagnostics on changed backend files.

Expected: no TypeScript errors.

## Task 8: Add frontend IA job types and hook methods

**Files:**
- Modify: `apps/frontend/src/types/ia.ts`
- Modify: `apps/frontend/src/hooks/useIa.ts`

- [ ] **Step 1: Add FE types**

Add Spanish-named types for:

- `EstadoGeneracionPlanIaFE`
- `GeneracionPlanIaFE`
- `RespuestaIniciarGeneracionPlanIaFE`

- [ ] **Step 2: Add hook methods**

Add methods/mutations for:

- iniciar generación async.
- consultar generación por ID.
- consultar generación activa.

- [ ] **Step 3: Invalidate queries on completion**

When status becomes `COMPLETADO`, invalidate:

- `['planes-alimentacion']`
- `['planes-alimentacion', planAlimentacionId, 'versiones']`

- [ ] **Step 4: Run diagnostics**

Run LSP diagnostics on changed frontend files.

Expected: no TypeScript errors.

## Task 9: Add fixed badge component

**Files:**
- Create: `apps/frontend/src/components/ia/BadgeGeneracionPlanIa.tsx`

- [ ] **Step 1: Implement badge**

Requirements:

- Fixed position.
- `data-testid="badge-generacion-ia"`.
- `data-testid="estado-generacion-ia"` on status text.
- Shows spinner while `PENDIENTE`/`GENERANDO`.
- Shows provider and message when present.
- Spanish UI copy.

- [ ] **Step 2: Run diagnostics**

Run LSP diagnostics on the new component.

Expected: no TypeScript errors.

## Task 10: Integrate async generation and edit lock in PlanEditorPage

**Files:**
- Modify: `apps/frontend/src/pages/PlanEditorPage.tsx`
- Modify: `apps/frontend/src/components/ia/GeneradorPlanSemanal.tsx`

- [ ] **Step 1: Submit async job**

Change the editor generation flow to call the async generation mutation and close/confirm quickly after job creation.

- [ ] **Step 2: Poll active job**

In `PlanEditorPage`, poll active generation while status is active.

- [ ] **Step 3: Render badge**

Render `BadgeGeneracionPlanIa` when a job is active or recently errored/completed if useful.

- [ ] **Step 4: Disable editing paths**

When `planBloqueadoPorIa` is true:

- disable generate button.
- disable save version button.
- block `handleEstructuraChange`.
- block `handleDragEnd`.
- block `handleAddIdea`.
- block `handleSelectSlotForIa`.
- skip autosave.

- [ ] **Step 5: Refresh on completion**

When status changes to `COMPLETADO`, reload plan/version data and show success toast.

- [ ] **Step 6: Run diagnostics**

Run LSP diagnostics on changed frontend files.

Expected: no TypeScript errors.

## Task 11: Verify build and manual QA

**Files:**
- No source changes unless verification reveals a defect.

- [ ] **Step 1: Run static verification**

Run project typecheck/build commands available in `package.json` without starting dev servers.

Expected: commands complete or any pre-existing unrelated failures are documented with exact output.

- [ ] **Step 2: Check server ports**

Use `Test-NetConnection` or HTTP checks for backend/frontend ports. Do not start servers.

If ports are down, ask Agustín to start them and stop.

- [ ] **Step 3: Playwright visual QA**

With servers already running, use Playwright MCP to open:

```txt
/profesional/plan/$socioId/editar
```

Verify:

- `badge-generacion-ia` appears after starting generation.
- `abrir-generador-ia-btn` is disabled during generation.
- `guardar-version-btn` is disabled during generation.
- editor grid cannot be changed during generation.
- final state unlocks after completion/error.

- [ ] **Step 4: Commit and push**

Inspect status/diff/log, stage only intentional files, commit with Conventional Commit, and push:

```bash
git status
git diff
git log --oneline -10
git add <intentional files>
git commit -m "feat: add background ai plan generation fallback"
git push origin main
```

## Self-review checklist

- [ ] Gemini and OpenRouter are integrated behind the existing AI provider port.
- [ ] Fallback only happens on quota/transient provider errors.
- [ ] Background generation state is persisted.
- [ ] Editing lock is global/persisted and enforced in backend.
- [ ] Frontend shows fixed badge and disables editing while generation is active.
- [ ] Playwright visual QA covers badge + disabled controls.
- [ ] No automated tests were added without Agustín explicitly asking.
