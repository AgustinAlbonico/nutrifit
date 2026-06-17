# Casos de Uso — Módulo de Turnos: Errores detectados

> **Fuente**: `C:\Users\agust\Desktop\CasosDeUso_Turnos.md`
> **Fecha**: 2026-06-17
> **Herramienta**: Playwright MCP
> **Evidencia**: `socio-mis-turnos.png`, network requests logs

---

## 🔴 Errores funcionales

### 1. Cancelar turno responde 400 sin feedback al usuario

- **Spec**: CU-05 — `PATCH /turnos/socio/:turnoId/cancelar`. Al cancelar un turno en estado PROGRAMADO, debe responder con error claro según la validación que falle (fecha pasada, plazo mínimo, etc.).
- **Realidad**: Al hacer clic en "Cancelar turno" sobre el turno #178 (PROGRAMADO, fecha 15/06/2026), el endpoint respondió 400 Bad Request. La UI no mostró ningún mensaje de error, toast, ni notificación visual.
- **Impacto**: El usuario nunca sabe qué pasó. La operación silenciosamente falla.

### 2. Endpoint `excepciones-disponibilidad` no existe (404)

- **Spec**: CU-13 — "Día feriado (excepción de disponibilidad) → los slots se marcan como no disponibles." Se requiere un endpoint para gestionar excepciones.
- **Realidad**: `GET /nutricionistas/5/excepciones-disponibilidad` responde 404. Se llama 2 veces al cargar la página `/agenda`.
- **Impacto**: La pestaña "Gestionar Fechas" en la agenda del nutricionista no puede funcionar. No se pueden marcar feriados ni excepciones.

### 3. Nutricionistas seed sin agenda configurada

- **Spec**: CU-01 / CU-02 — El socio debe poder ver disponibilidad y reservar turnos.
- **Realidad**: Todos los nutricionistas probados (ID 5, 54) responden con `{"data":[]}` en el endpoint de disponibilidad. No hay slots para ninguna fecha futura.
- **Impacto**: El flujo completo de reserva no se puede probar vía UI por falta de datos de agenda. Depende de que el nutricionista configure su agenda primero.

---

## 🟡 Problemas de UI/UX

### 1. Error 400 en cancelación no se muestra al usuario

- **Spec**: No especifica manejo de errores en UI, pero el principio general es que el usuario debe recibir feedback.
- **Realidad**: El clic en "Cancelar turno" no produce cambio visible. Sin toast, sin modal, sin indicación.
- **Impacto**: El usuario cree que no pasó nada o que la app no responde.

### 2. 404 en dashboard del socio (fuera de scope)

- **Spec**: Fuera del scope del spec de turnos.
- **Realidad**: `GET /planes-alimentacion/socio/8/activo` responde 404 al cargar el dashboard del socio `socio1-central@nutrifit.com`.
- **Impacto**: El card "Mi Plan Alimenticio" se muestra vacío. No bloquea funcionalidad de turnos.

---

## ✅ Funcionalidades que SÍ funcionan

- Login con credenciales seed (SOCIO, NUTRICIONISTA)
- Dashboard del socio con métricas (IMC, progreso, próximos turnos)
- Catálogo de nutricionistas con búsqueda, paginación (12 de 20), filtros y ordenamiento
- Agendar turno — paso 1 (seleccionar profesional) y paso 2 (seleccionar fecha con datepicker)
- Ficha de salud — 6 secciones con datos precargados, actualización y guardado
- Mis Turnos — listado con 4 turnos, filtros por estado/fecha/búsqueda, paginación
- Dashboard del nutricionista — métricas (pacientes activos, turnos hoy, planes)
- Mi agenda del día — pantalla funcional, muestra "Sin turnos para hoy" correctamente
- Mi Agenda — configuración de horarios semanales con 2 bloques (Lunes 09-13 y 16-20), guardado
- Ficha de salud del socio (GET) — endpoint responde OK con datos

