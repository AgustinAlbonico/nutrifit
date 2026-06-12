# CU-11: Reservar turno — Errores detectados

> **Fuente**: provisto por el usuario en el prompt (spec inline)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Actor usado**: `socio2-central@nutrifit.com` (Gym Central, ficha completa)
> **Evidencia**: `screenshots/11-reservar-turno-confirmado.png`
> **Turno creado**: ID #176, 2026-06-15 10:00 con Nutri Central

---

## Verificación 2026-06-12 15:38

> **Fuente**: provisto por el usuario en el prompt (spec inline)
> **Fecha**: 2026-06-12 15:38
> **Herramienta**: Playwright MCP
> **Actor usado**: `socio.m0@gymcentral.com` (Gym Central)
> **Evidencia**: `11-reservar-turno-inicio.png`, `11-reservar-turno-catalogo.png`, `11-reservar-turno-agendar.png`, `11-reservar-turno-confirmado-2026-06-12.png`, request `221`, request `222`
> **Turno creado**: ID #177, 2026-06-15 10:30 con Nutri Central

### 🔴 Errores funcionales

#### 1. El turno sigue creándose en `PROGRAMADO` y no en `CONFIRMADO`

- **Spec**: RB58 exige alta directa en `CONFIRMADO` y la respuesta 201 debería reflejar ese estado.
- **Realidad**: la request `222` (`POST http://localhost:3000/turnos/socio/reservar`) respondió `201 Created` con `{"data":{"idTurno":177,"fechaTurno":"2026-06-15","horaTurno":"10:30","estadoTurno":"PROGRAMADO"...}}`. La pantalla final `/turnos/177/confirmado` también muestra `ESTADO: PROGRAMADO`.
- **Impacto**: crítico. Rompe la regla principal del caso de uso y deja inconsistente el contrato funcional del flujo.

#### 2. El contrato HTTP real no coincide con los endpoints del spec

- **Spec**: `GET /api/nutricionistas/:id/slots` y `POST /api/turnos`.
- **Realidad**: en browser se usaron `GET /turnos/socio/profesional/5/disponibilidad?fecha=2026-06-15` (request `221`) y `POST /turnos/socio/reservar` (request `222`).
- **Impacto**: alto. El spec no describe el contrato observable real.

#### 3. La estructura del request/response no coincide con el spec

- **Spec**: body `{ nutricionistaId, gimnasioId, fechaHora, tipoConsulta? }` y response `{ id, estado: 'CONFIRMADO', fechaHora, nutricionista, ... }`.
- **Realidad**: el request real fue `{"nutricionistaId":5,"fechaTurno":"2026-06-15","horaTurno":"10:30"}` y la respuesta fue `{"success":true,"message":"Creado correctamente","data":{"idTurno":177,"fechaTurno":"2026-06-15","horaTurno":"10:30","estadoTurno":"PROGRAMADO","socioId":273,"nutricionistaId":5}}`.
- **Impacto**: alto. Cambian nombres, forma y semántica del contrato consumido por frontend.

### 🟡 Problemas de UI/UX

#### 1. La confirmación final no muestra el mensaje del spec ni los recordatorios

- **Spec**: "Turno reservado para el [fecha] a las [hora]. Recibirás un recordatorio 24h antes."
- **Realidad**: la pantalla final muestra `¡Turno reservado!` y `Guardá los datos de la reserva...`, pero no menciona recordatorios ni replica el copy esperado.
- **Impacto**: medio. El usuario no recibe la promesa visible de recordatorio que forma parte del caso de uso.

#### 2. La UI no expone `tipoConsulta` aunque el spec lo contempla como opcional

- **Spec**: el alta acepta `tipoConsulta?` como campo libre.
- **Realidad**: en el flujo UI no aparece ningún control para ese dato y el request observado no lo envía.
- **Impacto**: bajo a medio. El backend del spec queda subutilizado desde la pantalla actual.

### ✅ Funcionalidades que SÍ funcionan

- El socio autenticado puede navegar `Nutricionistas -> Reservar` y llegar al wizard de agenda.
- La preselección por query string `?nutricionistaId=5` funciona.
- La fecha elegida dispara carga de disponibilidad real; la request `221` devolvió slots libres y ocupados para `2026-06-15`.
- Los slots ocupados se muestran deshabilitados y los libres permiten selección.
- El `POST /turnos/socio/reservar` devuelve `201 Created` en el flujo feliz observado.
- La confirmación final muestra código del turno, fecha, hora, profesional y datos del socio.
- En esta verificación del happy path no hubo errores de consola JavaScript durante el flujo de reserva.

### Observaciones adicionales

- Con `socio2-central@nutrifit.com` y `socio3-central@nutrifit.com` el intento de reservar un slot libre devolvió `409 Conflict` y la UI mostró `Ya tenés una reserva activa. Cancelá tu turno actual o esperá a que finalice antes de reservar otro.`
- Esa evidencia confirma que existe un guard funcional por reservas activas, pero en esta pasada no se verificó si su alcance coincide exactamente con RB40 (`mismo día` + `mismo nutricionista`) o si está bloqueando más de lo debido.

---

## 🔴 Errores funcionales

