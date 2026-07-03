# Progreso Waves 2-6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining progreso module iteration: editable consultation measurements, richer progress dashboard, clinical alerts, measurement comparison, CSV export, and route cleanup.

**Architecture:** Keep backend business rules in turnos application use cases and expose thin controller endpoints. Keep frontend data normalization in progreso components/hooks and UI behavior in focused React components. Avoid broad rewrites of the large consultation page; add only the state required for editable measurements, preload indicators, and persisted collapsible sections.

**Tech Stack:** NestJS, TypeORM, MySQL, React, Vite, TypeScript, React Hook Form, Zod, Vitest, Playwright MCP.

---

## File Structure

- Create `apps/backend/src/application/turnos/dtos/actualizar-medicion.dto.ts` for the update payload.
- Create `apps/backend/src/application/turnos/use-cases/actualizar-medicion.use-case.ts` for measurement update rules.
- Modify `apps/backend/src/application/turnos/use-cases/index.ts` and `apps/backend/src/application/turnos/turnos.module.ts` to export/register the use case.
- Modify `apps/backend/src/presentation/http/controllers/turnos.controller.ts` for `PUT /turnos/:id/mediciones/:medicionId`.
- Modify backend specs for the use case/controller.
- Modify `apps/backend/src/application/turnos/use-cases/get-resumen-progreso.use-case.ts` to include clinical alerts.
- Modify `apps/frontend/src/components/progreso/types.ts` to add alert/comparison-compatible types.
- Modify existing dashboard components: `DashboardProgreso.tsx`, `PanelResumenEvolucion.tsx`, `TablaEvolucionPaciente.tsx`, `GraficoEvolucionPeso.tsx`, `GraficoPrincipalEvolucion.tsx`, `TimelineEvolucionClinica.tsx`.
- Create `AlertasClinicasProgreso.tsx`, `ComparadorMediciones.tsx`, and `ExportProgresoCSVButton.tsx` with colocated tests.
- Modify `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` and tests for PUT/POST selection, preload badges, and persisted collapses.
- Modify `apps/frontend/src/pages/ProgresoPacientePage.tsx` to use TanStack router params.

---

## Tasks

### Task 1: Backend Editable Measurements

- [ ] Add DTO and use case tests proving a nutricionista can update the medicion attached to the current turno.
- [ ] Implement `ActualizarMedicionUseCase` using TypeORM repositories, tenant gym filtering, turno ownership checks, IMC recomputation, and domain exceptions.
- [ ] Export/register the use case and add controller route `PUT /turnos/:id/mediciones/:medicionId`.
- [ ] Add controller spec coverage for route delegation.
- [ ] Run backend focused tests for update mediciones.
- [ ] Commit with `feat: allow editing consulta mediciones`.

### Task 2: Backend Clinical Alerts

- [ ] Add alert types to `GetResumenProgresoUseCase` response: severity, title, message, metric, value.
- [ ] Add tests for high cardiovascular risk, obesity IMC, rapid weight change, and high blood pressure.
- [ ] Implement deterministic alert calculation from the latest measurements and existing summary metrics.
- [ ] Run focused backend resumen tests.
- [ ] Commit with `feat: add progreso clinical alerts`.

### Task 3: Consultation Page UX

- [ ] Add tests for POST when there is no current medicion and PUT when an existing medicion is present.
- [ ] Add test for preload badge visibility when previous measurement values populate empty fields.
- [ ] Add test for localStorage-backed section collapse persistence.
- [ ] Implement minimal state for current saved medicion, preload source markers, PUT/POST selection, and persisted collapses.
- [ ] Run focused frontend page tests.
- [ ] Commit with `feat: improve consulta mediciones editing`.

### Task 4: Dashboard Summary, Table, Chart, Timeline

- [ ] Expand `PanelResumenEvolucion` to show composition KPIs for body fat and lean mass.
- [ ] Expand `TablaEvolucionPaciente` with composition/vitals columns and clear empty states.
- [ ] Thread active weight objective into `GraficoPrincipalEvolucion` and `GraficoEvolucionPeso` as an objective reference line.
- [ ] Make `TimelineEvolucionClinica` expandable/collapsible per event without losing current chronological behavior.
- [ ] Update component tests.
- [ ] Commit with `feat: enrich progreso dashboard summary`.

### Task 5: Alerts, Comparison, CSV Export

- [ ] Add `AlertasClinicasProgreso` and render it in the dashboard summary tab when backend alerts exist.
- [ ] Add `ComparadorMediciones` under a new dashboard tab for two selected mediciones.
- [ ] Add `ExportProgresoCSVButton` beside existing PDF export.
- [ ] Update dashboard tests for new tab/action visibility.
- [ ] Commit with `feat: add progreso comparison and export tools`.

### Task 6: Route Cleanup and Verification

- [ ] Replace manual pathname parsing in `ProgresoPacientePage.tsx` with TanStack `useParams`.
- [ ] Run LSP diagnostics on changed files.
- [ ] Run focused backend/frontend tests.
- [ ] Run frontend lint/build if practical; if repository-wide unrelated failures remain, document them with evidence.
- [ ] Check ports without starting servers. If frontend/backend are up, run Playwright MCP verification for consultation and progreso dashboard acceptance contract.
- [ ] Run `npx -y react-doctor@latest . --verbose --diff` after React changes.
- [ ] Commit/push remaining verified changes.

---

## Acceptance Contract

- Existing consultation measurement: save uses `PUT` and updates the same record.
- New consultation measurement: save uses `POST` and creates one record.
- Preloaded previous values are visible as previous-value hints, not silent magic.
- Collapsed consultation sections persist across reloads.
- Dashboard shows expanded history, composition KPIs, objective reference, interactive timeline, clinical alerts, comparison, and CSV export.
- Progreso patient route uses router params, not manual URL parsing.
- Verification evidence is fresh before completion claims.
