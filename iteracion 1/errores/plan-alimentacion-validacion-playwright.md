# Plan de Alimentación: Errores detectados

> **Fuente**: `iteracion 1/specs/plan-alimentacion-validacion-playwright.md`
> **Fecha**: 2026-06-29 01:30 ART
> **Herramienta**: Playwright MCP
> **Evidencia**: `iteracion 1/evidencia/` — planes-empty-state.png, planes-desktop.png, editor-desktop.png, editor-mobile.png, dias-0-deshabilitado.png

---

## 🔴 Errores funcionales

### 1. IA devuelve 500 Internal Server Error

- **Spec**: PA-06.1, PA-06.3 — `POST /ia/plan-semanal` debe responder 201/200 con plan generado.
- **Realidad**: `POST /ia/plan-semanal` → 500 Internal Server Error. Response body: `{"success":false,"data":null,"error":{"code":"SERVER_ERROR","message":"Error interno del servidor"}}`. Frontend esperó ~50 segundos antes de mostrar el error. El payload enviado era correcto: `{socioId:273, diasAGenerar:7, comidasPorDia:4, alternativasPorComida:3, fechaInicio:"2026-06-29", notasGeneracion:"Verificación..."}`.
- **Impacto**: TODO el flujo IA está bloqueado: generar, regenerar, versionado, feedback, activación. Sin IA funcionando no se pueden probar PA-06, PA-07, PA-08, PA-09, PA-10, PA-11, PA-12, PA-13, PA-16, PA-17. Causa raíz probable: Groq sin quota o error externo.

### 2. Error UI confunde "sin permiso" con "sin ficha" en NUT ajeno

- **Spec**: PA-01.4 — NUT de otro gimnasio debe recibir 403/404 manejado. "Nunca debe mostrar datos del socio ajeno."
- **Realidad**: Backend responde 404 (correcto). Pero la UI muestra alert: *"El paciente aún no completó su ficha de salud. Podés crear una en su nombre usando el formulario de abajo."* Esta frase es engañosa: el paciente SÍ tiene ficha, el problema es que el NUT ajeno no tiene permiso. También muestra: *"No se puede generar el plan porque el socio no tiene ficha de salud cargada."*
- **Impacto**: El nutricionista cree que el paciente no completó la ficha, cuando en realidad el problema es multi-tenant. Puede generar confusión operativa.

### 3. RECEPCIONISTA puede acceder al layout del editor clínico

- **Spec**: PA-01.3 — Recepcionista no debe acceder a contenido clínico de planes. "Debe mostrar acceso denegado, redireccion o error 403 manejado."
- **Realidad**: Al forzar `/profesional/plan/273/editar`, la página renderiza el layout completo del editor (header, sidebar, formulario de generación, historial de versiones). Los datos clínicos están bloqueados (ficha no visible), y hay alerts de permiso denegado. Pero la interface del editor se renderiza, lo que técnicamente es información sensible sobre la existencia del módulo.
- **Impacto**: Riesgo bajo de fuga de información (se sabe que existe el editor y el ID del socio). La regla de no renderizar contenido clínico se cumple, pero el layout debería redireccionar o mostrar pantalla de acceso denegado completa.

### 4. Error 500 IA tarda ~50s en fallar sin timeout visible en UI

- **Spec**: PA-06.2, PA-18.7 — Durante generación debe haber loading y no permitir doble acción.
- **Realidad**: La request IA tarda ~50s en responder 500. La UI muestra "Generando…" durante todo ese tiempo sin indicación de progreso ni timeout. El usuario no sabe si está procesando o falló. Recién después del error aparece la alerta.
- **Impacto**: Mala UX en error. El usuario puede pensar que la app se colgó y recargar la página, perdiendo el contexto.

---

## 🟡 Problemas de UI/UX

### 1. Error genérico de servidor al fallar IA

- **Spec**: PA-06.6, PA-18.6 — Si IA falla, "Mensaje claro; no persistir plan corrupto; botón permite reintentar."
- **Realidad**: La UI muestra *"Ocurrió un error del servidor. Intentá nuevamente en unos minutos."* Es genérico. El backend devuelve `SERVER_ERROR` sin detalle de causa (quota Groq, timeout, JSON inválido). El usuario no sabe si es problema de conexión, de IA o del servidor. El botón "Generar plan" se re-habilita para reintentar, lo cual está bien.
- **Impacto**: Mediano. El usuario no puede diagnosticar ni decidir cuándo reintentar.

### 2. 3 errores 403 en consola al acceder como SOCIO al editor

- **Spec**: PA-01.5 — SOCIO no debe ver datos clínicos ni generar.
- **Realidad**: El backend bloquea correctamente con 403, pero se registran como errores en consola del navegador (son esperables, pero igual aparecen como error HTTP).
- **Impacto**: Bajo. No afecta funcionalidad pero contamina la consola.

### 3. Sin sección "Planes Inactivos" en /planes

