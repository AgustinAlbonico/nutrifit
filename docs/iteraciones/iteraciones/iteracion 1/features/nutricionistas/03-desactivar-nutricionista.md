# 03 — Desactivar nutricionista

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-03
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `01-registrar-nutricionista.md`, `notificaciones.md`, `auth.md`, `multi-tenant.md`

## Descripción
Permite a recepción o admin desactivar (suspender) un nutricionista, con manejo de turnos futuros (cancelación + notificación a socios). Cubre también la reactivación.

**Decisión clave**: "desactivar nutricionista" es la desactivación **GLOBAL**. Todas las asociaciones `NutricionistaGimnasio` se desactivan. Para desasociar de un gimnasio específico, ver `multi-tenant.md` §Desasociar nutricionista.

## Actores
- RECEPCIONISTA, ADMIN

## Precondiciones
- El nutricionista existe y está ACTIVO.

## Postcondiciones
- Nutricionista pasa a `INACTIVO` (estado global).
- Todas las asociaciones `NutricionistaGimnasio` en ACTIVO pasan a INACTIVO.
- Turnos futuros (CONFIRMADO, PRESENTE) se cancelan con motivo "Nutricionista desactivado".
- Socios afectados reciben email con link al listado de nutricionistas activos (RB39).
- Registro en auditoría (uno por nutricionista + uno por cada turno cancelado).

## Camino principal
1. Actor busca al nutricionista.
2. Selecciona "Desactivar".
3. Sistema cuenta turnos futuros (estado ∈ {CONFIRMADO, PRESENTE}).
4. Si hay turnos futuros:
   - Muestra advertencia: "Hay N turnos futuros. Serán cancelados y los socios notificados."
   - Muestra lista resumida de turnos afectados (socio, fecha/hora).
5. Actor ingresa motivo (obligatorio, RB09).
6. Confirma.
7. Sistema en una transacción:
   - Marca nutricionista como `INACTIVO`.
   - Marca todas las `NutricionistaGimnasio` como `INACTIVO`.
   - Cancela turnos futuros con motivo "Nutricionista desactivado".
   - Libera los slots.
   - Registra auditoría `DEACTIVATE` con motivo.
   - Registra auditoría `CANCEL` por cada turno.
8. Encola notificaciones a socios afectados.
9. Mensaje: "Nutricionista desactivado. N turnos cancelados, M socios notificados."

## Reactivación

Si el nutricionista está INACTIVO, el botón dice "Reactivar".

- Mismo flujo inverso:
  1. Actor selecciona "Reactivar".
  2. Confirma.
  3. Sistema transaccional: nutricionista + todas las `NutricionistaGimnasio` → ACTIVO.
  4. NO se restauran turnos cancelados (requiere nueva reserva).
  5. Auditoría.

**Importante**: la reactivación reactiva TODAS las asociaciones a gimnasios. Si solo se quiere reactivar en un gimnasio, el admin debe hacerlo manualmente vía `multi-tenant.md`.

## Caminos alternativos
- **A1**: Nutricionista sin turnos futuros → solo cambio de estado + auditoría.
- **A2**: Actor cancela la operación → no se hace nada.
- **A3**: SMTP falla al notificar socios → cancelaciones se aplican igual, log en `log_notificacion` con retry (RB35).
- **A4**: Nutricionista intenta auto-desactivarse → 403 (no permitido).

## Casos borde
- **B1**: Hay un turno en curso (PRESENTE/EN_CURSO) → warning adicional: "Hay un turno en curso. Se cancelará de todos modos." (no se puede dejar inconsistente).
- **B2**: Un socio intenta reservar mientras se desactiva → falla con "El nutricionista ya no está disponible" (RB17).
- **B3**: Doble click en desactivar → idempotente: la segunda operación es no-op porque ya está INACTIVO.
- **B4**: Desactivación durante la cancelación de otro flujo → constraint transaccional evita inconsistencia.
- **B5**: Nutricionista con foto/diploma ya subidos → se conservan (no se borra el archivo, el nutricionista puede reactivarse y la foto sigue ahí).
- **B6**: Nutricionista ya está desactivado → 409.
- **B7**: El nutricionista está actualmente logueado → su sesión actual queda con el flag de inactivo en la próxima validación (no es inmediato). Decisión: el JWT no se invalida, pero al primer request se detecta que está inactivo y se fuerza logout. Ver `auth.md`.

