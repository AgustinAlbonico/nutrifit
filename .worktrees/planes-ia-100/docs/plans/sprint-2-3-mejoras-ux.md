# Plan: Sprint 2 y 3 - Mejoras UX

**Creado:** 2026-02-23
**Estado:** COMPLETO ✅

---

## Estado Actual

### MiPlanPage (Sprint 2) - COMPLETO ✅

- ✅ Vista detallada por día con Accordion
- ✅ Lista de alimentos por comida con cantidades
- ✅ Indicadores de calorías/macros por comida y día
- ✅ Resumen nutricional con promedio diario
- ✅ Objetivo nutricional visible
- ✅ Manejo de estados (cargando, sin plan, error)
- ✅ Botón para descargar PDF del plan

### Dashboard (Sprint 3) - COMPLETO ✅

- ✅ Dashboard específico por rol (Nutricionista vs Socio)
- ✅ Widget Turnos del día (Nutricionista)
- ✅ Widget Pacientes recientes (Nutricionista)
- ✅ Widget Próximo turno (Socio)
- ✅ Widget Progreso resumen (Socio)
- ✅ Widget Mensaje motivacional (Socio)

---

## Sprint 2: MiPlanPage - Botón PDF

### Estimación: 2-3 horas

### Tareas

| # | Tarea | Archivo | Est. |
|---|-------|---------|------|
| 2.1 | Reutilizar `ExportPlanPDFButton` del PlanEditor | `MiPlanPage.tsx` | 1h |
| 2.2 | Adaptar datos del plan al formato del componente | `MiPlanPage.tsx` | 1h |
| 2.3 | Testing y ajustes de UX | - | 0.5h |

### Dependencias
- `ExportPlanPDFButton` ya existe en `components/plan/`
- `plan-pdf.tsx` ya genera el documento PDF

---

## Sprint 3: Dashboards por Rol

### Estimación: 1-2 días

### 3.1 Dashboard Nutricionista

| # | Tarea | Archivo | Est. |
|---|-------|---------|------|
| 3.1.1 | Crear `DashboardNutricionista.tsx` | `pages/DashboardNutricionista.tsx` | 2h |
| 3.1.2 | Widget: Turnos del día | Componente nuevo | 1.5h |
| 3.1.3 | Widget: Pacientes recientes | Componente nuevo | 1h |
| 3.1.4 | Widget: Alertas (sin seguimiento) | Componente nuevo | 1h |
| 3.1.5 | Integrar en Dashboard.tsx según rol | `pages/Dashboard.tsx` | 0.5h |

**Widgets implementados:**

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard Nutricionista                                │
├──────────────────────┬──────────────────────────────────┤
│  📅 Turnos de Hoy    │  👥 Pacientes Recientes          │
│  ─────────────────   │  ──────────────────────          │
│  09:00 - Juan Pérez  │  • María López (hace 2 días)     │
│  10:30 - Ana García  │  • Carlos Ruiz (hace 5 días)     │
│  14:00 - Pedro Díaz  │  • Laura Martín (hace 1 semana)  │
│  [+ 3 más]           │  [Ver todos →]                   │
└──────────────────────┴──────────────────────────────────┘
```

### 3.2 Dashboard Socio

| # | Tarea | Archivo | Est. |
|---|-------|---------|------|
| 3.2.1 | Crear `DashboardSocio.tsx` | `pages/DashboardSocio.tsx` | 2h |
| 3.2.2 | Widget: Próximo turno | Componente nuevo | 1h |
| 3.2.3 | Widget: Mi progreso resumen | Reutilizar componentes | 1h |
| 3.2.4 | Widget: Mensaje motivacional | Componente simple | 0.5h |
| 3.2.5 | Integrar en Dashboard.tsx según rol | `pages/Dashboard.tsx` | 0.5h |

**Widgets implementados:**

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard Socio                                        │
├──────────────────────┬──────────────────────────────────┤
│  📅 Próximo Turno     │  📊 Mi Progreso                  │
│  ─────────────────   │  ─────────────────               │
│  Jueves 27/02        │  Peso actual: 75kg               │
│  14:00 hs            │  IMC: 24.5 (Normal)              │
│  Nutr. García        │  Objetivo: 72kg (falta 3kg)      │
├──────────────────────┴──────────────────────────────────┤
│  💬 Mensaje del día                                     │
│  ─────────────────                                      │
│  "¡Vas muy bien! Solo te faltan 3kg para tu objetivo."  │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Endpoints utilizados

| Endpoint | Uso | Estado |
|----------|-----|--------|
| `GET /turnos/profesional/:id/hoy` | Turnos del día | ✅ Ya existía |
| `GET /turnos/socio/mis-turnos` | Turnos del socio | ✅ Ya existía |
| `GET /turnos/profesional/:id/pacientes` | Pacientes del nutricionista | ✅ Ya existía |
| `GET /turnos/socio/mi-progreso` | Resumen progreso | ✅ Ya existía |

---

## Arquitectura de Archivos

```
apps/frontend/src/
├── pages/
│   ├── Dashboard.tsx              # Modificado: router por rol
│   ├── DashboardNutricionista.tsx # CREADO ✅
│   └── DashboardSocio.tsx         # CREADO ✅
├── components/
│   └── dashboard/
│       ├── TurnosDelDiaCard.tsx   # CREADO ✅
│       ├── ProximoTurnoCard.tsx   # CREADO ✅
│       ├── PacientesRecientesCard.tsx # CREADO ✅
│       ├── ProgresoResumenCard.tsx # CREADO ✅
│       └── MensajeMotivacional.tsx # CREADO ✅
```

---

## Criterios de Aceptación

### Sprint 2
- [x] Socio puede descargar PDF de su plan desde MiPlanPage
- [x] PDF incluye todos los días, comidas y alimentos
- [x] Botón visible solo cuando hay plan activo

### Sprint 3 - Nutricionista
- [x] Ve sus turnos del día actual al entrar al dashboard
- [x] Ve lista de pacientes con consultas recientes
- [ ] Ve alertas de pacientes sin seguimiento (opcional - endpoint pendiente)
- [x] Puede navegar a detalles desde cada widget

### Sprint 3 - Socio
- [x] Ve su próximo turno agendado
- [x] Ve resumen de su progreso (peso, IMC, objetivo)
- [x] Ve mensaje motivacional
- [x] Puede navegar a detalles desde cada widget

---

## Estado Final

**Sprint 2 y 3 COMPLETADOS** ✅

### Archivos creados:
- `apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx`
- `apps/frontend/src/components/dashboard/ProximoTurnoCard.tsx`
- `apps/frontend/src/components/dashboard/PacientesRecientesCard.tsx`
- `apps/frontend/src/components/dashboard/ProgresoResumenCard.tsx`
- `apps/frontend/src/components/dashboard/MensajeMotivacional.tsx`
- `apps/frontend/src/pages/DashboardNutricionista.tsx`
- `apps/frontend/src/pages/DashboardSocio.tsx`

### Archivos modificados:
- `apps/frontend/src/pages/MiPlanPage.tsx` (PDF button)
- `apps/frontend/src/pages/Dashboard.tsx` (role routing)

### Verificación:
- TypeScript: ✅
- ESLint: ✅
- Build: ✅

### Notas:
- Los endpoints del backend YA EXISTÍAN, no fue necesario crear nuevos
- El widget de Alertas quedó pendiente (opcional, requiere endpoint nuevo)
