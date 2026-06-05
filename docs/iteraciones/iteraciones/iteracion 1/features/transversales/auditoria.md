# Auditoría

> **Source of truth**: `01-iteracion-base-nutricional.md` §9, §16
> **Stack**: MySQL 8.0+ (confirmado por AGENTS.md)
> **Estado**: Por implementar
> **Prioridad**: Crítica
> **Dependencias**: todas las features (transversal)

## Descripción
Registro inmutable (append-only) de todas las acciones sensibles del sistema. Metadata completa: usuario, acción, entidad, antes/después, motivo, IP, user agent, timestamp. Retención **indefinida** (decisión de Q&A). Tablas particionadas **por mes** (decisión de Q&A) para manejo de volumen. Solo ADMIN puede consultar, filtrado por su gimnasio activo.

## Actores
- SISTEMA (registro automático desde cada use-case)
- ADMIN (consulta + export)

## Catálogo de acciones (enum completo)

Este es el catálogo maestro de valores válidos para `auditoria.accion`. Todas las features DEBEN usar estos valores.

| Acción | Cuándo se usa | Quién la origina |
|---|---|---|
| `CREATE` | Creación de entidad | Actor autenticado o sistema |
| `UPDATE` | Modificación de entidad | Actor autenticado |
| `DELETE` | Baja lógica (soft delete) | Actor autenticado |
| `CANCEL` | Cancelación de turno | Actor autenticado |
| `DEACTIVATE` | Desactivación de nutricionista/socio | RECEPCIONISTA, ADMIN |
| `REACTIVATE` | Reactivación de nutricionista/socio | RECEPCIONISTA, ADMIN |
| `CHECKIN` | Check-in de turno | RECEPCIONISTA, ADMIN |
| `AUTO_ABSENT` | Ausente automático (job) | SISTEMA |
| `MANUAL_ABSENT` | Ausente manual | NUTRICIONISTA, RECEPCIONISTA, ADMIN |
| `REVERT_ABSENT` | Reversión de ausente (admin) | ADMIN |
| `REVERT_CHECKIN` | Reversión de check-in (admin) | ADMIN |
| `CLOSE` | Cierre de consulta | NUTRICIONISTA |
| `INICIAR_CONSULTA` | Cambio de estado a EN_CURSO | NUTRICIONISTA |
| `FINALIZAR_CONSULTA` | Cambio de estado a REALIZADO | NUTRICIONISTA |
| `VIEW` | Vista de recurso (ej. ficha) | Actor autenticado |
| `LOGIN` | Login exitoso | Usuario |
| `LOGIN_FAILED` | Login fallido (cuenta no existe, password mal) | Usuario |
| `LOGOUT` | Logout | Usuario |
| `CHANGE_PASSWORD` | Cambio de contraseña | Usuario |
| `PASSWORD_RESET_REQUESTED` | Solicitud de recuperación | Usuario |
| `PASSWORD_RESET_COMPLETED` | Reset completado | Usuario |
| `WIZARD_STEP` | Avance de paso en wizard | NUTRICIONISTA, SOCIO |
| `WIZARD_COMPLETED` | Wizard terminado | NUTRICIONISTA, SOCIO |
| `WIZARD_RESET` | Reset de wizard (admin) | ADMIN |
| `WIZARD_FORCED` | Wizard forzado a completado (admin) | ADMIN |
| `EXPORT` | Exportación de datos (PDF, etc.) | SOCIO, NUTRICIONISTA |
| `SUPRESSION_REQUESTED` | Socio solicita supresión | SOCIO |
| `SUPRESSION_PROCESSED` | Supresión procesada (cuenta cerrada) | ADMIN, RECEPCIONISTA |
| `SUPRESSION_REJECTED` | Solicitud de supresión rechazada | ADMIN, RECEPCIONISTA |
| `OVERRIDE` | Override de validación (ej. alergia confirmada) | NUTRICIONISTA, ADMIN |
| `CONFIG_CHANGE` | Cambio en configuración del gimnasio | ADMIN |

## Acciones auditadas (mapeo por feature)