---

## Verificación 2026-06-17 (segunda vuelta)

> **Fecha**: 2026-06-17
> **Herramienta**: Playwright MCP
> **Actores probados**: NUTRICIONISTA (`nutri-central@nutrifit.com`), SOCIO (`socio1-central@nutrifit.com`), RECEPCIONISTA (`recepcion-central@nutrifit.com`)

### Estado de bugs del reporte anterior

#### ✅ Bug 2 del reporte anterior (RESUELTO) — 404 `excepciones-disponibilidad`

- **Antes**: `GET /nutricionistas/5/excepciones-disponibilidad` → 404.
- **Ahora**: el endpoint se renombró a `GET /agenda/5/excepciones-disponibilidad` y responde **200 OK**. La pestaña "Gestionar Fechas" de `/agenda` carga y muestra los bloqueos configurados (7 entradas visibles: "Test desde script standalone", "Test fix", "Vacaciones", "Bloqueo con conflicto", "Bloqueo forzado", etc.).
- **Evidencia**: requests 246 y 249 con 200 OK; screenshot `agenda-gestionar-fechas.png`.

#### ✅ Bug 3 del reporte anterior (RESUELTO) — Nutricionistas sin agenda

- **Antes**: todos los nutricionistas respondían `{"data":[]}` en disponibilidad.
- **Ahora**: Nutri Central (id 5) devuelve slots correctamente. Para el lunes 22/06/2026 retorna 4 slots OCUPADOS (09:00–11:00) y 10 slots DISPONIBLES (11:00–13:00 y 16:00–20:00). El flujo paso 1 → paso 2 → paso 3 funciona end-to-end.
- **Evidencia**: request 239 `GET /turnos/socio/profesional/5/disponibilidad?fecha=2026-06-22` → 200 OK; botón "Reservar turno" se habilita al elegir slot 11:00.

#### ⚠️ Bug 1 del reporte anterior (REGRESIÓN) — Cancelar turno

- **Antes**: el botón "Cancelar turno" existía y producía 400 silencioso.
- **Ahora**: el botón directamente **no existe en la UI**. Las cards de Mis Turnos (`/turnos`) son puramente informativas: no hay acciones de Cancelar, Reprogramar, Confirmar, Reprogramar ni Ver detalle. La ruta `/turnos/:id` no está registrada y muestra el fallback genérico de TanStack Router (`<p>Not Found</p>`).
- **Conclusión**: el síntoma "400 silencioso" se eliminó **eliminando la acción**, no corrigiendo el manejo del error. CU-05 (Cancelar) y CU-04 (Ver detalle) quedan **no implementadas** en la UI.

---

## 🔴 Errores funcionales nuevos

### 1. CU-05 (Cancelar mi turno) y CU-06 (Reprogramar) no implementados en UI del socio

