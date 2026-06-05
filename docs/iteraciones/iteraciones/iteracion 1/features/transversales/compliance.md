# Compliance — Ley 25.326 (Argentina)

> **Source of truth**: `01-iteracion-base-nutricional.md` §11.5
> **Estado**: Por implementar (parcial)
> **Prioridad**: Alta
> **Dependencias**: `auth.md`, `cierre-cuenta-socio.md`, `archivos.md`, `23-ver-progreso-socio.md`, `notificaciones.md`

## Descripción
Cumplimiento (parcial) de la Ley 25.326 de Protección de Datos Personales de Argentina. Cubre: consentimiento, acceso, rectificación, supresión, derecho al olvido. **NO cubre derecho de portabilidad JSON** (riesgo legal aceptado, decisión de Q&A — RB36 eliminado). SLA regulatorio: 10 días hábiles para responder solicitudes.

## Marco regulatorio
- **Ley 25.326** (Argentina, año 2000) — Protección de Datos Personales.
- **Decreto 1558/2001** — Reglamentación.
- **AAIP** (Agencia de Acceso a la Información Pública) — Ente de control.

## Derechos cubiertos

### 1. Consentimiento expreso
- Checkbox obligatorio al completar ficha de salud (RB44).
- Registrado en `consent_at` (timestamp del consentimiento).
- Sin consentimiento, la ficha está incompleta y bloquea reserva de turno (RB14).
- **El consentimiento se solicita UNA VEZ al completar la ficha por primera vez**. En iter 1 NO se vuelve a pedir en ediciones (decisión documentada — ver `09-editar-ficha-salud.md`).

### 2. Derecho de acceso
- El socio ve todos sus datos desde su perfil.
- Endpoint: `GET /api/socios/me/datos` (vista agregada).
- Catálogo de datos accesible al socio:
  - **Datos personales**: nombre, apellido, email, DNI, teléfono, fecha nacimiento, género.
  - **Ficha de salud (versión actual)**: altura, peso, alergias, intolerancias, restricciones, patologías, hábitos, objetivos, medicación, observaciones, embarazo/lactancia, peso histórico.
  - **Historial de ficha de salud**: lista de versiones con fecha de cada cambio.
  - **Mediciones**: peso, altura, IMC, perímetros, composición corporal, fotos de progreso (solo `publicada_at IS NOT NULL`).
  - **Consultas**: anamnesis, examen físico, diagnóstico, plan a seguir, recomendaciones, fecha de cada consulta.
  - **Planes alimentarios**: plan activo + históricos con días, comidas, grupos, alimentos.
  - **Turnos**: histórico completo (CONFIRMADO, PRESENTE, EN_CURSO, REALIZADO, CANCELADO, AUSENTE).
  - **Progreso**: visualizaciones + export PDF.
  - **Auditoría de sus propias acciones**: qué se registró a su nombre.

### 3. Derecho de rectificación
- Edición de ficha de salud (RB42, ver `09-editar-ficha-salud.md`).
- Edición de datos personales (parcial en iter 1, sin cambio de email — ver `auth.md`).

### 4. Derecho de supresión (baja lógica)
- El socio puede **solicitar** la supresión de su cuenta.
- La supresión la ejecuta **admin o recepción** (decisión de Q&A, ver `cierre-cuenta-socio.md`).
- Aplica supresión lógica: datos personales y clínicos quedan con `deleted_at`, datos ofuscados.
- Historial de turnos y consultas se conserva por obligación legal (RB37, Ley 25.326 art. 4° excepciones).

## Derecho NO cubierto en iter 1

### 5. Derecho de portabilidad (JSON) — **RIESGO LEGAL ACEPTADO**
- **NO se implementa export JSON del socio** (decisión de Q&A, RB36 eliminado).
- Solo se ofrece export PDF del progreso (ver `23-ver-progreso-socio.md`).
- **Riesgo legal**: si un socio solicita sus datos en formato estructurado, el sistema no cumple estrictamente con Ley 25.326 art. 13.
- **Mitigación**: si se presenta el caso, el admin exporta el PDF del reporte de progreso + plan activo + ficha, reconociendo que NO es cumplimiento total. Se sugiere escalar a legal del gimnasio.
- **Recomendación**: revisar esta decisión antes de salir a producción real. Considerar implementación de JSON como feature de iter 2+.

