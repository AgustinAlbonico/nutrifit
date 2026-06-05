# 14 — Reprogramar turno

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-14
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `11-reservar-turno.md`, `13-cancelar-turno.md`, `notificaciones.md`

## Descripción
Permite cambiar la fecha/hora de un turno existente, **conservando el mismo ID de turno** (RB10). El motivo es obligatorio. Límite de 3 reprogramaciones por turno (RB41). Solo se permite reprogramar a una fecha futura (decisión de Q&A). No se permite cambiar de nutricionista ni tipo de consulta.

## Actores
- SOCIO (con RB08: ≥24h)
- RECEPCIONISTA, ADMIN, NUTRICIONISTA (sin restricción, con motivo, RB12)

## Precondiciones
- Turno existe.
- Turno en estado ∈ {CONFIRMADO, PRESENTE}.
- `reprogramaciones_count < 3` (RB41).
- Si el actor es SOCIO: ≥24h de anticipación desde la fecha original (RB08).

## Postcondiciones
- Mismo turno con nueva fecha/hora.
- `reprogramaciones_count++`.
- `motivo` registrado.
- Slot anterior liberado, nuevo slot ocupado.
- Notificación al actor opuesto.
- Auditoría con antes/después.

## Camino principal
1. Actor accede al detalle del turno.
2. Selecciona "Reprogramar".
3. Ve la disponibilidad del **mismo nutricionista** (no se puede cambiar de nutricionista).
4. Selecciona nuevo slot.
5. Ingresa motivo (obligatorio, RB09).
6. Confirma.
7. Sistema valida en transacción (con `SELECT FOR UPDATE` sobre el turno):
   1. Estado actual ∈ {CONFIRMADO, PRESENTE}.
   2. `reprogramaciones_count < 3` (RB41).
   3. Si actor=SOCIO: `fecha_hora_original - now() >= 24h` (RB08).
   4. Nuevo slot en agenda (RB05) y NO bloqueado por excepción.
   5. Nuevo slot con ≥2h de anticipación desde `now()` (RB06).
   6. Nuevo slot con ≤60 días desde `now()` (RB07).
   7. **Nuevo slot es futuro** (no se permite reprogramar a pasado, decisión de Q&A).
   8. No existe otro turno del socio en el nuevo slot (RB28).
   9. No existe otro turno del nutricionista en el nuevo slot (RB27).
   10. Si hay otro turno del socio con el mismo nutricionista en el mismo día del nuevo slot (RB40), rechazar.
8. Actualiza:
   - `fecha_hora=nueva_fecha_hora`, `reprogramaciones_count++`, `motivo=...`.
   - Si `reprogramado_de_id` no estaba seteado, lo setea con el ID original (trazabilidad, RB10).
9. Encola notificación.
10. Auditoría con antes/después completo.
11. Mensaje: "Turno reprogramado para el [nueva fecha] a las [nueva hora]."

## Caminos alternativos
- **A1**: `reprogramaciones_count >= 3` (RB41) → "Este turno ya fue reprogramado 3 veces. Cancelá y reservá uno nuevo." Botón deshabilitado en UI.
- **A2**: Socio <24h (RB08) → "No se puede reprogramar con menos de 24 horas de anticipación".
- **A3**: Nuevo slot bloqueado por excepción → "Ese horario está bloqueado".
- **A4**: Nutricionista desactivado entre medio (RB17) → "El nutricionista ya no está disponible. Cancelá y reservá con otro profesional".
- **A5**: <2h de anticipación en nuevo slot (RB06) → "La reprogramación requiere al menos 2 horas de anticipación".
- **A6**: >60 días en nuevo slot (RB07) → "No se puede reprogramar a más de 60 días".
- **A7**: Reprogramar a pasado → "La reprogramación solo puede ser a una fecha futura".
- **A8**: RB40 (ya tiene turno con mismo nutricionista en el día del nuevo slot) → "Ya tenés un turno ese día con este nutricionista".
- **A9**: Cambio de nutricionista solicitado → "No se puede cambiar de nutricionista en una reprogramación. Cancelá y reservá con otro.".