Ver cada feature individual para los detalles. Resumen consolidado:

- **Nutricionista** (01, 02, 03): `CREATE`, `UPDATE`, `DEACTIVATE`, `REACTIVATE`.
- **Socio** (06, 07): `CREATE`, `UPDATE`, `DEACTIVATE`, `REACTIVATE`, `SUPRESSION_*`.
- **Ficha de salud** (08, 09): `CREATE` (cada versión), `UPDATE` (cada nueva versión), `VIEW` (apertura por nutricionista).
- **Disponibilidad** (04, 05): `UPDATE` (rangos), `CREATE`/`UPDATE` (excepciones).
- **Turnos** (11, 12, 13, 14, 15, 16): `CREATE`, `CANCEL`, `CHECKIN`, `AUTO_ABSENT`, `MANUAL_ABSENT`, `REVERT_*`, `INICIAR_CONSULTA`, `FINALIZAR_CONSULTA`.
- **Consulta** (18): `CREATE`, `UPDATE`, `CLOSE`.
- **Mediciones** (19): `CREATE`, `UPDATE`.
- **Plan alimentario** (20, 21, 22): `CREATE`, `UPDATE`, `DELETE`.
- **Sistema de alimentos** (sistema-alimentos.md): `CREATE`, `UPDATE`, `OVERRIDE` (cuando se confirma un alimento con alergia).
- **Auth** (auth.md): `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `CHANGE_PASSWORD`, `PASSWORD_RESET_*`.
- **Onboarding** (onboarding-*.md): `WIZARD_STEP`, `WIZARD_COMPLETED`, `WIZARD_RESET`, `WIZARD_FORCED`.
- **Configuración** (multi-tenant.md, archivos.md): `CONFIG_CHANGE`, `UPDATE` (gimnasio), `CREATE`/`DELETE` (archivos).
- **Compliance** (compliance.md): `EXPORT`, `SUPRESSION_*`.

## Funcionalidades

### 1. Registro (automático, transversal)
- Toda acción que modifica estado sensible se registra en `auditoria` en la **misma transacción** que la acción principal.
- Implementación: servicio `AuditoriaService.registrar(params)` invocado desde cada use-case después del cambio.
- Si la auditoría falla, la acción principal hace **rollback** (no se puede romper la atomicidad).

### 2. Consulta (admin)
- Vista de tabla con filtros: usuario, acción, entidad, rango de fechas, gimnasio.
- Paginación (50 items por página default).
- Búsqueda por texto en `motivo`.

### 3. Exportación
- Admin puede exportar la auditoría filtrada a CSV o JSON.
- **Rate limit**: 10 exports por hora por admin (evitar DoS).
- Genera archivo en `apps/backend/exports/auditoria_{timestamp}.{csv|json}`.
- URL firmada de descarga con expiración 24h.

## Reglas de negocio aplicadas
- **RB33**: Acciones sensibles registradas con metadata completa.
- **Decisión de Q&A**: Retención indefinida.
- **Decisión de Q&A**: Tablas particionadas por mes (no `PARTITION BY RANGE` nativo, ver §Implementación).

## Modelo de datos

### Entidad `Auditoria`
- `id (CHAR(36) UUID), usuario_id (CHAR(36) NULL, NULL si es el sistema), gimnasio_id (CHAR(36) NOT NULL), accion (VARCHAR(50) NOT NULL), entidad (VARCHAR(50) NOT NULL), entidad_id (CHAR(36) NULL), antes_json (JSON NULL), despues_json (JSON NULL), motivo (TEXT NULL), motivo_override (TEXT NULL), ip (VARCHAR(45) NULL), user_agent (VARCHAR(500) NULL), timestamp (DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3))`

### Constraints
- `CHECK(accion IN (catálogo))`: enum en aplicación (MySQL 8.0+ soporta CHECK enforcement).
- **Inmutabilidad**: NO hay UPDATE ni DELETE en la tabla. Solo INSERT. Se enforce a nivel DB con `BEFORE UPDATE` y `BEFORE DELETE` triggers que hacen `SIGNAL SQLSTATE '45000'`.

### Tamaño de campos JSON
- `antes_json` y `despues_json` limitado a **64 KB** (65536 bytes) en aplicación. Si excede, se trunca y se setea `motivo='JSON_TRUNCATED'`.

### Particionado por mes (MySQL 8.0+ workaround)

MySQL 8.0+ no soporta `PARTITION BY RANGE` con la misma sintaxis de PostgreSQL, pero sí con particiones nativas. **Decisión**: usar **tablas separadas por mes** (más simple, más portable, mismo efecto).

```sql
-- Script ejecutado por un cron mensual (o app startup)
CREATE TABLE IF NOT EXISTS auditoria_2026_06 LIKE auditoria_template;
-- El INSERT se hace a la tabla del mes actual via routing en la app
```

**Routing en la app**:
- `AuditoriaRepository.registrar(params)` calcula el mes actual y hace `INSERT INTO auditoria_YYYY_MM`.
- Para `SELECT`: `UNION ALL` de las tablas del rango de fechas consultado.
- Cron mensual crea la tabla del mes siguiente con 1 mes de anticipación.

**Justificación del workaround**: nativo de MySQL `PARTITION BY RANGE (TO_DAYS(timestamp))` requiere la columna `timestamp` en la PK compuesta, lo cual complica. Tablas separadas es más simple y mantiene el efecto de "rotación por mes" para archivado.

## Endpoints API

### `GET /api/admin/auditoria`
- **Auth**: ADMIN
- **Query**: `?usuarioId=...&accion=...&entidad=...&entidadId=...&fechaDesde=...&fechaHasta=...&page=1&limit=50`
- **Response 200**:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "usuarioId": "uuid",
        "usuarioEmail": "admin@nutrifit.com",
        "gimnasioId": "uuid",
        "accion": "UPDATE",
        "entidad": "nutricionista",
        "entidadId": "uuid",
        "motivo": "Cambio de duración de turno",
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2026-06-02T14:30:00.000Z"
      }
    ],
    "total": 1234,
    "page": 1,
    "limit": 50
  }
  ```