## SLA regulatorio

- **Ley 25.326 art. 14**: el responsable de tratamiento debe responder a las solicitudes en un plazo máximo de **10 días hábiles**.
- **Implementación**:
  - Cuando el socio solicita supresión, se crea `SolicitudSupresion` con `fecha_solicitud`.
  - Admin/recepción tiene 10 días hábiles para procesarla.
  - Si no se procesa en plazo, el sistema **alerta al admin** con un job diario.
  - Si pasan 30 días sin procesar, la solicitud se escala automáticamente (email al admin del gimnasio, cc al nutricionista principal del socio si lo tiene).

## Reglas de negocio aplicadas
- **RB14, RB37, RB42, RB44**: cumplimiento parcial.
- **RB36 (eliminado)**: portabilidad JSON NO se implementa. Riesgo aceptado.
- **Decisión de Q&A**: SLA de 10 días hábiles (alineado con ley).

## Actores
- SOCIO (ejercer derechos)
- ADMIN (gestionar solicitudes, ejecutar supresión)
- RECEPCIONISTA (gestionar solicitudes, ejecutar supresión)

## Modelo de datos

### Entidad `SolicitudSupresion`
- `id, socio_id, fecha_solicitud, fecha_limite_legal (fecha_solicitud + 10 días hábiles), estado (PENDIENTE|PROCESADA|RECHAZADA|RETRATADA), motivo_rechazo, procesado_por, procesado_at, created_at, updated_at`

### Cálculo de fecha_limite_legal
- Se calcula en la app: `fecha_solicitud + 10 días hábiles` (excluyendo sábados, domingos, feriados nacionales).
- Lista de feriados en `apps/backend/src/domain/constants/feriados-ar.ts` (constante).
- Si la implementación exacta de "días hábiles" es ambigua, usar `fecha_solicitud + 14 días corridos` como approximation (10 + margen de 4 fines de semana).

### Constraints
- `CHECK(estado IN ('PENDIENTE','PROCESADA','RECHAZADA','RETRATADA'))`
- `UNIQUE(socio_id) WHERE estado='PENDIENTE'` (un socio no puede tener dos solicitudes pendientes simultáneas).

## Endpoints API

### `POST /api/socios/me/solicitar-supresion`
- **Auth**: SOCIO
- **Body**: `{ confirmacion: true }` (campo obligatorio para evitar solicitud accidental)
- **Response 201**:
  ```json
  {
    "solicitudId": "uuid",
    "estado": "PENDIENTE",
    "fechaSolicitud": "2026-06-02T10:00:00.000Z",
    "fechaLimiteLegal": "2026-06-18T10:00:00.000Z" // +14 días corridos
  }
  ```
- **Side effect**: crea la solicitud, notifica a admin/recepción.
- **Errors**: 409 (ya hay solicitud pendiente), 400 (confirmación faltante), 500

### `GET /api/socios/me/solicitud-supresion-actual`
- **Auth**: SOCIO
- **Response 200**:
  ```json
  {
    "solicitud": {
      "id": "uuid",
      "estado": "PENDIENTE",
      "fechaSolicitud": "2026-06-02T10:00:00.000Z",
      "fechaLimiteLegal": "2026-06-18T10:00:00.000Z",
      "diasRestantes": 14
    }
  }
  ```
- Si no hay solicitud: `204 No Content`.
- **Errors**: 401, 500

### `POST /api/socios/me/solicitud-supresion/:id/retirar`
- **Auth**: SOCIO (dueño de la solicitud)
- **Body**: vacío
- **Response 200**: `{ ok: true, estado: 'RETRATADA' }`
- **Side effect**: marca la solicitud como RETIRADA. El socio conserva su cuenta.
- **Errors**: 400 (solicitud no está PENDIENTE), 404, 500

