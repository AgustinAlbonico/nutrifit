# Nutrifit Supervisor - Mejora de Planes y Progreso

## What This Is

Sistema de gestión nutricional para gimnasios/centros de fitness que conecta socios con nutricionistas para turnos, seguimiento de salud y planes de alimentación. **Este milestone**: completar al 100% la creación de planes de alimentación y el progreso del socio.

## Core Value

Permitir que el nutricionista cree planes de alimentación completos con un buscador de alimentos funcional, y que tanto el nutricionista como el socio puedan visualizar el progreso con dashboards completos (fotos, mediciones múltiples y gráficos de evolución).

## Requirements

### Validated

- ✓ Sistema de autenticación JWT con roles (ADMIN, NUTRICIONISTA, SOCIO, ASISTENTE) — existente
- ✓ Gestión de socios y nutricionistas — existente
- ✓ Sistema de turnos con estados (PENDIENTE, CONFIRMADO, CANCELADO, REALIZADO, AUSENTE) — existente
- ✓ Ficha de salud del socio — existente
- ✓ Planes de alimentación (estructura básica: PlanAlimentacion, DiaPlan, OpcionComida) — existente
- ✓ Base de datos de alimentos argentinos con información nutricional — existente
- ✓ Mediciones básicas (peso, altura) — existente
- ✓ Dashboard base con navegación por roles — existente

### Active

- [ ] Buscador de alimentos por categorías (carnes, lácteos, vegetales, frutas, cereales, legumbres, etc.)
- [ ] Visualización completa de info del alimento (nombre, calorías, macros, porción, sugerencias)
- [ ] Agregar alimento a comida → luego editar cantidad
- [ ] Estructura semanal completa de plan (Lunes-Domingo × 5 comidas)
- [ ] Exportar plan de alimentación a PDF
- [ ] Fotos de progreso (antes/después con comparación visual)
- [ ] Múltiples mediciones corporales (peso, altura, cintura, cadera, brazo, muslo, pecho)
- [ ] Cálculo automático de IMC
- [ ] Gráficos de evolución en el tiempo
- [ ] Comparación de métricas entre consultas
- [ ] Sistema de objetivos/metas (ej: perder 5kg)
- [ ] Historial detallado de mediciones
- [ ] Exportar reporte de progreso a PDF
- [ ] Dashboard de progreso idéntico para nutricionista y socio

### Out of Scope

- Integración con apps externas (MyFitnessPal, Fitbit) — complejidad alta, futuro
- Notificaciones push/email — ya identificado como gap, futuro
- Templates de planes de alimentación — nice-to-have, futuro
- Filtro de alérgenos y dietas especiales (keto, celíaca, diabética) — no requerido por el usuario
- Calculadora automática de macros — no requerido por el usuario

## Context

### Codebase Existente

**Monorepo** con arquitectura bien definida:
- **Backend**: NestJS + Clean Architecture (domain, application, infrastructure, presentation)
- **Frontend**: React 19 + TanStack Query/Router + shadcn/ui + Tailwind
- **Database**: MySQL con TypeORM

### Entidades Relevantes

| Entidad | Ubicación | Estado |
|---------|-----------|--------|
| `PlanAlimentacion` | `domain/entities/PlanAlimentacion/` | Existe, necesita mejoras |
| `DiaPlan` | `domain/entities/DiaPlan/` | Existe |
| `OpcionComida` | `domain/entities/OpcionComida/` | Existe |
| `Alimento` | `domain/entities/Alimento/` | Existe con datos argentinos |
| `GrupoAlimenticio` | `domain/entities/Alimento/` | Existe, usar para categorías |
| `ObservacionClinica` | `domain/entities/ObservacionClinica/` | Existe para mediciones |

### Páginas Frontend Relevantes

| Página | Ubicación | Estado |
|--------|-----------|--------|
| `PlanEditorPage` | `src/pages/PlanEditorPage.tsx` | Existe, buscador roto |
| `MiPlanPage` | `src/pages/MiPlanPage.tsx` | Existe |
| `ProgresoSocioPage` | `src/pages/ProgresoSocioPage.tsx` | Existe, incompleto |
| `ProgresoPacientePage` | `src/pages/ProgresoPacientePage.tsx` | Existe, incompleto |

### Gap Principal

El **buscador de alimentos** en el plan editor está roto/inexistente. No hay forma de buscar y agregar alimentos a las comidas.

## Constraints

- **Tech Stack**: Mantener NestJS + React + MySQL existente
- **Idioma**: Todo en español (código, UI, mensajes)
- **Timezone**: Argentina (UTC-3)
- **Auth**: JWT existente, mantener roles actuales

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Buscador por categorías (no búsqueda libre) | Usuario prefiere navegación por grupos alimenticios | — Pending |
| Mismo dashboard para ambos roles | Usuario quiere experiencia consistente | — Pending |
| Agregar alimento directo → editar después | Flujo más ágil, menor fricción | — Pending |
| Sin filtro de alérgenos en v1 | Usuario no lo marcó como prioritario | — Pending |
| Sin calculadora automática de macros | Usuario no lo marcó como prioritario | — Pending |

---
*Last updated: 2026-02-22 after initialization*
