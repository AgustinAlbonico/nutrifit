# Generación IA Preview Progresivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar un preview progresivo, comida por comida, durante la generación IA del plan alimentario sin publicar versiones parciales como plan oficial.

**Architecture:** Mantener el flujo existente de job persistido + polling con React Query. El backend va a publicar progreso y `snapshotParcialJson` en `generacion_plan_ia` desde el punto donde `GenerarPlanSemanalUseCase` ya genera comidas por lotes; el frontend va a renderizar ese snapshot como grilla de solo lectura con slots pendientes mientras el job está activo. La persistencia de `plan_alimentacion` y `plan_alimentacion_version` sigue ocurriendo solamente cuando el plan completo termina y valida correctamente.

**Tech Stack:** NestJS, TypeORM, MySQL, React, Vite, TanStack Query, Tailwind CSS, Playwright MCP para verificación visual manual.

---

## Constraints

- No iniciar ni reiniciar backend/frontend. Si la verificación visual necesita servidores y los puertos están caídos, pedirle a Agustín que los levante.
- No crear tests automáticos, archivos `.spec.ts`, `.test.ts`, fixtures ni mocks. Agustín no pidió tests.
- Mantener código, nombres y textos de UI en español, siguiendo la convención del repo.
- No introducir SSE, WebSocket, Bull/BullMQ ni worker externo en esta iteración.
- No permitir edición del plan mientras `planBloqueadoPorIa` esté activo.
- No publicar `plan_alimentacion` ni `plan_alimentacion_version` hasta que la generación completa termine y valide.
- Trabajar sobre `main`; no crear branches ni worktrees.
- Commit y push a `origin main` al terminar la implementación.

## File map

### Backend progress persistence

- Modify: `apps/backend/src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity.ts` — agregar campos de progreso/snapshot a la entidad de dominio.
- Modify: `apps/backend/src/domain/repositories/generacion-plan-ia.repository.ts` — permitir actualizar progreso y snapshot parcial.
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/entities/generacion-plan-ia.entity.ts` — agregar columnas nullable para progreso/snapshot.
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/repositories/generacion-plan-ia.repository.impl.ts` — mapear campos nuevos en create/update/query-builder/domain.

### Backend generation progress callback

- Modify: `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts` — exponer callback opcional de progreso y emitir snapshots parciales después de cada comida generada.
- Modify: `apps/backend/src/application/ai/use-cases/ejecutar-generacion-plan-semanal-background.service.ts` — pasar callback, persistir progreso en el job activo y respetar cancelación.

### Frontend progressive preview

- Modify: `apps/frontend/src/types/ia.ts` — agregar tipos de progreso y snapshot parcial.
- Modify: `apps/frontend/src/components/plan/estructuraPlan.utils.ts` — agregar helpers para claves de slot, estructura completa y slots generados.
- Modify: `apps/frontend/src/components/plan/SlotComidaManual.tsx` — mostrar estado pendiente/generando y permitir abrir detalle read-only de comidas ya generadas.
- Modify: `apps/frontend/src/components/plan/GrillaManualSlots.tsx` — pasar estado de generación por slot.
- Modify: `apps/frontend/src/pages/PlanEditorPage.tsx` — derivar `estructuraVisible`, renderizar banner de preview y mantener bloqueo de edición.
- Modify: `apps/frontend/src/components/ia/BadgeGeneracionPlanIa.tsx` — mostrar progreso real y slot actual.

## Task 1: Persistir campos de progreso IA

**Files:**
- Modify: `apps/backend/src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity.ts`
- Modify: `apps/backend/src/domain/repositories/generacion-plan-ia.repository.ts`
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/entities/generacion-plan-ia.entity.ts`
- Modify: `apps/backend/src/infrastructure/persistence/typeorm/repositories/generacion-plan-ia.repository.impl.ts`

- [ ] **Step 1: Extender entidad de dominio**

En `GeneracionPlanIaEntity`, agregar parámetros readonly al final del constructor para no romper lectura posicional previa más de lo necesario:

```ts
public readonly progresoActual?: number | null,
public readonly progresoTotal?: number | null,
public readonly diaActual?: string | null,
public readonly comidaActual?: string | null,
public readonly snapshotParcialJson?: unknown | null,
```

La entidad debe seguir considerando activa solo `PENDIENTE` y `GENERANDO`.

- [ ] **Step 2: Extender input del repositorio**

En `ActualizarGeneracionPlanIaInput`, agregar campos opcionales:

```ts
progresoActual?: number | null;
progresoTotal?: number | null;
diaActual?: string | null;
comidaActual?: string | null;
snapshotParcialJson?: unknown | null;
```

No relajar `estado`: para actualizaciones parciales usar `estado: 'GENERANDO'` explícitamente.

- [ ] **Step 3: Agregar columnas TypeORM**

En la entidad ORM `generacion-plan-ia.entity.ts`, agregar columnas nullable:

```ts
@Column({ name: 'progreso_actual', type: 'int', nullable: true })
progresoActual?: number | null;