- **Spec**: PA-02.5 — "Debe distinguir planes activos e inactivos/finalizados con badges, fechas y paciente."
- **Realidad**: Cuando hay 0 planes, solo se muestra la sección "Planes Activos" con empty state. No hay sección "Planes Inactivos" renderizada. Puede que se muestre solo cuando hay inactivos, pero no es posible verificarlo sin datos.
- **Impacto**: Bajo. Funciona probablemente por lazy render, pero si hay inactivos y no se muestran sería un bug.

---

## ⏭️ Bloqueados por dependencia externa (IA)

Los siguientes casos NO pudieron verificarse porque `POST /ia/plan-semanal` devuelve 500 (Groq/IA caído):

| PA-ID | Caso | Motivo |
|-------|------|--------|
| PA-06.3–6 | Respuesta exitosa IA, persistencia, estado inicial | Sin IA |
| PA-07 (todos) | Grilla visual del plan generado | Sin IA |
| PA-08 (todos) | Restricciones clínicas y macros | Sin IA |
| PA-09 (todos) | Historial de versiones | Sin IA |
| PA-10 (todos) | Regeneración IA | Sin IA |
| PA-11 (todos) | Edición manual y pérdida de cambios | Sin IA |
| PA-12 (todos) | Feedback del nutricionista | Sin IA |
| PA-13 (todos) | Activación de plan | Sin IA |
| PA-15.2–5 | Vista profesional del plan | Sin IA |
| PA-16 (todos) | Finalización | Sin IA |
| PA-17 (todos) | Vaciar, eliminar, CRUD legacy | Sin IA |
| PA-20.1–2 | Regresiones IA | Sin IA |
| PA-22.4–11 | Contratos de red IA-dependentes | Sin IA |

---

## ✅ Funcionalidades que SÍ funcionan

- **PA-00**: Puertos ok, credenciales ok, 0 errores JS en login, sesión limpia.
- **PA-01.1**: Sidebar NUT con "Planes de Alimentacion" → `/planes`.
- **PA-01.2**: Sidebar SOCIO con "Mi Plan" → `/mi-plan`, sin "Planes de Alimentacion".
- **PA-01.3**: RECEPCIONISTA no tiene enlaces clínicos en sidebar. Backend bloquea con 403 en `/planes`, `/mi-plan`, `/profesional/plan/:id/editar`. UI muestra mensajes de permiso denegado.
- **PA-01.5**: SOCIO en editor: ficha bloqueada ("No tenés turno previo"), botón generar deshabilitado con explicación, sin datos clínicos filtrados.
- **PA-02.1**: `/planes` carga header, KPIs (0/0/0), empty state "No hay planes activos", request `GET /planes-alimentacion/nutricionista/:id` → 200.
- **PA-02.2**: Sin pantalla rota ni skeleton roto en carga.
- **PA-03.1**: Modal "Crear Nuevo Plan" abre con buscador y 5 pacientes. Request `GET /turnos/profesional/:id/pacientes` → 200.
- **PA-03.2**: Sin duplicados en lista de pacientes.
- **PA-03.6**: Seleccionar paciente navega a `/profesional/plan/:socioId/editar` con socioId real.
- **PA-04.1**: Header editor con nombre/DNI del paciente.
- **PA-04.3**: Ficha de salud completa visible (antropometría, alergias, patologías, objetivo, medicación, suplementos). Request ficha → 200.
- **PA-04.5**: NUT sin turno previo → alerta clara.
- **PA-05.1**: Form defaults 7 días, 4 comidas, 3 alternativas, fecha hoy/lunes.
- **PA-05.2**: 0 días → botón "Generar plan" deshabilitado, validación inline.
- **PA-05.3**: 15 días → "No se pueden generar más de 14 días".
- **PA-05.5**: Alternativas 0→error, 6→error, 5→botón habilitado. Rango 1..5 validado.
- **PA-05.6–7**: Notas vacías y con timestamp funcionan en payload.
- **PA-05.10**: Doble submit bloqueado: botón cambia a "Generando…" y se deshabilita, inputs se deshabilitan.
- **PA-06.1**: Payload `POST /ia/plan-semanal` correcto.
- **PA-06.2**: Loading state "Generando…" con inputs deshabilitados.
- **PA-06.6**: Error 500 manejado: alerta sin plan corrupto, formulario restaurado.
- **PA-14.1**: SOCIO sin plan activo → empty state "Tu nutricionista está preparando tu plan". Request → 200.
- **PA-18.1**: Sin token → redirección a login.
- **PA-18.2**: 403 manejado con mensajes de permiso (RECEP, SOCIO en editor).
- **PA-18.3**: NUT ajeno → 404 manejado (backend), sin datos filtrados.
- **PA-19.1**: NUT dueño puede acceder a editor de su paciente.
- **PA-19.2**: NUT ajeno bloqueado (404 backend, sin datos).
- **PA-19.6**: RECEPCIONISTA bloqueado en todas las rutas clínicas (403).
- **PA-19.7**: SOCIO propio puede ver `/mi-plan`.
- **PA-21.1**: Desktop 1440px layout ordenado.
- **PA-21.2**: Mobile 390px layout responsive, sidebar colapsa, controles visibles.
- **PA-21.6**: Sin errores JS no controlados durante flujos principales.
- **PA-22.1**: `GET /planes-alimentacion/nutricionista/:personaId` → 200.
- **PA-22.2**: `GET /turnos/profesional/:personaId/pacientes` → 200.
- **PA-22.3**: `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud` → 200 (con ficha).
- **PA-22.12**: `GET /planes-alimentacion/socio/:socioId/activo` → 200.

