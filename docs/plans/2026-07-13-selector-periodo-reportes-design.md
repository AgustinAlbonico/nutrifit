# Diseño: Selector de Período con Rangos Preestablecidos — Reportes Admin

**Fecha:** 2026-07-13
**Estado:** Propuesto — pendiente de aprobación de Agustín
**Alcance:** Solo frontend — `apps/frontend/src/pages/admin/ReportesAdminPage.tsx`

---

## 1. Contexto

La página `/admin/reportes` (rol ADMIN/SUPERADMIN) ya permite filtrar el reporte de turnos con dos inputs de fecha (`fechaInicio`, `fechaFin`) que disparan automáticamente las queries `kpi-completo` y `asistencia-profesionales`, y que además alimentan el export CSV.

Pedido explícito de Agustín: agregar un botón que permita seleccionar rangos preestablecidos (hoy, esta semana, este mes, mes pasado, este año, año pasado) y rango personalizado para tipear manualmente.

El archivo `ReportesAdminPage.tsx` ya tiene trabajo local sin commitear que agrega el reporte de asistencia por nutricionista (interfaces, query, KPIs, gráfico y tabla). El cambio nuevo debe **preservar** ese trabajo sin alterarlo.

## 2. Estado actual

- Tarjeta "Período" con dos `<Input type="date">` (Desde/Hasta).
- Estado inicial: últimos 30 días hasta hoy.
- Constraints activas: `max={fechaHoy}` en fin, `max={fechaFin || fechaHoy}` en inicio, `min={fechaInicio}` en fin.
- `formatearFechaInput(Date)` produce `YYYY-MM-DD` en hora local.
- Query keys ya incluyen `fechaInicio,fechaFin` → cualquier cambio de estado refetchea automáticamente.

## 3. Diseño propuesto

### 3.1 Estructura visual del Card "Período"

```
┌─ Período ────────────────────────────────────────────┐
│  [ Hoy ▾ ]   Desde [2026-06-13]  Hasta [2026-07-13]   │
└─────────────────────────────────────────────────────┘
              ↑
              Popover con 7 opciones:
              • Hoy
              • Esta semana
              • Este mes
              • Mes pasado
              • Este año
              • Año pasado
              ─────────────
              • Rango personalizado
```

### 3.2 Comportamiento

- Click en el botón "Período" → abre el popover con las 7 opciones.
- Click en una opción preestablecida:
  - Calcula las fechas con `Date` local.
  - Setea `fechaInicio`/`fechaFin`.
  - Cierra el popover.
  - Las queries refetchean solas (mecanismo ya existente).
- Click en "Rango personalizado":
  - Cierra el popover.
  - Hace focus en el input "Desde" para edición manual.
- Los inputs Desde/Hasta **siempre quedan visibles** debajo del botón para ajustes finos o tipeo manual directo.

### 3.3 Helpers de cálculo (puros, sin estado)

- `obtenerRangoHoy()` → hoy, hoy.
- `obtenerRangoEstaSemana()` → lunes de esta semana, hoy (semana lunes→domingo, estándar AR).
- `obtenerRangoEsteMes()` → día 1 del mes actual, hoy.
- `obtenerRangoMesPasado()` → día 1 del mes pasado, último día del mes pasado.
- `obtenerRangoEsteAnio()` → 1 de enero de este año, hoy.
- `obtenerRangoAnioPasado()` → 1 de enero del año pasado, 31 de diciembre del año pasado.

Todas usan `Date` local y formatean con `formatearFechaInput(Date)` (helper existente) para evitar off-by-one por UTC.

### 3.4 Componentes UI a usar (ya disponibles)

- `Button` de shadcn/ui (`apps/frontend/src/components/ui/button.tsx`).
- `Popover`, `PopoverTrigger`, `PopoverContent` de shadcn/ui (`apps/frontend/src/components/ui/popover.tsx`).
- Icono: `lucide-react` → `CalendarDays` o `ChevronDown`.

Sin nuevas dependencias.

## 4. Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `apps/frontend/src/pages/admin/ReportesAdminPage.tsx` | Modificación: agregar imports, helpers, estado del popover, botón y manejo de presets |

No se crean archivos nuevos. No se modifican DTOs, tipos, ni hooks.

## 5. Contrato de aceptación

| Pedido | Debería verse |
|---|---|
| Botón con rangos preestablecidos | Botón "Período" con icono, ubicado en la tarjeta Período a la izquierda de los inputs |
| Hoy | Inputs = fecha de hoy en ambos; queries refetchan |
| Esta semana | Inputs = lunes de esta semana → hoy |
| Este mes | Inputs = día 1 del mes actual → hoy |
| Mes pasado | Inputs = día 1 del mes pasado → último día del mes pasado |
| Este año | Inputs = 1 de enero de este año → hoy |
| Año pasado | Inputs = 1 de enero del año pasado → 31 de diciembre del año pasado |
| Rango personalizado | Cierra popover y hace focus en input "Desde" |
| Constraints existentes | Sin fechas futuras; Desde ≤ Hasta |
| Trabajo local previo | Reporte de asistencia por nutricionista intacto |
| Export CSV | Usa el último rango activo (preset o custom) |

## 6. Riesgos y mitigaciones

- **R1 — Trabajo local sin commitear de asistencia:** preservado al 100%. El cambio se integra solo agregando imports, helpers y bloque del botón/popover; no se tocan interfaces ni la query de asistencia.
- **R2 — Off-by-one por UTC:** mitigado usando `Date` local y el helper `formatearFechaInput` existente.
- **R3 — Conflictos con `git pull` futuro:** cambios localizados en un solo archivo y concentrados; bajo riesgo de conflicto.

## 7. Pendiente de decisión

- **Semana lunes→domingo vs domingo→sábado:** propuesto lunes→domingo (estándar AR). Confirmar con Agustín.
- **Opción "Rango personalizado":** propuesto cerrar popover + focus en "Desde". Confirmar con Agustín.