- **Errors**: 400, 401, 403, 500

### `GET /api/admin/auditoria/:id`
- **Auth**: ADMIN
- **Response 200**: detalle completo con `antes_json` y `despues_json` parseados
- **Errors**: 404, 403, 500
- **Uso**: drill-down desde la lista para ver el diff completo

### `GET /api/admin/auditoria/export`
- **Auth**: ADMIN
- **Query**: mismos filtros que el listado + `&formato=csv|json`
- **Response**: archivo binario con `Content-Disposition: attachment`
- **Rate limit**: 10 exports/hora por admin (verificado en Redis o DB).
- **Errors**: 429 (rate limit), 500

### `GET /api/admin/auditoria/estadisticas`
- **Auth**: ADMIN
- **Response 200**:
  ```json
  {
    "totalEventos": 12345,
    "porAccion": { "CREATE": 5000, "UPDATE": 4000, ... },
    "porEntidad": { "turno": 8000, "nutricionista": 500, ... },
    "ultimos30Dias": 1234,
    "tamañoTablaActual": "2.5 GB"
  }
  ```
- **Errors**: 403, 500

## Implementación

### Servicio de auditoría
- `AuditoriaService.registrar(params)` con la firma:
  ```typescript
  interface RegistrarAuditoriaParams {
    usuarioId: string | null;
    gimnasioId: string;
    accion: AccionAuditoria;
    entidad: string;
    entidadId?: string | null;
    antesJson?: any | null;
    despuesJson?: any | null;
    motivo?: string | null;
    motivoOverride?: string | null;
    request?: Request; // Para extraer IP y user agent
  }
  ```
- Calcula el mes actual (`YYYY_MM`) y hace `INSERT INTO auditoria_YYYY_MM`.
- Trunca `antesJson`/`despuesJson` a 64KB si exceden.
- **NO se puede usar fuera de una transacción activa**: la app garantiza que cada use-case que llama a `auditoriaService.registrar()` está dentro de una transacción TypeORM.

