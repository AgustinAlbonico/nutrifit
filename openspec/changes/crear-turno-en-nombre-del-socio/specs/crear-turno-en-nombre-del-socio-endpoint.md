# Spec: Endpoint y Reglas Base para Creación de Turno por Terceros

**Spec ID**: crear-turno-en-nombre-del-socio-endpoint
**Change**: crear-turno-en-nombre-del-socio
**Related docs**: CU-12 expandido

## Requisito (Requirement)

Permitir a los actores internos (`RECEPCIONISTA`, `ADMIN`, `NUTRICIONISTA`) agendar un turno para un `SOCIO` asegurando que se respeten los scopes de gimnasio y las reglas de negocio (RBs) canónicas de la agenda de turnos, y dejando trazabilidad del evento y del creador.

## Contrato de Endpoint

Se expone **UN** único endpoint: `POST /turnos/crear`
*Justificación del path*: Centraliza la lógica de creación por terceros. El rol y el ID del actor se infieren del JWT inyectado en el request, por lo tanto no es necesario fragmentar el endpoint por rol (e.g. `/turnos/por-admin`).

### Request
```json
{
  "socioId": "uuid",
  "nutricionistaId": "uuid",
  "gimnasioId": "uuid",
  "fechaHora": "2026-06-15T10:00:00Z",
  "tipoConsulta": "PRIMERA_VEZ" // Opcional, según dominio
}
```

### Response
**Status 201 Created**
```json
{
  "id": "uuid",
  "estado": "CONFIRMADO",
  "fechaHora": "2026-06-15T10:00:00Z",
  "socioId": "uuid",
  "nutricionistaId": "uuid",
  "gimnasioId": "uuid",
  "creadoPor": "RECEPCION" // o 'ADMIN' o 'NUTRICIONISTA'
}
```

### Códigos de Error Esperados
- **400 Bad Request**: Fallos de validación del payload o de RBs (ej. turno en el pasado).
- **403 Forbidden**: El actor no tiene permiso `turnos.crear` o intentó asignar a un socio/gimnasio fuera de su alcance (cross-gym).
- **404 Not Found**: El `socioId`, `nutricionistaId` o `gimnasioId` no existen.
- **409 Conflict**: Conflicto de agenda (slot ocupado, solapamiento) o falla de RB40 (mismo día+mismo nutri).

## Control de Acceso y Permisos

- El actor debe tener el permiso explícito `turnos.crear`.
- **RECEPCIONISTA**: Puede agendar para cualquier socio de *su* gimnasio (`actor.gimnasioId === request.gimnasioId` y `socio.gimnasioId === request.gimnasioId`).
- **NUTRICIONISTA**: Puede agendar para cualquier socio de *su* gimnasio. No puede agendar en un gimnasio donde no opera.
- **ADMIN**: Puede agendar para gimnasios bajo su administración. (Por defecto conservador: si el admin está ligado a un gimnasio, aplica la misma regla de recepción. Si es un superadmin global, el scope abarca cualquier gimnasio existente, lo cual debe ser resuelto por el guard/interceptor de alcance global).

## Matriz de Reglas de Negocio (RBs)

| Regla | Descripción | Aplicación en este endpoint |
|---|---|---|
| **RB05** | Turnos en horarios permitidos | **APLICA** a todos. |
| **RB06** | No agendar en el pasado | **APLICA** a todos. |
| **RB07** | Slot no ocupado | **APLICA** a todos. |
| **RB14** | Ficha médica completa requerida | **BLOCK** para Nutricionista. **WARN** (omite restricción en backend) para Recepción/Admin. (Ver spec `crear-turno-en-nombre-del-socio-rb14-diferenciado.md`). |
| **RB17** | Cancelaciones previas / Penalidades | **APLICA** a todos (si el socio está bloqueado por penalidad, no se le puede agendar). |
| **RB27** | Límite de anticipación máxima | **APLICA** a todos. |
| **RB28** | Límite de anticipación mínima | **APLICA** a todos. |
| **RB33** | Auditoría y trazabilidad | **APLICA** a todos. Requiere popular `creadoPor`. |
| **RB40** | Un turno por día con el mismo nutri | **APLICA** a todos (evita turnos duplicados). |
| **RB58/59/60** | Reglas específicas de cancelación/estado | (Para estado inicial, nace `CONFIRMADO`). |

## Eventos de Dominio y Notificaciones

Al confirmar la creación del turno en DB, el sistema debe emitir eventos al target de persistencia existente (Outbox o Queue).

**Eventos Emitidos:**
1. `TURNO_CONFIRMADO` (Canónico, idéntico a la reserva por socio).
2. Un evento específico de trazabilidad según el creador:
   - `TURNO_CREADO_POR_RECEPCION`
   - `TURNO_CREADO_POR_ADMIN`
   - `TURNO_CREADO_POR_NUTRICIONISTA`

**Emails Disparados:**
1. **Socio**: Recibe email informativo indicando que su turno ha sido confirmado (no requiere acción por su parte).
2. **Nutricionista**: Recibe notificación del nuevo turno agendado en su agenda.
3. **Recordatorios**: El cron/scheduler enviará recordatorios al socio a las 24h y 1h antes del turno (comportamiento estándar).

## Auditoría (RB33)

El endpoint DEBE invocar al `AuditoriaService` preexistente.
- `accion`: `'CREATE'`
- `entidad`: `'turno'`
- `creadoPor`: `actor.id` (y rol asociado)
- `antesJson`: `null`
- `despuesJson`: `{ ...nuevoTurno }`

## Edge Cases Tratados

- **B1 (Fuera de política)**: Si el socio intenta pedir turnos de forma manual que rompen RB05/RB06, es bloqueado. El actor administrativo no puede bypassear restricciones de solapamiento de agenda o turnos pasados.
- **B2 (Socio recién creado sin ficha)**: Abordado por la regla de RB14 diferenciada.
- **B3 (RB40 mismo día+mismo nutri)**: Rechazado con 409 Conflict de manera uniforme.
- **B4 (Cross-gimnasio 403)**: El intento de un recepcionista de agendar a un socio de otro gimnasio resulta en 403 Forbidden.
- **B5 (Edición posterior)**: La edición del turno por parte de un nutricionista o recepcionista es out of scope para este CU.
- **B6 (Nutri de otro gimnasio 403)**: Un nutricionista intentando agendar en un gimnasio diferente al suyo propio recibe 403 Forbidden.