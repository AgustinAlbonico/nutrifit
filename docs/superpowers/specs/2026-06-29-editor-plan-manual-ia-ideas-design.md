# Editor de Plan Manual con Ideas IA — Diseño

> **Fecha**: 2026-06-29
> **Spec derivado de**: brainstorming con el usuario sobre coexistencia IA + manual con drag & drop de ideas.
> **Estado**: Aprobado por el usuario. Próximo paso: planning → implementación.

## 1. Resumen

Hoy el editor de plan (`/profesional/plan/:id/editar`) es **IA-only**: el nutricionista genera el plan completo desde Groq y luego lo regenera slot por slot. No existe UI para crear un plan desde cero agregando comidas manualmente slot por slot.

Este feature agrega un **editor manual completo** como opción coexistente con el modo IA, incluyendo un **panel de "Ideas IA" inline por slot**: el nutricionista puede pedirle a la IA 10 alternativas contextuales (basadas en la ficha clínica del paciente) y arrastrarlas o seleccionarlas para sumarlas al slot, o editar todo a mano.

El plan no es un documento vivo: es una **lista inmutable de versiones V2** con `motivoCambio` trazable. El modo manual crea versiones igual que el flujo IA actual — sin nueva entidad de dominio, sin migración de schema.

## 2. Decisiones de diseño tomadas en brainstorming

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | ¿Cómo exponer los modos IA / Manual? | **Pantalla única con tabs** (`IA` / `Manual` / `Historial`). Sub-componentes extraídos para no agrandar PlanEditorPage. |
| 2 | ¿Cómo pedir ideas IA al NUT en modo manual? | **Panel "Ideas IA" inline en cada slot**, contextual a la ficha del paciente. |
| 3 | ¿Cómo incorporar la idea al slot? | **Drag & drop + botón "Agregar al slot"** (doble mecanismo para accesibilidad). |
| 4 | ¿Cuántas alternativas por slot? | **10 alternativas con paginación 3 por página**, botón "Cargar más". |
| 5 | ¿Quiénes pueden usar el modo manual? | **NUTRICIONISTA dueño + ADMIN del gimnasio**. SUPERADMIN read-only (auditoría). |
| 6 | ¿Se mezclan slots manuales y slots IA en el mismo plan? | **Sí, alternables por slot**. La persistencia no distingue origen (es comida del plan). |

## 3. Arquitectura backend

### 3.1 Endpoints nuevos

| Verbo + path | Auth | Descripción |
|--------------|------|-------------|
| `POST /planes-alimentacion/:id/ideas-comida` | NUT dueño o ADMIN del gimnasio | Genera 1..20 alternativas IA para un slot específico (`dia`, `tipoComida`). Devuelve 200 con prompt usado + alternativas. |
| `GET /planes-alimentacion/:id/versiones/ideas-comida` | NUT dueño | Lista batch de ideas previamente generadas (cache client-side). |
| `PATCH /planes-alimentacion/:id/slots/:idSlot` | NUT dueño | Edita un slot existente (cantidades, nombre, alimentos). Recalcula macros. |
| `DELETE /planes-alimentacion/:id/slots/:idSlot` | NUT dueño | Vacía un slot (borra todas sus alternativas). |
| `PATCH /planes-alimentacion/:id/alternativas/:id` | NUT dueño | Edita una alternativa individual dentro de un slot. |
| `POST /planes-alimentacion/:id/persistir-manual` | NUT dueño | Persiste el draft manual como una **nueva versión inmutable V2** con `motivoCambio='edicion_manual'` (o `'creacion_inicial'` si es la primera versión). Acepta `If-Match: <versionId>` para concurrencia. |

### 3.2 DTO clave: `IdeasComidaRequestDto`

```ts
{
  dia: 'LUNES' | 'MARTES' | ... | 'DOMINGO',
  tipoComida: 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION',
  cantidadAlternativas: number  // 1..20, default 10
}
```

### 3.3 DTO clave: `IdeasComidaResponseDto`

