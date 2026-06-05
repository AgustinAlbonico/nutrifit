# Cierre de cuenta del socio

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-07 (desactivación), RB37
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `compliance.md`, `notificaciones.md`, `archivos.md`

## Descripción
Proceso de cierre/baja lógica de la cuenta de un socio. Se ejecuta **solo por admin o recepción** (decisión de Q&A). Aplica supresión lógica: datos personales y clínicos quedan con `deleted_at` y datos ofuscados. El historial de turnos y consultas se conserva por obligación legal (RB37, Ley 25.326 art. 4°).

Este feature cubre la **ejecución** de la supresión (admin/recepción procesa la solicitud del socio o decide cerrar unilateralmente). El **flujo de solicitud** del socio está en `compliance.md`.

## Actores
- RECEPCIONISTA, ADMIN (ejecutan la supresión)
- SOCIO (solicita la supresión vía `compliance.md`)

## Precondiciones
- El socio existe.
- El actor (admin/recepción) está autenticado.
- Si es ejecución de solicitud: existe `SolicitudSupresion` con `estado='PENDIENTE'`.
- Si es cierre unilateral: el admin decide cerrar sin solicitud del socio (caso edge).

## Postcondiciones
- `socio.deleted_at=now()`, `socio.estado='INACTIVO'`.
- `socio.motivo_eliminacion=...`.
- Datos personales **ofuscados**:
  - `nombre` → "Socio Suprimido #" + correlativo (generado al suprimir, no el `socio_id` viejo).
  - `apellido` → correlativo.
  - `email` → `suprimido-{correlativo}@nutrifit.local`.
  - `dni` → `null`.
  - `telefono` → `null`.
  - `fecha_nacimiento` → `null`.
  - `genero` → `null`.
  - `observaciones` → `null`.
- `usuario.deleted_at=now()`, `usuario.email=email_ofuscado`, `usuario.debe_cambiar_password=false`.
- `usuario.password_hash` se setea a un valor random (cuenta queda inaccesible).
- Refresh tokens del usuario: `revoked_at=now()`.
- Ficha de salud: `deleted_at=now()`.
- Versiones de ficha: `deleted_at=now()`.
- Planes (activo + históricos): `deleted_at=now()`.
- SolicitudSupresion (si existía): `estado='PROCESADA'`, `procesado_por=admin_id`, `procesado_at=now()`.
- Auditoría: `SUPRESSION_PROCESSED`.
- Notificación al socio (email): "Tu cuenta fue cerrada conforme a tu solicitud" (si fue por solicitud) o "Tu cuenta fue cerrada por el gimnasio" (si fue unilateral).

## Camino principal

### A) Ejecución de solicitud del socio (vía `compliance.md`)
1. Admin/recepción ve la solicitud PENDIENTE en su panel.
2. Click en "Procesar".
3. Sistema muestra: datos del socio (NO clínicos), resumen de lo que se va a suprimir:
   - N turnos históricos.
   - N planes (activo + históricos).
   - N mediciones.
   - N consultas.
4. Advertencia: "Esta acción es irreversible. Los datos personales y clínicos serán suprimidos. El historial de turnos y consultas se conserva por obligación legal."
5. Pregunta: "¿El socio tiene turnos futuros pendientes?" (ver §Edge cases B1).
6. Confirmación con campo motivo (obligatorio).
7. Confirma.
8. Sistema ejecuta el flujo de supresión (transaccional):
   1. Genera correlativo anónimo (autoincrement desde la última supresión, ej. `nextval('socio_suprimido_correlativo_seq')`).
   2. Ofusca datos del socio (nombre, apellido, email).
   3. `socio.deleted_at=now()`, `estado='INACTIVO'`, `motivo_eliminacion=...`.
   4. `usuario.deleted_at=now()`, regenera `password_hash` random, revoca refresh tokens.
   5. FichaSalud: `deleted_at=now()`.
   6. FichaSaludVersion: `deleted_at=now()` (todas las versiones).
   7. PlanAlimentario: `deleted_at=now()` (todos los planes del socio).
   8. SolicitudSupresion: `estado='PROCESADA'`, `procesado_por=...`, `procesado_at=now()`.
   9. **NO se eliminan**: turnos, consultas, mediciones (historial obligatorio).
