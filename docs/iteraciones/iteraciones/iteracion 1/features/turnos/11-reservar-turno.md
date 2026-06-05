# 11 — Reservar turno

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-11
> **Estado**: Por implementar
> **Prioridad**: Crítica
> **Dependencias**: `04-configurar-disponibilidad-semanal.md`, `05-cargar-excepcion-disponibilidad.md`, `08-completar-ficha-salud.md`, `notificaciones.md`

## Descripción
Permite al socio reservar un turno con un nutricionista. El turno se crea **directamente en estado CONFIRMADO** (RB58, sin token de confirmación público). Es el flujo principal del sistema. Implementa múltiples validaciones de negocio (RB05, RB06, RB07, RB14, RB17, RB27, RB28, RB40).

## Actores
- SOCIO

## Precondiciones
- Socio autenticado.
- Ficha de salud completa (RB14).
- Socio ACTIVO.
- Nutricionista ACTIVO en al menos un `NutricionistaGimnasio` del gimnasio del socio (RB17).
- Slot dentro de la agenda del nutricionista (disponibilidad semanal + excepciones) (RB05).
- Slot con ≥2h de anticipación (RB06).
- Slot con ≤60 días hacia adelante (RB07).
- Socio NO tiene otro turno el mismo día con el mismo nutricionista (RB40, salvo reprogramación).

## Postcondiciones
- Turno creado en estado CONFIRMADO (RB58).
- `confirmado_at=now()`.
- Email al socio con detalles del turno y recordatorios agendados.
- Email al nutricionista con el turno nuevo.
- Recordatorios automáticos 24h y 1h antes agendados (RB60).
- Auditoría.

## Camino principal
1. Socio accede a "Nutricionistas" o "Reservar turno".
2. Selecciona un nutricionista (ver `10-ver-nutricionistas-disponibles.md`).
3. Ve la agenda del nutricionista para los próximos 60 días (slots disponibles).
4. Selecciona fecha y hora específica.
5. Confirma.
6. Sistema valida EN TRANSACCIÓN (en orden, con `SELECT FOR UPDATE` sobre el slot):
   1. Ficha completa del socio (RB14).
   2. Socio ACTIVO.
   3. Nutricionista ACTIVO en el gimnasio del socio (RB17).
   4. Slot dentro de la disponibilidad semanal (RB05) y NO bloqueado por excepción.
   5. Slot con ≥2h de anticipación desde `now()` (RB06).
   6. Slot con ≤60 días desde `now()` (RB07).
   7. No existe otro turno del socio en el mismo slot (RB28).
   8. No existe otro turno del nutricionista en el mismo slot (RB27).
   9. No tiene otro turno con el mismo nutricionista en el mismo día (RB40).
7. Crea el turno:
   - `estado='CONFIRMADO'` (RB58, NO se crea en PROGRAMADO)
   - `confirmado_at=now()`
   - `creado_por='SOCIO'`
8. Encola notificaciones:
   - Email al socio con detalles.
   - Email al nutricionista.
   - Recordatorios 24h+1h antes (RB60).
9. Registra auditoría `accion=CREATE, entidad=turno`.
10. Mensaje: "Turno reservado para el [fecha] a las [hora]. Recibirás un recordatorio 24h antes."

## Caminos alternativos
- **A1**: Ficha incompleta → redirige a `08-completar-ficha-salud.md`.
- **A2**: Slot ya reservado (race condition) → "Ese horario ya no está disponible".
- **A3**: <2h de anticipación (RB06) → "La reserva requiere al menos 2 horas de anticipación".
- **A4**: >60 días (RB07) → "No se puede reservar con más de 60 días de anticipación".
- **A5**: Nutricionista INACTIVO (RB17) → "Este nutricionista no está disponible".
- **A6**: Fecha bloqueada por excepción → "Ese horario está bloqueado".
- **A7**: Ya tiene turno ese día con mismo nutricionista (RB40) → "Ya tenés un turno ese día con este nutricionista".

## Casos borde
- **B1**: Doble click en "Reservar" → idempotente: el segundo POST devuelve el turno recién creado (mismo ID). Ver §Concurrencia.
- **B2**: Dos socios reservan el mismo slot al mismo tiempo → RB27 (`UNIQUE` constraint) rechaza al segundo con 409.
- **B3**: Reserva de un slot con duración distinta a la del nutricionista → el slot se calcula con la duración del nutricionista, no se puede elegir duración al reservar.
- **B4**: El nutricionista pertenece a varios gimnasios → la reserva es en el gimnasio del socio, no se puede reservar en otro.
- **B5**: Reserva con exactamente 2h de anticipación → permitido (RB06 dice "al menos 2h").
- **B6**: Reserva de un turno de tipo "primera consulta" vs "control" → la UI puede tener tipos predefinidos, pero en backend se trata igual (campo `tipo_consulta` libre).
- **B7**: Reserva en el último día del límite de 60 días → permitido.
- **B8**: Reserva en zona horaria distinta a la del gimnasio → la conversión se hace en backend usando la zona del gimnasio.

