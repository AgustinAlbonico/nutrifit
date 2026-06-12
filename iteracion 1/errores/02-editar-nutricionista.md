# 02 — Editar nutricionista: Errores detectados

> **Fuente**: inline (user message)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Evidencia**: `iteracion-1-errores-02-editar-nutricionista-dialog.png`, `iteracion-1-errores-02-editar-nutricionista-console-error.png`

---

## 🔴 Errores funcionales

### 1. Botón "Guardar cambios" no dispara PATCH a la API

- **Spec**: El camino principal dice que al confirmar la edición, el sistema debe actualizar en transacción y responder con "Datos actualizados". Endpoint `PATCH /api/nutricionistas/:id`.
- **Realidad**: El diálogo "Editar Nutricionista" se abre correctamente, los campos se cargan con datos existentes, se pueden modificar. Pero al hacer clic en "Guardar cambios" (botón `type="submit"` dentro de un `<form>`), **no se dispara ninguna petición PATCH ni POST**. No hay actividad de red. No hay mensaje de error visible. El diálogo permanece abierto. No hay errores ni warnings en consola.
- **Impacto**: La función de editar nutricionistas **no funciona**. Ningún cambio se persiste. El spec completo de edición queda inutilizable.

### 2. TypeError al forzar submit del formulario

- **Spec**: N/A (no debería crashear)
- **Realidad**: Al forzar programáticamente el envío del formulario (`form.dispatchEvent(new Event('submit', ...))`), se produce un crash:
  ```
  TypeError: Cannot read properties of undefined (reading 'trim')
      at GestionNutricionistas.tsx:209:45
      at editarNutricionista (GestionNutricionistas.tsx:420:21)
  ```
  Esto ocurre dentro de la función `validarFormularioEdicion()` o código de preparación del payload, donde se intenta hacer `.trim()` sobre un valor `undefined`. El candidato más probable es el campo **Matrícula** que está vacío para varios nutricionistas (ej. "Sofía González" la tiene vacía).
- **Impacto**: Incluso si el botón funcionara, el guardado crashearía al validar/enviar. Es un blocker adicional sobre el #1.

---

## 🟡 Problemas de UI/UX

### 3. Recepcionista no tiene acceso a "Nutricionistas" desde el sidebar

- **Spec**: Dice que RECEPCIONISTA puede editar nutricionistas (campos administrativos, sin email/matrícula). El endpoint `PATCH /api/nutricionistas/:id` acepta RECEPCIONISTA.
- **Realidad**: El sidebar del recepcionista **no muestra el enlace "Nutricionistas"**. Solo muestra Dashboard, Turnos del día, Notificaciones y Configuración. Sin embargo, navegando directamente a `/nutricionistas` la página carga correctamente con los botones "Ver" y "Editar" (aunque sin "Baja", lo cual es correcto).
- **Impacto**: El recepcionista no puede descubrir la funcionalidad de gestión de nutricionistas a menos que sepa la URL exacta. Baja visibilidad de la feature.

---

## ✅ Funcionalidades que SÍ funcionan

- Login como ADMIN en `admin-central@nutrifit.com` funciona correctamente.
- Login como RECEPCIONISTA en `recepcion-central@nutrifit.com` funciona correctamente.
- La página "Gestión de Nutricionistas" (`/nutricionistas`) carga y muestra la lista con datos correctos (nombre, email, tarifa, experiencia, estado).
- El diálogo "Editar Nutricionista" se abre correctamente al hacer clic en "Editar".
- Los campos del formulario se cargan con los datos existentes del nutricionista.
- El campo "Email" se muestra como texto readonly (editable visualmente, no confirmé si el backend lo rechaza).
- Los filtros de búsqueda (nombre, estado, provincia, ciudad, antigüedad, orden) están visibles en la UI.
- Navegación directa a `/nutricionistas` como RECEPCIONISTA revela la tabla con botones "Ver" y "Editar" (correctamente omitido "Baja").
- No hay errores 500 del backend durante la verificación.
- La API `GET /profesional` responde [200] con los datos correctos.

---