### `GET /api/socios/me/datos`
- **Auth**: SOCIO
- **Response 200**: vista agregada con todas las categorías del §2 (derecho de acceso).
- **Estructura**:
  ```json
  {
    "datosPersonales": {...},
    "fichaSaludActual": {...},
    "historialFichaSalud": [{ version, fecha }],
    "mediciones": [...],
    "consultas": [...],
    "planesAlimentarios": [...],
    "turnos": [...],
    "auditoriaPropia": [...]  // solo del socio logueado
  }
  ```
- **Errors**: 401, 500

### `GET /api/socios/me/export-pdf`
- **Auth**: SOCIO
- **Response**: PDF binario con ficha + plan activo + mediciones + consultas + turnos. Idéntico al export de progreso pero más completo.
- **Errors**: 500

### `GET /api/admin/solicitudes-supresion`
- **Auth**: ADMIN, RECEPCIONISTA
- **Query**: `?estado=PENDIENTE&page=1&limit=50`
- **Response 200**: lista paginada con datos del socio (sin datos clínicos, solo administrativos).
- **Errors**: 403, 500

### `POST /api/admin/solicitudes-supresion/:id/procesar`
- **Auth**: ADMIN, RECEPCIONISTA
- **Body**: vacío
- **Response 200**:
  ```json
  {
    "ok": true,
    "socioId": "uuid",
    "estado": "PROCESADA",
    "suprimidoAt": "2026-06-05T10:00:00.000Z"
  }
  ```
- **Side effect**:
  1. Ejecuta el flujo de supresión (ver `cierre-cuenta-socio.md`).
  2. Marca la solicitud como PROCESADA.
  3. Auditoría `SUPRESSION_PROCESSED`.
  4. Notifica al socio (email: "Tu cuenta fue cerrada conforme a tu solicitud").
- **Errors**: 400 (estado no es PENDIENTE), 404, 500

### `POST /api/admin/solicitudes-supresion/:id/rechazar`
- **Auth**: ADMIN, RECEPCIONISTA
- **Body**: `{ motivo: string }` (obligatorio)
- **Response 200**: `{ ok: true, estado: 'RECHAZADA' }`
- **Side effect**: marca la solicitud como RECHAZADA con motivo, notifica al socio.
- **Errors**: 400 (motivo faltante), 404, 500

## Implementación

### Flujo del socio
1. Socio va a "Mi perfil" → "Cerrar mi cuenta".
2. Pantalla con advertencias y resumen de lo que se va a suprimir.
3. Checkbox de confirmación: "Entiendo que perderé acceso a mi información".
4. Botón "Solicitar supresión" → `POST /api/socios/me/solicitar-supresion` con `{ confirmacion: true }`.
5. Socio ve confirmación con `fechaLimiteLegal`.
6. Puede ver el estado en cualquier momento con `GET /api/socios/me/solicitud-supresion-actual`.
7. Puede retirar la solicitud con `POST /api/socios/me/solicitud-supresion/:id/retirar` mientras esté PENDIENTE.

### Flujo de admin/recepción
1. Admin/recepción ve notificaciones (in-app + email) sobre solicitudes nuevas.
2. Va a "Solicitudes de supresión" → ve listado.
3. Click en solicitud → ve datos del socio (NO clínicos, solo administrativos) + motivo de la solicitud.
4. Decisión:
   - **Procesar**: click → ejecuta el flujo de supresión (`cierre-cuenta-socio.md`).
   - **Rechazar**: click → modal con motivo obligatorio.

### Job de SLA (alerta de plazo)
- BullMQ repeatable job (cron diario a las 9 AM).
- Query: `SELECT * FROM solicitud_supresion WHERE estado='PENDIENTE' AND fecha_limite_legal < now() + INTERVAL '2 days'`.
- Para cada una: alerta al admin del gimnasio.
- Si `fecha_limite_legal < now()` (vencida): email a admin + cc nutricionista principal del socio.

