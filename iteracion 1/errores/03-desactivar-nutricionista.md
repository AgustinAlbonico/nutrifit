# 03 — Desactivar nutricionista: Errores detectados

> **Fuente**: Inline (provisto por el usuario)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP
> **Evidencia**: `screenshots/03-gestion-nutricionistas.png`, `screenshots/03-detalle-nutricionista.png`, `screenshots/03-confirmar-baja.png`, network requests

---

## 🔴 Errores funcionales

### 1. No existe botón "Desactivar" en el detalle del nutricionista

- **Spec**: El detalle del nutricionista debe mostrar botón "Desactivar" (rojo/atención) si está ACTIVO, o "Reactivar" (verde) si está INACTIVO.
- **Realidad**: El modal "Detalles del Nutricionista" (abierto con "Ver") solo muestra información profesional y personal. No tiene ningún botón de acción (ni Desactivar ni Reactivar). El botón de baja solo existe en la tabla de gestión como "Baja", no en el detalle.
- **Impacto**: El usuario no puede desactivar un nutricionista desde la vista de detalle como especifica el spec.

### 2. "Baja" es un DELETE físico, no una desactivación lógica

- **Spec**: POST `/api/nutricionistas/:id/desactivar` — cambia estado a INACTIVO, conserva el registro.
- **Realidad**: El botón "Baja" envía un DELETE `http://localhost:3000/profesional/54` y elimina el registro permanentemente. Tras la operación, el nutricionista desaparece del listado y la cuenta baja de 14 a 13 resultados. No es posible reactivarlo.
- **Impacto**: Inconsistencia de datos. No hay vuelta atrás. Reactivación imposible.

### 3. Recepcionista no puede desactivar nutricionistas

- **Spec**: Actores: RECEPCIONISTA, ADMIN.
- **Realidad**: Con RECEPCIONISTA logueado, las únicas acciones en la tabla son "Ver" y "Editar". El botón "Baja" solo aparece para ADMIN. No hay forma para que recepción desactive nutricionistas.
- **Impacto**: Rol RECEPCIONISTA no tiene permiso para ejecutar el caso de uso.

### 4. Modal de confirmación no coincide con el spec

- **Spec**: Modal debe mostrar:
  - "Hay N turnos futuros. Serán cancelados y los socios notificados."
  - Lista resumida de turnos afectados (socio, fecha/hora).
  - Campo motivo obligatorio (RB09).
  - Post-confirmación: "Nutricionista desactivado. N turnos cancelados, M socios notificados."
- **Realidad**: El modal "Confirmar baja" solo muestra: "¿Estás seguro de que querés dar de baja a X? Esta acción no se puede deshacer." Sin mención de turnos futuros, sin lista de turnos, sin campo motivo, sin contador post-operación.
- **Impacto**: El usuario no tiene visibilidad del impacto de la desactivación (turnos cancelados, socios afectados).

### 5. API endpoints del spec no existen

- **Spec**:
  - `POST /api/nutricionistas/:id/desactivar` → Response 200
  - `POST /api/nutricionistas/:id/reactivar` → Response 200
- **Realidad**: Ambos endpoints devuelven 404.
- **Impacto**: La API pública documentada no está implementada.

### 6. No hay notificaciones a socios

- **Spec**: Socios afectados reciben email con link al listado de nutricionistas activos (RB39). Eventos `NUTRICIONISTA_DESACTIVADO` y `TURNO_CANCELADO`.
- **Realidad**: La operación de baja no menciona ni notifica a socios. No hay evidencia de cola de notificaciones o emails.
- **Impacto**: Socios con turnos futuros no son informados de la cancelación.

---

## 🟡 Problemas de UI/UX

### 1. Nombre del botón: "Baja" vs "Desactivar"

- **Spec**: "Desactivar" (rojo/atención).
- **Realidad**: "Baja". Semánticamente diferente.
- **Impacto**: Inconsistencia terminológica con el spec y posible confusión del usuario.

### 2. Botón "Baja" en tabla, no en detalle

- **Spec**: Botón en la pantalla "Detalle del nutricionista".
- **Realidad**: Botón directamente en la fila de la tabla de gestión, junto a "Ver" y "Editar". No hay página de detalle dedicada con acciones.
- **Impacto**: UX diferente a la especificada. Menos contexto para la acción de desactivar.

### 3. Sin distinción visual Activo/Inactivo en acciones

- **Spec**: Si ACTIVO → "Desactivar" (rojo). Si INACTIVO → "Reactivar" (verde).
- **Realidad**: No existe botón "Reactivar" porque la baja es permanente (DELETE). No hay estado INACTIVO en el modelo actual.
- **Impacto**: Imposible probar el flujo de reactivación.

### 4. Sin advertencia de turnos en curso (B1)

- **Spec**: Si hay turno PRESENTE/EN_CURSO → warning adicional: "Hay un turno en curso. Se cancelará de todos modos."
- **Realidad**: No hay chequeo ni advertencia de turnos.
- **Impacto**: Un turno podría estar ocurriendo en este momento y se cancelaría sin aviso.

---

## ✅ Funcionalidades que SÍ funcionan

- La tabla de gestión de nutricionistas existe y lista correctamente los profesionales.
- El filtro por estado (Todos/Activos/Inactivos) está presente en la UI.
- La página es accesible para ADMIN y RECEPCIONISTA (aunque con diferentes acciones).
- El modal de "Ver" muestra correctamente los datos del nutricionista.
- El modal de "Editar" permite modificar datos del nutricionista.
- El botón "Baja" (admin) ejecuta la acción y la tabla se refresca.

---