```ts
{
  promptUsado: string,                          // para debug / auditoría
  alternativas: Array<{
    idTemp: string,                            // server-side UUID temporal
    nombre: string,
    alimentos: Array<{
      alimentoId: number,
      cantidad: number,
      unidad: string,
      nombre: string                           // denormalizado para mostrar en UI
    }>,
    calorias: number,
    proteinas: number,
    carbohidratos: number,
    grasas: number,
    etiquetas: string[]                         // p.ej. ['vegano', 'alto-fibra']
  }>
}
```

### 3.4 Errores

| Código | Cuándo | UX |
|--------|--------|-----|
| 403 | NUT no es dueño del plan | Pantalla "No tenés permisos para este plan" (ya existe en NUT ajeno). |
| 400 | Plan sin slot/datos inválidos | Mensaje semántico inline en el slot (no toast). |
| 400 | Paciente sin ficha clínica | Link directo a `/profesional/paciente/:id/ficha` para completarla. |
| 409 | Versión cambió (concurrencia) | Banner "Otro nutricionista editó este plan. Recargá la página." |
| 503 | Groq timeout / invalid JSON | Toast "La IA está sobrecargada. Reintentá en 30s." (mensaje semántico via `traducirErrorApi`). |

### 3.5 Permisos (alineados con respuestas)

| Rol | Acceso al editor manual | Generar ideas IA | Persistir |
|-----|-------------------------|------------------|-----------|
| NUTRICIONISTA dueño del plan | ✓ | ✓ | ✓ |
| ADMIN del gimnasio del plan | ✓ | ✓ | ✓ |
| SUPERADMIN | ✓ lectura | ✗ | ✗ |
| RECEPCIONISTA | ✗ | ✗ | ✗ |
| SOCIO | ✗ | ✗ | ✗ |

Se agregan acciones RBAC:
- `PLANES_IDEAS_GENERAR`
- `PLANES_SLOTS_EDITAR`
- `PLANES_PERSISTIR_MANUAL`

Estas acciones se agregan al grupo NUTRICIONISTA del seed (`apps/backend/src/seed/data/grupos-permisos.data.ts`).

### 3.6 Modelo de datos

**Sin migración**: la entity `PlanAlimentacionVersionEntity.datosJson.estructura[]` ya soporta `alternativas: AlternativaComida[]` con N alternativas por slot (lo agregamos en plan-alimentacion-ia-v2). El editor manual escribe el mismo shape.

## 4. Arquitectura frontend

### 4.1 Estructura de componentes

```
PlanEditorPage  (refactor 502 → ~250 líneas)
├─ <Tabs value={modo}>           ← NUEVO container
│  ├─ Tab "Generar con IA"
│  │  └─ GeneradorPlanSemanal (existente)
│  │  └─ WeeklyPlanGrid V2 (existente, read-only del plan generado)
│  ├─ Tab "Manual"               ← NUEVO
│  │  └─ EditorManualPlan        ← NUEVO (orquesta grilla + IA por slot)
│  │     ├─ GrillaManualSlots    ← NUEVO (7×N slots clickeables)
│  │     │  └─ SlotComidaManual     ← NUEVO (slot individual con toolbar)
│  │     │     └─ SugerenciasIaSlot ← NUEVO (popover con 10 cards)
│  │     │        └─ AlternativaIaCard ← NUEVO (card arrastrable + 'Agregar')
│  │     │     └─ SlotEditorAlimentos ← NUEVO (modal para editar cantidades)
│  │     └─ DialogResumenMacros  ← NUEVO (sticky footer con macros live)
│  └─ Tab "Historial"            ← reubica VersionHistory lateral actual
│
└─ FeedbackModal (existente) — disparado desde ambos modos
```

### 4.2 Estructura del slot (diseño UX)

```
┌───────────────────────────────────────────────────┐
│ Lunes                                              │
│ Desayuno        [+ Agregar manualmente] [✨ Sugerir]│
│                                                   │
│ ┌─ Alternativa 1 ─────────────────────────────┐  │
│ │ Avena con banana y nueces            380kcal │  │
│ │ • 50g Avena                                   │  │
│ │ • 200ml Leche almendras                        │  │
│ │ • 20g Nueces                                  │  │
│ │ [Editar] [Duplicar] [Eliminar]                │  │
│ └───────────────────────────────────────────────┘  │
│                                                   │
│ (drop zone — "Soltá una idea acá")                │
└───────────────────────────────────────────────────┘
```