- **Spec**: El socio debe poder cancelar y reprogramar turnos propios desde la UI.
- **Realidad**: En `/turnos` las cards de cada turno (incluido el #178 PROGRAMADO del 15/06/2026) no exponen ningún botón de acción. No hay dropdown, no hay menú contextual, no hay link "Ver detalle". La ruta `/turnos/178` muestra "Not Found" (TanStack Router fallback).
- **Impacto**: el socio no puede cancelar ni reprogramar ningún turno. Esto bloquea al usuario cada vez que el backend rechaza una nueva reserva por "ya tenés una reserva activa" (ver bug siguiente): la app le dice que cancele el actual, pero no le da la herramienta para hacerlo.

### 2. Bloqueo funcional del socio: no puede reservar ni cancelar su turno vencido

- **Spec**: CU-02 — al intentar reservar con un turno activo previo, el sistema debe informar y permitir al socio liberarse primero.
- **Realidad**: `POST /turnos/socio/reservar` responde 400 con `"Ya tenés una reserva activa. Cancelá tu turno actual o esperá a que finalice antes de reservar otro."` (request 240). El socio1 Central tiene el turno #178 PROGRAMADO del 15/06/2026 (pasado hace 2 días). No puede reservar uno nuevo y **tampoco puede cancelar el viejo** (ver bug 1).
- **Impacto**: estado de cuenta bloqueado, sin camino de salida para el usuario.

### 3. CU-38 (Check-in recepción) falla sin feedback al usuario fuera de ventana

- **Spec**: CU-38 — si el check-in está fuera de la ventana `-10min/+30min` el backend retorna `BadRequestError`. La UI debe reflejar el error.
- **Realidad**: `POST /turnos/219/check-in` respondió 400 con `"El check-in solo se permite entre 10 min antes y 30 min después del horario del turno."` (request 240, error visible en consola). En pantalla: ningún toast, ningún modal, ningún cambio de estado del botón. El botón "Realizar check-in" / "Check-in" sigue visible y habilitado como si nada hubiera pasado.
- **Impacto**: la recepcionista hace click una y otra vez sin entender por qué no se registra la asistencia. Mismo patrón de "operación silenciosa" que el bug original de Cancelar.

---

## 🟡 Problemas de UI/UX

### 1. Bug UI-1 del reporte anterior (PERSISTE) — 404 `planes-alimentacion/socio/8/activo`

- **Realidad (re-confirmado)**: al cargar el dashboard del socio, la consola registra `Failed to load resource: 404 @ http://localhost:3000/planes-alimentacion/socio/8/activo`.
- **Impacto**: card "Mi Plan Alimenticio" del dashboard queda vacía para `socio1-central@nutrifit.com`. Sigue siendo **fuera de scope** del spec de turnos pero se arrastra de la verificación anterior.

### 2. Botones de cards Mis Turnos sin affordance

- **Realidad**: las cards de `/turnos` no son clickeables (el click no produce nada), no tienen cursor pointer visible, y no hay icono de "más opciones". El usuario que tenga un turno PROGRAMADO no tiene ninguna pista visual de qué hacer con él.
- **Impacto**: confusión + inacción.

---

## ✅ Funcionalidades que SÍ funcionan (segunda vuelta)

- Login con credenciales seed para los 3 roles probados.
- Dashboard del nutri: métricas, agenda del día (`/turnos-profesional` → 200), agendar/pacientes links.
- Mi Agenda del nutri: tab "Horarios Habituales" con bloques editables; tab "Gestionar Fechas" carga bloqueos (7 visibles) y permite crear nuevos.
- Catálogo de nutricionistas del socio (12 resultados con tarifa, ciudad, link "Ver perfil completo").
- Agendar turno paso 1 → 2 → 3: Nutri Central muestra 14 slots para 22/06/2026 con estados correctos (Ocupado / Disponible).
- Reserva rechazada con **feedback visible al usuario** cuando hay conflicto (`"Ya tenés una reserva activa..."`) — esto demuestra que el patrón de error SÍ puede mostrarse cuando la página lo decide.
- Panel de Recepción (`/dashboard` y `/recepcion/turnos`): 3 turnos listados, columnas Hora/Socio/DNI/Nutricionista/Estado/Acción, botones contextuales ("Check-in" para PROGRAMADO, "Revertir" para AUSENTE).
- Endpoint `GET /turnos/recepcion/dia?fecha=2026-06-17` responde 200 con shape correcto.

---

> **Screenshots de evidencia**:
> - `iteracion 1/errores/agenda-gestionar-fechas.png` — excepciones disponibilidad OK
> - `iteracion 1/errores/turno-detalle-not-found.png` — ruta `/turnos/:id` sin componente
> - `iteracion 1/errores/reservar-bloqueada-sin-cancelacion.png` — 400 de reserva con feedback visible
> - `iteracion 1/errores/recepcion-checkin-sin-feedback.png` — 400 de check-in SIN feedback al usuario

