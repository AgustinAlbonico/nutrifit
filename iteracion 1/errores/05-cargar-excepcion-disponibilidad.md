# 05 — Cargar excepción de disponibilidad: Errores detectados

> **Fuente**: Provisto inline por el usuario (no existe como archivo en disco)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP + API calls directas
> **Evidencia**: `05-gestionar-fechas-tab.png`

---

## 🔴 Errores funcionales

### 1. API endpoint `GET /nutricionistas/:id/excepciones` no existe (404)

- **Spec**: Define `GET /api/nutricionistas/:id/excepciones` con query params
- **Realidad**: `Invoke-RestMethod GET http://localhost:3000/nutricionistas/5/excepciones` → 404 `"Cannot GET /nutricionistas/5/excepciones"`
- **Impacto**: El frontend no puede cargar excepciones existentes. No hay forma de listar excepciones para mostrarlas en el calendario.

### 2. API endpoint `POST /nutricionistas/:id/excepciones` no existe (404)

- **Spec**: Define `POST /api/nutricionistas/:id/excepciones` para crear excepción
- **Realidad**: `Invoke-RestMethod POST http://localhost:3000/nutricionistas/5/excepciones` → 404
- **Impacto**: No se puede crear excepciones. El spec completo depende de este endpoint.

### 3. API endpoint `POST /nutricionistas/:id/excepciones/confirmar-accion` no existe (404)

- **Spec**: Define `POST /api/nutricionistas/:id/excepciones/confirmar-accion`
- **Realidad**: `Invoke-RestMethod POST http://localhost:3000/nutricionistas/5/excepciones/confirmar-accion` → 404
- **Impacto**: No se puede manejar la acción explícita cuando hay turnos afectados (RB20).

### 4. No existe UI para crear excepciones

- **Spec**: Define botón "Nueva excepción", form con date picker, tipo (día completo/rango), motivo, y modal de confirmación con lista de turnos.
- **Realidad**: La pantalla "Mi Agenda" > "Gestionar Fechas" solo muestra un date picker y una sección "Horarios del día" vacía. No hay botón para crear excepción, ni formulario, ni modal. No hay manera de crear excepciones desde la UI.
- **Impacto**: El feature completo está ausente en el frontend.

---

## 🟡 Problemas de UI/UX

### 1. La descripción del tab sugiere que se pueden gestionar excepciones pero no hay opción

- **Spec**: El texto del encabezado dice "gestiona excepciones por fecha"
- **Realidad**: El tab "Gestionar Fechas" solo permite seleccionar fecha y ver horarios del día. No hay acciones disponibles para crear excepciones.
- **Impacto**: Falsa expectativa para el usuario.

---

## ✅ Funcionalidades que SÍ funcionan

- La navegación a "Mi Agenda" funciona correctamente
- Los tabs "Horarios Habituales" (configuración semanal) y "Gestionar Fechas" existen y son navegables
- El date picker funciona: permite seleccionar fecha, los días pasados están deshabilitados
- No hay errores de consola ni warning

---

## Resumen de verificación

| Categoría | Cantidad |
|---|---|
| Errores funcionales | 4 |
| Problemas UI/UX | 1 |
| Funcionalidades OK | 4 |

---

## Verificación 2026-06-16 (Playwright MCP)

> **Re-verificación solicitada por el usuario** porque reportó que la feature SÍ funciona en "Mi Agenda" > "Gestionar Fechas" (se pueden bloquear turnos).

### Metodología

- Login como `nutri-central@nutrifit.com` (personaId 5, gimnasioId 1)
- Navegación a `/agenda` → tab "Gestionar Fechas"
- Selección de fecha 2026-06-22 (lunes, día con disponibilidad)
- Click en botón "Bloquear Horario" del slot 10:30

### Hallazgos visuales

Sí, **la UI SÍ permite bloquear slots puntuales libres** y mostrar su estado. Eso es lo que ve el usuario. Pero **NO es la feature que describe el spec**. La implementación real es **conceptualmente distinta** a lo que pide el spec:

| Spec pide (CU-05) | Lo que está implementado |
|---|---|
| Entidad `ExcepcionDisponibilidad` con tabla propia | No existe esa entidad. Lo que se crea es un `turno` con `estadoTurno: "PROGRAMADO"` y `socioId: 0` |
| Endpoint `POST /nutricionistas/:id/excepciones` | Endpoint real: `POST /turnos/profesional/5/bloquear` con body `{fecha, horaTurno}` |
| Endpoint `POST /nutricionistas/:id/excepciones/confirmar-accion` | No existe |
| Tipo "día completo" | No existe — solo bloqueo de un slot puntual (1 hora) |
| Tipo "rango parcial" con hora inicio/fin | No existe — solo se puede bloquear una hora a la vez |
| Modal de confirmación con lista de turnos afectados (RB20) | No existe — el botón "Bloquear Horario" está deshabilitado para slots ocupados; no hay flujo de "cancelar con motivo" / "conservar excepcionalmente" |
| Campo `motivo` | No existe |
| Auditoría `entidad='excepcion_disponibilidad'` (RB33) | No existe |
| Constraint `UNIQUE(nutricionista_gimnasio_id, fecha, COALESCE(hora_inicio,...))` | No existe — nada impide bloqueos duplicados |
| Límite de 60 días (RB07) | No se valida explícitamente — el date picker solo bloquea fechas pasadas, no futuras lejanas |

### Evidencia de la implementación real

- **Endpoint descubierto**: `POST http://localhost:3000/turnos/profesional/5/bloquear`
  - Request: `{"fecha":"2026-06-22","horaTurno":"10:30"}`
  - Response 201: `{"success":true,"message":"Creado correctamente","data":{"idTurno":218,"fechaTurno":"2026-06-22","horaTurno":"10:30","estadoTurno":"PROGRAMADO","socioId":0,"nutricionistaId":5}}`
  - **Observación clave**: el `estadoTurno` es `"PROGRAMADO"`, no `"BLOQUEADO"`. La entidad creada es un `turno` con `socioId: 0`, NO una `excepcion_disponibilidad`. Conceptualmente es un "turno fantasma sin socio".
- **Endpoint de desbloqueo**: `PATCH /turnos/profesional/5/:turnoId/desbloquear`
- **Código fuente** (apps/frontend/src/pages/Agenda.tsx:311-339): las funciones `bloquearTurno` y `desbloquearTurno` confirman que NO hay flujo de excepción con día completo / rango / motivo.

### Estado del slot OCUPADO (RB20)

- El slot 09:00 está reservado por "Socio TestE2E" (DNI 77777001).
- El botón "Bloquear Horario" NO aparece — en su lugar hay un botón `disabled` que dice "Turno Ocupado".
- **No hay forma de cancelar el turno desde acá**, ni modal de confirmación, ni opción de "conservar excepcionalmente". RB20 está completamente sin soporte.

### Estado del slot BLOQUEADO

- 09:30 y 10:00 ya estaban bloqueados (probablemente creados en sesiones de prueba anteriores).
- El botón dice "Habilitar Horario" y llama a `PATCH /turnos/profesional/5/:turnoId/desbloquear`.
- Sí funciona como toggle de slot individual.

### Conclusión de la re-verificación

✅ **Lo que vio el usuario es correcto**: la UI permite bloquear/desbloquear slots puntuales libres.

❌ **El reporte de errores original es correcto y NO queda invalidado**: la feature implementada es **bloqueo de slots individuales** (un caso degenerado de la spec), NO la entidad `ExcepcionDisponibilidad` con día completo, rangos, motivo, RB19, RB20, RB33 y los 3 endpoints del spec.

- El spec CU-05 sigue **mayoritariamente no implementado** (≈85% ausente).
- Lo que existe cumple apenas un subconjunto mínimo: bloquear un slot suelto libre.
- Los 4 errores funcionales y 1 problema UI/UX del reporte original **se mantienen vigentes**, con la siguiente corrección: el error #4 ("No existe UI para crear excepciones") debe leerse como *"No existe UI para crear excepciones según el contrato del spec; lo que existe es una UI alternativa de bloqueo de slots puntuales que NO cumple RB19, RB20, ni RB33"*.

### Recomendación

El equipo de producto debe decidir:
1. **Aceptar la implementación alternativa** (bloqueo de slots sueltos) como alcance reducido de CU-05, marcando el resto como "fuera de scope iter 1" y actualizar el spec.
2. **O exigir la implementación completa** según el spec original: entidad `ExcepcionDisponibilidad`, endpoints `/nutricionistas/:id/excepciones`, modal RB20, auditoría, motivo, tipos día completo/rango, UNIQUE constraint.

### Screenshots

- `iteracion 1/errores/05-gestionar-fechas-lunes.png` — vista inicial con slots libres/bloqueados/ocupados del lunes 22/06
- `iteracion 1/errores/05-gestionar-fechas-despues-bloquear.png` — slot 10:30 recién bloqueado, ahora muestra "Habilitar Horario"
