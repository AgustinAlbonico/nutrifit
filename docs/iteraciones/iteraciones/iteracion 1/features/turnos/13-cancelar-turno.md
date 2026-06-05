# 13 — Cancelar turno

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-13
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `11-reservar-turno.md`, `notificaciones.md`

## Descripción
Permite cancelar un turno existente. El motivo es obligatorio (RB09). Las reglas de anticipación dependen del actor: socio debe cancelar con ≥24h (RB08); recepción/admin/nutricionista pueden cancelar sin restricción horaria (RB12). Motivos solo texto libre (decisión de Q&A).

## Actores
- SOCIO (con RB08: ≥24h)
- RECEPCIONISTA, ADMIN, NUTRICIONISTA (sin restricción, con motivo, RB12)

## Precondiciones
- Turno existe.
- Turno en estado ∈ {CONFIRMADO, PRESENTE}.
- Si el actor es SOCIO: ≥24h de anticipación (RB08).
- Si el actor es RECEPCIONISTA/ADMIN/NUTRICIONISTA: sin restricción horaria, pero con motivo (RB12).

## Postcondiciones
- Turno en estado CANCELADO.
- `cancelado_at=now()`, `motivo` registrado.
- Slot liberado.
- Notificación al actor opuesto.
- Auditoría.

## Camino principal
1. Actor accede al detalle del turno.
2. Selecciona "Cancelar".
3. Ingresa motivo (texto libre, obligatorio, RB09).
4. Confirma.
5. Sistema valida:
   - Estado actual ∈ {CONFIRMADO, PRESENTE}.
   - Si actor=SOCIO: `fecha_hora - now() >= 24h` (RB08).
   - Si actor=RECEPCION/ADMIN/NUTRICIONISTA: pasa validación.
6. En transacción:
   - `estado='CANCELADO'`, `cancelado_at=now()`, `motivo=...`.
   - Libera el slot (no requiere acción, el slot se considera libre al excluir CANCELADO en el cálculo).
7. Encola notificación al actor opuesto (email).
8. Auditoría `accion=CANCEL, entidad=turno, motivo`.
9. Mensaje: "Turno cancelado."

## Caminos alternativos
- **A1**: Socio intenta cancelar <24h (RB08) → "No se puede cancelar con menos de 24 horas de anticipación". Botón deshabilitado en la UI.
- **A2**: Turno ya CANCELADO/REALIZADO/AUSENTE → "El turno no se puede cancelar en su estado actual".
- **A3**: Motivo vacío (frontend o backend) → "El motivo de cancelación es obligatorio".
- **A4**: Recepción cancela por motivo administrativo → permitido sin restricción.
- **A5**: Nutricionista cancela por no poder atender → permitido, pero debe ser antes de `presente_at` para que no cuente como no-show.

## Casos borde
- **B1**: Cancelación simultánea desde socio y recepción → constraint de estado lo evita: el segundo recibe 409 "El turno ya fue cancelado".
- **B2**: Fallo de notificación (SMTP) → la cancelación se aplica igual (RB35); log en `log_notificacion` con reintento.
- **B3**: Turno reprogramado (origen) → cancelar el reprogramado libera el slot nuevo; el original sigue en historial.
- **B4**: Cancelación de turno que ya está PRESENTE → permitido solo para RECEPCION/ADMIN/NUTRICIONISTA. El socio no puede cancelar un turno que ya pasó el check-in.
- **B5**: Cancelación masiva (recepción cancela varios turnos del mismo nutricionista por ausencia del profesional) → esta feature es para uno a uno. Para cancelación masiva, ver feature aparte.
- **B6**: Cancelación durante un job concurrente (scheduler de ausente) → lock transaccional evita inconsistencia.
- **B7**: El socio que cancela no es el dueño del turno → 403.

## Reglas de negocio aplicadas
- **RB08**: Socio ≥24h.
- **RB09**: Motivo obligatorio.
- **RB12**: Recepción/Admin/Nutricionista sin restricción, con motivo.
- **RB33**: Auditoría.
- **RB35**: Fallo de notificación no aborta.

## Eventos disparados
- `TURNO_CANCELADO` → email al actor opuesto.
  - Si el actor es SOCIO: email al nutricionista.
  - Si el actor es RECEPCION/ADMIN/NUTRICIONISTA: email al socio.

## Auditoría
- `accion='CANCEL'`, `entidad='turno'`, `motivo` declarado, `antes_json` y `despues_json`.

## Criterios de aceptación
- [ ] Socio puede cancelar con ≥24h y motivo.
- [ ] Socio NO puede cancelar con <24h (botón deshabilitado o error).
- [ ] Recepción/Admin/Nutricionista pueden cancelar sin restricción.
- [ ] Motivo es obligatorio.
- [ ] Slot se libera.
- [ ] Notificación al actor opuesto.
- [ ] Cancelación simultánea: el segundo recibe 409.
- [ ] Auditoría con motivo.
- [ ] Test unitario: use-case `cancelar-turno.use-case.ts` cubre happy path, A1, A2, RB08, RB09, RB12.

## Endpoints API

### `POST /api/turnos/:id/cancelar`
- **Auth**: SOCIO (dueño), RECEPCIONISTA, ADMIN, NUTRICIONISTA (del nutricionista del turno)
- **Body**: `{ motivo: string }`
- **Response 200**: `{ ok: true, estado: 'CANCELADO' }`
- **Errors**: 400 (motivo faltante, <24h si socio), 403, 404, 409 (ya cancelado)

## Modelo de datos

### Entidad `Turno`
- `estado='CANCELADO'`, `cancelado_at=now()`, `motivo=...`

## UI / UX

### Pantalla: Detalle del turno
- Botón "Cancelar" visible para todos los actores autorizados.
- Si el actor es SOCIO y <24h: botón deshabilitado con tooltip "No se puede cancelar con menos de 24h".
- Modal de confirmación: campo motivo (textarea), botones "Cancelar" / "Confirmar cancelación".

## Tests

### Unitarios
- `cancelar-turno.use-case.ts`:
  - Happy path socio con 25h
  - A1: socio con 23h → rechazado
  - Recepción con 1h → permitido
  - A2: ya cancelado → 409
  - B1: doble cancelación → 409 al segundo
  - B7: socio distinto al dueño → 403

## Notas
- El campo `motivo` es texto libre. No hay catálogo predefinido (decisión de Q&A).
- La cancelación no genera reembolso ni proceso de pago (no hay pagos en iter 1).
- Si el turno ya está PRESENTE (check-in hecho), solo RECEPCION/ADMIN/NUTRICIONISTA pueden cancelar. El socio no.