Click en "Sugerir ideas":
1. Backend `POST /planes-alimentacion/:id/ideas-comida` con la ficha del paciente.
2. Popover con 10 cards (3 visibles, paginación interna).
3. Cada card muestra: nombre, kcal/macros, etiquetas, alimentos.
4. Drag de la card al drop zone del slot → `PATCH` inserta alternativa.
5. Click en "Agregar al slot" → mismo efecto (accesibilidad teclado).
6. Drop zone siempre visible en slots vacíos, y al hover de slots con alternativas.

### 4.3 Macros en vivo

`useMacrosAcumulados(estructura, objetivoMacros)`:
- Hook pure con `useMemo` que suma macros de todas las alternativas del plan.
- Pinta sticky footer (`DialogResumenMacros`) abajo a la derecha:
  - Total kcal / P / C / G.
  - Banda global (VERDE / AMARILLO / ROJO).
  - Desvío porcentual vs objetivoMacros.
- Si ROJO: tooltip explicativo + botón **"Regenerar este slot con IA"** que llama `/ideas-comida`.

### 4.4 Modelos de datos (tipos frontend)

```ts
// types/ia.ts (extendido)
export interface IdeaComidaIa {
  idTemp: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    nombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  etiquetas: string[];
}

export interface SlotComidaManual {
  dia: DiaSemana;
  tipo: TipoComidaPlan;
  alternativas: Array<{
    nombre?: string;
    alimentos: Array<{ alimentoId: number; cantidad: number; unidad: string }>;
  }>;
  /** Macros cacheadas localmente, computadas con useMemo. */
  macrosAcumuladas: ResumenMacrosDiaFE | null;
}
```

### 4.5 Estado y flujo de edición

```
const [estadoLocal, setEstadoLocal] = useState<{
  estructura: EstructuraDiaFE[];
  alternativasPorSlot: Record<string, IdeaComidaIa[]>;
  slotEnSugerencia: string | null;
}>({...estadoInicial});
```

- Cada cambio se persiste con `PATCH /slots/:id` (autosave debounced 800ms).
- `POST /persistir-manual` solo se llama al "Guardar borrador completo" → crea versión inmutable nueva con `motivoCambio='edicion_manual'`.

### 4.6 Dependencias frontend nuevas

- `@dnd-kit/core`: drag & drop accesible out-of-the-box (soporte teclado y screen reader).
- `framer-motion` (opcional): para micro-interacciones en slot.

## 5. UX flow detallado

### 5.1 Cobertura de restricciones — Garantía explícita

Las 10 alternativas sugeridas por slot deben respetar **las mismas restricciones clínicas** que se aplican al plan completo generado por IA. Esta es una promesa de seguridad clínica: el NUT puede confiar en que cada idea está validada.

#### Tabla de restricciones (idéntica al flujo V2 IA plan completo)

| # | Restricción | Origen en ficha | Aplicación en prompt | Validación post-filter |
|---|-------------|----------------|----------------------|--------------------------|
| 1 | **Alergias** | `ficha.alergias[]` (p.ej. `["Maní", "Mariscos"]`) | Bloque estricto: alimentos con la alérgeno excluido del pool de generación | `restriccionesValidator.validar()` → 0 incidencias críticas |
| 2 | **Restricciones alimentarias** | `ficha.restriccionesAlimentarias` (texto libre: "vegano", "sin TACC", "sin lactosa") | Parseo de keywords + reglas semánticas: si "vegano" → no huevo, carne, lácteos, miel | Misma validación que en `GenerarPlanSemanalUseCase` |
| 3 | **Patologías** | `ficha.patologias[]` (p.ej. `["Diabetes tipo 2", "Hipertensión"]`) | Reglas preestablecidas: diabetes → bajo índice glucémico, hipertensión → bajo sodio | Warnings (no bloqueo) reportadas en cada alternativa con etiqueta |
| 4 | **Medicación** | `ficha.medicacionActual` (texto libre) | Heurística conservadora: anticoagulantes → alertar sobre Vitamina K alta | Solo warning — nunca bloquea, pero aparece en tooltip de la card |
| 5 | **Suplementos** | `ficha.suplementosActuales` (texto libre) | Info context: si toma hierro → incluir fuentes vegetales | Sin restricción; se muestra como sugerencia en card |

