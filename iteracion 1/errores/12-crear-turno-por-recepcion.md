# CU-12: Crear turno en nombre del socio (por recepción) — Errores detectados

> **Fuente**: provisto por el usuario en el prompt (spec inline). No existe archivo `12-*.md` en `iteracion 1/`.
> **Fecha**: 2026-06-12 16:12
> **Herramienta**: Playwright MCP
> **Actores usados**: `recepcion-central@nutrifit.com` (Gym Central) y `admin-central@nutrifit.com` (Gym Central)
> **Evidencia**: `12-dashboard-recepcion-404.png` (botón "Asignar Turno" en dashboard de recepción), `12-ruta-404-turnos-nuevo.png` (ruta `/turnos/nuevo` renderea "Not Found")

---

## 🔴 Errores funcionales

### 1. La feature completa no está implementada — ni endpoint backend ni ruta frontend existen

- **Spec**: la pantalla de recepción debe permitir "Crear turno" con búsqueda de socio, selector de nutricionista, calendario de disponibilidad, y (si el socio no tiene ficha completa) un warning amarillo arriba. Backend expuesto vía `POST /api/turnos/por-recepcion` con body `{ socioId, nutricionistaId, gimnasioId, fechaHora, tipoConsulta? }` y respuesta `201 { id, estado: 'CONFIRMADO', ... }`.
- **Realidad**:
  - El único botón visible para iniciar el flujo es **"Asignar Turno"** en el dashboard de recepción (accesos rápidos). Al hacer click navega a `/turnos/nuevo`, que renderea la página por defecto de TanStack Router con el texto **`Not Found`** (warnings en consola: `"A notFoundError was encountered on the route with ID '/auth', but a notFoundComponent option was not configured..."`).
  - `GET http://localhost:3000/turnos/por-recepcion` con token de recepción devuelve `403`. `POST` contra esa misma ruta con body válido devuelve `404 {"code":"NOT_FOUND","message":"Cannot POST /turnos/por-recepcion"}`. Idéntico resultado con token de admin.
  - Probé variantes plausibles del path: `/turnos/por-recepcion`, `/turnos/recepcion/crear`, `/turnos/recepcion/asignar`, `/turnos/admin/crear`, `/turnos/admin/asignar`, `/turnos/crear`, `/turnos/turno`, `/turnos/turno/crear`, `/api/turnos/por-recepcion`, `/api/turnos`. Todas devuelven `404 Cannot <METHOD>` o `403` (rutas registradas sin handler). No hay endpoint observable que implemente el contrato del spec.
  - La única página `/recepcion/turnos` es de **check-in** ("Check-in de Turnos" / "Registra la llegada de los socios a sus turnos programados") y no expone creación de turnos.
  - El botón **"Ver"** de cada card de "Agenda Profesionales" es un `<generic>` con `cursor: pointer` pero sin acción: click no navega, no abre modal, no dispara request.
- **Impacto**: **CRÍTICO**. La feature del CU-12 entera no existe. Ni UI, ni endpoint. Recepción no puede crear turnos en nombre del socio desde la app. Lo único verificable es que la cuenta `recepcion-central@nutrifit.com` sí tiene el permiso `turnos.crear` en su JWT (`"permissions":["...","turnos.crear",...]`), así que la autorización no es el cuello de botella: lo que falta es el caso de uso, el controller, la ruta y la página.

### 2. El contrato HTTP del spec no se observa en ningún endpoint

- **Spec**: `POST /api/turnos/por-recepcion` con body `{ socioId, nutricionistaId, gimnasioId, fechaHora, tipoConsulta? }`, respuesta `201 { id, estado: 'CONFIRMADO', ... }`.
- **Realidad**: no existe ningún endpoint de creación de turno específico para recepción. El único endpoint emparentado que responde es `POST /turnos/socio/reservar` (verificado en CU-11), pero devuelve `403` cuando se invoca con token de recepción: `{"code":"FORBIDDEN","message":"No tenés permisos para realizar esta acción."}`. No hay forma de que recepción cree un turno en nombre del socio desde la API.
- **Impacto**: alto. El spec no solo no está implementado: ni siquiera hay un endpoint "vecino" al que se le pueda delegar. RB58, RB40, RB14, RB33, RB60 y los eventos del CU-12 son todos no verificables porque el camino crítico no existe.

### 3. No es posible verificar ningún criterio de aceptación del spec

- **Spec**: 9 criterios de aceptación en la sección "Criterios de aceptación" (crear turno CONFIRMADO con `creado_por='RECEPCION'`, warning de ficha incompleta, validaciones RB05/RB06/RB07/RB27/RB28/RB40, emails, recordatorios 24h+1h, auditoría, tests unitarios del use-case).
- **Realidad**: al no existir endpoint ni UI, **ninguno** de los 9 criterios puede ejecutarse desde el navegador. El spec menciona además un test unitario esperado en `crear-turno-recepcion.use-case.ts` que tampoco se puede invocar desde Playwright.
- **Impacto**: alto. La verificación del CU-12 termina en la primera interacción: la feature no se entrega.

---

## 🟡 Problemas de UI/UX

### 1. El botón "Asignar Turno" del dashboard de recepción lleva a un 404 visible al usuario