@Column({ name: 'progreso_total', type: 'int', nullable: true })
progresoTotal?: number | null;

@Column({ name: 'dia_actual', type: 'varchar', length: 32, nullable: true })
diaActual?: string | null;

@Column({ name: 'comida_actual', type: 'varchar', length: 64, nullable: true })
comidaActual?: string | null;

@Column({ name: 'snapshot_parcial_json', type: 'json', nullable: true })
snapshotParcialJson?: unknown | null;
```

- [ ] **Step 4: Mapear create/update/domain**

En `generacion-plan-ia.repository.impl.ts`:

- Inicializar los campos nuevos en `crear()` como `null`.
- En `actualizar()`, asignar cada campo si `input.<campo> !== undefined`.
- En `crearCambiosActualizacion(input)`, incluir cada campo nuevo si viene definido.
- En `toDomain()`, pasar los campos nuevos al constructor.

Código guía para `crearCambiosActualizacion`:

```ts
if (input.progresoActual !== undefined) {
  cambios.progresoActual = input.progresoActual;
}
if (input.progresoTotal !== undefined) {
  cambios.progresoTotal = input.progresoTotal;
}
if (input.diaActual !== undefined) {
  cambios.diaActual = input.diaActual;
}
if (input.comidaActual !== undefined) {
  cambios.comidaActual = input.comidaActual;
}
if (input.snapshotParcialJson !== undefined) {
  cambios.snapshotParcialJson = input.snapshotParcialJson;
}
```

- [ ] **Step 5: Verificar backend parcial**

Run:

```bash
npm run build:backend
```

Expected: build de NestJS exitoso o solo fallas preexistentes no relacionadas. No ejecutar migraciones automáticamente.

## Task 2: Emitir progreso desde generación por comida

**Files:**
- Modify: `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts`

- [ ] **Step 1: Definir contrato de progreso**

En el mismo archivo, cerca de los tipos privados del use case, agregar interfaces en español:

```ts
interface SnapshotParcialPlanIa {
  estructura: PlanSemanalJson['estructura'];
}

export interface ProgresoGeneracionPlanIa {
  dia: string;
  tipoComida: string;
  comidasGeneradas: number;
  comidasTotales: number;
  snapshotParcial: SnapshotParcialPlanIa;
}

