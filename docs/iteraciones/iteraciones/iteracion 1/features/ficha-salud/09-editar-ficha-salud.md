# 09 — Editar ficha de salud

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-09
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `08-completar-ficha-salud.md`, `notificaciones.md`

## Descripción
Permite al socio editar su ficha de salud existente. Cada edición genera una nueva `FichaSaludVersion` inmutable (RB50). Si el socio ya tuvo consultas, la ficha se marca como "actualizada recientemente" para alertar al nutricionista (RB15, RB42).

## Actores
- SOCIO

## Precondiciones
- El socio está autenticado.
- El socio tiene una ficha (completa o pendiente).

## Postcondiciones
- Nueva `FichaSaludVersion` creada.
- `FichaSalud.version_actual_id` apunta a la nueva versión.
- `actualizada_at` actualizado.
- Si tiene consultas previas: marcada como "actualizada recientemente" (RB15).
- Auditoría con antes/después.

## Camino principal
1. Socio accede a "Mi ficha de salud" (misma pantalla que CU-08 pero pre-llena).
2. Modifica los campos que quiere.
3. Confirma.
4. Sistema valida:
   - Mismas validaciones que CU-08 (rangos, obligatorios).
   - **No requiere consentimiento de nuevo** (RB44: se setea una sola vez).
5. Crea nueva `FichaSaludVersion` (RB50). La anterior queda inmutable.
6. Actualiza `FichaSalud.version_actual_id` y `actualizada_at`.
7. Si tiene consultas previas:
   - `FichaSalud.actualizada_at` > `MAX(consulta.created_at)` → marca "actualizada recientemente" (RB15).
   - Notifica a nutricionistas vinculados (los que tienen turnos previos con el socio).
8. Auditoría con antes/después.
9. Mensaje: "Ficha actualizada."

## Caminos alternativos
- **A1**: Campos inválidos (mismos que CU-08) → errores inline.
- **A2**: Error al guardar → mensaje genérico + log de error.
- **A3**: Sin permiso (no es su ficha) → 403.

## Casos borde
- **B1**: Cambia alergias y tiene plan activo (RB24) → el nutricionista verá una alerta al abrir el plan activo: "Ficha del socio actualizada desde la última edición del plan, revisar alergias/restricciones".
- **B2**: Cambia peso que modifica IMC histórico → NO se recalcula IMC histórico (RB21). El peso en ficha es referencia, las mediciones son snapshots.
- **B3**: Nutricionista está viendo la ficha mientras el socio la edita → last-write-wins (RB29). El nutricionista al refrescar ve la nueva versión.
- **B4**: Cambia embarazo a EMBARAZADA o LACTANDO → flag visible prominentemente.
- **B5**: Cambia email del nutricionista desde la ficha → no aplica, email no está en la ficha.
- **B6**: Edición durante la creación de un plan → el plan usa la versión actual al momento de validar ingredientes. Si se edita la ficha después, el plan ya creado NO se re-valida (queda con la versión que tenía al crear).
- **B7**: Edición con múltiples cambios rápidos → cada edición genera una nueva versión, todas se conservan. Si quiere ver historial, el endpoint correspondiente lo muestra.

## Reglas de negocio aplicadas
- **RB15**: Alerta de "actualizada recientemente" si tiene consultas.
- **RB21**: IMC histórico no se recalcula.
- **RB29**: Last-write-wins con alerta visual.
- **RB33**: Auditoría.
- **RB42**: Ficha editable aunque haya consultas.
- **RB50**: Cada edición genera nueva versión inmutable.

## Eventos disparados
- `FICHA_ACTUALIZADA` → email al socio (confirmación).
- Si tiene consultas previas: in-app a nutricionistas vinculados ("Ficha del socio X actualizada").

## Auditoría
- `accion='UPDATE'`, `entidad='ficha_salud'`, `entidad_id=socio_id`, `antes_json` (versión anterior), `despues_json` (versión nueva).

## Criterios de aceptación
- [ ] Socio puede editar su ficha.
- [ ] Cada edición genera una nueva versión inmutable.
- [ ] Historial completo se conserva.
- [ ] Validación de rangos.
- [ ] Alerta de "actualizada recientemente" al nutricionista si tiene consultas.
- [ ] RB24: si cambia alergias, nutricionista ve alerta al abrir plan activo.
- [ ] RB21: IMC histórico NO se recalcula.
- [ ] Last-write-wins con `updated_at`.
- [ ] Auditoría con antes/después.
- [ ] Test unitario: use-case `editar-ficha-salud.use-case.ts` cubre happy path, RB15, RB21, RB29.

## Endpoints API

### `PATCH /api/socios/me/ficha-salud`
- **Auth**: SOCIO
- **Body**: campos a modificar (parcial o total)
- **Response 200**: ficha actualizada con `version=N, actualizada_at=now()`
- **Errors**: 400, 404, 500

### `GET /api/socios/me/ficha-salud/historial`
- **Auth**: SOCIO
- **Response 200**: `[{ version, createdAt, motivo }]` (resumen) o versiones completas según query.
- **Errors**: 404

### `GET /api/socios/me/ficha-salud/version/:n`
- **Auth**: SOCIO
- **Response 200**: ficha completa de esa versión (read-only).
- **Errors**: 404

### `GET /api/socios/:id/ficha-salud/historial`
- **Auth**: NUTRICIONISTA (con RB13)
- **Response 200**: versiones del socio.

## Modelo de datos

### Entidades afectadas
- `FichaSaludVersion` (nueva fila)
- `FichaSalud` (actualización de `version_actual_id`, `actualizada_at`)

### Comportamiento
- La nueva versión contiene TODOS los campos, no solo los cambios. Es un snapshot completo.
- `motivo_cambio` se registra en metadata de auditoría, no en la versión misma.

## UI / UX

### Pantalla: Ficha de salud (modo edición)
- Idéntica a CU-08 pero pre-llena.
- Banner superior: "Última edición: [fecha] [hora]".
- Botón "Ver historial" → modal con lista de versiones.

### Indicador "Actualizada recientemente"
- En la agenda del nutricionista, en cada turno, un badge "Ficha actualizada" si la última edición es posterior a la última consulta del socio.
- En el detalle de la consulta/turno, banner explícito.

## Tests

### Unitarios
- `editar-ficha-salud.use-case.ts`:
  - Editar un campo (mínima)
  - Editar todos los campos
  - Cambio de alergias con plan activo → alerta generada
  - Cambio de peso → IMC histórico NO recalculado
  - RB29: last-write-wins (concurrencia)

## Notas
- El campo `consent_at` se setea UNA VEZ y NO se vuelve a pedir. Decisión: para cambios menores no se re-pide, pero podría agregarse en iter 2+ si se requiere para cambios sensibles (alergias, embarazo).
- La versión actual SIEMPRE se muestra al nutricionista; el historial está disponible bajo demanda.
- Si el socio edita la ficha muy frecuentemente (ej. >1 vez al día), se podría rate-limitar en iter 2+. En iter 1 no hay límite.
