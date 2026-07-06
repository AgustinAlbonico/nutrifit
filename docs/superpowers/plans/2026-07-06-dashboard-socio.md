# Dashboard Socio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el dashboard del socio en una superficie accionable y corregir las rutas rotas de acciones rápidas.

**Architecture:** Mantener la composición existente del dashboard y mejorar solo componentes propios del socio. No tocar `EstadisticasKpiCard` porque también alimenta dashboards de nutricionista y recepcionista.

**Tech Stack:** React, TanStack Router, TanStack Query, Tailwind CSS, shadcn/ui, lucide-react.

---

### Task 1: Documentar contrato aprobado

**Files:**
- Create: `docs/plans/2026-07-06-dashboard-socio-design.md`

- [x] **Step 1: Registrar qué pidió Agustín y qué debe verse**

Guardar la tabla de aceptación con rutas reales, hero “Tu plan de hoy”, KPIs claros y verificación Playwright.

### Task 2: Corregir navegación y UX principal

**Files:**
- Modify: `apps/frontend/src/pages/DashboardSocio.tsx`
- Modify: `apps/frontend/src/components/dashboard/AccionesRapidasSocioCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/PlanAlimenticioCard.tsx`

- [x] **Step 1: Hero accionable**

Agregar CTAs a `/turnos/agendar` y `/mi-progreso`, más resumen de próximo turno.

- [x] **Step 2: Rutas correctas**

Cambiar acciones rápidas a `/turnos/agendar`, `/mi-plan` y `/mi-progreso`.

- [x] **Step 3: CTA de plan correcto**

Cambiar “Ver plan completo” de `/planes` a `/mi-plan` y mejorar vacío sin plan.

### Task 3: Pulir microcopy de soporte

**Files:**
- Modify: `apps/frontend/src/components/dashboard/GraficoProgresoCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/ObjetivosCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/MensajeMotivacional.tsx`

- [x] **Step 1: Vacíos más útiles**

Explicar cuándo aparecerá el gráfico y cómo definir objetivos.

- [x] **Step 2: Acentos y tono local**

Corregir textos sin acentos y mantener copy en español.

### Task 4: Verificar sin levantar servidores

**Files:**
- No code changes.

- [x] **Step 1: LSP diagnostics**

Run: diagnostics on every changed frontend source file.

Expected: no diagnostics.

- [x] **Step 2: Build/lint**

Run: `npm run build:frontend` and `npm run lint:frontend`.

Expected: exit code 0, unless pre-existing unrelated issues surface.

- [x] **Step 3: Visual QA**

If ports 5173 and 3000 are already up, use Playwright to verify `/dashboard` and quick-action navigation. If ports are down, ask Agustín to start them and stop.