interface OpcionesGeneracionPlanSemanal {
  onProgreso?: (progreso: ProgresoGeneracionPlanIa) => Promise<void> | void;
}
```

Si `PlanSemanalJson['estructura']` no está accesible por nombre en ese scope, usar el tipo existente que ya representa `planJson.estructura` en el archivo. No usar `any`.

- [ ] **Step 2: Extender execute sin romper callers**

Cambiar la firma pública:

```ts
async execute(
  input: SolicitudPlanSemanal,
  opciones: OpcionesGeneracionPlanSemanal = {},
): Promise<RespuestaPlanSemanal> {
```

Pasar `opciones.onProgreso` a `generarPlanPorDiasConReintentos(...)`.

- [ ] **Step 3: Extender parámetros privados**

La llamada privada debe recibir `onProgreso`:

```ts
const { planJson, validacionMacros } = await this.generarPlanPorDiasConReintentos({
  contextoPromptBase,
  socioId: input.socioId,
  diasEsperados,
  comidasPorDia,
  alternativasPorComida,
  fechaInicio: input.fechaInicio,
  objetivoMacros,
  onProgreso: opciones.onProgreso,
});
```

Agregar `onProgreso?: OpcionesGeneracionPlanSemanal['onProgreso'];` al tipo de parámetros del método privado.

- [ ] **Step 4: Construir estructura parcial determinística**

Dentro de `generarPlanPorDiasConReintentos`, después de agregar cada resultado a `resultadosPorComida`, crear una estructura parcial ordenada por `diasEsperados` y `tiposComidaEsperados`.

Código guía:

```ts
const construirEstructuraParcial = () =>
  diasEsperados.map((dia) => ({
    dia,
    comidas: tiposComidaEsperados.flatMap((tipoComida) => {
      const resultado = resultadosPorComida.find(
        (comidaGenerada) =>
          comidaGenerada.dia === dia && comidaGenerada.tipoComida === tipoComida,
      );

      if (!resultado) {
        return [];
      }

      return [
        {
          tipo: tipoComida,
          nombre: resultado.nombre,
          horario: resultado.horario,
          alimentos: resultado.alimentos,
          macros: resultado.macros,
          receta: resultado.receta,
          equivalencias: resultado.equivalencias,
        },
      ];
    }),
  }));
```

Adaptar los nombres exactos a la forma real de `resultado` en el archivo. La clave es que el orden visual salga de `diasEsperados`/`tiposComidaEsperados`, no del orden de resolución de promesas.

- [ ] **Step 5: Emitir progreso por comida generada**

Después de cada `resultadosPorComida.push(resultado)`, invocar el callback si existe:

```ts
await onProgreso?.({
  dia: resultado.dia,
  tipoComida: resultado.tipoComida,
  comidasGeneradas: resultadosPorComida.length,
  comidasTotales: tareasGeneracion.length,
  snapshotParcial: {
    estructura: construirEstructuraParcial(),
  },
});
```

Si el código actual empuja un lote completo con spread, reemplazarlo por un loop sobre `resultadosLote` para emitir progreso individual sin cambiar la concurrencia del proveedor.

- [ ] **Step 6: Verificar backend parcial**

Run:

```bash
npm run build:backend
```

Expected: build exitoso o fallas preexistentes no relacionadas.

## Task 3: Persistir progreso desde el worker background

**Files:**
- Modify: `apps/backend/src/application/ai/use-cases/ejecutar-generacion-plan-semanal-background.service.ts`

- [ ] **Step 1: Agregar helper de mensaje de progreso**

Crear una función privada para mantener el texto consistente:

```ts
private crearMensajeProgreso(comidasGeneradas: number, comidasTotales: number): string {
  return `${comidasGeneradas}/${comidasTotales} comidas generadas`;
}
```

- [ ] **Step 2: Pasar callback al use case**

Cambiar la ejecución principal:

```ts
const respuesta = await this.generarPlanSemanalUseCase.execute(solicitud, {
  onProgreso: async (progreso) => {
    const actualizada = await this.generacionRepo.actualizarSiActiva(generacion.id, {
      estado: 'GENERANDO',
      mensajeEstado: this.crearMensajeProgreso(
        progreso.comidasGeneradas,
        progreso.comidasTotales,
      ),
      progresoActual: progreso.comidasGeneradas,
      progresoTotal: progreso.comidasTotales,
      diaActual: progreso.dia,
      comidaActual: progreso.tipoComida,
      snapshotParcialJson: progreso.snapshotParcial,
    });

    if (!actualizada) {
      throw new Error('La generación de plan IA ya no está activa.');
    }
  },
});
```

Usar el tipo exportado `ProgresoGeneracionPlanIa` solo si mejora legibilidad; no duplicar interfaces.

- [ ] **Step 3: Mantener finalización oficial igual**

En el update `COMPLETADO`, conservar `respuestaJson`, `planAlimentacionId` y `finalizadoEn`. También conservar el último `progresoTotal` persistido por el callback y cerrar con el mensaje final:

```ts
mensajeEstado: 'Plan generado correctamente',
```

No recalcular ni persistir plan oficial desde el snapshot. `respuestaJson` sigue siendo la fuente final que hidrata el editor.

- [ ] **Step 4: Tratar cancelación como no publicación**

Si `actualizarSiActiva` devuelve `null` dentro del callback, abortar la generación con error controlado. El catch actual debe evitar marcar `ERROR` si el estado ya fue `CANCELADO`; si hoy `marcarErrorSiActiva` ya usa `actualizarSiActiva`, alcanza con no publicar `COMPLETADO`.

- [ ] **Step 5: Verificar backend parcial**

Run:

```bash
npm run build:backend
```

Expected: build exitoso o fallas preexistentes no relacionadas.

## Task 4: Tipar preview progresivo en frontend

**Files:**
- Modify: `apps/frontend/src/types/ia.ts`
- Modify: `apps/frontend/src/components/plan/estructuraPlan.utils.ts`

- [ ] **Step 1: Agregar tipos de snapshot parcial**

En `ia.ts`, agregar:

```ts
export interface SnapshotParcialPlanIaFE {
  estructura: PlanAlimentacionDatosJsonFE['estructura'];
}
```

Extender `GeneracionPlanIaFE`:

```ts
progresoActual: number | null;
progresoTotal: number | null;
diaActual: string | null;
comidaActual: string | null;
snapshotParcialJson: SnapshotParcialPlanIaFE | null;
```

Si el backend serializa campos ausentes en generaciones viejas, usar `?:` solo cuando el tipo actual del proyecto lo necesite; preferir `null` para contrato nuevo.

- [ ] **Step 2: Agregar helpers de estructura**

En `estructuraPlan.utils.ts`, agregar funciones puras:

```ts
import type { EstructuraDiaFE } from '@/types/ia';

export function crearClaveSlot(dia: string, tipoComida: string): string {
  return `${dia}::${tipoComida}`;
}

export function obtenerClavesGeneradas(estructura: EstructuraDiaFE[]): Set<string> {
  return new Set(
    estructura.flatMap((dia) =>
      dia.comidas.map((comida) => crearClaveSlot(dia.dia, comida.tipo)),
    ),
  );
}
```

Si `EstructuraDiaFE` no expone `comida.tipo` con ese nombre, ajustar al tipo real en `ia.ts`.

- [ ] **Step 3: Verificar frontend parcial**

Run:

```bash
npm run build:frontend
```

Expected: TypeScript y Vite build exitosos o fallas preexistentes no relacionadas.

## Task 5: Mostrar slots pendientes en la grilla

**Files:**
- Modify: `apps/frontend/src/components/plan/SlotComidaManual.tsx`
- Modify: `apps/frontend/src/components/plan/GrillaManualSlots.tsx`

- [ ] **Step 1: Extender props del slot**

En `SlotComidaManual.tsx`, agregar props opcionales:

```ts
generando?: boolean;
soloLectura?: boolean;
```

Usar `soloLectura` para bloquear acciones de mutación sin impedir abrir el detalle cuando el slot tiene alternativas.

- [ ] **Step 2: Permitir detalle read-only**

Ajustar `abrirDetalle` para que solo bloquee slots vacíos o pendientes, no comidas ya generadas:

```ts
const abrirDetalle = () => {
  if (generando || alternativas.length === 0) {
    return;
  }

  establecerDetalleAbierto(true);
};
```

Los botones de agregar, editar, duplicar y eliminar deben seguir deshabilitados cuando `deshabilitado || soloLectura`.

- [ ] **Step 3: Renderizar pendiente claro**

En el estado vacío, si `generando` es true, mostrar un placeholder distinto a `Vacío`:

```tsx
{generando ? (
  <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 text-center text-xs font-medium text-emerald-700">
    Generando comida...
  </div>
) : (
  <div className="text-muted-foreground">Vacío</div>
)}
```

Ajustar clases a las convenciones reales del componente si ya usa otros tokens.

- [ ] **Step 4: Pasar estado desde la grilla**

En `GrillaManualSlots.tsx`, agregar prop:

```ts
slotsGenerando?: Set<string>;
soloLectura?: boolean;
```

Para cada slot, calcular:

```ts
const claveSlot = crearClaveSlot(dia.dia, tipoComida);
const generando = slotsGenerando?.has(claveSlot) ?? false;
```

Pasar `generando` y `soloLectura` a `SlotComidaManual`.

- [ ] **Step 5: Verificar frontend parcial**

Run:

```bash
npm run build:frontend
```

Expected: build exitoso o fallas preexistentes no relacionadas.

## Task 6: Renderizar preview progresivo en PlanEditorPage

**Files:**
- Modify: `apps/frontend/src/pages/PlanEditorPage.tsx`

- [ ] **Step 1: Derivar snapshot activo**

Cerca de los valores derivados del contexto IA, agregar:

```ts
const snapshotParcial = generacionVisible?.snapshotParcialJson ?? null;
const mostrandoPreviewIa = planBloqueadoPorIa && !!snapshotParcial;
const estructuraVisible = mostrandoPreviewIa
  ? completarEstructuraManual(snapshotParcial.estructura)
  : estructura;
```

Usar la función existente de completar estructura si está definida en la página; si no, adaptar al helper real que hoy garantiza días/tipos completos.

- [ ] **Step 2: Calcular slots pendientes**

Agregar cálculo memoizado:

```ts
const slotsGeneradosPreview = useMemo(
  () => (snapshotParcial ? obtenerClavesGeneradas(snapshotParcial.estructura) : new Set<string>()),
  [snapshotParcial],
);

const slotsGenerandoPreview = useMemo(() => {
  if (!mostrandoPreviewIa) {
    return new Set<string>();
  }

  return new Set(
    estructuraVisible.flatMap((dia) =>
      dia.comidas
        .map((comida) => crearClaveSlot(dia.dia, comida.tipo))
        .filter((clave) => !slotsGeneradosPreview.has(clave)),
    ),
  );
}, [estructuraVisible, mostrandoPreviewIa, slotsGeneradosPreview]);
```

Importar helpers desde `@/components/plan/estructuraPlan.utils`.

- [ ] **Step 3: Agregar banner de preview**

Encima de `GrillaManualSlots`, renderizar solo cuando `mostrandoPreviewIa`:

```tsx
{mostrandoPreviewIa && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
    <p className="font-semibold">Preview generado por IA en progreso</p>
    <p>
      {generacionVisible.progresoActual ?? 0}/{generacionVisible.progresoTotal ?? '...'} comidas generadas. El plan todavía no está publicado y no se puede editar hasta que termine.
    </p>
  </div>
)}
```

Ajustar a los componentes/tokens existentes si la página ya usa `Alert`, `Card` o estilos equivalentes.

- [ ] **Step 4: Pasar estructura visible a la grilla**

Cambiar la grilla:

```tsx
<GrillaManualSlots
  estructura={estructuraVisible}
  deshabilitado={planBloqueadoPorIa}
  soloLectura={mostrandoPreviewIa}
  slotsGenerando={slotsGenerandoPreview}
  ...