## Casos borde
- **B1**: Reprogramación múltiple (el socio reprog. 2 veces seguidas) → contador se incrementa, sigue permitido hasta 3.
- **B2**: Dos actores reprograman al mismo slot al mismo tiempo → RB27/RB28 lo rechazan al segundo con 409.
- **B3**: El slot original queda libre y otro socio lo toma inmediatamente → permitido.
- **B4**: Reprogramar un turno AUSENTE o CANCELADO → no permitido, son terminales.
- **B5**: Reprogramar un turno ya en PRESENTE → solo RECEPCION/ADMIN/NUTRICIONISTA pueden (no el socio, ya pasó el check-in).
- **B6**: Reprogramar manteniendo el mismo slot (sin cambios) → warning "No detectaste cambios. ¿Querés reprogramar igual?".
- **B7**: Reprogramación cross-gimnasio → si el nutricionista está en 2 gimnasios, la reprogramación mantiene el gimnasio original.

## Reglas de negocio aplicadas
- **RB05, RB06, RB07, RB08, RB09, RB10, RB12, RB27, RB28, RB33, RB40, RB41, RB58, RB59, RB60**.
- Adicional (decisión de Q&A): **no se permite reprogramar a pasado**.

## Eventos disparados
- `TURNO_REPROGRAMADO` → email al actor opuesto.

## Auditoría
- `accion='UPDATE'`, `entidad='turno'`, `motivo` declarado, `antes_json` y `despues_json` (con `reprogramaciones_count` y `fecha_hora`).

## Criterios de aceptación
- [ ] Socio puede reprogramar con ≥24h, motivo y contador <3.
- [ ] Límite de 3 reprogramaciones se aplica.
- [ ] Solo se permite reprogramar a futuro.
- [ ] No se permite cambiar de nutricionista.
- [ ] Validación de slot disponible, anticipación, 60 días.
- [ ] Notificación al actor opuesto.
- [ ] Reprogramación simultánea: el segundo recibe 409.
- [ ] Auditoría con antes/después.
- [ ] Test unitario: use-case `reprogramar-turno.use-case.ts` cubre happy path, A1, A2, A7, RB10, RB41.

## Endpoints API

### `POST /api/turnos/:id/reprogramar`
- **Auth**: SOCIO (dueño), RECEPCIONISTA, ADMIN, NUTRICIONISTA (del nutricionista del turno)
- **Body**: `{ nuevaFechaHora, motivo: string }`
- **Response 200**: `{ ok: true, turno }` con el turno actualizado.
- **Errors**: 400 (motivo faltante, validaciones), 403, 404, 409 (slot ocupado, reprogramaciones excedidas, ya cancelado)

## Modelo de datos

### Entidad `Turno`
- `fecha_hora=nueva`, `reprogramaciones_count+=1`, `motivo=...`, `reprogramado_de_id=id_original_si_no_existia`

## UI / UX

### Pantalla: Detalle del turno → Reprogramar
- Calendario de disponibilidad del mismo nutricionista.
- Indicador: "Reprogramaciones usadas: [N] de 3".
- Si N=3: opción deshabilitada, mensaje "Cancelá y reservá un nuevo turno".
- Modal de confirmación: motivo obligatorio.

## Tests

### Unitarios
- `reprogramar-turno.use-case.ts`:
  - Happy path socio a 25h
  - A1: 3 reprogramaciones ya → rechazado
  - A2: socio a 23h → rechazado
  - A5: nuevo slot a 1h → rechazado
  - A6: nuevo slot a 61 días → rechazado
  - A7: nuevo slot en pasado → rechazado
  - A8: RB40 en nuevo día
  - B1: contador se incrementa
  - B2: doble reprogramación al mismo slot → 409 al segundo

## Notas
- La reprogramación NO cambia el nutricionista ni el tipo de consulta. Solo fecha/hora.
- El campo `reprogramado_de_id` permite trazabilidad del turno original, pero el turno actual tiene un ID único.
- Si el nutricionista se desactiva, las reprogramaciones pendientes a sus turnos fallan; el socio debe cancelar y reservar con otro.
