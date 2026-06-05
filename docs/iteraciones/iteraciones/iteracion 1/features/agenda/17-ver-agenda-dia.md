# 17 — Ver agenda del día

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-17
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `15-check-in.md`, `18-registrar-consulta.md`, `19-registrar-mediciones.md`, `turnos/16-ausente-automatico.md`

## Descripción
Permite al nutricionista ver su agenda del día con todos los turnos del día, acceder al detalle de cada turno, abrir la ficha del paciente (con permiso RB13), registrar consulta o medición, iniciar/finalizar consulta, y marcar ausente manualmente.

## Actores
- NUTRICIONISTA (su propia agenda, RB55)
- RECEPCIONISTA, ADMIN (vista de cualquier agenda para soporte)

## Precondiciones
- Nutricionista autenticado.
- La agenda es del día actual en la zona horaria del gimnasio.
- Para ver agenda de OTRO nutricionista: requiere RECEPCIONISTA o ADMIN del mismo gimnasio.

## Postcondiciones
- Lista de turnos del día mostrada.
- (Si abre ficha de un socio, se setea `revisada_por_nutricionista_at` automáticamente, RB45).
- Si inicia/finaliza consulta: ver `18-registrar-consulta.md`.
- Si marca ausente manual: ver `marcar-ausente-manual` (este spec).

## Camino principal
1. Nutricionista accede a "Mi agenda".
2. Sistema muestra los turnos del día (CONFIRMADO, PRESENTE, EN_CURSO, REALIZADO, AUSENTE) ordenados por hora.
3. Filtros: socio (búsqueda), hora, estado, objetivo.
4. Click en un turno → ver detalle:
   - Datos del socio (nombre, email, teléfono).
   - Tipo de consulta.
   - Estado.
   - **Botones contextuales según estado** (ver §Botones).
   - Link a "Ver ficha de salud" (con permiso RB13).
   - Link a "Ver historial de consultas".
   - Link a "Ver plan activo" (si tiene).
5. Al abrir ficha de un socio: se setea `revisada_por_nutricionista_at = now()` (RB45).

## Botones contextuales por estado del turno

| Estado | Botones disponibles |
|---|---|
| CONFIRMADO | "Marcar presente" (no — eso es recepción, ver CU-15), "Marcar ausente manual" |
| PRESENTE | "Iniciar consulta", "Marcar ausente" (socio se fue) |
| EN_CURSO | "Finalizar consulta" |
| REALIZADO | Solo lectura |
| AUSENTE | Solo lectura |
| CANCELADO | Solo lectura |

**Decisión**: "Iniciar consulta" y "Finalizar consulta" son acciones separadas que transicionan el estado del turno (ver §Endpoints). El nutricionista NO hace check-in (eso es recepción).

## Caminos alternativos
- **A1**: Sin turnos del día → "No tenés turnos asignados para el día de hoy".
- **A2**: Socio sin ficha → "El paciente aún no completó su ficha de salud" (no se muestra la ficha).
- **A3**: Turno CANCELADO/AUSENTE → visible con badge de estado, no editable.

## Casos borde

### B1: Turnos muy próximos entre sí
- Se muestran en orden cronológico.
- Aviso visual si hay solapamiento.

### B2: Ficha actualizada recientemente (RB15)
- Badge de alerta en el turno: "Ficha actualizada desde la última consulta".
- Visible en agenda y detalle.

### B3: Consulta en curso abierta en otro dispositivo
- Lock optimista con `version` en el campo de consulta.
- Si el nutricionista A abre una consulta y el nutricionista B (no aplica en iter 1) o el mismo nutricionista en otro tab intenta guardar:
  - 409 "La consulta fue modificada por otro usuario."

### B4: Día con muchos turnos (>20)
- Paginación o scroll virtual.

### B5: Nutricionista abre un turno CONFIRMADO antes de la hora
- Puede ver la ficha pero no iniciar consulta (estado no es PRESENTE).
- Mensaje: "El socio aún no hizo check-in. La consulta se inicia cuando recepción haga check-in."

### B6: El nutricionista abre un turno CONFIRMADO después de la hora pero el job de ausente no corrió todavía
- Ve el turno en CONFIRMADO. Puede marcarlo como ausente manualmente.

