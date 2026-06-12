# CU-04 — Configurar disponibilidad semanal: Errores detectados

> **Fuente**: `01-iteracion-base-nutricional.md` §CU-04
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Evidencia**: `04-pantalla-disponibilidad.png`, `04-estado-inicial-agenda.png`

---

## 🟡 Problemas de UI/UX

### 1. RB03 — Duración única por nutricionista (violación)

- **Spec**: `RB03: Duración única por nutricionista`. La duración debe ser un campo **único y global** que aplica a todos los rangos del nutricionista.
- **Realidad**: La UI muestra un campo `Duración (min)` **por bloque**. Cada bloque puede tener una duración diferente.
- **Impacto**: Permite al nutricionista configurar duraciones inconsistentes (ej. bloque 1 con 30min, bloque 2 con 45min), lo que viola la regla de negocio RB03. No hay validación server-side que lo impida (se puede PUT con duraciones diferentes).

---

### 2. A3 — Mensaje de warning diferente al spec

- **Spec**: *"Con esta duración y los rangos definidos, el rango del día [X] no genera slots completos. Ajustá la duración o los rangos."*
- **Realidad**: El mensaje actual es *"La duracion del turno en Lunes supera el rango horario disponible."*
- **Impacto**: Bajo. El mensaje actual es funcionalmente correcto pero menos informativo que el del spec. No orienta al usuario sobre qué acción tomar.

---

### 3. A4 — Sin warning al eliminar bloque con turnos futuros

- **Spec**: *"Intento de borrar un rango con turnos futuros reservados → warning: Este rango tiene N turnos reservados. Si lo eliminás, esos turnos quedarán fuera de la agenda configurada. ¿Continuar?"*
- **Realidad**: El botón `Eliminar bloque` (X) elimina el bloque inmediatamente sin verificar si existen turnos futuros reservados. No hay warning ni confirmación.
- **Impacto**: Los turnos pueden quedar huérfanos sin que el usuario sea consciente.

---

### 4. B2 — Sin advertencia al cambiar duración con turnos futuros

- **Spec**: *"Hay N turnos futuros con la duración actual. Los nuevos slots se calcularán con la nueva duración. Los turnos existentes NO se modifican. ¿Continuar?"*
- **Realidad**: No se muestra ninguna advertencia al cambiar la duración. El sistema guarda sin preguntar.
- **Impacto**: El usuario no es consciente de que los turnos existentes mantendrán la duración anterior.

---

### 5. Mensaje de éxito no coincide con el spec

- **Spec**: *"Disponibilidad configurada. N slots disponibles para los próximos 60 días."*
- **Realidad**: Frontend muestra *"Horarios de atencion actualizados."* (toast). Backend responde *"Actualizado correctamente"*.
- **Impacto**: Bajo. El mensaje del spec es más informativo (incluye conteo de slots).

---

### 6. API endpoint paths difieren del spec

- **Spec**: `GET /api/nutricionistas/:id/disponibilidad` y `PUT /api/nutricionistas/:id/disponibilidad`
- **Realidad**: `GET /agenda/:personaId` y `PUT /agenda/:personaId/configuracion`
- **Impacto**: Los paths no coinciden con el diseño API del spec. Si hay clientes o documentación externa que use los paths del spec, fallarán.

---

## ✅ Funcionalidades que SÍ funcionan

- Nutricionista puede acceder a "Mi Agenda" → "Horarios Habituales" y ver/editar rangos
- **A1**: Validación hora fin > hora inicio → toast *"La hora de fin debe ser mayor a la hora de inicio."*
- **A2**: Validación de no solapamiento (RB04) → toast *"Hay horarios superpuestos en el dia [X]."*
- **A3**: Validación duración mayor al rango → toast *"La duracion del turno en [día] supera el rango horario disponible."*
- **Happy path**: Guardar horarios → PUT 200 OK, respuesta con datos actualizados
- Carga de datos existentes desde API al abrir la pantalla
- "Gestionar Fechas" tab con DatePicker, bloqueo/desbloqueo de turnos
- Sin errores de consola en flujo normal

---

## Notas técnicas

- El botón `Guardar horarios` **no responde** a clicks de Playwright MCP directos (`page.getByRole('button').click()`). Para interactuar con el formulario fue necesario usar `page.evaluate` con dispatch de eventos nativos. Esto sugiere un problema con la delegación de eventos de React o con el componente `Button` de shadcn, que podría interferir con eventos sintéticos.
- El toast de `sonner` se usa correctamente para mostrar errores de validación.
- Los IDs de los bloques cambian en cada PUT (se eliminan y recrean), confirmando el comportamiento transaccional del spec.
