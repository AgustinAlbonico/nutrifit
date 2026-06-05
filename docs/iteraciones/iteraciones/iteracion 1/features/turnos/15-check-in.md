# 15 — Realizar check-in

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-15
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `11-reservar-turno.md`, `16-ausente-automatico.md`, `notificaciones.md`

## Descripción
Permite a recepción o admin marcar al socio como presente cuando llega al gimnasio. Cambia el estado del turno de CONFIRMADO a PRESENTE y setea `presente_at`. Es prerrequisito para que el nutricionista pueda iniciar la consulta (estado EN_CURSO).

## Actores
- RECEPCIONISTA
- ADMIN

## Precondiciones
- Turno existe.
- Turno del día actual (en la zona horaria del gimnasio).
- Estado actual ∈ {CONFIRMADO}.
- El turno NO debe estar CANCELADO ni AUSENTE.

## Postcondiciones
- Turno en estado PRESENTE.
- `presente_at=now()`.
- Notificación al nutricionista (in-app o email).
- Auditoría.

## Camino principal
1. Recepción abre "Turnos del día" (vista por defecto del día actual).
2. Busca al socio (por nombre, DNI, email o turno).
3. Selecciona el turno y "Marcar presente".
4. Confirma.
5. Sistema valida:
   - Turno es del día actual (en TZ del gimnasio).
   - Estado ∈ {CONFIRMADO}.
6. Actualiza: `estado='PRESENTE'`, `presente_at=now()`.
7. Encola notificación al nutricionista.
8. Auditoría `accion=CHECKIN, entidad=turno`.
9. UI muestra: "Check-in realizado para [socio] a las [hora]".

## Caminos alternativos
- **A1**: Turno no es del día actual → "Solo se puede hacer check-in de turnos del día actual".
- **A2**: Estado ∈ {CANCELADO, AUSENTE, REALIZADO} → "El turno no se puede marcar presente en su estado actual".
- **A3**: Turno PRESENTE ya → "El turno ya fue marcado presente a las [presente_at]". Idempotente.

## Casos borde
- **B1**: Check-in duplicado (doble click) → idempotente, no doble auditoría.
- **B2**: Check-in manual de un turno que el job ya marcó AUSENTE → ver §Revertir ausente.
- **B3**: Recepción marca presente a socio equivocado → admin puede revertir (ver §Revertir).
- **B4**: Recepción marca presente a un turno de otro gimnasio → no aplica (recepción solo ve turnos de su gimnasio).
- **B5**: Check-in de un turno que ya está EN_CURSO o REALIZADO → no permitido.

### Revertir ausente (admin)
- Si el job de ausente (CU-16) marcó un turno como AUSENTE pero el socio llega tarde y se le quiere hacer check-in:
  - El admin debe **revertir manualmente**: cambiar el estado de AUSENTE a CONFIRMADO y luego hacer check-in normal.
  - Esto queda auditado (`accion='REVERT_ABSENT'`).
  - Decisión de Q&A.

### Revertir check-in (admin)
- Si recepción marcó presente al socio equivocado:
  - El admin puede revertir: cambiar el estado de PRESENTE a CONFIRMADO (clear `presente_at`).
  - Queda auditado.
  - Decisión de Q&A.

## Reglas de negocio aplicadas
- **RB33**: Auditoría.

## Eventos disparados
- `TURNO_CHECKIN` → email al nutricionista.

## Auditoría
- `accion='CHECKIN'`, `entidad='turno'`, `antes_json` y `despues_json`.
- Reversiones: `accion='REVERT_ABSENT'` o `accion='REVERT_CHECKIN'`.

## Criterios de aceptación
- [ ] Recepción puede marcar turno CONFIRMADO como PRESENTE solo el día del turno.
- [ ] Idempotente (doble click no causa problemas).
- [ ] Notificación al nutricionista.
- [ ] Si el turno está AUSENTE por el job, admin puede revertir.
- [ ] Si se marcó al socio equivocado, admin puede revertir.
- [ ] Auditoría registrada.
- [ ] Test unitario: use-case `checkin-turno.use-case.ts` cubre happy path, A1, A2, A3.

## Endpoints API

### `POST /api/turnos/:id/checkin`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: vacío
- **Response 200**: `{ ok: true, presenteAt }`
- **Errors**: 400 (no es del día), 404, 409 (estado no válido), 500

### `POST /api/turnos/:id/revertir-checkin`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, estado: 'CONFIRMADO' }`
- **Errors**: 400, 404, 409 (estado no permite revertir), 500

### `POST /api/turnos/:id/revertir-ausente`
- **Auth**: ADMIN
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, estado: 'CONFIRMADO' }`
- **Errors**: 400, 404, 409 (estado no permite revertir), 500

## Modelo de datos

### Entidad `Turno`
- `estado='PRESENTE'`, `presente_at=now()`

## UI / UX

### Pantalla: Turnos del día
- Lista de turnos del día, agrupados por nutricionista o por hora.
- Cada turno: socio, hora, tipo consulta, estado, botones de acción.
- Si estado=CONFIRMADO: botón "Marcar presente" prominente.
- Si estado=PRESENTE: badge verde "Presente a las [hora]".
- Si estado=AUSENTE: badge rojo con opción "Revertir ausente" para admin.

### Modal: Revertir (admin)
- Campo motivo obligatorio.
- Confirmación fuerte ("¿Estás seguro? Esto quedará auditado.").

## Tests

### Unitarios
- `checkin-turno.use-case.ts`:
  - Happy path turno CONFIRMADO del día
  - A1: turno de ayer → rechazado
  - A2: turno CANCELADO → rechazado
  - A3: ya PRESENTE → idempotente
- `revertir-checkin.use-case.ts`:
  - Solo ADMIN
  - Motivo obligatorio
- `revertir-ausente.use-case.ts`:
  - Solo ADMIN
  - Motivo obligatorio

## Notas
- El check-in no se puede hacer desde el celular del socio (self check-in), solo por recepción. Decisión de iter 1.
- El job de ausente (CU-16) corre cada 5 min y puede competir con el check-in. El lock transaccional evita inconsistencia.
- Las reversiones son operaciones sensibles y solo ADMIN puede hacerlas. Decisión de Q&A.
