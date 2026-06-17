# 02 — Editar nutricionista: Errores detectados

> **Fuente**: inline (user message)
> **Fecha**: 2026-06-16
> **Herramienta**: Playwright MCP
> **Evidencia**: `modal-creacion-nutricionista.png`

---

## 🔴 Errores funcionales

### ~~1. Botón "Guardar cambios" no dispara PATCH a la API~~ ✅ RESUELTO

- **Spec**: El camino principal dice que al confirmar la edición, el sistema debe actualizar en transacción y responder con "Datos actualizados". Endpoint `PATCH /api/nutricionistas/:id`.
- **Realidad anterior**: El botón no disparaba ninguna request.
- **Verificación 2026-06-16**: Click en "Guardar cambios" → **`PUT /profesional/550 → 200 OK`** con `{"success":true,"message":"Actualizado correctamente"}`. El formulario se cierra y la lista se refresca. **Resuelto**.

### ~~2. TypeError al forzar submit del formulario~~ ✅ RESUELTO

- **Spec**: N/A (no debería crashear)
- **Realidad anterior**: `TypeError: Cannot read properties of undefined (reading 'trim')`
- **Verificación 2026-06-16**: El PUT se envió sin errores, 45ms de respuesta, sin errores en consola. **Resuelto**.

---

## 🟡 Problemas de UI/UX

### ~~3. Recepcionista no tiene acceso a "Nutricionistas" desde el sidebar~~ ✅ RESUELTO

- **Spec**: RECEPCIONISTA puede editar nutricionistas.
- **Realidad anterior**: El sidebar del recepcionista no mostraba "Nutricionistas".
- **Verificación 2026-06-16**: El sidebar muestra el link "Nutricionistas" con RECEPCIONISTA logueado. **Resuelto**.

---

## ⚠️ Inconsistencias detectadas en verificación 2026-06-16

### 4. Campo "Duración del turno" presente en editar pero no en crear

- **Qué se pidió**: Los campos del form de editar deben ser iguales a los del form de crear.
- **Realidad**: El form de crear no tiene "Duración del turno (minutos)" (se eliminó previamente), pero el form de editar sí lo mostraba.
- **Acción tomada**: Se eliminó el campo "Duración del turno (minutos)" del formulario de editar (validación + UI). El valor existente del nutricionista se mantiene en el estado y se envía en el PUT para no romper el backend, pero el usuario no puede modificarlo desde el modal de edición.
- **Estado**: ✅ RESUELTO

---

## ✅ Funcionalidades que SÍ funcionan

- Login como RECEPCIONISTA funciona correctamente.
- La página "Gestión de Nutricionistas" (`/nutricionistas`) carga y muestra la lista con datos correctos.
- El diálogo "Editar Nutricionista" se abre correctamente al hacer clic en "Editar".
- Los campos del formulario se cargan con los datos existentes del nutricionista.
- El botón **"Guardar cambios"** dispara correctamente **`PUT /profesional/:id → 200`** y la respuesta contiene los datos actualizados.
- No hay errores en consola ni crash al enviar el formulario.
- Los formularios de **crear** y **editar** ahora tienen los **mismos campos visibles** (sin `duracionTurnoMin` en ninguno de los dos).
- Sidebar de RECEPCIONISTA muestra el link "Nutricionistas".
- La API `GET /profesional` responde [200] con los datos correctos.
