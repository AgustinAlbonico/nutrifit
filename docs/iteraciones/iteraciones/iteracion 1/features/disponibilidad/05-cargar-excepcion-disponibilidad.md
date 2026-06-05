# 05 — Cargar excepción de disponibilidad

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-05
> **Estado**: Por implementar
> **Prioridad**: Media
> **Dependencias**: `04-configurar-disponibilidad-semanal.md`, `notificaciones.md`, `auditoria.md`

## Descripción
Permite al nutricionista (o admin/recepción) bloquear un día completo o un rango horario específico en una fecha particular. Las excepciones solo bloquean, no agregan horarios extra (RB19). Si la excepción afecta turnos ya reservados, requiere acción explícita (RB20): cancelar con motivo o conservar excepcionalmente.

## Actores
- NUTRICIONISTA (la propia)
- ADMIN, RECEPCIONISTA

## Precondiciones
- El nutricionista existe.
- La fecha está dentro de los próximos 60 días (consistente con RB07).

## Postcondiciones
- Excepción guardada.
- Slots afectados recalculados.
- Si la excepción afecta turnos reservados y se eligió cancelar: turnos cancelados con motivo, socios notificados.
- Auditoría.

## Camino principal
1. Actor accede a "Excepciones de agenda".
2. Selecciona fecha (date picker, max 60 días).
3. Define tipo:
   - **Día completo**: bloquea todos los slots de ese día.
   - **Rango parcial**: bloquea un rango horario específico.
4. (Opcional) Ingresa motivo.
5. Click "Guardar".
6. Sistema valida:
   - Fecha dentro de 60 días.
   - Si es rango parcial: hora fin > hora inicio.
   - No es duplicado de otra excepción en misma fecha y rango.
7. Sistema consulta si hay turnos reservados en el rango bloqueado.
8. **Si hay turnos afectados** (RB20):
   - Modal con lista de turnos.
   - Opciones: "Cancelar turnos con motivo" / "Conservar turnos excepcionalmente".
   - Acción explícita requerida.
9. Si no hay turnos: guarda directamente.
10. Auditoría `CREATE` con la excepción completa.

## Caminos alternativos
- **A1**: Fecha fuera de 60 días → "La fecha excede el límite de 60 días".
- **A2**: Rango parcial con hora fin ≤ hora inicio → "La hora de fin debe ser mayor a la hora de inicio".
- **A3**: Excepción duplicada (misma fecha y rango) → "Ya existe una excepción para esta fecha y rango".
- **A4**: Rango parcial fuera del horario de atención → permitido (puede bloquear un slot puntual).

## Casos borde
- **B1**: Bloqueo parcial que corta un turno ya generado → warning explícito: "Este bloqueo corta el turno de [socio] a las HH:MM. ¿Cancelar el turno o reducir el bloqueo?".
- **B2**: Excepción de día completo en una fecha sin disponibilidad configurada → se permite (no tiene efecto práctico, queda registrada).
- **B3**: Excepción para una fecha pasada → no permitido.
- **B4**: Excepción de día completo vs múltiples rangos parciales en la misma fecha → si ya hay una excepción de día completo, no se puede agregar otra. Si hay rangos parciales, se pueden agregar más.
- **B5**: Eliminar o editar excepción → **NO soportado en iter 1** (gestión completa queda como feature futura). Solo se crea.
- **B6**: Excepción creada con slots que ya pasaron (fecha/hora del rango anterior a `now()`) → permitido si la fecha es futura (los slots pasados no se recalculan, no se afectan turnos).
- **B7**: Race condition: dos actores crean excepción simultáneamente → el `UNIQUE` constraint rechaza al segundo.

## Reglas de negocio aplicadas
- **RB19**: Excepciones solo bloquean.
- **RB20**: Si afecta turnos reservados, requiere acción explícita.
- **RB33**: Auditoría.

## Eventos disparados
- Si se cancelan turnos: `TURNO_CANCELADO` por cada uno (email al socio y al nutricionista).
- Si se conservan turnos: no hay notificación (es un caso excepcional acordado).

## Auditoría
- `CREATE` con `entidad='excepcion_disponibilidad'`, `despues_json` con la excepción.
- Si se cancelaron turnos: `CANCEL` con `entidad='turno'`, `motivo='Excepción de disponibilidad'`, antes/después por cada turno.

## Endpoints API

### `GET /api/nutricionistas/:id/excepciones`
- **Auth**: NUTRICIONISTA, ADMIN, RECEPCIONISTA
- **Query**: `?gimnasioId=...&fechaDesde=...&fechaHasta=...` (default: próximos 60 días)
- **Response 200**: `[{ id, fecha, horaInicio, horaFin, motivo, diaCompleto, createdAt }]`
- **Errors**: 401, 500