- **Spec**: la pantalla de creación de turno es el happy path del CU-12.
- **Realidad**: al hacer click en "Asignar Turno" desde `/dashboard`, la app navega a `/turnos/nuevo` que renderea la página por defecto `Not Found` de TanStack Router (sin layout, sin sidebar, sin CTAs de retorno). Captura: `12-ruta-404-turnos-nuevo.png`.
- **Impacto**: medio-alto. Recepción ve un error genérico en lugar de un mensaje accionable. No hay forma de que descubra por sí misma que la feature está sin implementar.

### 2. El botón "Ver" de la "Agenda Profesionales" no es interactivo

- **Spec**: la sección "Agenda Profesionales" del dashboard debería permitir seleccionar un nutricionista y ver su disponibilidad para asignar un turno.
- **Realidad**: el card de cada profesional tiene un `<generic>` con la palabra "Ver" y `cursor: pointer` pero no tiene handler, no es un link, no abre modal. Click no produce navegación ni request.
- **Impacto**: medio. Es un entry point visual que sugiere funcionalidad que tampoco está implementada.

### 3. No hay un sidebar ni un item de menú dedicado a "Crear turno"

- **Spec**: implica una pantalla dedicada de "Crear turno (recepción)" con búsqueda de socio, selector de nutricionista y calendario.
- **Realidad**: el sidebar de recepción solo expone `Dashboard`, `Turnos del dia` (check-in), `Notificaciones`, `Configuracion`. No hay `/recepcion/turnos/nuevo`, ni `/turnos/crear`, ni un link dedicado a la creación de turnos.
- **Impacto**: medio. La feature no es descubrible vía navegación; solo aparece como botón roto en el dashboard.

---

## ✅ Funcionalidades que SÍ funcionan (contexto)

- Login como `recepcion-central@nutrifit.com` con `123456` → 201 + JWT con permisos `turnos.crear`, `turnos.editar`, `turnos.cancelar`, `turnos.ver`, etc.
- Dashboard de recepción carga y muestra KPIs (`Turnos Hoy`, `Presentes`, `Pendientes`, `En curso`), Turnos del Día con filtro, Agenda Profesionales (12 nutricionistas de Gym Central), Acciones Rápidas y Últimos Registrados.
- Login como `admin-central@nutrifit.com` → 201, JWT con permisos más amplios, dashboard admin distinto con matriz de permisos visible.
- Las requests que sí responden del backend (con token de recepción): `GET /turnos/recepcion/dia`, `GET /profesional`, `GET /socio`, `GET /auth/perfil`. Todas `200 OK`.
- La sesión persiste en `localStorage["nutrifit.auth"]` con el JWT firmado de la recepción.
- El botón "Asignar Turno" del dashboard **sí dispara navegación** (al menos la intención está cableada); el problema es que la ruta destino no existe.

---

## Caminos alternativos y casos borde NO verificados (no se pueden probar)

| Camino / caso | Razón |
|---|---|
| A1: socio sin ficha completa → warning | No hay UI ni endpoint para llegar al formulario |
| A2: socio INACTIVO → bloqueado | Sin endpoint reachable |
| A3: nutricionista sin disponibilidad | Sin endpoint |
| A4: slot bloqueado por excepción | Sin endpoint |
| A5/RB40: socio con turno ese día+mismo nutri | Sin endpoint |
| B1: fuera de política (RB06, RB07) | Sin endpoint |
| B2: socio recién creado sin ficha | Sin endpoint |
| B3: socio ya tiene turno ese día (RB40) | Sin endpoint |
| B4: gimnasio distinto al del actor (cross-gimnasio) | Sin endpoint |
| B5: editar turno creado por ella misma | No hay creación, no hay edición observable |
| B6: nutricionista de otro gimnasio | Sin endpoint |
| Emails (socio informativo + nutricionista) | Sin endpoint que dispare eventos |
| Recordatorios 24h+1h (RB60) | Sin endpoint |
| Auditoría con `creado_por='RECEPCION'` | Sin endpoint |
| Tests unitarios de `crear-turno-recepcion.use-case.ts` | Out of scope de Playwright (código) |

---

## Observaciones adicionales

- La spec menciona en "Notas" que el campo `creado_por='RECEPCION'` se persiste, que el email al socio es informativo (no requiere acción) y que el nutricionista ve una insignia "Creado por recepción" al abrir el turno. Ninguno de estos derivados es verificable en este estado.
- El spec también menciona que si el socio no tiene ficha, el nutricionista ve "Socio sin ficha completa" como warning adicional. Tampoco verificable.
- Si el equipo confirma que la feature entra en otra iteración, esta verificación debería repetirse cuando estén implementados: endpoint `POST /turnos/por-recepcion` (o el path que decida el equipo), ruta `/turnos/nuevo` (o equivalente) con layout de recepción, componente de búsqueda de socio, selector de nutricionista con filtro por gimnasio, calendario de disponibilidad, modal/warning de ficha incompleta, y persistencia del flag `creado_por='RECEPCION'`.
- Screenshot del dashboard de recepción con el botón "Asignar Turno" que rompe: `12-dashboard-recepcion-404.png`. Screenshot del resultado al click: `12-ruta-404-turnos-nuevo.png`.
