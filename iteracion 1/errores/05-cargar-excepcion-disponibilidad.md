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