### `POST /api/nutricionistas/:id/excepciones`
- **Auth**: NUTRICIONISTA, ADMIN, RECEPCIONISTA
- **Body**: `{ gimnasioId, fecha, horaInicio?, horaFin?, motivo? }` (si horaInicio/horaFin son null, es día completo)
- **Response 201**: `{ id, ... }` o `{ id, ..., turnosAfectados: [...], requiereAccion: true }` si hay turnos
- **Errors**: 400, 404, 409 (duplicado), 500

### `POST /api/nutricionistas/:id/excepciones/confirmar-accion`
- **Auth**: NUTRICIONISTA, ADMIN, RECEPCIONISTA
- **Body**: `{ excepcionId, accion: 'cancelar_turnos'|'conservar_turnos', motivo?: string }`
- **Response 200**: `{ ok: true, turnosCancelados?: number }`
- **Errors**: 400, 404, 500

## Modelo de datos

### Entidad `ExcepcionDisponibilidad`
- `id, nutricionista_gimnasio_id, fecha, hora_inicio (nullable), hora_fin (nullable), motivo, created_at, created_by`

### Constraints
- `CHECK((hora_inicio IS NULL AND hora_fin IS NULL) OR (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio))`
- **Solución para UNIQUE con NULLs (MySQL)**: usar `COALESCE(hora_inicio, '00:00:00')` en el UNIQUE, o usar `UNIQUE(nutricionista_gimnasio_id, fecha, dia_completo)` donde `dia_completo` es un boolean calculado. **Decisión**: usar `UNIQUE(nutricionista_gimnasio_id, fecha, COALESCE(hora_inicio, '00:00:00'), COALESCE(hora_fin, '23:59:59'))` (las 4 columnas, donde NULL se convierte a valores sentinela).

## Cálculo de slots con excepciones

```
slots_base = calcular_slots_base(disponibilidad_semanal, duracion)  // ver 04
excepciones = consultar_excepciones_en_rango(fecha)

para cada slot en slots_base:
  para cada excepcion en excepciones:
    si excepcion.dia_completo AND slot.fecha == excepcion.fecha:
      eliminar slot
    si excepcion.rango AND slot.fecha == excepcion.fecha AND 
       slot.hora_inicio >= excepcion.hora_inicio AND 
       slot.hora_fin <= excepcion.hora_fin:
      eliminar slot
```

## UI / UX

### Pantalla: Excepciones de agenda
- Calendario con fechas resaltadas en rojo si tienen excepción.
- Click en fecha → modal con detalle y opción de crear nueva.
- Botón "Nueva excepción" → form con date picker + tipo (día completo / rango) + motivo.

### Modal: Confirmación de acción (cuando hay turnos afectados)
- Lista de turnos (socio, fecha/hora, tipo consulta).
- Radio buttons: "Cancelar turnos con motivo [campo texto]" / "Conservar turnos excepcionalmente".
- Botón "Confirmar" deshabilitado hasta seleccionar opción.
- Si "Cancelar", campo motivo obligatorio.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Excepción día completo vs rangos | El día completo bloquea todo, los rangos parciales se permiten solo si NO hay día completo |
| Excepción fuera de 60 días | 400 "fuera del límite" |
| Bloqueo parcial que corta turno | Warning explícito |
| Race condition en duplicados | UNIQUE constraint |
| Eliminar/editar excepción | NO soportado en iter 1 |
| Slots pasados en rango | Permitido, no afecta |

## Tests

### Unitarios
- `crear-excepcion-disponibilidad.use-case.ts`:
  - Día completo
  - Rango parcial
  - A1: fecha fuera de 60 días
  - A3: duplicado (UNIQUE)
  - B1: bloqueo parcial que corta turno
  - B4: día completo cuando hay rangos parciales
  - B7: race condition
- `confirmar-accion-excepcion.use-case.ts`:
  - Cancelar turnos con motivo
  - Conservar turnos

## Notas
- La gestión completa de excepciones (editar, eliminar) se difiere a iter 2+. Esta feature cubre solo la creación.
- Si la excepción es "día completo" y se eligió "conservar turnos", esos turnos quedan "huérfanos" (fuera de agenda). El sistema debe alertar al nutricionista en su agenda (banner en `17-ver-agenda-dia.md`).
- **MySQL NULL handling en UNIQUE**: la solución con `COALESCE` funciona pero es hacky. Considerar trigger o lógica en use-case en iter 2+ si se quiere más limpio.
- El flag `created_by` es el `usuario_id` (puede ser RECEPCIONISTA, ADMIN, o el NUTRICIONISTA mismo).
