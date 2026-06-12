# CU-07 — Desactivar socio: Errores detectados

> **Fuente**: Inline (CU-07 del mensaje del usuario)
> **Fecha**: 2026-06-12
> **Herramienta**: Playwright MCP

---

## 🔴 Errores funcionales

### 1. Baja es DELETE físico en vez de desactivación suave (soft-delete)

- **Spec**: Socio pasa a INACTIVO. Datos se conservan. Reactivación posible.
- **Realidad**: Se ejecuta `DELETE /socio/:id` → eliminación física. No hay reactivación posible. Contador baja de 60 a 59.
- **Impacto**: Viola el flujo completo de CU-07. No se puede reactivar. Se pierden datos del socio (RB37).

### 2. Modal de confirmación no pide motivo ni advierte sobre turnos/plan

- **Spec**: Modal con "El socio tiene N turnos futuros. Serán cancelados." + "El socio tiene un plan alimentario activo. El plan se conserva pero no será editable." + campo motivo OBLIGATORIO.
- **Realidad**: Simple diálogo "¿Estás seguro de que querés dar de baja a X? Esta acción no se puede deshacer." Sin motivo, sin advertencias.
- **Impacto**: No hay trazabilidad del motivo. Usuario no es informado sobre consecuencias.

### 3. No se cancelan turnos futuros ni se notifica

- **Spec**: Turnos futuros se cancelan con motivo "Socio desactivado". Se registra auditoría por cada turno. Notificaciones a socios y nutricionistas.
- **Realidad**: No hay evidencia de cancelación de turnos ni notificaciones (DELETE directo).
- **Impacto**: Los nutricionistas pueden tener turnos de un socio que ya no existe.

### 4. API endpoint no coincide con spec

- **Spec**: `POST /api/socios/:id/desactivar`, `POST /api/socios/:id/reactivar`
- **Realidad**: `DELETE /socio/:id`. No hay endpoint de reactivación.
- **Impacto**: Inconsistencia con API documentada.

---

## ✅ Funcionalidades que SÍ funcionan

- Botón "Baja" en cada fila del listado de socios
- Diálogo de confirmación antes de eliminar
- DELETE /socio/:id retorna 200 con mensaje
- Toast "Socio dado de baja exitosamente"
- Sin errores de consola JavaScript

---

> **Nota**: Ver también `06-crear-socio.md` para errores compartidos (RB32 violado en creación, impacto en CU-07).