#### Cómo se aplican — Pipeline

```
┌─────────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
│ fichaSaludSocio     │ ─► │ PromptIdeasComida    │ ─► │ Groq (modelo V2)   │
│ - alergias          │    │ .build({ ficha,     │    │ genera N alts.     │
│ - restricciones     │    │   slot, n, contexto})│    │ considerando TODO   │
│ - patologías        │    │                       │    │ el contexto        │
│ - medicación        │    │ (mismo builder que   │    └────────┬───────────┘
│ - suplementos       │    │  PromptPlanSemanal)  │              │
└─────────────────────┘    └──────────────────────┘              ▼
                                                          ┌────────────────────┐
                                                          │ Post-filter server: │
                                                          │ restriccionesValid. │
                                                          │ .validarAlternativa()│
                                                          │ → 0 críticos, warns │
                                                          │ opcionales          │
                                                          └────────┬────────────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────────┐
                                                          │ Persiste memoria IA │
                                                          │ (ya existe backend) │
                                                          └────────────────────┘
```

#### Implementación concreta

**Reusar `RestriccionesValidatorV2`** (ya existe en `apps/backend/src/application/restricciones/restricciones-validator.service.ts`) agregando un método nuevo:

```ts
class RestriccionesValidatorV2 {
  // Ya existe (usado por plan completo):
  validarPlanCompleto(plan: PlanAlimentacionDatosJson): Incidencias[];

  // NUEVO método para ideas individuales:
  validarAlternativa(
    ficha: FichaSaludSocio,
    alternativa: { nombre: string; alimentos: AlimentoItem[] },
  ): {
    criticas: IncidenciaRestriccion[];   // bloquean (alergia, restricción dura)
    warnings: string[];                  // muestran al NUT (p.ej. "Alto sodio")
  };
}
```

Comportamiento:
- Si `criticas.length > 0` → la IA descarta la idea y regenera automáticamente (loop hasta 12 iteraciones o fallback).
- Si `warnings.length > 0` → la idea se devuelve igual; la UI muestra ⚠️ con tooltip explicativo.

**Reusar `PromptPlanSemanalBuilder`** como base. Crear `PromptIdeasComidaBuilder` con composición:

```ts
class PromptIdeasComidaBuilder {
  build(args: {
    ficha: FichaSaludSocio;
    slot: { dia: DiaSemana; tipoComida: TipoComida };
    cantidad: number;
  }): { system: string; user: string };
  // Reusa `componerContextoRestricciones(ficha)` del builder V2 existente.
  // Garantiza coherencia 1-a-1 entre el contexto del prompt IA plan completo
  // y el contexto del prompt IA ideas individuales.
}
```

Esto es **una sola fuente de verdad** (`componerContextoRestricciones`) para que NUT jamás vea una idea que contradiga el plan completo.

#### Visualización en UI

Cada card de idea lleva opcional:
- **Badge verde** "✓ Cumple restricciones del paciente"
- **Badge amarillo** "⚠️ Consideración: alto en sodio" con tooltip
- **Badge rojo** (NO debería aparecer post-filter) — si aparece es bug crítico

El usuario final (NUT) puede:
- Click en badge de warning → ver detalle (qué restricción y por qué).
- Toggle "Mostrar ideas que casi encajan pero con warnings" en el popover (default ON).

#### Edge cases resueltos

| Caso | Manejo |
|------|---------|
| Ficha sin restricciones declaradas | La IA genera alternativas genéricas; badge neutro "Sin restricciones aplicadas". |
| Restricción contradictoria (p.ej. vegano + frecuente consumo de huevo) | La IA descarta ideas con la contradicción; si tras 12 iteraciones no logra, devuelve 5 con warnings visibles. |
| Alergia que no está en el catálogo de alimentos | El backend no encuentra el alimento relacionado → pasa sin bloqueo (warning de "no se encontró match"). |
| Medicación con interacción seria (p.ej. anticoagulante + alto Vit-K) | Warning crítico bloqueante en tooltip pero la IA intenta alternativas seguras. |