## Reglas de negocio aplicadas
- **RB17**: Nutricionista inactivo no aparece en listados ni recibe turnos.
- **RB18**: Cancelar turnos futuros al desactivar.
- **RB25**: Nutricionista en N gimnasios → al desactivar, se desactivan TODAS las asociaciones.
- **RB33**: Auditoría.
- **RB39**: No hay reasignación, se cancelan y se notifica con link al listado.

## Eventos disparados
- `NUTRICIONISTA_DESACTIVADO` → email al admin (confirmación).
- `TURNO_CANCELADO` por cada turno → email al socio afectado con link al listado de nutricionistas activos del gimnasio.
- `TURNO_CANCELADO` por cada turno → email al nutricionista (sumario de turnos cancelados).

## Auditoría
- `DEACTIVATE` con `entidad='nutricionista'`, `motivo` declarado, `despues_json` con estado nuevo.
- `CANCEL` con `entidad='turno'`, `motivo='Nutricionista desactivado'`, antes/después por cada turno.

## Criterios de aceptación
- [ ] Recepción puede desactivar un nutricionista.
- [ ] Si hay turnos futuros, se cancelan automáticamente.
- [ ] Socios reciben email con link al listado de activos.
- [ ] El nutricionista inactivo no aparece en listados públicos.
- [ ] El nutricionista inactivo no puede hacer login (o su sesión queda invalidada en próximo request).
- [ ] Reactivación vuelve a poner al nutricionista activo.
- [ ] Auditoría registra la desactivación y cada cancelación.
- [ ] Test unitario: use-case `desactivar-nutricionista.use-case.ts` cubre happy path, sin turnos futuros, con muchos turnos.

## Endpoints API

### `POST /api/nutricionistas/:id/desactivar`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, turnosCancelados: number, sociosNotificados: number }`
- **Errors**: 400 (motivo faltante), 403, 404, 409 (ya inactivo), 500

### `POST /api/nutricionistas/:id/reactivar`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true }`
- **Errors**: 400 (motivo faltante), 403, 404, 409 (ya activo), 500

## Modelo de datos

### Entidades afectadas
- `Nutricionista` (cambio de `estado`).
- `NutricionistaGimnasio` (cambio de `estado` en TODAS las asociaciones).
- `Turno` (cambio de `estado` a `CANCELADO`, `motivo`, `cancelado_at`).
- `LogNotificacion` (registro de emails enviados).
- `Auditoria` (registros).

## UI / UX

### Pantalla: Detalle del nutricionista
- Si ACTIVO: botón "Desactivar" (rojo/atención).
- Si INACTIVO: botón "Reactivar" (verde).

### Modal: Confirmación de desactivación
- Muestra: "Vas a desactivar a [nombre]. [N] turnos futuros serán cancelados."
- Lista de turnos afectados (resumida, con scroll si son muchos).
- Campo motivo obligatorio.
- Botones: "Cancelar" / "Desactivar" (rojo).
- Post-confirmación: mensaje con cantidad de turnos cancelados y socios notificados.

## Notas
- El nutricionista puede seguir accediendo a su cuenta tras desactivar (para ver historial), pero no recibe turnos nuevos. Decisión de UX.
- Si el nutricionista desactivado intenta login → falla con "Tu cuenta está desactivada, contactá al administrador".
- La desactivación es **GLOBAL**. Para desasociar de un gimnasio específico, ver `multi-tenant.md`.
- La reactivación reactiva **todas** las asociaciones. El admin puede ajustar después individualmente.
- **B7**: la sesión actual del nutricionista logueado NO se invalida inmediatamente. Al próximo request, el backend detecta `estado='INACTIVO'` y fuerza logout (responde 401 con mensaje claro).