### Extracción de IP y user agent
- Helper en middleware HTTP: `getRequestContext(req) -> { ip, userAgent }`.
- IP: `req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip`.
- User agent: `req.headers['user-agent']`.

### Cron de creación de particiones
- BullMQ repeatable job (cron `0 0 1 * *` — primer día de cada mes a las 00:00).
- Crea la tabla del mes siguiente con la misma estructura que `auditoria_template`.
- Si falla, alerta admin.

### Triggers de inmutabilidad
```sql
DELIMITER //
CREATE TRIGGER auditoria_2026_06_no_update
BEFORE UPDATE ON auditoria_2026_06
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Auditoria es inmutable';
END//

CREATE TRIGGER auditoria_2026_06_no_delete
BEFORE DELETE ON auditoria_2026_06
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Auditoria es inmutable';
END//
DELIMITER ;
```

## Edge cases

- **B1**: Volumen alto → particionado mensual resuelve queries. Índices `(gimnasio_id, timestamp)`, `(entidad, entidad_id)`.
- **B2**: Admin de varios gimnasios → filtra por gimnasio activo del JWT. Para ver auditoría de OTRO gimnasio, debe cambiar de gimnasio activo.
- **B3**: Admin y RECEPCIONISTA del mismo gimnasio → ¿ven lo mismo? **Decisión: solo ADMIN ve auditoría**. RECEPCIONISTA no tiene acceso. (Endurecimiento de seguridad: el admin es el responsable de tratamiento de datos.)
- **B4**: Auditoría con JSON > 64KB → se trunca con flag `motivo='JSON_TRUNCATED'`. Decisión dura, no configurable.
- **B5**: Auditoría del sistema (job) → `usuario_id=NULL`, `accion` empieza con `AUTO_` o incluye `JOB_` para distinguir.
- **B6**: Multi-tenant leak prevention → TODA query filtra por `gimnasio_id`. Tests de aislamiento obligatorios.
- **B7**: Reasignación de gimnasio del socio → la auditoría conserva el `gimnasio_id` del CONTEXTO de la acción (no el actual). Esto permite ver "qué gimnasio ejecutó la acción" históricamente.
- **B8**: Export falla a mitad de generación → el archivo parcial se borra, se loguea el error, admin puede reintentar.
- **B9**: Tabla del mes no existe (caso borde en deploy inicial) → el servicio la crea on-the-fly antes del INSERT (transacción con IF NOT EXISTS).

## Tests

### Unitarios
- `auditoria.service.ts`:
  - Registra entrada con metadata completa
  - Trunca JSON > 64KB
  - Selecciona tabla del mes correcto
  - Crea tabla on-the-fly si no existe
- `consultar-auditoria.use-case.ts`:
  - Filtros funcionan
  - Paginación correcta
  - Solo del gimnasio del admin (multi-tenant)
  - Búsqueda por texto en motivo
- `exportar-auditoria.use-case.ts`:
  - Genera CSV válido
  - Genera JSON válido
  - Rate limit (10/h)
  - URL firmada con expiración

### Integración
- Test crítico: ejecutar una acción completa (ej. crear nutricionista) y verificar que la entrada de auditoría tiene metadata completa (usuario, IP, user agent, antes/después, motivo).

### E2E (manual)
- Login como admin → ver listado de auditoría con eventos del último día.
- Filtrar por entidad "turno" → ver eventos de turnos.
- Click en evento → ver diff antes/después.
- Exportar CSV → abrir y verificar formato.

## Notas
- La tabla de auditoría es CRÍTICA para compliance. Backups frecuentes (responsabilidad de DevOps).
- **El test más importante**: "ninguna acción sensible del sistema puede ejecutarse sin generar entrada de auditoría". Cubrir con tests de integración por cada use-case crítico.
- En iter 2+ se puede considerar:
  - Archivado a storage frío después de 2 años.
  - Replicación a sistema de analytics separado.
  - Búsqueda full-text en `motivo` (MySQL FULLTEXT index).
- **Visibilidad cross-admin**: solo ADMIN del gimnasio ve la auditoría. RECEPCIONISTA no. Decisión de seguridad.
