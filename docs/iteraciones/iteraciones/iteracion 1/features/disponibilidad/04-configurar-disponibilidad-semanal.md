# 04 — Configurar disponibilidad semanal

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-04
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `01-registrar-nutricionista.md`, `multi-tenant.md`

## Descripción
Permite al nutricionista (o admin/recepción) configurar los días de la semana y rangos horarios en que el nutricionista atiende en un gimnasio específico. Cada nutricionista tiene una duración única de turno que aplica a todos sus rangos. Múltiples rangos por día permitidos (ej. lunes 8-12 y 15-19). No se permiten solapamientos (RB04).

## Actores
- NUTRICIONISTA (la propia, en su gimnasio)
- ADMIN (cualquier nutricionista de su gimnasio)
- RECEPCIONISTA (cualquier nutricionista de su gimnasio)

## Precondiciones
- El nutricionista existe.
- El nutricionista está ACTIVO en al menos un `NutricionistaGimnasio`.
- Para configurar, el actor debe tener acceso a ese `NutricionistaGimnasio`.

## Postcondiciones
- Disponibilidad guardada para el `NutricionistaGimnasio` específico.
- Slots disponibles recalculados (ver §Cálculo de slots).
- Auditoría con antes/después.

## Camino principal
1. Actor accede a "Mi agenda" → "Configurar disponibilidad" (o "Agenda" del nutricionista si es admin/recep).
2. Selecciona el gimnasio (si el nutricionista está en varios).
3. Define la **duración única de sus turnos** en minutos (default: el valor actual, si existe).
4. Por cada día de la semana (L-D), agrega uno o más rangos:
   - Hora de inicio (HH:MM)
   - Hora de fin (HH:MM)
5. Guarda.
6. Sistema valida (en orden):
   - Duración > 0.
   - Para cada rango: hora fin > hora inicio.
   - Para cada día: no solapamiento entre rangos del mismo día (RB04).
   - Advertencia si el rango no genera ningún slot completo con la duración configurada.
7. Elimina los rangos anteriores del `NutricionistaGimnasio` y crea los nuevos (transaccional).
8. Recalcula slots disponibles para los próximos 60 días.
9. Auditoría `accion=UPDATE, entidad=disponibilidad_semanal, antes_json, despues_json`.
10. Mensaje: "Disponibilidad configurada. N slots disponibles para los próximos 60 días."

## Caminos alternativos
- **A1**: Hora fin ≤ hora inicio → "La hora de fin debe ser mayor a la hora de inicio".
- **A2**: Solapamiento entre rangos del mismo día (RB04) → "Los rangos del día [X] se superponen. Corregí los horarios.".
- **A3**: Duración no genera slot completo en algún rango → warning: "Con esta duración y los rangos definidos, el rango del día [X] no genera slots completos. Ajustá la duración o los rangos.".
- **A4**: Intento de borrar un rango con turnos futuros reservados → warning: "Este rango tiene N turnos reservados. Si lo eliminás, esos turnos quedarán fuera de la agenda configurada. ¿Continuar?" (RB03). Si confirma, los turnos NO se cancelan automáticamente, pero el sistema alerta que quedarán "huérfanos" (la disponibilidad nueva no los contempla).

## Casos borde
- **B1**: Rango que no es múltiplo exacto de la duración (ej. 8:00-12:10 con 30min) → se tranca al último slot completo, el remanente se ignora silenciosamente.
- **B2**: Cambio de duración con turnos futuros reservados → advertencia: "Hay N turnos futuros con la duración actual. Los nuevos slots se calcularán con la nueva duración. Los turnos existentes NO se modifican. ¿Continuar?" (RB03). Si confirma, se actualiza la duración, los turnos existentes mantienen su slot.
- **B3**: Horarios que cruzan medianoche → no soportado en iter 1. Rango debe estar dentro del mismo día.
- **B4**: Diferentes zonas horarias del servidor vs gimnasio → usar siempre la zona horaria del gimnasio (ConfiguracionGimnasio).
- **B5**: Cambio de gimnasio del nutricionista → la disponibilidad es por `NutricionistaGimnasio`, así que cada gimnasio tiene su propia configuración.
- **B6**: Eliminar todos los rangos de un día → permitido (el día no tendrá slots).
- **B7**: Eliminar toda la disponibilidad → el nutricionista no recibe turnos nuevos, pero los existentes se mantienen.