9. Auditoría `SUPRESSION_PROCESSED` con `motivo`, antes_json con los datos originales (para registro legal).
10. Email al socio (si tenía email real antes de la ofuscación): "Tu cuenta fue cerrada conforme a tu solicitud del [fecha]".
11. Mensaje al admin: "Socio suprimido. Correlativo asignado: #N".

### B) Cierre unilateral (admin decide sin solicitud)
- Mismo flujo que A) pero:
  - No se modifica SolicitudSupresion.
  - El email al socio dice: "Tu cuenta fue cerrada por el gimnasio. Contactanos para más información."
  - Auditoría `SUPRESSION_PROCESSED` con `motivo_origen='CIERRE_UNILATERAL'`.

## Caminos alternativos

### A1: Socio ya suprimido
- "El socio ya fue suprimido el [fecha]".

### A2: Motivo faltante en la confirmación
- "El motivo es obligatorio".

### A3: Sin permiso (no es ADMIN/RECEPCIONISTA)
- 403.

## Casos borde

### B1: Socio con turnos futuros pendientes
- **Default**: cancelar automáticamente (decisión de Q&A).
- Si admin/recepción elige "cancelar manual" (opción en el modal): el sistema NO cancela, deja la responsabilidad al admin/recepción de cancelar después.
- La elección se persiste en `motivo_eliminacion` para auditoría.

### B2: Socio con plan activo
- El plan activo se marca `deleted_at=now()` igual que los históricos.
- **No se transfiere** a otro socio (no aplica en iter 1).
- Si había consultas referenciándolo, las consultas mantienen `plan_alimentario_referenciado_id` apuntando al plan eliminado, pero se aclara visualmente.

### B3: Socio con archivos (fotos de progreso, diploma si aplica)
- Los archivos físicos NO se borran (decisión: conservar para auditoría/legal).
- Se marcan con `deleted_at=now()` en la tabla `archivo` (soft delete).
- El path físico se conserva.
- En iter 2+ se puede implementar cleanup físico después de N años.

### B4: Socio reactivado después de suprimido
- **NO existe flujo de reactivación** en iter 1.
- Si el gimnasio necesita "reactivar" un socio suprimido, debe **crear un nuevo socio** con datos nuevos.
- El historial anónimo se mantiene (socios suprimidos no se pueden reactivar como tales).

### B5: Exportación previa del socio
- El gimnasio debe asegurarse de haber entregado el export PDF al socio **antes** de la supresión.
- El sistema NO valida esto automáticamente.
- **Recomendación**: el modal de supresión debe preguntar "¿Ya se le entregó el export PDF al socio?" con confirmación obligatoria.

### B6: Socio con auditoría propia extensa
- Las entradas de `auditoria` del socio (donde es el `usuario_id`) se mantienen **sin modificar** (la auditoría es inmutable).
- El nombre/email en el JSON de la auditoría queda con los datos del momento de la acción, NO se ofusca retroactivamente. Esto preserva la trazabilidad legal.

### B7: Solicitud rechazada vs procesada
- Si admin **rechaza** la solicitud: ver `compliance.md` §`POST /api/admin/solicitudes-supresion/:id/rechazar`. El socio sigue activo, solicitud queda en estado RECHAZADA.
- Si admin **procesa**: este flujo.

## Reglas de negocio aplicadas
- **RB33**: Auditoría.
- **RB37**: Supresión lógica con conservación de historial.

## Endpoints API

### `POST /api/socios/:id/cerrar-cuenta`
- **Auth**: RECEPCIONISTA, ADMIN
- **Body**:
  ```json
  {
    "motivo": "string (obligatorio)",
    "solicitudId": "uuid (opcional, si se procesa una solicitud del socio)",
    "turnosFuturosAccion": "cancelar_auto | dejar_manual",
    "exportPrevioEntregado": true,
    "origen": "SOLICITUD | CIERRE_UNILATERAL"
  }
  ```
- **Response 200**:
  ```json
  {
    "ok": true,
    "socioId": "uuid",
    "correlativoAnonimo": 42,
    "suprimidoAt": "2026-06-05T10:00:00.000Z",
    "turnosCancelados": 3,
    "planesSuprimidos": 5
  }
  ```
- **Errors**: 400 (motivo faltante, exportPrevioEntregado=false), 403, 404, 409 (ya suprimido), 500

## Modelo de datos

### Entidad `Socio` (modificaciones al suprimir)
- `deleted_at=now()`
- `estado='INACTIVO'`
- `motivo_eliminacion=...`
- `nombre`, `apellido`, `email`, `dni`, `telefono`, `fecha_nacimiento`, `genero`, `observaciones` ofuscados/null
- `correlativo_anonimo` (nuevo campo, INT UNIQUE, generado al suprimir)

