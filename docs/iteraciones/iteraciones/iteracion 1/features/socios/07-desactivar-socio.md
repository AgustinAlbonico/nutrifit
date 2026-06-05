# 07 — Desactivar socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-07
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `06-crear-socio.md`, `notificaciones.md`, `auth.md`

## Descripción
Permite a recepción o admin desactivar un socio. Maneja los turnos futuros pendientes (cancelación + notificación). Cubre también la reactivación.

## Actores
- RECEPCIONISTA
- ADMIN

## Precondiciones
- El socio existe y está ACTIVO.

## Postcondiciones
- Socio pasa a INACTIVO.
- Turnos futuros (CONFIRMADO, PRESENTE) se cancelan con motivo "Socio desactivado".
- Plan alimentario activo se conserva (no se elimina, pero no será editable por el nutricionista mientras el socio esté inactivo).
- Socios y nutricionistas afectados reciben notificación.
- Auditoría registrada.

## Camino principal
1. Actor busca al socio.
2. Selecciona "Desactivar".
3. Sistema cuenta turnos futuros del socio.
4. Si hay turnos futuros:
   - Advierte: "El socio tiene N turnos futuros. Serán cancelados."
5. Si tiene plan activo:
   - Advierte: "El socio tiene un plan alimentario activo. El plan se conserva pero no será editable mientras esté inactivo. ¿Continuar?"
6. Actor ingresa motivo.
7. Confirma.
8. Sistema en transacción:
   - Marca socio como INACTIVO.
   - Cancela turnos futuros con motivo "Socio desactivado".
   - NO elimina ni modifica el plan activo.
   - Registra auditoría `accion=DEACTIVATE, entidad=socio` con motivo.
   - Registra auditoría `accion=CANCEL, entidad=turno, motivo='Socio desactivado'` por cada turno.
9. Encola notificaciones.
10. Mensaje: "Socio desactivado. N turnos cancelados."

## Reactivación
- Si el socio está INACTIVO, el botón dice "Reactivar".
- Mismo flujo inverso:
  1. Actor selecciona "Reactivar" → confirma.
  2. Sistema: socio → ACTIVO.
  3. NO se restauran turnos cancelados (requiere nueva reserva).
  4. Plan activo conservado vuelve a ser editable.
  5. Auditoría.

## Caminos alternativos
- **A1**: Socio sin turnos futuros → solo cambio de estado.
- **A2**: Sin plan activo → no muestra advertencia de plan.
- **A3**: Actor cancela la operación.

## Casos borde
- **B1**: Socio tiene plan activo + nutricionista con turno en curso → advertencia combinada, el turno en curso se cancela.
- **B2**: Socio tiene consulta reciente sin revisar → warning, no bloquea.
- **B3**: Socio intenta loguearse durante la desactivación → falla con mensaje claro.
- **B4**: Reactivación de socio que tenía un plan eliminado mientras estaba inactivo → el plan sigue eliminado; el socio no recupera el plan.
- **B5**: Doble click → idempotente.
- **B6**: Socio con foto de perfil → se conserva (no se borra).

## Reglas de negocio aplicadas
- **RB33**: Auditoría.

## Eventos disparados
- `SOCIO_DESACTIVADO` → email al admin.
- `TURNO_CANCELADO` → email al socio y al nutricionista por cada turno cancelado.

## Auditoría
- `accion='DEACTIVATE'`, `entidad='socio'`, `motivo` declarado.
- `accion='CANCEL'`, `entidad='turno'`, `motivo='Socio desactivado'`, antes/después por cada turno.

## Criterios de aceptación
- [ ] Recepción puede desactivar un socio.
- [ ] Si hay turnos futuros, se cancelan automáticamente.
- [ ] Plan activo se conserva.
- [ ] Socios y nutricionistas reciben notificaciones.
- [ ] El socio inactivo no puede hacer login.
- [ ] Reactivación vuelve a poner al socio activo.
- [ ] Auditoría registra la desactivación y cada cancelación.
- [ ] Test unitario: use-case cubre happy path, sin turnos futuros, con plan activo.

## Endpoints API

### `POST /api/socios/:id/desactivar`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, turnosCancelados: number }`
- **Errors**: 404, 400 (motivo faltante), 500

### `POST /api/socios/:id/reactivar`
- **Auth**: RECEPCIONISTA, ADMIN
- **Response 200**: `{ ok: true }`
- **Errors**: 404, 500

## Modelo de datos

### Entidades afectadas
- `Socio` (cambio de `estado`)
- `Turno` (cambio de `estado` a `CANCELADO`, `motivo`, `cancelado_at`)
- `PlanAlimentario` (NO se modifica, queda `activo` pero ineditable por nutricionista)
- `LogNotificacion`
- `Auditoria`

## UI / UX

### Pantalla: Detalle del socio
- Si ACTIVO: botón "Desactivar" (rojo).
- Si INACTIVO: botón "Reactivar" (verde).

### Modal: Confirmación
- Muestra: cantidad de turnos futuros.
- Si tiene plan activo: advertencia explícita.
- Campo motivo obligatorio.
- Botones "Cancelar" / "Desactivar" (rojo).

## Tests

### Unitarios
- `desactivar-socio.use-case.ts`:
  - Desactivación sin turnos futuros
  - Desactivación con N turnos → cancela todos
  - Desactivación con plan activo → advertencia mostrada
  - Motivo faltante → error
  - Idempotencia

- `reactivar-socio.use-case.ts`:
  - Reactivación simple
  - Plan sigue como estaba (activo o eliminado)

## Notas
- El plan activo se marca como "no editable por nutricionista mientras el socio esté inactivo" — esto se modela con una validación en el use-case de edición de plan (no como flag en DB).
- Si el socio desactivado intenta login → "Tu cuenta está inactiva, contactá a recepción".
- Los datos del socio (ficha, mediciones, consultas, planes históricos) se conservan por obligación legal (RB37, ver `compliance.md`).