### 5.2 UX flow

#### Flujo feliz — NUT crea plan manual con ayuda de IA

1. NUT entra a `/profesional/plan/273/editar` como nutri-central.
2. Ve tabs `IA | Manual | Historial`. Tab "Manual" es default si no hay plan previo.
3. Tab "Manual" muestra grilla 7×5 vacía con placeholders.
4. NUT click en slot "Lunes Desayuno" → tooltip "✨ Sugerir ideas".
5. Pide ideas → popover con 10 cards. Cada card muestra macro-resumen y un badge de cumplimiento de restricciones:
   - Verde: "Cumple todas las restricciones del paciente"
   - Amarillo: "Consideración: ..."

### Flujo de error

- NUT edita y se va → modal "Tienes cambios sin guardar". Cancelar mantiene la edición.
- Concurrencia: 2 NUTs editan → primer POST 200 OK; segundo POST → 409 con banner "Otro nutricionista editó este plan. Recargá para ver cambios."
- IA tarda > 30s → botón "Sugerir ideas" muestra "Reintentá". Cancelación funciona.

## 6. Plan de testing

### 6.1 Tests backend nuevos

- `ideas-comida.use-case.spec.ts`:
  - **Cobertura de restricciones** (un test por cada fila de la tabla 5.1):
    - Alergia: ficha con alergia al maní → 0 alternativas incluyen maní o derivados (validar nombres de alimentos contra catálogo).
    - Restricción alimentaria "vegano" → 0 alternativas con huevo, carne, lácteos, miel.
    - Restricción alimentaria "sin TACC" → 0 alternativas con trigo, avena estándar, cebada.
    - Patología "diabetes tipo 2" → todas las ideas con `indiceGlucemico < 55` o etiqueta "bajo-IG".
    - Medicación "warfarina" → warnings sobre alimentos altos en vitamina K (espinaca, brócoli); alternativas con etiqueta "⚠️ Consideración Vit-K".
    - Ficha sin alergias → ideas genéricas con badge neutro "Sin restricciones aplicadas".
  - Genera 10 alternativas con ficha completa (mix de restricciones: vegano + sin TACC + diabetes).
  - Loop de regeneración: 12 iteraciones si la primera salida incluye 1 crítica → retorna la siguiente sin críticas.
  - Genera 10 alternativas con ficha vacía (genéricas).
  - Error timeout Groq → 503 con mensaje semántico.
  - Plan sin socio → 404.
  - Paciente sin ficha → 400 semántico "Paciente sin ficha, completala primero".
  - Auth: NUT no dueño → 403; ADMIN del gimnasio → 200.
  - RestriccionesValidatorV2.validarAlternativa():
    - Caso 0 incidencias → { criticas: [], warnings: [] }.
    - Caso 1 crítica (alergia al maní + idea incluye maní) → { criticas: [alergia maní], warnings: [] }.
    - Caso 0 críticas + 1 warning → { criticas: [], warnings: ["Alto en sodio"] }.
    - Caso 2 críticas → { criticas: [alergia1, restricción-dura], warnings: [] }.

- `validar-restricciones-alternativa.spec.ts` (unit test del validador):
  - 8 tests parametrizados con combinaciones (alergia × restricción × patología × medicamento).
  - Verifica que la salida es determinística y categoriza bien crítica vs warning.

- `editar-slot-manual.use-case.spec.ts`:
  - Patch cantidades válidas → 200 y macros recalculadas.
  - Patch con `alimentoId` inexistente → 400.
  - Concurrencia: `If-Match` con `versionId` desactualizado → 409.
  - Recalcular macrosPorDia coherente con totales.

- `persistir-plan-manual.use-case.spec.ts`:
  - Crea nueva versión V2 con motivo='edicion_manual'.
  - Marca la anterior como inactiva (estado máquina).
  - Si plan ya está FINALIZADO → 400.

### 6.2 Tests frontend nuevos