/>
```

Mantener todos los handlers existentes. No habilitar autosave ni edición durante generación.

- [ ] **Step 5: Mantener hidratación final existente**

No cambiar el efecto que, en `COMPLETADO`, usa `respuestaJson` para hidratar `respuesta`, `estructura`, versión y estado modificado. Ese efecto sigue siendo el punto donde el preview se convierte en plan oficial visible.

- [ ] **Step 6: Verificar frontend parcial**

Run:

```bash
npm run build:frontend
```

Expected: build exitoso o fallas preexistentes no relacionadas.

## Task 7: Mostrar progreso real en el badge IA

**Files:**
- Modify: `apps/frontend/src/components/ia/BadgeGeneracionPlanIa.tsx`

- [ ] **Step 1: Crear helper de progreso**

Agregar helper local:

```ts
function obtenerTextoProgreso(generacion: GeneracionPlanIaFE): string | null {
  if (generacion.progresoActual == null || generacion.progresoTotal == null) {
    return null;
  }

  return `${generacion.progresoActual}/${generacion.progresoTotal} comidas generadas`;
}
```

- [ ] **Step 2: Incluir slot actual**

En la descripción o detalle expandido, mostrar:

```tsx
{textoProgreso && <p>{textoProgreso}</p>}
{generacion.diaActual && generacion.comidaActual && (
  <p>Actual: {generacion.diaActual} - {generacion.comidaActual}</p>
)}
```

Si el badge tiene versión compacta y expandida, mostrar progreso compacto en ambas; el slot actual puede quedar solo en expandida.

- [ ] **Step 3: Conservar fallback actual**

Si no hay progreso, mantener `mensajeEstado`/descripción actual para compatibilidad con generaciones viejas.

- [ ] **Step 4: Verificar frontend parcial**

Run:

```bash
npm run build:frontend
```

Expected: build exitoso o fallas preexistentes no relacionadas.

## Task 8: Verificación integrada y QA visual

**Files:**
- No new files expected.

- [ ] **Step 1: Revisar diff completo**

Run:

```bash
git status --short
git diff --stat
git diff -- apps/backend/src apps/frontend/src
```

Expected: solo archivos intencionales del preview progresivo. No incluir cambios preexistentes de `.omo`, caches, imágenes, `tokens.env` ni archivos no relacionados.

- [ ] **Step 2: Build backend**

Run:

```bash
npm run build:backend
```

Expected: NestJS compila. Si falla por un error preexistente, documentar archivo/error exacto y confirmar que no fue introducido por este cambio.

- [ ] **Step 3: Build frontend**

Run:

```bash
npm run build:frontend
```

Expected: TypeScript + Vite compilan. Si falla por un error preexistente, documentar archivo/error exacto y confirmar que no fue introducido por este cambio.

- [ ] **Step 4: Verificar puertos antes de Playwright**

Run:

```powershell
Test-NetConnection -ComputerName localhost -Port 3000
Test-NetConnection -ComputerName localhost -Port 5173
```

Expected: si ambos puertos están abiertos, continuar con Playwright MCP. Si alguno está cerrado, pedirle a Agustín que levante los servidores y detener QA visual. No iniciar procesos.

- [ ] **Step 5: QA visual con Playwright MCP**

Con servidores arriba, navegar a la pantalla del editor:

```txt
/profesional/plan/$socioId/editar
```

Verificar estos estados:

- generación iniciada sin comidas todavía: badge visible, edición bloqueada, slots pendientes no parecen editables;
- generación activa con `snapshotParcialJson`: comidas generadas visibles, slots pendientes muestran `Generando comida...`, badge muestra `x/y comidas generadas`;
- detalle de comida generada: se puede abrir en modo lectura, sin botones de mutación habilitados;
- generación completada: desaparece el modo preview y se hidrata el plan oficial desde `respuestaJson`;
- cancelación/error: no se publica una versión parcial como plan oficial.

Capturar screenshot o snapshot de al menos el estado activo con preview parcial y del estado completado.

- [ ] **Step 6: Commit atómico**

Stage solo los archivos intencionales. Usar Conventional Commit sin atribución IA:

```bash
git add apps/backend/src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity.ts \
  apps/backend/src/domain/repositories/generacion-plan-ia.repository.ts \
  apps/backend/src/infrastructure/persistence/typeorm/entities/generacion-plan-ia.entity.ts \
  apps/backend/src/infrastructure/persistence/typeorm/repositories/generacion-plan-ia.repository.impl.ts \
  apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts \
  apps/backend/src/application/ai/use-cases/ejecutar-generacion-plan-semanal-background.service.ts \
  apps/frontend/src/types/ia.ts \
  apps/frontend/src/components/plan/estructuraPlan.utils.ts \
  apps/frontend/src/components/plan/SlotComidaManual.tsx \
  apps/frontend/src/components/plan/GrillaManualSlots.tsx \
  apps/frontend/src/pages/PlanEditorPage.tsx \
  apps/frontend/src/components/ia/BadgeGeneracionPlanIa.tsx
