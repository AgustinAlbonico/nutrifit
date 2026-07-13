# Plan de Implementación: Selector de Período con Rangos Preestablecidos

**Fecha:** 2026-07-13
**Diseño:** `docs/plans/2026-07-13-selector-periodo-reportes-design.md`
**Alcance:** `apps/frontend/src/pages/admin/ReportesAdminPage.tsx`
**Tests:** no se crean tests automáticos (regla absoluta del proyecto).

---

## 1. Prerrequisitos

- ✅ Diseño aprobado por Agustín.
- ✅ Servers levantados por Agustín (backend 3000, frontend 5173) — **no tocarlos**.
- ✅ Verificar puertos con `Test-NetConnection` antes de cualquier verificación visual.

## 2. Pasos de implementación

### Paso 1 — Imports nuevos
- `Popover`, `PopoverTrigger`, `PopoverContent` desde `@/components/ui/popover`.
- `CalendarDays` o `ChevronDown` desde `lucide-react`.
- Verificar que `Button` ya está importado; si no, agregarlo.

### Paso 2 — Helpers de fechas (puros)
Agregar en el archivo (top-level, fuera del componente):

```ts
function obtenerRangoHoy(): { inicio: string; fin: string }
function obtenerRangoEstaSemana(): { inicio: string; fin: string }
function obtenerRangoEsteMes(): { inicio: string; fin: string }
function obtenerRangoMesPasado(): { inicio: string; fin: string }
function obtenerRangoEsteAnio(): { inicio: string; fin: string }
function obtenerRangoAnioPasado(): { inicio: string; fin: string }
```

Implementación:
- Construir `Date` en local.
- Formatear con `formatearFechaInput(Date)` (ya existe).
- Semana lunes→domingo.

### Paso 3 — Estado del popover
```ts
const [periodoPopoverAbierto, setPeriodoPopoverAbierto] = useState(false);
const refDesdeInput = useRef<HTMLInputElement | null>(null);
```

### Paso 4 — Handler unificado
```ts
const aplicarPeriodo = (rango: { inicio: string; fin: string }, conFocusEnInicio = false) => {
  setFechaInicio(rango.inicio);
  setFechaFin(rango.fin);
  setPeriodoPopoverAbierto(false);
  if (conFocusEnInicio) {
    setTimeout(() => refDesdeInput.current?.focus(), 0);
  }
};
```

### Paso 5 — UI del botón + popover
Insertar dentro del `<Card>` de "Período", **antes** del bloque de los dos inputs:

- `<Popover open={periodoPopoverAbierto} onOpenChange={setPeriodoPopoverAbierto}>`
- `<PopoverTrigger asChild><Button variant="outline" className="gap-2"><CalendarDays /> Período <ChevronDown /></Button></PopoverTrigger>`
- `<PopoverContent className="w-56 p-1" align="start">` con una lista de botones:
  - "Hoy" → `aplicarPeriodo(obtenerRangoHoy())`
  - "Esta semana" → `aplicarPeriodo(obtenerRangoEstaSemana())`
  - "Este mes" → `aplicarPeriodo(obtenerRangoEsteMes())`
  - "Mes pasado" → `aplicarPeriodo(obtenerRangoMesPasado())`
  - "Este año" → `aplicarPeriodo(obtenerRangoEsteAnio())`
  - "Año pasado" → `aplicarPeriodo(obtenerRangoAnioPasado())`
  - Separador (`<div className="my-1 h-px bg-border" />`)
  - "Rango personalizado" → `aplicarPeriodo({ inicio: '', fin: '' }, true)` — pero antes de borrar el estado, mejor: cerrar el popover y focus en "Desde" sin tocar `fechaInicio`/`fechaFin` (así no se gatilla un refetch vacío).

### Paso 6 — Ref en input "Desde"
- Agregar `ref={refDesdeInput}` al `<Input>` de fechaInicio.

### Paso 7 — Layout
- Envolver el contenido del Card "Período" en un `flex flex-col gap-3` o `space-y-3` para mantener separación visual entre el botón y los inputs.

## 3. Validación técnica (sin crear tests)

- `lsp_diagnostics` sobre el archivo modificado → 0 errores.
- `npm run typecheck -w @nutrifit/frontend` → pasa.
- `npm run lint -w @nutrifit/frontend` → pasa (o solo warnings preexistentes).
- Revisión React (sin crear tests): hooks en orden estable, sin closures raras, refs bien usados.

## 4. Verificación visual con Playwright MCP

Precondición: confirmar que los servidores están arriba (`Test-NetConnection localhost 3000` y `:5173`). Si NO están, pedirle a Agustín que los levante.

Pasos:

1. Login como `admin-central@nutrifit.com` (password `123456`) en `http://localhost:5173`.
2. Navegar a `/admin/reportes`.
3. Snapshot inicial:
   - Confirmar botón "Período" visible a la izquierda de los inputs.
   - Confirmar inputs muestran últimos 30 días.
4. `playwright_browser_click` sobre el botón → snapshot del popover:
   - Confirmar las 7 opciones en orden: Hoy, Esta semana, Este mes, Mes pasado, Este año, Año pasado, Rango personalizado.
5. Click en **Hoy**:
   - Inputs muestran fecha de hoy en ambos.
   - Network: `GET /admin/estadisticas/kpi-completo?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD` con la misma fecha.
6. Repetir con **Este mes**, **Mes pasado**, **Año pasado**, leyendo la fecha del sistema con `playwright_browser_evaluate` para validar.
7. Click en **Rango personalizado**:
   - Popover se cierra.
   - El input "Desde" tiene focus (verificable con `playwright_browser_evaluate` → `document.activeElement`).
8. Tipear rango custom (ej: `2026-01-01` a `2026-01-31`):
   - Queries refetchan con el nuevo rango.
9. Constraint existente: intentar setear `fechaFin` con fecha futura → bloqueado por `max`.
10. Exportar CSV → archivo descargado refleja el último rango activo.
11. Verificar visualmente que el bloque de "asistencia por nutricionista" sigue funcionando con el nuevo rango.

## 5. Commit y push

- `git status` + `git diff` → revisar que solo se commitea el archivo modificado y los nuevos docs.
- `git add apps/frontend/src/pages/admin/ReportesAdminPage.tsx docs/plans/2026-07-13-selector-periodo-reportes-design.md docs/plans/2026-07-13-selector-periodo-reportes-plan.md`.
- Mensaje: `feat(admin-reportes): selector de período con rangos preestablecidos`.
- `git push origin main`.

## 6. Criterios de "hecho"

- [ ] Botón "Período" visible y popover con 7 opciones funciona.
- [ ] Cada preset setea las fechas correctas y dispara el refetch.
- [ ] "Rango personalizado" cierra y enfoca "Desde".
- [ ] Inputs Desde/Hasta siguen editables manualmente.
- [ ] Constraints existentes (sin fechas futuras, Desde ≤ Hasta) intactas.
- [ ] Reporte de asistencia por nutricionista intacto.
- [ ] Export CSV usa el rango activo.
- [ ] `lsp_diagnostics` limpio en el archivo modificado.
- [ ] `typecheck` y `lint` pasan.
- [ ] Verificación visual con Playwright completa con evidencia.
- [ ] Commit + push a `origin main`.