### 1. Turno se crea en estado PROGRAMADO — viola RB58 explícitamente

- **Spec**: RB58 dice "Turno se crea CONFIRMADO directo", `CHECK(estado != 'PROGRAMADO')` en la DB. El spec es claro: no se permite PROGRAMADO en iter 1.
- **Realidad**: `POST /turnos/socio/reservar` devuelve `"estadoTurno": "PROGRAMADO"`. La pantalla de confirmación muestra **"Estado: PROGRAMADO"**.
- **Impacto**: **CRÍTICO**. Viola una regla de negocio fundamental del sistema. El turno se muestra como "programado" al socio cuando debería aparecer como "confirmado". El flujo de recordatorios, notificaciones y estados posteriores podría verse afectado.

### 2. Endpoint paths no coinciden con el spec

- **Spec**: `POST /api/turnos`, `GET /api/nutricionistas/:id/slots`
- **Realidad**: `POST /turnos/socio/reservar`, `GET /turnos/socio/profesional/:id/disponibilidad`
- **Impacto**: Inconsistencia contractual entre spec e implementación. Quien integre contra el spec no va a encontrar los endpoints esperados.

### 3. Response structure difiere del spec

- **Spec**: cuerpo directo `{ id, estado, fechaHora, nutricionista, ... }`
- **Realidad**: `{ success: true, data: { idTurno, estadoTurno, ... }, error: null }`
- **Impacto**: Los nombres de campos también difieren (`idTurno` vs `id`, `estadoTurno` vs `estado`, `fechaTurno` vs `fechaHora`). Rompe compatibilidad con clientes que sigan el spec.

---

## 🟡 Problemas de UI/UX

### 1. Mensaje de confirmación no coincide con el spec

- **Spec**: "Turno reservado para el 15/06/2026 a las 10:00. Recibirás un recordatorio 24h antes."
- **Realidad**: heading "¡Turno reservado!" + "Guardá los datos de la reserva..."
- **Impacto**: Bajo. La UX es funcional pero el copy no es el especificado. El mensaje del spec es más informativo porque incluye la fecha/hora y recordatorio.

### 2. Los pasos del wizard se muestran como "Completo" pero sin feedback visual fuerte

- **Spec**: no especifica diseño del wizard, pero el actual muestra checkmarks en Paso 1 y 2 una vez completados.
- **Realidad**: Los pasos se marcan como "Completo" con un icono, pero en Paso 3 no hay indicación visual de que se necesita seleccionar un slot hasta que se hace.
- **Impacto**: Bajo. Funcional, navegable, claro.

### 3. No se muestra `tipo_consulta` en el formulario

- **Spec**: el body del POST acepta `tipoConsulta?` como opcional, campo libre.
- **Realidad**: no hay campo de tipo de consulta en la UI actual. El POST no envía `tipo_consulta`.
- **Impacto**: Bajo (es opcional y el campo es libre). No hay forma de distinguir "primera consulta" vs "control" desde la UI.

---

## 🟡 Problemas de UI/UX adicional

### 4. Pantalla de confirmación no incluye recordatorios

- **Spec**: "Recibirás un recordatorio 24h antes."
- **Realidad**: la confirmación no menciona recordatorios automáticos.
- **Impacto**: El socio no sabe que recibirá recordatorios, lo que reduce la utilidad de la feature de recordatorios (RB60).

---

## ✅ Funcionalidades que SÍ funcionan

- **Flujo completo de reserva**: seleccionar profesional → seleccionar fecha → seleccionar slot → confirmar → turno creado.
- Validación de ficha de salud completa: `GET /turnos/socio/ficha-salud` responde con datos (socioId=9, fichaSaludId=3).
- Profesional pre-seleccionado desde URL (`?nutricionistaId=5`) funciona correctamente.
- Slots se calculan on-demand: `GET /turnos/socio/profesional/5/disponibilidad?fecha=2026-06-15` devuelve correctamente slots LIBRE y OCUPADO.
- Los slots OCUPADOS aparecen deshabilitados en la UI (no se puede clickear).
- Los slots LIBRES son clickeables y muestran "Horario seleccionado: ..." con botón "Reservar turno".
- `POST /turnos/socio/reservar` devuelve 201 Created con los datos del turno.
- Pantalla de confirmación con código (#176), fecha, hora, profesional, datos del socio.
- Link "Volver a mis turnos" en la confirmación navega correctamente a `/turnos`.
- La duración del turno se toma de la configuración del nutricionista (30 min para Nutri Central).
- Sin errores de consola JavaScript en toda la navegación de la reserva.

---

## Caminos alternativos NO verificados

| Camino | Razón |
|--------|-------|
| A1: Ficha incompleta | socio2-central ya tiene ficha (fichaSaludId=3) |
| A2: Slot ya reservado (race condition) | Requiere 2 requests simultáneos |
| A3: <2h anticipación | No se probó con fecha/hora cercana |
| A4: >60 días | No se probó con fecha lejana |
| A5: Nutricionista INACTIVO | No se probó |
| A6: Fecha bloqueada | No se probó |
| A7: Ya tiene turno mismo día | No se probó (primer turno del socio) |
| B1: Doble click | No se probó idempotencia |

---