### B7: Iniciar consulta pero el socio no se presentó
- NO se puede iniciar consulta si el turno está CONFIRMADO. Solo desde PRESENTE.
- Si el socio no vino, se marca como AUSENTE (manual o auto) y la consulta no se inicia.

### B8: Finalizar consulta sin completar todas las secciones obligatorias
- **Decisión**: la consulta se puede finalizar con secciones vacías. El nutricionista completa después (edita con motivo).

### B9: Nutricionista en múltiples gimnasios
- La agenda se filtra por el gimnasio activo del JWT.

## Reglas de negocio aplicadas
- **RB13**: Solo ve datos de socios con turno previo.
- **RB15**: Alerta de ficha actualizada.
- **RB45**: Marca de revisada por nutricionista.
- **RB55**: No ve agenda de otros nutricionistas.

## Eventos disparados
- Al abrir ficha: `FICHA_REVISADA` (interno, sin notificación).
- Al iniciar/finalizar consulta: ver `18-registrar-consulta.md`.
- Al marcar ausente manual: `TURNO_AUSENTE_MANUAL` (email al socio, ver §Eventos).

## Auditoría
- Apertura de ficha: `VIEW` con `entidad='ficha_salud'`.
- Iniciar consulta: `INICIAR_CONSULTA` con `entidad='turno'`.
- Finalizar consulta: `FINALIZAR_CONSULTA` con `entidad='turno'`.
- Marcar ausente manual: `MANUAL_ABSENT` con `entidad='turno'`.

## Endpoints API

### `GET /api/nutricionistas/me/agenda`
- **Auth**: NUTRICIONISTA
- **Query**:
  - `?fecha=YYYY-MM-DD` (default: hoy en TZ del gimnasio)
  - `?estado=CONFIRMADO,PRESENTE,EN_CURSO,REALIZADO,AUSENTE` (default: todos)
  - `?page=1&limit=20`
- **Response 200**:
  ```json
  {
    "fecha": "2026-06-02",
    "turnos": [
      {
        "id": "uuid",
        "hora": "10:00",
        "socio": { "id": "uuid", "nombre": "Juan", "apellido": "Pérez", "email": "..." },
        "tipoConsulta": "Primera consulta",
        "estado": "CONFIRMADO",
        "fichaActualizada": false,
        "consultaId": "uuid | null"
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 20
  }
  ```
- **Errors**: 401, 500

### `GET /api/nutricionistas/me/agenda/:turnoId`
- **Auth**: NUTRICIONISTA (con RB13)
- **Response 200**: detalle del turno con datos del socio, consulta (si existe), permiso para ficha.
- **Errors**: 403, 404, 500

### `POST /api/turnos/:id/iniciar-consulta`
- **Auth**: NUTRICIONISTA (del turno)
- **Body**: vacío
- **Side effect**: `estado='EN_CURSO'`, `en_curso_at=now()`. Si no existe consulta para este turno, se crea una vacía.
- **Response 200**: `{ ok: true, estado: 'EN_CURSO', consultaId: 'uuid' }`
- **Errors**:
  - 400 (estado no es PRESENTE)
  - 403 (no es el nutricionista del turno)
  - 404
  - 500

### `POST /api/turnos/:id/finalizar-consulta`
- **Auth**: NUTRICIONISTA (del turno)
- **Body**: vacío
- **Side effect**: `estado='REALIZADO'`, `realizado_at=now()`. La consulta queda asociada y puede ser editada después.
- **Response 200**: `{ ok: true, estado: 'REALIZADO', realizadoAt: '...' }`
- **Errors**:
  - 400 (estado no es EN_CURSO)
  - 403
  - 404
  - 500

### `POST /api/turnos/:id/marcar-ausente-manual`
- **Auth**: NUTRICIONISTA (del turno), RECEPCIONISTA, ADMIN
- **Body**: `{ motivo: string }`
- **Side effect**:
  - `estado='AUSENTE'`, `ausente_at=now()`, `motivo=...`
  - Auditoría `MANUAL_ABSENT`.
  - Notificación al socio.