### Entidad `Usuario` (modificaciones al suprimir)
- `deleted_at=now()`
- `email=email_ofuscado`
- `password_hash=<random_bytes>` (cuenta inaccesible)
- `debe_cambiar_password=false`
- `intentos_fallidos=0`

### Entidad `RefreshToken`
- `revoked_at=now()` para todos los tokens del usuario

### Entidades marcadas con `deleted_at`
- `Socio`, `Usuario`, `FichaSalud`, `FichaSaludVersion`, `PlanAlimentario`, `Archivo`

### Entidades NO modificadas
- `Turno` (historial obligatorio, RB37)
- `Consulta` (historial obligatorio, RB37)
- `Medicion` (historial, marcada con flag `socio_suprimido=true` en queries)
- `Auditoria` (inmutable)

### Secuencia para correlativo anónimo
- Tabla `socio_suprimido_correlativo_seq` con `nextval`.
- Garantiza unicidad global.
- Decisión de diseño: NO usar el `socio_id` viejo para mantener separación clara.

## UI / UX

### Modal: Cierre de cuenta
1. **Sección 1: Datos del socio** (no clínicos).
2. **Sección 2: Resumen de supresión**:
   - "N turnos históricos (se conservan por ley)".
   - "N planes (se marcan como suprimidos)".
   - "N mediciones (se conservan, marcadas como anónimas)".
   - "N consultas (se conservan)".
3. **Sección 3: Turnos futuros pendientes**:
   - Si hay: "El socio tiene N turnos futuros. ¿Cancelarlos automáticamente o dejarlos manualmente?"
   - Radio buttons: "Cancelar automáticamente (recomendado)" / "Dejar manualmente".
4. **Sección 4: Export previo**:
   - Checkbox obligatorio: "Confirmo que el socio ya recibió su export PDF antes de la supresión".
5. **Sección 5: Motivo**:
   - Textarea obligatorio.
6. **Sección 6: Advertencia**:
   - Texto grande: "Esta acción es IRREVERSIBLE. Los datos personales del socio serán eliminados de forma permanente. El historial se conservará pero sin identidad."
7. **Botones**: "Cancelar" / "Suprimir cuenta" (rojo, doble click).

### Vista: Listado de socios
- Los socios suprimidos NO aparecen en el listado por defecto.
- Filtro "Mostrar suprimidos" → los muestra con badge gris.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Socio sin ficha | Se suprime normal |
| Socio sin turnos | Se suprime normal |
| Socio sin planes | Se suprime normal |
| Socio con archivos | Archivos físicos se conservan (soft delete) |
| Socio con auditoría propia | Entradas quedan inmutables |
| Reactivación | NO posible; crear nuevo socio |
| Export previo no entregado | El sistema bloquea la supresión hasta que se confirme |

## Tests

### Unitarios
- `cerrar-cuenta-socio.use-case.ts`:
  - Happy path con solicitud del socio
  - Happy path cierre unilateral
  - A1: ya suprimido → 409
  - A2: motivo faltante → 400
  - A3: sin permiso → 403
  - B1: turnos futuros con default cancelar_auto
  - B1: turnos futuros con dejar_manual
  - B2: plan activo marcado deleted_at
  - B3: archivos con deleted_at
  - B5: exportPrevioEntregado=false → 400
  - Verificar que datos personales se ofuscan
  - Verificar que refresh tokens se revocan
  - Verificar que correlativo_anonimo se asigna
  - Verificar que auditoría SUPRESSION_PROCESSED se crea
  - Verificar que solicitudes pendientes se marcan PROCESADAS

## Notas
- **Crítico**: la supresión es IRREVERSIBLE en términos de datos personales. El historial queda pero sin identidad.
- El gimnasio debe entregar el export PDF ANTES de la supresión. En iter 2+ se puede mejorar con export JSON para cumplimiento pleno de Ley 25.326 art. 13.
- Las entradas de auditoría NO se ofuscan retroactivamente. Esto preserva la trazabilidad legal de las acciones previas a la supresión.
- Esta operación es sensible: logging adicional y alertas a admin de seguridad son obligatorios.
- **No hay reactivación**: un socio suprimido es un cierre definitivo. Si quiere volver, se crea un socio nuevo.
