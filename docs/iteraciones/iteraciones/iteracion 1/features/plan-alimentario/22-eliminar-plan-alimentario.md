# 22 — Eliminar plan alimentario

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-22
> **Estado**: Por implementar
> **Prioridad**: Media
> **Dependencias**: `20-crear-plan-alimentario.md`, `notificaciones.md`, `auditoria.md`

## Descripción
Permite al nutricionista eliminar (baja lógica) un plan alimentario. El plan se marca con `deleted_at` y deja de aparecer en listados (RB34). El socio queda sin plan activo. El motivo es obligatorio (RB23). NO se eliminan planes históricos anteriores (solo el plan específico).

## Actores
- NUTRICIONISTA (creador)

## Precondiciones
- Plan existe.
- Plan no eliminado previamente (`deleted_at IS NULL`).

## Postcondiciones
- `deleted_at=now()`.
- Si era el plan activo, socio queda sin plan activo.
- Planes históricos anteriores se conservan.
- Auditoría.

## Camino principal
1. Nutricionista abre el plan (activo o histórico).
2. Selecciona "Eliminar".
3. Ingresa motivo (obligatorio, RB23).
4. Confirma con doble confirmación ("¿Estás seguro? Esta acción no se puede deshacer. El socio quedará sin plan activo si era el actual.").
5. Sistema en transacción:
   - `deleted_at=now()`, `motivo_eliminacion=...`.
   - Si era ACTIVO: ahora el socio no tiene plan activo.
6. Auditoría `DELETE` con motivo.
7. Notificación al socio.
8. Mensaje: "Plan eliminado".

## Reactivación (admin)

- Si el admin necesita "reactivar" un plan eliminado (caso de error), puede:
  - `POST /api/admin/planes/:id/reactivar` con motivo.
  - Setea `deleted_at=NULL`, `motivo_eliminacion=NULL`.
  - **NO restaura** automáticamente el plan como activo (debe hacerlo manualmente).
  - Auditoría.

## Caminos alternativos
- **A1**: Plan ya eliminado → "El plan ya fue eliminado".
- **A2**: Motivo faltante → "El motivo es obligatorio".
- **A3**: Sin permiso (no es el creador) → 403.
- **A4**: Plan referenciado por una consulta reciente → warning "Este plan es referenciado por N consultas recientes. ¿Continuar?". Permitido continuar.

## Casos borde
- **B1**: Eliminación accidental → el plan se puede reactivar seteando `deleted_at=NULL` (acción admin con auditoría).
- **B2**: Hay planes históricos anteriores → no se ven afectados.
- **B3**: Socio intenta abrir el plan eliminado desde una pestaña vieja → al refrescar, ve "Plan eliminado" o se redirige.
- **B4**: El plan eliminado era el activo y había consulta próxima referenciándolo → la consulta se mantiene con `plan_alimentario_referenciado_id` apuntando al plan eliminado, pero se aclara visualmente.
- **B5**: Socio con plan activo eliminado → queda sin plan activo. La UI muestra "No tenés plan activo actualmente. Contactá a tu nutricionista.".
- **B6**: Re-activación de un plan eliminado con alimentos desactivados → los alimentos desactivados siguen con badge "No disponible".
- **B7**: Eliminar un plan cuando se está creando uno nuevo en paralelo → constraint de unicidad evita race conditions.

## Reglas de negocio aplicadas
- **RB23**: Motivo obligatorio.
- **RB33**: Auditoría.
- **RB34**: Soft delete (`deleted_at`).

## Eventos disparados
- `PLAN_ELIMINADO` → email al socio.

## Auditoría
- `DELETE` con `entidad='plan_alimentario'`, `motivo_eliminacion`, `antes_json` y `despues_json` (con `deleted_at`).

## Endpoints API

### `DELETE /api/planes/:id`
- **Auth**: NUTRICIONISTA (creador)
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true }`
- **Errors**: 400 (motivo faltante), 403, 404, 409 (ya eliminado), 500

### `POST /api/admin/planes/:id/reactivar`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, deletedAt: null }`
- **Errors**: 400, 404, 500

## Modelo de datos

### Entidad `PlanAlimentario` (campos de soft delete)
- `deleted_at: DATETIME NULL`
- `motivo_eliminacion: TEXT NULL`

## UI / UX

### Modal: Confirmación de eliminación
- Advertencia fuerte: "Esta acción no se puede deshacer".
- Si era activo: "El socio quedará sin plan activo".
- Campo motivo obligatorio.
- **Doble confirmación**: tipear "ELIMINAR" en un input.
- Botones: "Cancelar" / "Eliminar" (rojo, doble click).

### Vista: Socio sin plan activo
- Banner: "No tenés plan alimentario activo. Tu nutricionista está trabajando en uno nuevo." o mensaje similar.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Plan ya eliminado | 409 |
| Plan referenciado por consulta | Warning, permitido |
| Socio ve plan eliminado desde caché | Refrescar muestra "Plan eliminado" |
| Re-activación por admin | Restaura pero NO marca como activo |
| Plan eliminado era el activo | Socio queda sin plan activo |
| Alimentos desactivados en plan reactivado | Badge "No disponible" |

## Tests

### Unitarios
- `eliminar-plan-alimentario.use-case.ts`:
  - Plan activo → soft delete
  - Plan histórico → soft delete
  - A1: ya eliminado → 409
  - A2: sin motivo → 400
  - B1: reactivación (test aparte)
  - B2: hay planes históricos anteriores → no afectados
- `reactivar-plan-alimentario.use-case.ts`:
  - Solo ADMIN
  - Con motivo
  - Setea `deleted_at=NULL`

## Notas
- La baja lógica es más segura que el borrado físico: permite auditoría, reactivación y análisis histórico.
- El nutricionista que creó el plan puede eliminarlo. No se permite que otro nutricionista lo elimine (solo admin puede reactivar).
- El socio debe ser notificado de la eliminación y entender que su plan activo desapareció.
- **Reactivación por admin** es una operación sensible (debería requerir justificación). Considerar aprobación dual en iter 2+.
- Después de eliminar el plan activo, el socio queda en un estado "sin plan activo" hasta que el nutricionista cree uno nuevo. La UI debe manejar este estado sin恐慌.
