# Editor de Plan Manual con Ideas IA: Errores detectados

> **Fuente**: `docs/superpowers/specs/2026-06-29-editor-plan-manual-ia-ideas-design.md`
> **Fecha**: 2026-06-29
> **Herramienta**: Playwright MCP
> **Usuario**: nutri-central@nutrifit.com (Nutri Central, personaId=5)
> **Plan**: Plan #185 de Diego González (socioId=273)

---

## 🔴 Errores funcionales

### 1. Tab Manual no visible sin plan generado previamente

- **Spec**: Sección 5.2 — "Tab 'Manual' es default si no hay plan previo". La grilla 7×5 debe ser accesible incluso sin haber generado un plan con IA.
- **Realidad**: El tab Manual se renderiza condicionalmente con `{respuesta?.planAlimentacionId && (<TabsTrigger value="manual">...>)}` en `PlanEditorPage.tsx:404`. Como `respuesta` arranca en `null`, el tab no aparece hasta que el NUT genera un plan con IA primero.
- **Impacto**: El modo manual no puede usarse para crear un plan desde cero. Obliga al NUT a generar un plan con IA aunque quiera armarlo manualmente.

### 2. Auto-fetch masivo de ideas-comida al montar tab Manual

- **Spec**: Las ideas IA deben cargarse bajo demanda, cuando el NUT clickea "Sugerir ideas" en un slot (sección 4.2).
- **Realidad**: `SugerenciasIaSlot.tsx:50-53` tiene un `useEffect(() => { cargar(); }, [])` que auto-fetchea `POST /planes-alimentacion/:id/ideas-comida` al montarse. Como hay 35 slots (7 días × 5 comidas), se disparan 35 requests simultáneas al entrar al tab Manual.
- **Impacto**: ~70 requests en total (probablemente con retry por error 400). Satura la API y la consola de errores. UX nefasto: el NUT ve una cascada de errores sin entender qué pasó.

### 3. POST /planes-alimentacion/:id/ideas-comida devuelve 400

- **Spec**: Endpoint definido en sección 3.1 (POST con body `{ dia, tipoComida, cantidadAlternativas }`).
- **Realidad**: Todas las requests a `POST /planes-alimentacion/185/ideas-comida` fallan con 400 Bad Request.
- **Impacto**: El feature completo de "Sugerir ideas IA" no funciona. El NUT nunca ve alternativas.
- **Causa probable**: En `generar-ideas-comida.use-case.ts:146` se accede a `plan.socio.idPersona` pero la query de `planRepo.findOne()` en línea 124-127 solo carga `{ nutricionista: true }` — **`socio` no está en la relación cargada**. Esto lanza un error que NestJS traduce a 400 o 500.

### 4. Auto-save en mount con estructura vacía → POST /persistir-manual 400

- **Spec**: El auto-save debounced debe persistir solo cambios reales del NUT.
- **Realidad**: `EditorManualPlan.tsx:154-158` usa `useDebounce(estructura, 800)`. A los 800ms del mount, dispara `POST /planes-alimentacion/185/persistir-manual` con la estructura vacía inicial. El backend rechaza con 400 porque requiere `dias.length > 0` y `totalAlternativas > 0`.
- **Impacto**: Dos entries de error 400 en consola al cargar el tab Manual.

### 5. POST /persistir-manual usa `items` pero el payload frontend usa `alimentos`

- **Spec**: DTO `PersistirManualPayload` en sección 4 define que las alternativas contienen `alimentos: Array<{ alimentoId, cantidad, unidad? }>`.
- **Realidad**: `EditorManualPlan.tsx:61-78` define el payload con `alimentos`. Pero el backend `PersistirPlanManualUseCase.ts:149-150` espera `a.items.map((i) => i.alimentoId)`. El DTO del backend (`PersistirPlanManualDto`) probablemente espera `items` en lugar de `alimentos`.
- **Impacto**: El guardado de borrador fallaría con 400 aunque se pase estructura no vacía, por mismatch de nombres de campo.

### 6. PATCH /slots/:idSlot no implementado (fuera de scope)

- **Spec**: Sección 3.1 lista `PATCH /planes-alimentacion/:id/slots/:idSlot` (Task 1.5).
- **Realidad**: El plan del SDD dice "Task 1.5 SKIPPED: contradice la arquitectura V2 inmutabile del repositorio abstracto". Los edits son locales al navegador.
- **Impacto**: El spec no está actualizado. Las secciones 4.5 y 4.6 del spec describen autosave vía PATCH que no existe.

---

## 🟡 Problemas de UI/UX

### 1. SugerenciasIaSlot auto-abre sin interacción del usuario

- **Spec**: El popover de ideas IA debe abrirse cuando el NUT clickea "✨ Sugerir ideas" (sección 5.2, paso 4).
- **Realidad**: `SugerenciasIaSlot` se renderiza siempre en todos los slots al entrar al tab Manual, y como tiene `useEffect` con auto-fetch, cada slot intenta cargar ideas inmediatamente.
- **Impacto**: No solo son errores de red — el componente que debería ser un popover/trigger está renderizado permanentemente en cada celda.

### 2. "COLACION" en grilla pero estructura inicial no la incluye

- **Spec**: Sección 4.2 muestra 4 comidas por slot (Desayuno, Almuerzo, Merienda, Cena). COLACION es un tipo extra que existe en el enum `TipoComida`.
- **Realidad**: `EditorManualPlan.tsx:49-57` crea estructura inicial con 4 comidas (sin COLACION). Pero `GrillaManualSlots.tsx:27` define `TIPOS_COMIDA` con 5 incluyendo COLACION. Los slots de COLACION se renderizan pero nunca tendrán datos iniciales.
- **Impacto**: Los slots de COLACION existen en la grilla pero no en la estructura de datos. Posible inconsistencia.

---

## ✅ Funcionalidades que SÍ funcionan

- Login como NUT pre-autenticado en la sesión de Playwright
- Navegación a `/profesional/plan/273/editar`
- Generación de plan con IA (POST /ia/plan-semanal → 201 Created, plan #185)
- Una vez generado el plan: tab "Manual" visible con grilla 7×5
- Tab "Historial" visible (GET /versiones → 200 OK)
- Grilla manual 7×5 renderizada correctamente con todos los slots
- Cada slot muestra botón "Sugerir ideas IA" y placeholder "Arrastrá ideas o agregá manualmente"
- Header del editor con nombre del paciente y DNI
- Botón "Guardar borrador" visible en footer sticky
- Resumen de macros (DialogResumenMacros) con 0 kcal / P0g · C0g · G0g en estructura vacía
- Sidebar colapsable con panel de navegación
- Plan generado muestra tarjeta "Plan semanal generado" con versión 1 y macros validadas

---

## Resumen

| Tipo | Cantidad |
|------|----------|
| 🔴 Errores funcionales | 6 |
| 🟡 Problemas de UI/UX | 2 |
| ✅ Funcionalidades OK | 11 |