- **Response 200**: `{ ok: true, estado: 'AUSENTE' }`
- **Errors**:
  - 400 (motivo faltante, estado no es CONFIRMADO/PRESENTE)
  - 403
  - 404
  - 409 (estado no permite)
  - 500

### `GET /api/turnos/hoy`
- **Auth**: RECEPCIONISTA, ADMIN
- **Query**: `?nutricionistaId=...` (opcional, si no: todos los del gimnasio)
- **Response 200**: `[{ id, socio, nutricionista, hora, estado, tipoConsulta }]`
- **Use**: dashboard de recepción
- **Errors**: 401, 500

## Funcionalidad: Marcar ausente manual

Esta es la feature completa (no un sub-caso del 16). Permite al nutricionista (o recepción/admin) marcar un turno CONFIRMADO/PRESENTE como AUSENTE manualmente, antes o después del job automático.

### Camino
1. Desde la agenda, click en "Marcar ausente manual" en un turno.
2. Modal: confirmar + motivo (obligatorio).
3. Backend: `estado='AUSENTE'`, `ausente_at=now()`, `motivo=...`. Auditoría + notificación.
4. UI: badge AUSENTE en el turno.

### Edge cases
- **A1**: Turno ya AUSENTE → 409 "El turno ya fue marcado ausente."
- **A2**: Turno REALIZADO/CANCELADO → 409.
- **A3**: Reversión por admin → ver `15-check-in.md` §Revertir ausente.

## UI / UX

### Pantalla: Mi agenda
- Header: fecha actual + navegación día anterior/siguiente.
- Resumen del día: X confirmados, Y presentes, Z finalizados.
- Lista de turnos del día, agrupados por hora.
- Card de turno: hora grande, nombre socio, tipo consulta, estado (badge), botones contextuales.

### Detalle del turno
- Sección "Paciente": datos básicos.
- Sección "Turno": fecha/hora, estado, tipo, motivo.
- Sección "Acciones": botones según estado.
- Sección "Documentos": link a ficha, historial, plan activo.
- Sección "Consulta": si existe, mostrar resumen + link a `18-registrar-consulta.md`.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Turnos muy próximos | Orden cronológico, aviso si solapamiento |
| Ficha actualizada | Badge "Ficha actualizada" |
| Consulta en otro tab | Lock optimista, 409 al segundo |
| Día con muchos turnos | Paginación o scroll virtual |
| Iniciar consulta antes de check-in | Mensaje: "El socio aún no hizo check-in" |
| Finalizar sin completar secciones | Permitido, editable después |
| Multi-gimnasio | Filtrar por gimnasio activo |

## Tests

### Unitarios
- `obtener-agenda-dia.use-case.ts`:
  - Solo turnos del día del nutricionista
  - Filtros
  - Orden cronológico
  - Marca `fichaActualizada` correctamente
- `abrir-ficha-desde-turno.use-case.ts`:
  - Con turno previo → permite ver
  - Sin turno previo → 403
  - Setea `revisada_por_nutricionista_at` (RB45)
- `iniciar-consulta.use-case.ts`:
  - Solo desde PRESENTE
  - Crea consulta vacía si no existe
  - Transición a EN_CURSO
- `finalizar-consulta.use-case.ts`:
  - Solo desde EN_CURSO
  - Transición a REALIZADO
  - Permite edición posterior
- `marcar-ausente-manual.use-case.ts`:
  - Solo desde CONFIRMADO/PRESENTE
  - Motivo obligatorio
  - Auditoría MANUAL_ABSENT
  - Notificación al socio

## Notas
- "Marcar ausente manual" por el nutricionista es una acción complementaria al job automático (CU-16). Útil cuando el nutricionista ve que el socio no vino y quiere registrarlo antes del job.
- El nutricionista NO puede cambiar el estado de un turno de PRESENTE a AUSENTE sin una razón explícita (eso es reversal, solo admin).
- El badge "Ficha actualizada" usa `ficha.actualizada_at > MAX(consulta.created_at)`.
- "Iniciar consulta" e "Iniciar consulta" son acciones distintas que cambian el estado del turno. Ver `18-registrar-consulta.md` para el detalle de la consulta.