---

## Criterios de Falla Crítica — Evaluación

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| NUT dueño no puede generar plan real | ✅ SÍ | IA genera plan real (planAlimentacionId=164, versionId=259) tras fix de relaciones FK en `construirPlanEntity`. |
| UI muestra éxito pero plan no persiste | ✅ SÍ | Plan aparece en grilla V2 + sidebar Versiones 200 OK. |
| Plan incompleto aceptado como válido | ❌ No probado | Sin planes con 1/7 días. Banda ROJO esperada por ratio 1 comida vs objetivo 4, pero persiste con advertencia. |
| Socio ve borradores | ❌ No probado | No hay borradores. |
| Socio edita/regenera/vota/activa | ❌ No probado | Regresión aún cubierta por flujos previos. |
| NUT ajeno ve/modifica planes ajenos | ✅ NO | UI muestra "No tenés acceso a este paciente" en vez de "sin ficha". |
| Recepcionista accede a contenido clínico | ✅ NO | UI muestra "No tenés permisos para editar planes" — layout clínico NO se renderiza. |
| Activación permite amarillo/rojo | ❌ No probado | Sin planes. |
| Versionado roto | ✅ NO | `GET /planes-alimentacion/:id/versiones` 200 OK tras fix RBAC (`PLANES_VER`). |
| Regeneración modifica partes no solicitadas | ❌ No probado | Sin regeneración. |
| Dashboard socio navega a `/planes` | ✅ NO | Sidebar SOCIO → `/mi-plan`. Dashboard "Ver plan completo" también. |
| Errores JS no controlados en flujos principales | ✅ NO | 0 errores JS en login, /planes, /dashboard, /profesional/plan/:id/editar con NUT dueño tras generar. |

---

## Verificación 2026-06-29 00:44 ART — fixes aplicados

**Cambios verificados:**

| Bug original | Fix | Re-verificación |
|--------------|------|-----------------|
| #1 IA devuelve 500 SERVER_ERROR | `construirPlanEntity` setea `socio`/`nutricionista` con FK explícito | `POST /ia/plan-semanal` → 201 Created, plan 162→164, sin error en pantalla. 0 errores consola. |
| #2 UI confunde "sin permiso" con "sin ficha" | `useObtenerFichaNutricionista` clasifica `pacienteNoAccesible` para 404 con "no encontr*"; `PlanEditorPage` corta con `EstadoBloqueadoPlanEditor` cuando `sinPermisos` | NUT Norte (`nutri-norte@nutrifit.com`) en `/profesional/plan/273/editar` ve "No tenés acceso a este paciente" en vez de "El paciente aún no completó su ficha". Evidencia: `iteracion 1/evidencia/nut-ajeno-editor-bloqueado-2026-06-29T03-48Z.png`. |
| #3 RECEPCIONISTA puede acceder al layout del editor clínico | `PlanEditorPage` calcula `puedeEditarPlanes = rol === 'NUTRICIONISTA'` y rendera bloqueo completo cuando es false | RECEPCIONISTA Central en editor ve "No tenés permisos para editar planes"; `data-testid="plan-editor-layout"` no se monta. Evidencia: `iteracion 1/evidencia/recepcion-editor-bloqueado-2026-06-29T03-45Z.png`. |
| (Nuevo) `GET /planes-alimentacion/:id/versiones` 403 incluso para NUT dueño | Cambiar `@Actions('PLANES_IA_VERSIONES')` (acción inexistente) por `@Actions(ACCIONES.PLANES_VER)` (acción real en seed NUTRICIONISTA) en `listarVersiones` y `obtenerVersion` | `GET /planes-alimentacion/164/versiones` → 200 OK tras HMR; sidebar Versiones se monta sin alert de error. Evidencia: `iteracion 1/evidencia/plan-alimentacion-reverificado-fixes-ia-2026-06-29T03-44Z.png`. |
| (Nuevo) Frontend no desempolvaba `ApiResponse<T>` en mutations IA → crash en `macros.macrosPorDia` | Helper `desenvolverRespuestaApi` en `lib/api-response.ts`, aplicado en `useIa` y `regenerar` de `PlanEditorPage`; `normalizarRespuestaConMacros` mezcla `macros.macrosPorDia` en `plan.macrosPorDia` | Generación mínima renderiza grilla V2 con advertencia de macros. |

**Acceso y evidencia:**
- Backend `localhost:3000` y frontend `localhost:5173` (dev servers del usuario, no se reiniciaron).
- Solo devs (sin Co-Author), commit + push tras tests + build + lint puntual.

**Pendiente (no incluido en este fix):**
- Sin re-verificación de: feedback, activación, finalización, edición manual con prompts.
- `1 comida` para `diasAGenerar=1` produce banda ROJO (400 kcal vs 2000 objetivo). Es esperado y se persiste con notificación.