## Eventos disparados
- `SUPRESSION_REQUESTED` → email a admin/recepción.
- `SUPRESSION_PROCESSED` → email al socio confirmando cierre.
- `SUPRESSION_REJECTED` → email al socio con el motivo del rechazo.
- `SUPRESSION_SLA_WARNING` → email a admin (2 días antes del vencimiento).
- `SUPRESSION_SLA_BREACHED` → email a admin + cc nutricionista.

## Auditoría
- `SUPRESSION_REQUESTED` cuando el socio solicita.
- `SUPRESSION_PROCESSED` cuando admin procesa.
- `SUPRESSION_REJECTED` cuando admin rechaza.
- `SUPRESSION_WITHDRAWN` cuando el socio retira.
- Ver `auditoria.md` para el formato completo.

## Edge cases

- **B1**: Socio pide portabilidad JSON → respuesta del admin: "Por el momento solo podemos ofrecerte un PDF. Si necesitás el JSON, contactanos por otro canal y evaluamos caso por caso." (Copy neutra, no admitir incumplimiento).
- **B2**: Solicitud de supresión con turnos futuros pendientes → ver `cierre-cuenta-socio.md` §B2 (cancelar auto o manual).
- **B3**: Socio retira la solicitud → admin la ve como RETIRADA en el listado.
- **B4**: Admin procesa supresión → el PDF de export ya no está disponible. Si el socio lo había descargado antes, lo conserva localmente.
- **B5**: Solicitud duplicada → constraint UNIQUE lo bloquea.
- **B6**: Cambio de gimnasio del socio mientras tiene solicitud pendiente → la solicitud se mantiene asociada al socio (no al gimnasio). Si se procesa, la supresión es del socio en su gimnasio actual.
- **B7**: Solicitud creada por error → el socio puede retirarla (B3).
- **B8**: Socio reactivado después de procesado → ver `cierre-cuenta-socio.md` B4. Crear nuevo socio, historial anónimo se mantiene.

## Tests

### Unitarios
- `solicitar-supresion.use-case.ts`:
  - Crea solicitud
  - Rechaza si ya hay PENDIENTE (409)
  - Calcula fecha_limite_legal correctamente
- `retirar-solicitud-supresion.use-case.ts`:
  - Marca RETIRADA
  - Solo si PENDIENTE
- `procesar-solicitud-supresion.use-case.ts`:
  - Ejecuta supresión
  - Marca PROCESADA
  - Notifica al socio
- `rechazar-solicitud-supresion.use-case.ts`:
  - Motivo obligatorio
  - Marca RECHAZADA
- `calcular-dias-habiles.ts`:
  - Cuenta correctamente
  - Excluye sábados, domingos
  - Excluye feriados (lista constante)
- `job-sla-supresion`:
  - Alerta 2 días antes
  - Alerta cuando vence

### Integración
- Flujo end-to-end: socio solicita → admin procesa → datos ofuscados correctamente.

## Compliance considerations
- **DPO**: NO hay Data Protection Officer formal en iter 1. El admin del gimnasio actúa como responsable de tratamiento.
- **Registro de tratamientos**: documentado internamente por el gimnasio (no aplica al producto).
- **Logs**: la auditoría cubre las acciones sobre datos personales (SUPRESSION_*, EXPORT, etc.).
- **Backup y disaster recovery**: el gimnasio debe tener backup cifrado de la DB. El producto no impone pero la auditoría es crítica.
- **Auditoría externa**: AAIP puede requerir demostrar cumplimiento. El export de auditoría ayuda.

## Notas
- **Crítico**: la supresión es **IRREVERSIBLE** en términos de datos personales. El historial queda pero sin identidad.
- **El gimnasio debe tener un proceso de "derecho de portabilidad"** ANTES de la supresión, para que el socio pueda llevarse sus datos. En iter 1 esto es solo PDF (deficiente). En iter 2+ se sugiere JSON.
- **Esta operación es sensible**: logging adicional y alertas a admin de seguridad son obligatorios.
- **Recomendación**: consulta legal antes de salir a producción real con socios argentinos.