git commit -m "feat: mostrar preview progresivo de planes IA"
```

- [ ] **Step 7: Push**

Run:

```bash
git push origin main
```

Expected: push exitoso a `origin main`.

## Acceptance checklist

- [ ] `POST /ia/plan-semanal/generaciones` sigue respondiendo sin esperar el plan completo.
- [ ] El job guarda progreso en `generacion_plan_ia` durante `GENERANDO`.
- [ ] `GET /ia/plan-semanal/generaciones/:id` y la generación activa devuelven progreso + `snapshotParcialJson`.
- [ ] La grilla del editor muestra comidas parciales durante generación.
- [ ] Los slots pendientes muestran estado de carga, no `Vacío` ambiguo.
- [ ] Las comidas generadas se pueden inspeccionar en modo lectura.
- [ ] Las acciones de edición/guardado siguen bloqueadas mientras el job está activo.
- [ ] El badge muestra progreso real cuando existe.
- [ ] El plan oficial solo se hidrata/publica desde `respuestaJson` al terminar.
- [ ] Cancelación/error no dejan versión parcial publicada.
- [ ] No se crearon tests automáticos.
- [ ] No se iniciaron dev servers desde el agente.

## Execution notes

- La primera implementación puede mostrar avance por comida después de que termina cada batch concurrente; no hace falta cambiar la concurrencia actual.
- El snapshot parcial debe ser compatible con la estructura que ya consume `GrillaManualSlots`.
- Si una generación vieja no tiene campos nuevos, el frontend debe caer al mensaje actual sin romper.
- Si aparece una falla por migración/DB local, no inventar una solución destructiva: documentar el estado y pedir confirmación antes de tocar historial de migraciones o datos.
