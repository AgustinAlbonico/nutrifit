 # Evolución Longitudinal del Paciente Implementation Plan

 > **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

 **Goal:** Rediseñar el módulo de progreso para convertirlo en una ficha longitudinal visual y clínica, útil para socio y nutricionista, con lectura rápida, series temporales ricas y tabla de evolución analítica.

 **Architecture:** La primera iteración debe maximizar reutilización del backend actual y mover la complejidad al frontend a través de selectores, derivadores de series y componentes especializados. La pantalla deja de depender de tabs rígidas y pasa a una narrativa en capas: resumen arriba, analítica abajo, manteniendo `useProgresoData`, `useObjetivos` y `useFotosProgreso` como fuentes primarias.

 **Tech Stack:** React 19, Vite, TypeScript, TanStack Query, TanStack Router, Recharts, Tailwind CSS, shadcn/ui, Vitest, Testing Library, Playwright MCP.

 ---

 ## Scope Split

 | Slice | Resultado verificable |
 |---|---|
 | 1 | El frontend dispone de utilidades puras para filtros temporales, series derivadas y deltas clínicos. |
 | 2 | La UI muestra un encabezado longitudinal y KPIs clínicos reutilizando datos actuales. |
 | 3 | Existe un gráfico principal configurable con soporte explícito para pliegues. |
 | 4 | La tabla histórica pasa a ser una tabla clínica con columnas, deltas y expansión por fila. |
 | 5 | La vista integra timeline, objetivos y fotos dentro del relato longitudinal. |
 | 6 | Tests y verificación visual prueban desktop/mobile y estados con/sin datos. |

 ## File Structure

 ### Frontend principal

 | File | Action | Responsibility |
 |---|---|---|
 | `apps/frontend/src/components/progreso/DashboardProgreso.tsx` | Modify | Reemplazar layout por narrativa longitudinal y reducir dependencia de tabs aisladas. |
 | `apps/frontend/src/components/progreso/useProgresoData.ts` | Modify | Exponer datos base sin lógica visual y ajustar query helpers si hace falta. |
 | `apps/frontend/src/components/progreso/types.ts` | Modify | Agregar tipos derivados para filtros, series y filas de tabla enriquecidas. |
 | `apps/frontend/src/components/progreso/useSeriesEvolucion.ts` | Create | Derivar series filtradas, KPIs, deltas y variantes por métrica. |
 | `apps/frontend/src/components/progreso/PanelResumenEvolucion.tsx` | Create | Header longitudinal y tarjetas KPI. |
 | `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.tsx` | Create | Gráfico maestro configurable por métrica/grupo. |
 | `apps/frontend/src/components/progreso/PanelPlieguesEvolucion.tsx` | Create | Visualización específica de pliegues y suma total. |
 | `apps/frontend/src/components/progreso/PanelComposicionCorporal.tsx` | Create | Lectura de % grasa y masa magra con texto clínico corto. |
 | `apps/frontend/src/components/progreso/TablaEvolucionPaciente.tsx` | Create | Tabla clínica avanzada con deltas y detalle expandible. |
 | `apps/frontend/src/components/progreso/TimelineEvolucionClinica.tsx` | Create | Timeline de mediciones, objetivos y fotos. |
 | `apps/frontend/src/components/progreso/TablaHistorialMediciones.tsx` | Keep or deprecate | Reemplazar gradualmente por `TablaEvolucionPaciente`. |

 ### Tests

 | File | Action | Responsibility |
 |---|---|---|
 | `apps/frontend/src/components/progreso/useSeriesEvolucion.test.ts` | Create | Validar filtros, deltas y derivación de series. |
 | `apps/frontend/src/components/progreso/PanelResumenEvolucion.test.tsx` | Create | Verificar render de KPIs y estados vacíos. |
 | `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.test.tsx` | Create | Verificar selector de métrica, fallback y soporte de pliegues. |
 | `apps/frontend/src/components/progreso/TablaEvolucionPaciente.test.tsx` | Create | Verificar columnas, deltas y expansión. |
 | `apps/frontend/src/pages/__tests__/progreso-paciente-page.test.tsx` | Create or modify | Cubrir la pantalla longitudinal completa. |

 ---

 ### Task 1: Base de datos derivada y filtros temporales

 **Files:**
 - Modify: `apps/frontend/src/components/progreso/types.ts`
 - Create: `apps/frontend/src/components/progreso/useSeriesEvolucion.ts`
 - Create: `apps/frontend/src/components/progreso/useSeriesEvolucion.test.ts`

 - [ ] **Step 1: Write failing tests for temporal filters and deltas**

 Create `apps/frontend/src/components/progreso/useSeriesEvolucion.test.ts`:

 ```ts
 import { describe, expect, it } from 'vitest';
 import { derivarSeriesEvolucion } from './useSeriesEvolucion';
 import type { HistorialMediciones } from './types';

 const historialBase: HistorialMediciones = {
   socioId: 10,
   nombreSocio: 'Ana',
   apellidoSocio: 'Pérez',
   altura: 165,
   mediciones: [
     {
       idMedicion: 1,
       fecha: '2026-01-10T10:00:00.000Z',
       peso: 80,
       altura: 165,
       imc: 29.4,
       perimetroCintura: 92,
       perimetroCadera: 105,
       perimetroBrazo: 31,
       perimetroMuslo: 60,
       perimetroPecho: 98,
       pliegueTriceps: 25,
       pliegueAbdominal: 32,
       pliegueMuslo: 28,
       porcentajeGrasa: 34,
       masaMagra: 52.8,
       frecuenciaCardiaca: 74,
       tensionSistolica: 118,
       tensionDiastolica: 78,
       notasMedicion: null,
       profesional: null,
     },
     {
       idMedicion: 2,
       fecha: '2026-04-10T10:00:00.000Z',
       peso: 75,
       altura: 165,
       imc: 27.5,
       perimetroCintura: 86,
       perimetroCadera: 101,
       perimetroBrazo: 30,
       perimetroMuslo: 58,
       perimetroPecho: 96,
       pliegueTriceps: 20,
       pliegueAbdominal: 26,
       pliegueMuslo: 24,
       porcentajeGrasa: 30,
       masaMagra: 52.5,
       frecuenciaCardiaca: 70,
       tensionSistolica: 116,
       tensionDiastolica: 76,
       notasMedicion: 'Buen progreso',
       profesional: { id: 2, nombre: 'Laura', apellido: 'Gómez' },
     },
   ],
 };

 describe('derivarSeriesEvolucion', () => {
   it('ordena ascendente y calcula delta de peso y cintura contra línea base', () => {
     const resultado = derivarSeriesEvolucion(historialBase, 'todo');

     expect(resultado.series.peso).toHaveLength(2);
     expect(resultado.kpis.pesoActual?.valor).toBe(75);
     expect(resultado.kpis.pesoActual?.deltaLineaBase).toBe(-5);
     expect(resultado.kpis.cinturaActual?.deltaLineaBase).toBe(-6);
   });

   it('calcula suma de pliegues y deja disponible la serie clínica', () => {
     const resultado = derivarSeriesEvolucion(historialBase, 'todo');

     expect(resultado.series.pliegues[0].sumaPliegues).toBe(85);
     expect(resultado.series.pliegues[1].sumaPliegues).toBe(70);
   });
 });
 ```

 - [ ] **Step 2: Run tests and confirm they fail**

 Run:

 ```bash
 npm run test --workspace=apps/frontend -- useSeriesEvolucion.test.ts
 ```

 Expected: FAIL because `useSeriesEvolucion.ts` does not exist.

 - [ ] **Step 3: Extend types for derived data**

 Add to `apps/frontend/src/components/progreso/types.ts`:

 ```ts
 export type RangoTemporalEvolucion = '30d' | '90d' | '6m' | '12m' | 'todo';

 export interface KpiEvolucion {
   valor: number | null;
   deltaLineaBase: number | null;
   deltaPorcentual: number | null;
   unidad: string;
   tendenciaTexto: string | null;
 }

 export interface PuntoSeriePliegues {
   fecha: string;
   fechaFormateada: string;
   triceps: number | null;
   abdominal: number | null;
   muslo: number | null;
   sumaPliegues: number | null;
 }
 ```

 - [ ] **Step 4: Implement the derivation utility**

 Create `apps/frontend/src/components/progreso/useSeriesEvolucion.ts` with a pure function first:

 ```ts
 import { format, parseISO } from 'date-fns';
 import { es } from 'date-fns/locale';
 import type {
   HistorialMediciones,
   KpiEvolucion,
   PuntoSeriePliegues,
   RangoTemporalEvolucion,
 } from './types';

 function calcularDelta(actual: number | null, base: number | null) {
   if (actual == null || base == null) return null;
   return Number((actual - base).toFixed(2));
 }

 function calcularDeltaPorcentual(actual: number | null, base: number | null) {
   if (actual == null || base == null || base === 0) return null;
   return Number((((actual - base) / base) * 100).toFixed(2));
 }

 export function derivarSeriesEvolucion(
   historial: HistorialMediciones | undefined,
   _rango: RangoTemporalEvolucion,
 ) {
   const mediciones = [...(historial?.mediciones ?? [])].sort(
     (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
   );

   const primera = mediciones[0] ?? null;
   const ultima = mediciones[mediciones.length - 1] ?? null;

   const pesoActual: KpiEvolucion = {
     valor: ultima?.peso ?? null,
     deltaLineaBase: calcularDelta(ultima?.peso ?? null, primera?.peso ?? null),
     deltaPorcentual: calcularDeltaPorcentual(ultima?.peso ?? null, primera?.peso ?? null),
     unidad: 'kg',
     tendenciaTexto: mediciones.length > 1 ? 'vs línea base' : null,
   };

   const cinturaActual: KpiEvolucion = {
     valor: ultima?.perimetroCintura ?? null,
     deltaLineaBase: calcularDelta(
       ultima?.perimetroCintura ?? null,
       primera?.perimetroCintura ?? null,
     ),
     deltaPorcentual: calcularDeltaPorcentual(
       ultima?.perimetroCintura ?? null,
       primera?.perimetroCintura ?? null,
     ),
     unidad: 'cm',
     tendenciaTexto: mediciones.length > 1 ? 'vs línea base' : null,
   };

   const pliegues: PuntoSeriePliegues[] = mediciones.map((medicion) => {
     const valores = [
       medicion.pliegueTriceps,
       medicion.pliegueAbdominal,
       medicion.pliegueMuslo,
     ].filter((valor): valor is number => valor != null);

     return {
       fecha: medicion.fecha,
       fechaFormateada: format(parseISO(medicion.fecha), 'dd MMM', { locale: es }),
       triceps: medicion.pliegueTriceps,
       abdominal: medicion.pliegueAbdominal,
       muslo: medicion.pliegueMuslo,
       sumaPliegues: valores.length ? valores.reduce((a, b) => a + b, 0) : null,
     };
   });

   return {
     mediciones,
     kpis: {
       pesoActual,
       cinturaActual,
     },
     series: {
       peso: mediciones,
       pliegues,
     },
   };
 }
 ```

 - [ ] **Step 5: Run tests and confirm they pass**

 Run:

 ```bash
 npm run test --workspace=apps/frontend -- useSeriesEvolucion.test.ts
 ```

 Expected: PASS.

 - [ ] **Step 6: Commit slice 1**

 ```bash
 git add apps/frontend/src/components/progreso/types.ts apps/frontend/src/components/progreso/useSeriesEvolucion.ts apps/frontend/src/components/progreso/useSeriesEvolucion.test.ts
 git commit -m "feat: derive longitudinal evolution series"
 ```

 ---

 ### Task 2: Encabezado longitudinal y KPIs clínicos

 **Files:**
 - Create: `apps/frontend/src/components/progreso/PanelResumenEvolucion.tsx`
 - Create: `apps/frontend/src/components/progreso/PanelResumenEvolucion.test.tsx`
 - Modify: `apps/frontend/src/components/progreso/DashboardProgreso.tsx`

 - [ ] **Step 1: Write render test for KPIs and temporal filter**

 Create `apps/frontend/src/components/progreso/PanelResumenEvolucion.test.tsx`:

 ```tsx
 import { render, screen } from '@testing-library/react';
 import { PanelResumenEvolucion } from './PanelResumenEvolucion';

 describe('PanelResumenEvolucion', () => {
   it('muestra nombre, rango temporal y KPIs principales', () => {
     render(
       <PanelResumenEvolucion
         titulo="Evolución de Ana Pérez"
         subtitulo="12 mediciones desde 10/01/2026"
         rangoTemporal="todo"
         onCambiarRango={() => {}}
         kpis={{
           pesoActual: { valor: 75, deltaLineaBase: -5, deltaPorcentual: -6.25, unidad: 'kg', tendenciaTexto: 'vs línea base' },
           cinturaActual: { valor: 86, deltaLineaBase: -6, deltaPorcentual: -6.52, unidad: 'cm', tendenciaTexto: 'vs línea base' },
         }}
       />,
     );

     expect(screen.getByText('Evolución de Ana Pérez')).toBeInTheDocument();
     expect(screen.getByText('12 mediciones desde 10/01/2026')).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /todo/i })).toBeInTheDocument();
     expect(screen.getByText(/75 kg/i)).toBeInTheDocument();
     expect(screen.getByText(/-5/i)).toBeInTheDocument();
   });
 });
 ```

 - [ ] **Step 2: Run the test and confirm it fails**

 ```bash
 npm run test --workspace=apps/frontend -- PanelResumenEvolucion.test.tsx
 ```

 Expected: FAIL because the component does not exist.

 - [ ] **Step 3: Implement `PanelResumenEvolucion`**

 Create `apps/frontend/src/components/progreso/PanelResumenEvolucion.tsx`:

 ```tsx
 import { Button } from '@/components/ui/button';
 import type { KpiEvolucion, RangoTemporalEvolucion } from './types';

 interface Props {
   titulo: string;
   subtitulo: string;
   rangoTemporal: RangoTemporalEvolucion;
   onCambiarRango: (rango: RangoTemporalEvolucion) => void;
   kpis: {
     pesoActual?: KpiEvolucion;
     cinturaActual?: KpiEvolucion;
   };
 }

 const RANGOS: Array<{ id: RangoTemporalEvolucion; label: string }> = [
   { id: '30d', label: '30 días' },
   { id: '90d', label: '90 días' },
   { id: '6m', label: '6 meses' },
   { id: '12m', label: '12 meses' },
   { id: 'todo', label: 'Todo' },
 ];

 export function PanelResumenEvolucion({
   titulo,
   subtitulo,
   rangoTemporal,
   onCambiarRango,
   kpis,
 }: Props) {
   return (
     <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.9))] p-6 shadow-sm">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
         <div>
           <p className="text-sm font-medium uppercase tracking-[0.2em] text-orange-600">Ficha longitudinal</p>
           <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{titulo}</h1>
           <p className="mt-2 text-sm text-slate-600">{subtitulo}</p>
         </div>
         <div className="flex flex-wrap gap-2">
           {RANGOS.map((rango) => (
             <Button
               key={rango.id}
               type="button"
               variant={rangoTemporal === rango.id ? 'default' : 'outline'}
               onClick={() => onCambiarRango(rango.id)}
             >
               {rango.label}
             </Button>
           ))}
         </div>
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 4: Integrate the summary panel into `DashboardProgreso`**

 In `apps/frontend/src/components/progreso/DashboardProgreso.tsx`:

 ```tsx
 const [rangoTemporal, setRangoTemporal] = useState<RangoTemporalEvolucion>('todo');
 const seriesEvolucion = derivarSeriesEvolucion(historial, rangoTemporal);
 ```

 And replace the current header block with:

 ```tsx
 <PanelResumenEvolucion
   titulo={titulo}
   subtitulo={subtitulo}
   rangoTemporal={rangoTemporal}
   onCambiarRango={setRangoTemporal}
   kpis={seriesEvolucion.kpis}
 />
 ```

 - [ ] **Step 5: Run tests and typecheck**

 ```bash
 npm run test --workspace=apps/frontend -- PanelResumenEvolucion.test.tsx useSeriesEvolucion.test.ts
 npm run typecheck --workspace=apps/frontend
 ```

 Expected: PASS.

 - [ ] **Step 6: Commit slice 2**

 ```bash
 git add apps/frontend/src/components/progreso/PanelResumenEvolucion.tsx apps/frontend/src/components/progreso/PanelResumenEvolucion.test.tsx apps/frontend/src/components/progreso/DashboardProgreso.tsx
 git commit -m "feat: add longitudinal evolution summary panel"
 ```

 ---

 ### Task 3: Gráfico principal configurable y panel de pliegues

 **Files:**
 - Create: `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.tsx`
 - Create: `apps/frontend/src/components/progreso/PanelPlieguesEvolucion.tsx`
 - Create: `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.test.tsx`
 - Modify: `apps/frontend/src/components/progreso/DashboardProgreso.tsx`

 - [ ] **Step 1: Write the failing graph test for pliegue mode**

 Create `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.test.tsx`:

 ```tsx
 import { render, screen } from '@testing-library/react';
 import { GraficoPrincipalEvolucion } from './GraficoPrincipalEvolucion';

 describe('GraficoPrincipalEvolucion', () => {
   it('muestra selector de métricas y modo pliegues', () => {
     render(
       <GraficoPrincipalEvolucion
         modo="pliegues"
         onCambiarModo={() => {}}
         series={{
           peso: [],
           pliegues: [
             {
               fecha: '2026-04-10T10:00:00.000Z',
               fechaFormateada: '10 abr',
               triceps: 20,
               abdominal: 26,
               muslo: 24,
               sumaPliegues: 70,
             },
           ],
         }}
       />,
     );

     expect(screen.getByRole('button', { name: /pliegues/i })).toBeInTheDocument();
     expect(screen.getByText(/pliegues/i)).toBeInTheDocument();
   });
 });
 ```

 - [ ] **Step 2: Run the test and confirm it fails**

 ```bash
 npm run test --workspace=apps/frontend -- GraficoPrincipalEvolucion.test.tsx
 ```

 Expected: FAIL because the component does not exist.

 - [ ] **Step 3: Implement the graph shell**

 Create `apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.tsx` reusing Recharts:

 ```tsx
 import { Button } from '@/components/ui/button';

 type ModoGrafico = 'peso' | 'pliegues';

 interface Props {
   modo: ModoGrafico;
   onCambiarModo: (modo: ModoGrafico) => void;
   series: {
     peso: Array<{ fechaFormateada?: string; peso?: number; imc?: number }>;
     pliegues: Array<{ fechaFormateada: string; triceps: number | null; abdominal: number | null; muslo: number | null; sumaPliegues: number | null }>;
   };
 }

 export function GraficoPrincipalEvolucion({ modo, onCambiarModo }: Props) {
   return (
     <section className="rounded-3xl border bg-white p-5 shadow-sm">
       <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
         <div>
           <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Serie temporal</p>
           <h2 className="text-xl font-semibold text-slate-900">
             {modo === 'peso' ? 'Peso e IMC' : 'Pliegues cutáneos'}
           </h2>
         </div>
         <div className="flex gap-2">
           <Button type="button" variant={modo === 'peso' ? 'default' : 'outline'} onClick={() => onCambiarModo('peso')}>Peso</Button>
           <Button type="button" variant={modo === 'pliegues' ? 'default' : 'outline'} onClick={() => onCambiarModo('pliegues')}>Pliegues</Button>
         </div>
       </div>
       <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed text-sm text-slate-500">
         Integrar aquí la variante Recharts correspondiente al modo seleccionado.
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 4: Implement dedicated pliegues panel**

 Create `apps/frontend/src/components/progreso/PanelPlieguesEvolucion.tsx`:

 ```tsx
 interface Props {
   ultimaSumaPliegues: number | null;
   deltaLineaBase: number | null;
 }

 export function PanelPlieguesEvolucion({ ultimaSumaPliegues, deltaLineaBase }: Props) {
   return (
     <section className="rounded-3xl border bg-white p-5 shadow-sm">
       <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Adiposidad subcutánea</p>
       <h2 className="mt-2 text-xl font-semibold text-slate-900">Pliegues</h2>
       <div className="mt-6 grid gap-4 sm:grid-cols-2">
         <div className="rounded-2xl bg-slate-50 p-4">
           <p className="text-sm text-slate-500">Suma actual</p>
           <p className="mt-2 text-3xl font-bold text-slate-900">
             {ultimaSumaPliegues != null ? `${ultimaSumaPliegues} mm` : '-'}
           </p>
         </div>
         <div className="rounded-2xl bg-slate-50 p-4">
           <p className="text-sm text-slate-500">Cambio desde línea base</p>
           <p className="mt-2 text-3xl font-bold text-slate-900">
             {deltaLineaBase != null ? `${deltaLineaBase} mm` : '-'}
           </p>
         </div>
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 5: Integrate both components in `DashboardProgreso`**

 Add local state and render:

 ```tsx
 const [modoGrafico, setModoGrafico] = useState<'peso' | 'pliegues'>('peso');
 ```

 ```tsx
 <GraficoPrincipalEvolucion
   modo={modoGrafico}
   onCambiarModo={setModoGrafico}
   series={seriesEvolucion.series}
 />

 <PanelPlieguesEvolucion
   ultimaSumaPliegues={seriesEvolucion.series.pliegues.at(-1)?.sumaPliegues ?? null}
   deltaLineaBase={
     seriesEvolucion.series.pliegues.length > 1
       ? Number(
           (
             (seriesEvolucion.series.pliegues.at(-1)?.sumaPliegues ?? 0) -
             (seriesEvolucion.series.pliegues[0]?.sumaPliegues ?? 0)
           ).toFixed(2),
         )
       : null
   }
 />
 ```

 - [ ] **Step 6: Run tests**

 ```bash
 npm run test --workspace=apps/frontend -- GraficoPrincipalEvolucion.test.tsx
 npm run typecheck --workspace=apps/frontend
 ```

 Expected: PASS.

 - [ ] **Step 7: Commit slice 3**

 ```bash
 git add apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.tsx apps/frontend/src/components/progreso/PanelPlieguesEvolucion.tsx apps/frontend/src/components/progreso/GraficoPrincipalEvolucion.test.tsx apps/frontend/src/components/progreso/DashboardProgreso.tsx
 git commit -m "feat: add configurable longitudinal charts"
 ```

 ---

 ### Task 4: Tabla clínica avanzada y composición corporal

 **Files:**
 - Create: `apps/frontend/src/components/progreso/PanelComposicionCorporal.tsx`
 - Create: `apps/frontend/src/components/progreso/TablaEvolucionPaciente.tsx`
 - Create: `apps/frontend/src/components/progreso/TablaEvolucionPaciente.test.tsx`
 - Modify: `apps/frontend/src/components/progreso/DashboardProgreso.tsx`

 - [ ] **Step 1: Write the failing table test**

 Create `apps/frontend/src/components/progreso/TablaEvolucionPaciente.test.tsx`:

 ```tsx
 import { fireEvent, render, screen } from '@testing-library/react';
 import { TablaEvolucionPaciente } from './TablaEvolucionPaciente';

 describe('TablaEvolucionPaciente', () => {
   it('muestra columnas principales y permite expandir una fila', () => {
     render(
       <TablaEvolucionPaciente
         filas={[
           {
             id: 1,
             fecha: '10 abr 2026',
             peso: '75 kg',
             imc: '27.5',
             cintura: '86 cm',
             deltaPeso: '-5 kg',
             detalle: 'Buen progreso',
           },
         ]}
       />,
     );

     expect(screen.getByText('Peso')).toBeInTheDocument();
     expect(screen.getByText('IMC')).toBeInTheDocument();
     fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }));
     expect(screen.getByText('Buen progreso')).toBeInTheDocument();
   });
 });
 ```

 - [ ] **Step 2: Run the test and confirm it fails**

 ```bash
 npm run test --workspace=apps/frontend -- TablaEvolucionPaciente.test.tsx
 ```

 Expected: FAIL because the component does not exist.

 - [ ] **Step 3: Implement the table**

 Create `apps/frontend/src/components/progreso/TablaEvolucionPaciente.tsx`:

 ```tsx
 import { useState } from 'react';

 interface FilaTablaEvolucion {
   id: number;
   fecha: string;
   peso: string;
   imc: string;
   cintura: string;
   deltaPeso: string;
   detalle: string;
 }

 interface Props {
   filas: FilaTablaEvolucion[];
 }

 export function TablaEvolucionPaciente({ filas }: Props) {
   const [filaExpandida, setFilaExpandida] = useState<number | null>(null);

   return (
     <section className="rounded-3xl border bg-white p-5 shadow-sm">
       <div className="mb-4">
         <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Lectura clínica</p>
         <h2 className="text-xl font-semibold text-slate-900">Tabla de evolución</h2>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full min-w-[760px] text-left text-sm">
           <thead>
             <tr className="border-b text-slate-500">
               <th className="py-3">Fecha</th>
               <th className="py-3">Peso</th>
               <th className="py-3">IMC</th>
               <th className="py-3">Cintura</th>
               <th className="py-3">Delta peso</th>
               <th className="py-3">Acción</th>
             </tr>
           </thead>
           <tbody>
             {filas.map((fila) => (
               <>
                 <tr key={fila.id} className="border-b">
                   <td className="py-3">{fila.fecha}</td>
                   <td className="py-3">{fila.peso}</td>
                   <td className="py-3">{fila.imc}</td>
                   <td className="py-3">{fila.cintura}</td>
                   <td className="py-3">{fila.deltaPeso}</td>
                   <td className="py-3">
                     <button type="button" onClick={() => setFilaExpandida(filaExpandida === fila.id ? null : fila.id)}>
                       Ver detalle
                     </button>
                   </td>
                 </tr>
                 {filaExpandida === fila.id && (
                   <tr>
                     <td className="pb-4 pt-2 text-slate-600" colSpan={6}>{fila.detalle}</td>
                   </tr>
                 )}
               </>
             ))}
           </tbody>
         </table>
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 4: Implement the composition panel**

 Create `apps/frontend/src/components/progreso/PanelComposicionCorporal.tsx`:

 ```tsx
 interface Props {
   porcentajeGrasa: number | null;
   masaMagra: number | null;
 }

 export function PanelComposicionCorporal({ porcentajeGrasa, masaMagra }: Props) {
   return (
     <section className="rounded-3xl border bg-white p-5 shadow-sm">
       <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Composición corporal</p>
       <div className="mt-5 grid gap-4 sm:grid-cols-2">
         <div className="rounded-2xl bg-slate-50 p-4">
           <p className="text-sm text-slate-500">Grasa corporal</p>
           <p className="mt-2 text-3xl font-bold text-slate-900">
             {porcentajeGrasa != null ? `${porcentajeGrasa}%` : '-'}
           </p>
         </div>
         <div className="rounded-2xl bg-slate-50 p-4">
           <p className="text-sm text-slate-500">Masa magra</p>
           <p className="mt-2 text-3xl font-bold text-slate-900">
             {masaMagra != null ? `${masaMagra} kg` : '-'}
           </p>
         </div>
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 5: Replace old history tab usage**

 In `DashboardProgreso.tsx`, replace the old history render:

 ```tsx
 <TablaEvolucionPaciente
   filas={seriesEvolucion.mediciones.map((medicion, indice) => ({
     id: medicion.idMedicion,
     fecha: new Date(medicion.fecha).toLocaleDateString('es-AR'),
     peso: `${medicion.peso} kg`,
     imc: medicion.imc.toFixed(1),
     cintura: medicion.perimetroCintura ? `${medicion.perimetroCintura} cm` : '-',
     deltaPeso:
       indice === 0
         ? '-'
         : `${Number((medicion.peso - seriesEvolucion.mediciones[0].peso).toFixed(1))} kg`,
     detalle: medicion.notasMedicion ?? 'Sin notas de medición',
   }))}
 />
 ```

 - [ ] **Step 6: Run tests and typecheck**

 ```bash
 npm run test --workspace=apps/frontend -- TablaEvolucionPaciente.test.tsx
 npm run typecheck --workspace=apps/frontend
 ```

 Expected: PASS.

 - [ ] **Step 7: Commit slice 4**

 ```bash
 git add apps/frontend/src/components/progreso/PanelComposicionCorporal.tsx apps/frontend/src/components/progreso/TablaEvolucionPaciente.tsx apps/frontend/src/components/progreso/TablaEvolucionPaciente.test.tsx apps/frontend/src/components/progreso/DashboardProgreso.tsx
 git commit -m "feat: add clinical evolution table"
 ```

 ---

 ### Task 5: Timeline longitudinal e integración con objetivos y fotos

 **Files:**
 - Create: `apps/frontend/src/components/progreso/TimelineEvolucionClinica.tsx`
 - Modify: `apps/frontend/src/components/progreso/DashboardProgreso.tsx`
 - Modify: `apps/frontend/src/pages/ProgresoPacientePage.tsx`
 - Modify: `apps/frontend/src/pages/ProgresoSocioPage.tsx`

 - [ ] **Step 1: Implement the timeline component**

 Create `apps/frontend/src/components/progreso/TimelineEvolucionClinica.tsx`:

 ```tsx
 interface EventoTimeline {
   id: string;
   fecha: string;
   titulo: string;
   descripcion: string;
 }

 interface Props {
   eventos: EventoTimeline[];
 }

 export function TimelineEvolucionClinica({ eventos }: Props) {
   return (
     <section className="rounded-3xl border bg-white p-5 shadow-sm">
       <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Historia temporal</p>
       <h2 className="text-xl font-semibold text-slate-900">Timeline clínico</h2>
       <div className="mt-6 space-y-4">
         {eventos.map((evento) => (
           <article key={evento.id} className="rounded-2xl border-l-4 border-orange-400 bg-slate-50 p-4">
             <p className="text-xs uppercase tracking-wide text-slate-500">{evento.fecha}</p>
             <h3 className="mt-1 font-semibold text-slate-900">{evento.titulo}</h3>
             <p className="mt-1 text-sm text-slate-600">{evento.descripcion}</p>
           </article>
         ))}
       </div>
     </section>
   );
 }
 ```

 - [ ] **Step 2: Feed the timeline with existing measurements, objectives and sessions**

 In `DashboardProgreso.tsx`, derive events like:

 ```tsx
 const eventosTimeline = [
   ...seriesEvolucion.mediciones.map((medicion) => ({
     id: `medicion-${medicion.idMedicion}`,
     fecha: new Date(medicion.fecha).toLocaleDateString('es-AR'),
     titulo: `Medición registrada: ${medicion.peso} kg`,
     descripcion: medicion.notasMedicion ?? 'Sin notas adicionales',
   })),
   ...(listaObjetivos?.activos ?? []).map((objetivo) => ({
     id: `objetivo-${objetivo.idObjetivo}`,
     fecha: new Date(objetivo.fechaInicio).toLocaleDateString('es-AR'),
     titulo: `Objetivo ${objetivo.tipoMetrica}`,
     descripcion: `Meta ${objetivo.valorObjetivo}`,
   })),
 ];
 ```

 - [ ] **Step 3: Render timeline below the chart and table**

 ```tsx
 <TimelineEvolucionClinica eventos={eventosTimeline} />
 ```

 - [ ] **Step 4: Keep role-specific copy only at page boundary**

 Ensure `ProgresoPacientePage.tsx` and `ProgresoSocioPage.tsx` keep passing:

 - `esVistaNutricionista={true}` for profesional
 - `esVistaNutricionista={false}` for socio

 and avoid duplicating longitudinal logic in those page files.

 - [ ] **Step 5: Run page-level tests or add them if missing**

 ```bash
 npm run test --workspace=apps/frontend -- progreso-paciente-page.test.tsx
 npm run typecheck --workspace=apps/frontend
 ```

 Expected: PASS.

 - [ ] **Step 6: Commit slice 5**

 ```bash
 git add apps/frontend/src/components/progreso/TimelineEvolucionClinica.tsx apps/frontend/src/components/progreso/DashboardProgreso.tsx apps/frontend/src/pages/ProgresoPacientePage.tsx apps/frontend/src/pages/ProgresoSocioPage.tsx
 git commit -m "feat: add longitudinal clinical timeline"
 ```

 ---

 ### Task 6: Verificación final y QA visual

 **Files:**
 - Modify as needed: test files created above

 - [ ] **Step 1: Run frontend test suite for touched files**

 ```bash
 npm run test --workspace=apps/frontend -- useSeriesEvolucion.test.ts PanelResumenEvolucion.test.tsx GraficoPrincipalEvolucion.test.tsx TablaEvolucionPaciente.test.tsx progreso-paciente-page.test.tsx
 ```

 Expected: PASS.

 - [ ] **Step 2: Run lint and typecheck**

 ```bash
 npm run lint --workspace=apps/frontend
 npm run typecheck --workspace=apps/frontend
 ```

 Expected: PASS.

 - [ ] **Step 3: Verify frontend manually with Playwright MCP once Agustín apruebe implementación**

 Visual acceptance contract:

 - `qué pidió`: evolución completa y agradable a la vista con gráficos y tabla
 - `qué debe verse`: header longitudinal, filtros temporales, gráfico principal, panel de pliegues, composición corporal, tabla clínica y timeline

 Routes to verify:

 - `/profesional/paciente/:socioId/progreso`
 - `/mi-progreso` o ruta equivalente del socio

 States to verify:

 - paciente con múltiples mediciones
 - paciente sin historial
 - mobile y desktop

 - [ ] **Step 4: Commit final slice**

 ```bash
 git add apps/frontend/src/components/progreso apps/frontend/src/pages/ProgresoPacientePage.tsx apps/frontend/src/pages/ProgresoSocioPage.tsx
 git commit -m "feat: redesign patient longitudinal evolution"
 ```

 ## Self-review

 - El plan cubre explícitamente el pedido principal: más profundidad visual, más riqueza temporal y tabla clínica.
 - No depende de un backend nuevo para la primera iteración.
 - Deja una puerta clara para una fase 2 con enriquecimientos backend si el producto lo necesita.
 - Las tareas siguen slices coherentes y verificables.

 ## Execution Handoff

 Plan complete and saved to `docs/superpowers/plans/2026-06-18-evolucion-paciente-longitudinal-plan.md`. Two execution options:

 **1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

 **2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

 Which approach?