## Reglas de negocio aplicadas
- **RB05**: Slot en agenda.
- **RB06**: ≥2h anticipación.
- **RB07**: ≤60 días.
- **RB14**: Ficha completa obligatoria.
- **RB17**: Nutricionista activo.
- **RB27**: Slot único por nutricionista.
- **RB28**: Slot único por socio.
- **RB33**: Auditoría.
- **RB40**: 1 turno por día con mismo nutricionista.
- **RB58**: Turno se crea CONFIRMADO directo.
- **RB59**: Solo email.
- **RB60**: Recordatorios 24h+1h.

## Concurrencia

Estrategia:
1. `BEGIN TRANSACTION`
2. `SELECT ... FOR UPDATE` sobre `disponibilidad_semanal` del día correspondiente (lock pesimista).
3. Validar slot disponible.
4. `INSERT INTO turno (...)` con `UNIQUE(nutricionista_gimnasio_id, fecha_hora) WHERE estado IN (CONFIRMADO, PRESENTE, EN_CURSO)` (constraint parcial en DB).
5. Si viola el UNIQUE → ROLLBACK y devolver 409.
6. `COMMIT`.

Alternativa: lock optimista con `version` no es tan crítico porque el constraint UNIQUE en DB es la fuente de verdad.

## Endpoints API

### `GET /api/nutricionistas/:id/slots`
- **Auth**: SOCIO autenticado
- **Query**: `?gimnasioId=...&fechaDesde=...&fechaHasta=...` (default: próximos 60 días desde hoy+2h)
- **Response 200**: `[{ fechaHora, duracionMin }]` con slots disponibles.
- **Errors**: 400, 404

### `POST /api/turnos`
- **Auth**: SOCIO
- **Body**: `{ nutricionistaId, gimnasioId, fechaHora, tipoConsulta? }`
- **Response 201**: `{ id, estado: 'CONFIRMADO', fechaHora, nutricionista, ... }`
- **Errors**:
  - 400: validación (anticipación, rango)
  - 403: nutricionista inactivo
  - 404: nutricionista no existe
  - 409: slot ocupado (race condition)
  - 412: ficha incompleta (precondición no cumplida)

## Modelo de datos

### Entidad `Turno`
- `id, socio_id, nutricionista_gimnasio_id, fecha_hora, duracion_min, tipo_consulta, estado='CONFIRMADO', motivo, creado_por, created_at, confirmado_at, cancelado_at, ausente_at, presente_at, en_curso_at, realizado_at, reprogramado_de_id, reprogramaciones_count`

### Constraints
- `UNIQUE INDEX idx_turno_slot_activo ON turno(nutricionista_gimnasio_id, fecha_hora) WHERE estado IN ('CONFIRMADO', 'PRESENTE', 'EN_CURSO')` (índice parcial)
- `UNIQUE INDEX idx_turno_socio_slot ON turno(socio_id, fecha_hora) WHERE estado IN ('CONFIRMADO', 'PRESENTE', 'EN_CURSO')`
- `CHECK(estado != 'PROGRAMADO')` (RB58: no se permite ese estado en iter 1)

## Eventos disparados
- `TURNO_CONFIRMADO` (no es transición desde PROGRAMADO; es el alta) → email al socio y nutricionista.
- Recordatorios 24h+1h antes (jobs scheduler, ver `notificaciones.md`).

## Auditoría
- `accion='CREATE'`, `entidad='turno'`, `despues_json` con el turno creado.

## Criterios de aceptación
- [ ] Socio con ficha completa puede reservar turno.
- [ ] Validación de 2h de anticipación.
- [ ] Validación de 60 días.
- [ ] Validación de nutricionista activo.
- [ ] Validación de slot disponible (anti race condition).
- [ ] Validación de no tener 2 turnos mismo día mismo nutricionista.
- [ ] Turno se crea en estado CONFIRMADO (no PROGRAMADO).
- [ ] Email se envía al socio y nutricionista.
- [ ] Recordatorios 24h+1h se agendan.
- [ ] Auditoría registrada.
- [ ] Test unitario: use-case `reservar-turno.use-case.ts` cubre happy path, A1-A7, B1-B8.
- [ ] Test de concurrencia: dos requests simultáneos al mismo slot → uno gana, otro recibe 409.

## Notas
- El `tipo_consulta` es un campo libre (texto). En iter 1 no hay catálogo predefinido.
- La duración del turno se toma de la configuración del nutricionista, no del request.
- La creación del turno es **transaccional** con todas las validaciones, para evitar estados inconsistentes.
