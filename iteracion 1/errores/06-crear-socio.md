# CU-06 — Crear socio: Errores detectados

> **Fuente**: Inline (CU-06 del mensaje del usuario)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Evidencia**: Screenshots, network requests, snapshots

---

## 🔴 Errores funcionales

### 1. Contraseña no es auto-generada (viola RB32)

- **Spec**: El sistema genera una contraseña provisional de 12 chars con requisitos, la hashea y la envía por email. El usuario NUNCA ingresa la contraseña.
- **Realidad**: El formulario tiene un campo obligatorio "Contraseña temporal *" donde el usuario debe tipear la contraseña manualmente.
- **Impacto**: Viola la regla de negocio RB32. El socio recibe la contraseña que el recepcionista escribió, no una generada por el sistema. Riesgo de seguridad y experiencia de usuario deficiente.

### 2. Baja usa DELETE físico en vez de soft-delete (viola CU-07)

- **Spec**: Socio pasa a estado INACTIVO (RB). Se conservan todos los datos.
- **Realidad**: Se usa `DELETE /socio/:id` que elimina físicamente al socio. El contador baja de 60 a 59. El filtro "Inactivos" muestra 0 resultados.
- **Impacto**: Los datos del socio se pierden permanentemente. Reactivación es imposible. Viola requisitos legales de retención de datos (RB37).

### 3. Modal de baja no pide motivo ni advierte sobre turnos/plan

- **Spec**: Modal con advertencia de turnos futuros, plan activo, y campo motivo OBLIGATORIO.
- **Realidad**: Diálogo simple "¿Estás seguro?" sin campo de motivo, sin advertencia de turnos ni plan.
- **Impacto**: No hay trazabilidad del motivo de baja. El usuario no es alertado sobre consecuencias.

### 4. API endpoint no coincide con spec

- **Spec**: `POST /api/socios`, `POST /api/socios/:id/desactivar`, `POST /api/socios/:id/reactivar`
- **Realidad**: `POST /socio`, `DELETE /socio/:id` (no hay reactivación)
- **Impacto**: Inconsistencia con la API documentada. Afecta a clientes que consuman la API según spec.

---

## 🟡 Problemas de UI/UX

### 1. Formulario de creación tiene campos extra obligatorios que el spec marca como opcionales

- **Spec**: Obligatorios: nombre, apellido, email. Opcionales: DNI, teléfono, fecha nacimiento, género, observaciones.
- **Realidad**: DNI, fecha de nacimiento, género, teléfono, dirección, ciudad, provincia y contraseña son todos obligatorios (*).
- **Impacto**: El formulario pide más datos de los necesarios para registrar un socio. Incrementa fricción. Campos como dirección/ciudad/provincia ni siquiera están en el spec.

### 2. Falta campo "observaciones administrativas"

- **Spec**: Incluye campo opcional "observaciones administrativas".
- **Realidad**: No existe ese campo en el formulario.
- **Impacto**: Recepción no puede dejar notas internas al crear el socio.

### 3. Falta campo "estado" (default ACTIVO)

- **Spec**: estado (default ACTIVO) como campo en el formulario.
- **Realidad**: No se muestra ni permite seleccionar estado.
- **Impacto**: No se puede crear un socio directamente como INACTIVO si fuera necesario.

---

## ✅ Funcionalidades que SÍ funcionan

- Listado de socios con filtros (nombre, email, DNI, estado, provincia, ciudad, orden)
- Botón "Nuevo socio" abre modal
- Validación client-side de campos requeridos
- POST /socio retorna 201 con datos del socio creado
- Toast "Socio creado exitosamente"
- Botón "Baja" con confirmación
- DELETE /socio/:id retorna 200 con mensaje "Socio dado de baja exitosamente"
- Sin errores de consola JavaScript
- Asignación automática al gimnasio del actor (gimnasioId: 1 para Gym Central)

---