## Reglas de negocio aplicadas
- **RB03**: Duración única por nutricionista.
- **RB04**: No solapamiento de rangos.
- **RB05**: Turnos solo dentro de agenda.
- **RB07**: Límite 60 días (afecta cálculo de slots).
- **RB25**: Nutricionista en N gimnasios → disponibilidad por gimnasio.
- **RB33**: Auditoría.
- **RB57**: No hay gap entre turnos.

## Eventos disparados
- Ninguno (es configuración interna, no se notifica al socio).

## Auditoría
- `accion='UPDATE'`
- `entidad='disponibilidad_semanal'`
- `entidad_id`: id del `NutricionistaGimnasio`
- `antes_json` y `despues_json` con los rangos antes/después

## Criterios de aceptación
- [ ] Nutricionista puede configurar sus rangos.
- [ ] Validación de no solapamiento (RB04).
- [ ] Validación de duración > 0.
- [ ] Advertencia al cambiar duración con turnos futuros.
- [ ] Slots se recalculan correctamente para 60 días.
- [ ] Disponibilidad independiente por gimnasio (RB25).
- [ ] Auditoría con antes/después.
- [ ] Test unitario: use-case `configurar-disponibilidad.use-case.ts` cubre happy path, solapamiento, advertencia de duración.

## Cálculo de slots (lógica de negocio)

Para cada día de la semana y para los próximos 60 días a partir de hoy:

```
slots = []
para cada (fecha) en próximos 60 días:
  para cada (rango) del día de la semana correspondiente:
    si fecha está bloqueada por excepción → no generar slots para este rango
    sino:
      slot_inicio = max(rango.inicio, ahora + 2h)  // RB06
      slot_fin = rango.fin
      mientras slot_inicio + duración <= slot_fin:
        slots.push({ nutricionista_gimnasio_id, fecha_hora: slot_inicio, duracion_min })
        slot_inicio += duración
```

Los slots NO se persisten en DB. Se calculan on-demand en cada request de disponibilidad. Esto evita problemas de sincronización.

## Endpoints API

### `GET /api/nutricionistas/:id/disponibilidad`
- **Auth**: NUTRICIONISTA (la propia), ADMIN, RECEPCIONISTA
- **Query**: `?gimnasioId=...&fechaDesde=...&fechaHasta=...` (opcional, default próximos 60 días)
- **Response 200**: `{ duracionTurnoMin, rangos: [{ diaSemana, horaInicio, horaFin }], slots: [{ fechaHora, duracionMin }] }`

### `PUT /api/nutricionistas/:id/disponibilidad`
- **Auth**: NUTRICIONISTA (la propia), ADMIN, RECEPCIONISTA
- **Body**: `{ gimnasioId, duracionTurnoMin, rangos: [{ diaSemana, horaInicio, horaFin }] }`
- **Response 200**: `{ ok: true, slotsCalculados: number }`
- **Errors**: 400 (validación), 403, 404, 500

## Modelo de datos

### Entidades afectadas
- `Nutricionista` (campo `duracion_turno_min`)
- `DisponibilidadSemanal` (nueva o actualizada): `id, nutricionista_gimnasio_id, dia_semana, hora_inicio, hora_fin`

### Constraints
- Por cada `(nutricionista_gimnasio_id, dia_semana)`, no solapamiento de rangos (validación en use-case + constraint CHECK opcional).

## UI / UX

### Pantalla: Configurar disponibilidad
- Formulario con 7 secciones (una por día de la semana, colapsables).
- Cada día: lista de rangos (inicio/fin) con botón "+ Agregar rango" y "X" para eliminar.
- Campo global "Duración de turno" arriba.
- Validación visual de solapamiento (rangos en rojo si se superponen).
- Botón "Guardar" con confirmación si hay turnos futuros.

## Tests

### Unitarios
- `configurar-disponibilidad.use-case.ts`:
  - Happy path: 1 rango por día
  - Múltiples rangos por día sin solapamiento
  - A2: solapamiento detectado
  - A3: duración no genera slot completo
  - B1: rango no múltiplo se trunca
  - B2: cambio de duración con turnos futuros
  - Cálculo de slots para 60 días

## Notas
- El cálculo de slots es on-demand, no se persisten. Esto simplifica mucho: no hay que mantener una tabla de slots sincronizada.
- Si el gimnasio cambia de zona horaria, los slots existentes se invalidan y se recalculan automáticamente.
- El nutricionista con 0 rangos configurados no recibe turnos nuevos (no hay slots disponibles).