- `EditorManualPlan.test.tsx` — render grilla 7×5 vacía + sticky footer.
- `SlotComidaManual.test.tsx` — hover toolbar, agregar/eliminar alternativa.
- `SugerenciasIaSlot.test.tsx` — fetch, paginación 3/10, agregar al slot.
- `AlternativaIaCard.test.tsx` — `aria-grabbed`, keyboard accessible.
- `DialogResumenMacros.test.tsx` — sticky footer recalcula live.
- `useMacrosAcumulados.test.ts` — pure hook.
- `useDragDropSlot.test.ts` — hook de DnD-kit accessibility.

### 6.3 Escenarios Playwright (re-verificación)

1. NUT en `/profesional/plan/273/editar` ve los 3 tabs.
2. Tab "Manual" muestra grilla vacía.
3. Click en slot → "Sugerir ideas" → popover con 10 cards.
4. Drag card → alternativa añadida; sticky footer actualiza.
5. Editar cantidades manualmente → footer recalcula.
6. Guardar borrador → versión nueva V2 aparece en "Historial".
7. Concurrencia: simular 2 NUTs editando → segundo ve 409 Conflict.
8. NUT ajeno (socio 273 desde nutri-norte) → sigue viendo "No tenés permisos".
9. RECEPCIONISTA sigue viendo bloqueo total del editor.

## 7. Archivos a tocar

### 7.1 Backend (nuevos)

- `apps/backend/src/application/planes-alimentacion/use-cases/generar-ideas-comida.use-case.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/editar-slot-manual.use-case.ts`
- `apps/backend/src/application/planes-alimentacion/use-cases/persistir-plan-manual.use-case.ts`
- `apps/backend/src/application/ia/builders/prompt-ideas-comida.builder.ts`
- `apps/backend/src/presentation/http/controllers/ideas-comida.controller.ts`
- Specs asociados para cada uno

### 7.2 Backend (modificados)

- `apps/backend/src/application/planes-alimentacion/planes-alimentacion.module.ts` (DI nuevos use-cases)
- `apps/backend/src/presentation/http/controllers/planes-alimentacion.controller.ts` (PATCH slots)
- `apps/backend/src/infrastructure/auth/guards/actions.guard.ts` (nuevas acciones)
- `apps/backend/src/seed/data/grupos-permisos.data.ts` (NUTRICIONISTA + las 3 nuevas acciones)

### 7.3 Frontend (nuevos)

- `apps/frontend/src/pages/EditorManualPlan.tsx`
- `apps/frontend/src/components/plan/GrillaManualSlots.tsx`
- `apps/frontend/src/components/plan/SlotComidaManual.tsx`
- `apps/frontend/src/components/plan/SugerenciasIaSlot.tsx`
- `apps/frontend/src/components/plan/AlternativaIaCard.tsx`
- `apps/frontend/src/components/plan/DialogResumenMacros.tsx`
- `apps/frontend/src/components/plan/SlotEditorAlimentos.tsx`
- `apps/frontend/src/hooks/useMacrosAcumulados.ts`
- `apps/frontend/src/hooks/useDragDropSlot.ts`
- 9 specs asociados

### 7.4 Frontend (modificados)

- `apps/frontend/src/pages/PlanEditorPage.tsx` (refactor a tabs, 502 → ~250 líneas)
- `apps/frontend/src/hooks/useIa.ts` (nueva mutation `generarIdeasComida`)
- `apps/frontend/src/types/ia.ts` (extender con tipos manuales)
- `apps/frontend/src/components/ui/tabs.tsx` (sin cambios, ya soporta variant="line")

## 8. Estimación

- ~15 archivos tocados
- ~3000 líneas de código + tests
- 1 PR grande con backend + frontend, O 2 PRs separados (recomendado):
  - **PR 1 (backend)**: use-cases + endpoints + specs
  - **PR 2 (frontend)**: components + hooks + specs + integración con editor IA existente

## 9. Out of scope (para iteraciones futuras)

- Versionado visual por slot (drag entre slots del mismo día).
- Sincronización con calendario del paciente.
- Auto-asignación de alimentos favoritos del paciente al slot.
- Sugerencias IA de "plan semanal completo" en modo manual (similar al IA pero con slots pre-armados).
- Comentarios en slots (thread por slot).
- Exportar PDF del plan manual (compartido con V1 y V2).
