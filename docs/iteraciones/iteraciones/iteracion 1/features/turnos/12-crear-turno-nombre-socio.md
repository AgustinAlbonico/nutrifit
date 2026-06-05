# 12 — Crear turno en nombre del socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-12
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `11-reservar-turno.md`

## Descripción
Variante de CU-11 ejecutada por recepción o admin. Permite crear un turno en nombre del socio, sin necesidad de que el socio esté logueado. La diferencia con CU-11 es que NO requiere ficha completa (warning, no bloqueo) y se marca con `creado_por='RECEPCION'`.

## Actores
- RECEPCIONISTA
- ADMIN

## Precondiciones
- Actor autenticado.
- Socio ACTIVO.
- Nutricionista ACTIVO en el gimnasio del actor.
- Slot dentro de la agenda del nutricionista.
- Slot con ≥2h de anticipación (RB06).
- Slot con ≤60 días (RB07).
- RB40: no tiene otro turno con mismo nutricionista en mismo día.

## Postcondiciones
- Turno creado en estado CONFIRMADO (RB58).
- `creado_por='RECEPCION'`.
- Email informativo al socio (sin token de confirmación, ya está CONFIRMADO).
- Email al nutricionista.
- Recordatorios 24h+1h agendados (RB60, **solo para el socio** — el nutricionista no recibe recordatorios, ver `notificaciones.md`).
- Auditoría.

## Camino principal
1. Recepción busca al socio.
2. Selecciona nutricionista (del gimnasio del actor).
3. Ve la disponibilidad del nutricionista (slots disponibles).
4. Selecciona fecha y hora.
5. Confirma.
6. Sistema valida (mismas validaciones que CU-11, EXCEPTO ficha completa):
   1. Socio ACTIVO.
   2. Nutricionista ACTIVO.
   3. Slot en agenda (RB05).
   4. ≥2h anticipación (RB06).
   5. ≤60 días (RB07).
   6. Sin otro turno del socio en el slot (RB28).
   7. Sin otro turno del nutricionista en el slot (RB27).
   8. No tiene otro turno con mismo nutricionista en mismo día (RB40).
7. Si el socio NO tiene ficha completa:
   - Muestra warning: "El socio no tiene ficha completa. Se permite crear el turno igualmente, pero el nutricionista verá esta alerta al abrir el turno. ¿Continuar?"
   - El actor puede cancelar o continuar.
8. Crea el turno:
   - `estado='CONFIRMADO'`, `creado_por='RECEPCION'`, `confirmado_at=now()`.
9. Encola notificaciones (email informativo al socio, email al nutricionista, recordatorios).
10. Auditoría.
11. Mensaje: "Turno creado para [socio] el [fecha] a las [hora]."

## Caminos alternativos
- **A1**: Socio sin ficha completa → warning (no bloquea). El turno se crea igual.
- **A2**: Socio INACTIVO → bloqueado: "El socio está inactivo, no se puede crear turno".
- **A3**: Nutricionista sin disponibilidad → "No hay horarios disponibles".
- **A4**: Slot bloqueado por excepción → no se permite.
- **A5**: RB40 (ya tiene turno ese día) → "El socio ya tiene un turno ese día con este nutricionista".

## Casos borde
- **B1**: Recepción intenta reservar fuera de política (RB06, RB07) → falla con mensaje claro.
- **B2**: Recepción crea turno para socio recién creado sin ficha → warning, permitido.
- **B3**: Socio ya tiene turno ese día con mismo nutricionista (RB40) → bloqueado.
- **B4**: Recepción crea turno en un gimnasio distinto al suyo (cross-gimnasio) → bloqueado, 403.
- **B5**: Recepción edita un turno creado por ella misma (cancelar, reprogramar) → permitido, mismo flujo que cualquier actor.
- **B6**: Crear turno para un nutricionista que NO pertenece al gimnasio del actor → bloqueado, 403.

## Reglas de negocio aplicadas
- **RB05, RB06, RB07, RB17, RB27, RB28, RB40, RB58, RB59, RB60**: mismas que CU-11.
- **RB14**: NO se exige (recepción puede crear sin ficha).
- **RB33**: Auditoría con `creado_por='RECEPCION'`.

## Eventos disparados
- `TURNO_CREADO_POR_RECEPCION` (evento específico) o `TURNO_CONFIRMADO` → email al socio y nutricionista.
- Recordatorios 24h+1h solo al socio.

## Auditoría
- `accion='CREATE'`, `entidad='turno'`, `creado_por='RECEPCION'`, `despues_json` con el turno.

## Criterios de aceptación
- [ ] Recepción puede crear turno en nombre del socio.
- [ ] Advertencia visible si socio no tiene ficha completa.
- [ ] Turno se crea CONFIRMADO con `creado_por='RECEPCION'`.
- [ ] Validación de slot disponible, anticipación, límite 60 días.
- [ ] Email al socio (informativo, no requiere acción).
- [ ] Email al nutricionista.
- [ ] Recordatorios 24h+1h solo para el socio.
- [ ] Auditoría con `creado_por`.
- [ ] Test unitario: use-case `crear-turno-recepcion.use-case.ts` cubre happy path, A1, A2, RB40.

## Endpoints API

### `POST /api/turnos/por-recepcion`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**: `{ socioId, nutricionistaId, gimnasioId, fechaHora, tipoConsulta? }`
- **Response 201**: `{ id, estado: 'CONFIRMADO', ... }`
- **Errors**: 400, 403, 404, 409 (slot ocupado)

## Modelo de datos

Idéntico a CU-11, con `creado_por='RECEPCION'` en lugar de `'SOCIO'`.

## UI / UX

### Pantalla: Crear turno (recepción)
- Búsqueda de socio.
- Selector de nutricionista (del gimnasio del actor).
- Calendario de disponibilidad.
- Si socio no tiene ficha: warning amarillo arriba.

## Tests

### Unitarios
- `crear-turno-recepcion.use-case.ts`:
  - Happy path con ficha completa
  - A1: sin ficha completa + warning + continuar
  - A2: socio inactivo
  - A4: slot bloqueado
  - A5: RB40
  - B4: gimnasio distinto al del actor

## Notas
- Esta feature existe porque la operativa real en gimnasios tiene a recepción creando turnos por teléfono, walk-in, etc.
- El nutricionista, al abrir un turno con `creado_por='RECEPCION'`, ve una insignia "Creado por recepción" para contexto.
- Si el socio no tenía ficha, el nutricionista ve "Socio sin ficha completa" como warning adicional.
