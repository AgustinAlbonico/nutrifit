# Design: ficha-salud (CU-08 + CU-09)

**Change ID**: ficha-salud
**Phase**: design
**Date**: 2026-06-03
**Source artifacts**: `openspec/changes/ficha-salud/{proposal.md, explore.md, specs/*.md}`
**Persistence**: OpenSpec + Engram (BOTH)

---

## 1. Resumen de arquitectura

El change evoluciona `FichaSalud` (módulo `turnos`) de un upsert simple a un modelo inmutable: cada POST/PUT crea una nueva fila en `FichaSaludVersion` y actualiza el puntero `version_actual_id` en `FichaSalud`. Mantenemos el código en `TurnosModule` y emitimos eventos a `NotificacionesService` (sin DomainEvent base, siguiendo el patrón `TURNO_RESERVADO`). El fix RB14 endurece `ReservarTurnoSocioUseCase` para chequear `completada=true`. El frontend agrega un banner "Última edición", un checkbox de consentimiento (RB44, solo primera vez), un modal de historial, y un modal de consentimiento RGPD.

---

## 2. Backend — Modelo de datos

### Entidad `FichaSalud` (modificada)

Tabla: `ficha_salud`. Solo se documentan las **columnas nuevas o modificadas**; las pre-existentes (altura, peso, etc.) no cambian.

| Columna (DB) | Tipo TypeORM | Tipo TS | Nullable | Default | Constraints | Propósito / RB |
|---|---|---|---|---|---|---|
| `completada` | `boolean` | `boolean` | NO | `false` | — | Flag RB14, RB50 |
| `completada_at` | `datetime` | `Date \| null` | YES | `null` | — | Timestamp de primera completitud (RB50, RB15) |
| `actualizada_at` | `datetime` | `Date \| null` | YES | `null` | — | Última edición (RB15, RB42) |
| `consent_at` | `datetime` | `Date \| null` | YES | `null` | — | RGPD (RB44) |
| `version_actual_id` | `int` | `number \| null` | YES | `null` | FK → `ficha_salud_version.id_ficha_salud_version` (ON DELETE RESTRICT) | Puntero a la versión vigente (RB50) |
| `revisada_por_nutricionista_at` | `datetime` | `Date \| null` | YES | `null` | — | RB45 — leído por nutricionista al abrir |

`fecha_creacion` (existente) sigue siendo la fecha de inserción. `updated_at` lo maneja `AuditableOrmEntity`.

### Entidad `FichaSaludVersion` (nueva)

Tabla: `ficha_salud_version`. **Inmutable**: el repository expone solo `save()` (insert). No hay `update` ni `delete` en código de aplicación. Regla de código: el ORM entity no expone método `update` y se documenta en el comentario de la clase.

| Columna (DB) | Tipo TypeORM | Tipo TS | Nullable | Default | Constraints | Propósito / RB |
|---|---|---|---|---|---|---|
| `id_ficha_salud_version` | `int` PK auto-increment | `number` | NO | — | PK | Identificador |
| `id_ficha_salud` | `int` | `number` | NO | — | FK → `ficha_salud.id_ficha_salud` (ON DELETE CASCADE) | Vinculación al aggregate root |
| `id_socio` | `int` | `number` | NO | — | FK → `persona.id_persona` (ON DELETE RESTRICT), INDEX | Para queries directos sin JOIN |
| `version` | `int` | `number` | NO | — | UNIQUE(`id_ficha_salud`, `version`) | Secuencia por ficha (RB50, RB29) |
| `datos_json` | `json` | `Record<string, unknown>` | NO | — | — | Snapshot completo: altura, peso, nivel, objetivo, alergias[], patologias[], medicacion, suplementos, cirugias, antecedentes, frecuencia, agua, restricciones, alcohol, tabaco, sueno, contacto (RB50) |
| `created_at` | `datetime` | `Date` | NO | `CURRENT_TIMESTAMP` | — | Cuándo se creó esta versión |
| `created_by` | `int` | `number \| null` | YES | `null` | FK → `usuario.id_usuario` | Quién la creó (en esta iteración siempre el socio dueño, pero deja puerta abierta a nutricionista) |

**Decisión de inmutabilidad**: no usamos `BEFORE UPDATE` triggers (MySQL los soportaría pero añade acoplamiento). En su lugar, **regla de código**: `FichaSaludVersionRepository` no expone `update()` ni `delete()`. Esto es defendible con tests (un test verifica que el repo no expone tales métodos). El seed nunca borra versiones; el down de la migración las borra solo en rollback.

### Índices

| Índice | Tabla | Columnas | Tipo | Motivo |
|---|---|---|---|---|
| `idx_fsv_ficha_version` | `ficha_salud_version` | `id_ficha_salud`, `version` | UNIQUE | RB50, previene duplicar número de versión |
| `idx_fsv_socio` | `ficha_salud_version` | `id_socio` | INDEX | Query endpoint nutricionista |
| `idx_fsv_created_at` | `ficha_salud_version` | `created_at` | INDEX | Ordenar historial DESC |
| `idx_fs_socio` | `ficha_salud` | (socio_id) ya existe como UNIQUE vía `OneToOne` | — | RB14 ya garantizado |
| `idx_fs_completada` | `ficha_salud` | `completada` | INDEX | Optimiza query RB14 (socios sin ficha completa) |

### Migración

**Archivo**: `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603000000-FichaSaludVersionado.ts`

`up`:
1. `CREATE TABLE ficha_salud_version (...)` con todas las columnas, FKs a `ficha_salud` y `persona`, UNIQUE(`id_ficha_salud`,`version`), INDEX(`id_socio`), INDEX(`created_at`).
2. `ALTER TABLE ficha_salud ADD COLUMN completada boolean NOT NULL DEFAULT false`.
3. `ALTER TABLE ficha_salud ADD COLUMN completada_at datetime NULL`.
4. `ALTER TABLE ficha_salud ADD COLUMN actualizada_at datetime NULL`.
5. `ALTER TABLE ficha_salud ADD COLUMN consent_at datetime NULL`.
6. `ALTER TABLE ficha_salud ADD COLUMN version_actual_id int NULL` + FK a `ficha_salud_version`.
7. `ALTER TABLE ficha_salud ADD COLUMN revisada_por_nutricionista_at datetime NULL`.
8. `CREATE INDEX idx_fs_completada ON ficha_salud (completada)`.
9. **Datos existentes (backfill)**: para cada fila en `ficha_salud`:
   - `completada = true` (asumimos que si existe, está completada — caso conservador; no hay fichas huérfanas "incompletas" porque la app no lo permitía).
   - `completada_at = fecha_creacion` (o `NOW()` si `fecha_creacion` es null por algún motivo histórico).
   - `actualizada_at = fecha_creacion`.
   - `consent_at = fecha_creacion` (pre-RGPD implícito: si la subió, consintió).
   - Crear `FichaSaludVersion v1` con `datos_json` reconstruido de la fila actual (altura, peso, etc.) — **una query que lea cada ficha y arme el JSON**.

`down`:
1. `DROP INDEX idx_fs_completada ON ficha_salud`.
2. `ALTER TABLE ficha_salud DROP COLUMN revisada_por_nutricionista_at`.
3. `ALTER TABLE ficha_salud DROP FOREIGN KEY (version_actual_id)`, `DROP COLUMN version_actual_id`.
4. `ALTER TABLE ficha_salud DROP COLUMN consent_at`.
5. `ALTER TABLE ficha_salud DROP COLUMN actualizada_at`.
6. `ALTER TABLE ficha_salud DROP COLUMN completada_at`.
7. `ALTER TABLE ficha_salud DROP COLUMN completada`.
8. `DROP TABLE ficha_salud_version`.

**Notas backfill**: el backfill se hace en una sola transacción lógica por lote para no bloquear. Se registra log con conteo de fichas backfilleadas.

---

## 3. Backend — Use cases

### `UpsertFichaSaludSocioUseCase` (modificado)

**Signature**:
```typescript
async ejecutar(userId: number, payload: UpsertFichaSaludSocioDto): Promise<FichaSaludSocioResponseDto>
```

**Input DTO** (modificado, conserva shape):
```typescript
class UpsertFichaSaludSocioDto {
  altura: number;             // 100..250 (cm)
  peso: number;               // 20..500 (kg)  -- ver nota A2
  nivelActividadFisica: NivelActividadFisica;
  objetivoPersonal: string;   // 1..500
  alergias?: string[];
  patologias?: string[];
  medicacionActual?: string | null;
  suplementosActuales?: string | null;
  cirugiasPrevias?: string | null;
  antecedentesFamiliares?: string | null;
  frecuenciaComidas?: FrecuenciaComidas | null;
  consumoAguaDiario?: number | null;  // 0..10 (litros)
  restriccionesAlimentarias?: string | null;
  consumoAlcohol?: ConsumoAlcohol | null;
  fumaTabaco?: boolean;
  horasSueno?: number | null;  // 0..24
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  // NUEVO:
  consentimiento?: boolean;    // OBLIGATORIO true si ficha no existe
}
```

**Output DTO** (extendido):
```typescript
class FichaSaludSocioResponseDto {
  socioId: number;
  fichaSaludId: number;
  // ... campos existentes ...
  // NUEVOS:
  completada: boolean;
  completadaAt: Date | null;
  actualizadaAt: Date | null;
  consentAt: Date | null;
  versionActual: number;        // número de versión
}
```

**Pasos (pseudo)**:
1. Resolver socio por `userId` (igual que hoy).
2. `dataSource.transaction()`: ver §Transacciones.
3. Determinar si es **creación** (`!ficha`) o **edición** (`ficha.completada === true`).
4. Si es creación:
   - Validar `payload.consentimiento === true` (RB44). Si no → `BadRequestError("Se requiere consentimiento expreso para almacenar la ficha")`.
   - `ficha.completada = true; ficha.completadaAt = now(); ficha.consentAt = now();`.
5. Si es edición:
   - Validar **NO** requerir `consentimiento` (RB44: solo la primera vez). Si viene, se ignora silenciosamente.
   - `ficha.actualizadaAt = now()`.
6. Resolver alergias y patologías (idéntico a hoy — `resolveAlergias`/`resolvePatologias`).
7. Mapear todos los campos del payload a la ficha (idéntico a hoy, más los nuevos flags).
8. `fichaSaludRepository.save(ficha)` (update si existe, insert si no).
9. Construir `datosJson` = snapshot completo de la ficha post-guardado.
10. Calcular `nuevaVersion = (ficha.versionActualId ? ultimaVersion + 1 : 1)`. Lectura: `SELECT MAX(version) FROM ficha_salud_version WHERE id_ficha_salud = ?` con row-level lock.
11. `fichaSaludVersionRepository.save({idFichaSalud: ficha.idFichaSalud, idSocio: socio.idPersona, version: nuevaVersion, datosJson, createdBy: userId})`.
12. `ficha.versionActualId = nuevaVersion.id`.
13. `fichaSaludRepository.save(ficha)`.
14. `auditoriaService.registrar(...)` con `accion` y `antes/despues` (ver §6).
15. Commit.
16. **Post-commit** (fuera de transacción):
    - Si es creación → `notificacionesService.crear({tipo: FICHA_COMPLETADA, ...})` (ver §5).
    - Si es edición → `notificacionesService.crear({tipo: FICHA_ACTUALIZADA, ...})` (ver §5).
17. Devolver `FichaSaludSocioResponseDto` con `versionActual: nuevaVersion`.

**Efectos secundarios**:
- **Auditoría**: ver §6. `ACCION_FICHA_COMPLETADA` en create, `ACCION_FICHA_ACTUALIZADA` en edit. Payload antes/después con shape especial (ver §6).
- **Eventos/notificaciones**: post-commit, sincrónico al servicio de notificaciones (mismo patrón que `TURNO_RESERVADO`).
- **Errores**: `BadRequestError` con códigos:
  - `400` "Complete todos los campos obligatorios" (validación DTO).
  - `400` "La altura debe estar entre 100 y 250 cm" (validación DTO).
  - `400` "El peso debe estar entre 20 y 500 kg" (validación DTO).
  - `400` "Se requiere consentimiento expreso para almacenar la ficha" (RB44).
  - `404` "Socio no encontrado" (existente).

**Transacciones**: sí, todo el bloque desde paso 2 hasta paso 13 va dentro de `dataSource.transaction()`. La notificación se hace **post-commit** (paso 16) para no enviar emails de fichas que se rolled-backean.

**Tests unitarios**:
- Happy path crear con todos los campos → assert `version=1`, `completada=true`, `consentAt=now()`, `auditoriaService.registrar` llamado con `FICHA_COMPLETADA`.
- Happy path editar → assert `version=2`, `actualizadaAt` updated, `consentAt` intacto, `auditoria` con `FICHA_ACTUALIZADA` y antes/después.
- Validación altura fuera de rango → lanza BadRequest (delegado a ValidationPipe, pero hay test unitario del DTO con `validateOrReject`).
- Validación peso fuera de rango → mismo.
- Validación enums (NivelActividadFisica, FrecuenciaComidas, ConsumoAlcohol) → `validateOrReject` falla.
- Consentimiento en creación: false → BadRequest.
- Consentimiento en edición: false → éxito, no se modifica `consentAt`.
- Consentimiento en edición: true explícito → éxito, no se modifica `consentAt`.
- Versionado: tres llamadas consecutivas → versiones 1, 2, 3.
- Race condition: dos PATCH concurrentes → uno gana con versión N+1, el otro con N+2 (no se pierde ninguna).
- Notificación post-commit: en happy path se llama una vez con tipo correcto; en caso de error DB no se llama.

### `ListarHistorialFichaSaludUseCase` (nuevo)

**Signature**:
```typescript
async ejecutar(userId: number): Promise<HistorialFichaSaludItemDto[]>
```

**Output DTO**:
```typescript
class HistorialFichaSaludItemDto {
  version: number;
  versionId: number;
  createdAt: Date;
  createdBy: number | null;
}
```

**Pasos**:
1. Resolver socio.
2. Si `!socio.fichaSalud` → `NotFoundError("No se encontraron fichas de salud")`.
3. `fichaSaludVersionRepository.find({where: {idFichaSalud: socio.fichaSalud.idFichaSalud}, order: {version: 'DESC'}})`.
4. Mapear a DTO resumido (sin `datosJson`).
5. Retornar array (puede ser vacío si el backfill no se ejecutó, lo cual sería un bug del deploy).

**Tests**:
- Socio sin ficha → 404.
- Socio con 3 versiones → array de 3, ordenado DESC.
- Cada item tiene `version`, `versionId`, `createdAt` (no `datosJson`).

### `ObtenerVersionFichaSaludUseCase` (nuevo)

**Signature**:
```typescript
async ejecutar(userId: number, n: number): Promise<DatosFichaSaludVersionDto>
```

**Output DTO**:
```typescript
class DatosFichaSaludVersionDto {
  version: number;
  createdAt: Date;
  datos: Record<string, unknown>;  // deserializado de datos_json
}
```

**Pasos**:
1. Resolver socio.
2. Si `!socio.fichaSalud` → 404.
3. `fichaSaludVersionRepository.findOne({where: {idFichaSalud, version: n}})`.
4. Si no existe → `NotFoundError("Versión no encontrada")`.
5. Retornar DTO con `datos` parseado.

**Tests**:
- Versión existente → retorna datos.
- Versión inexistente (n=99 cuando hay 2) → 404.
- Socio sin ficha → 404.

### `ReservarTurnoSocioUseCase` (modificado — RB14 fix)

Solo cambia la condición al inicio (línea 71 actual):

```diff
- if (!socio.fichaSalud) {
+ if (!socio.fichaSalud || !socio.fichaSalud.completada) {
   throw new BadRequestError(
-    'Debe completar su ficha de salud antes de reservar un turno.',
+    'Debe completar su ficha de salud antes de reservar un turno. La ficha debe estar marcada como completada.',
   );
 }
```

**No** se carga `fichaSalud.completada` actualmente en `relations` — sí, sí: línea 187 ya tiene `relations: {fichaSalud: true}`. Por lo tanto, el cambio de la condición basta. Si en el futuro se hace eager:false, agregar `completada` a la selección explícita.

**Tests unitarios** (extender `reservar-turno-socio.use-case.spec.ts`):
- `RB14: bloquea si ficha es null` (existente, asegurar que sigue).
- `RB14: bloquea si ficha existe pero completada=false` (nuevo).
- `RB14: permite si ficha existe y completada=true` (nuevo).

### `GetFichaSaludSocioUseCase` (modificado — output enriquecido)

Solo agrega los nuevos campos al DTO de respuesta: `completada`, `completadaAt`, `actualizadaAt`, `consentAt`, `versionActual`. No cambia lógica.

**Tests**: extender el actual (si existe) con assert de nuevos campos.

### `GetFichaSaludPacienteUseCase` (sin cambios — RB16 ya cubierto)

Ver §8.

---

## 4. Backend — Controllers / Endpoints

Todos van en `apps/backend/src/presentation/http/controllers/turnos.controller.ts` (controller existente). Mantener consistencia de paths (`/turnos/...`).

| Method + Path | Auth Guard + Roles | Body DTO | Response | Códigos de error |
|---|---|---|---|---|
| `GET /turnos/socio/ficha-salud` (existente) | `JwtAuthGuard + RolesGuard + ActionsGuard`, `@Rol(SOCIO)` | — | `FichaSaludSocioResponseDto` o `null` (404 en controller → `null`) | 401, 403, 404 |
| `PUT /turnos/socio/ficha-salud` (existente, ahora crea o edita) | `@Rol(SOCIO)` | `UpsertFichaSaludSocioDto` (con `consentimiento` opcional) | `FichaSaludSocioResponseDto` | 400 (validación, RB44), 401, 403 |
| `GET /turnos/socio/ficha-salud/historial` (nuevo) | `@Rol(SOCIO)` | — | `HistorialFichaSaludItemDto[]` | 401, 403, 404 |
| `GET /turnos/socio/ficha-salud/version/:n` (nuevo) | `@Rol(SOCIO)` | — | `DatosFichaSaludVersionDto` | 401, 403, 404 |
| `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial` (nuevo, RB13) | `@Rol(NUTRICIONISTA) + NutricionistaOwnershipGuard` | — | `HistorialFichaSaludItemDto[]` | 401, 403, 404 |
| `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/version/:n` (nuevo) | `@Rol(NUTRICIONISTA) + NutricionistaOwnershipGuard` | — | `DatosFichaSaludVersionDto` | 401, 403, 404 |

**Decisión**: el spec original pide `GET /api/socios/me/ficha-salud/...` pero el codebase ya usa `/turnos/socio/ficha-salud/...`. Mantenemos `/turnos/...` por consistencia (decisión de proposal).

---

## 5. Backend — Eventos y notificaciones

### `FICHA_COMPLETADA`

- **Cuándo**: post-commit del bloque transaccional de `UpsertFichaSaludSocioUseCase`, solo en creación.
- **No se introduce un DomainEvent base**. Se invoca `notificacionesService.crear({...})` directamente (mismo patrón que `ReservarTurnoSocioUseCase` línea 149-156).
- **Tipo de notificación**: extender el enum `TipoNotificacion` en `packages/shared/src/types/notificacion.ts` con `FICHA_COMPLETADA = 'FICHA_COMPLETADA'`. Mantiene simetría con `TURNO_RESERVADO` etc.
- **Payload**:
```typescript
{
  destinatarioId: socio.idPersona,
  tipo: TipoNotificacion.FICHA_COMPLETADA,
  titulo: 'Ficha de salud completada',
  mensaje: 'Tu ficha de salud fue completada exitosamente. Ya podés reservar turnos con nuestros nutricionistas.',
  metadata: { fichaSaludId: ficha.idFichaSalud, version: 1 }
}
```
- **Email**: NO en iteración actual (fuera de scope por decisión de usuario). Solo notificación in-app. La decisión de proposal: "emails to socio on FICHA_COMPLETADA / FICHA_ACTUALIZADA". **Esto requiere el servicio de email**. Verificar si existe en `apps/backend/src/infrastructure/services/email/` o `apps/backend/src/infrastructure/services/notificaciones/`. Si no existe, **bloqueante para PR1**: hay que agregar un EmailService stub o diferir a PR3.

**Subject del email (placeholder)**:
> "Tu ficha de salud de NutriFit está completa"

**Body**:
> "Hola {nombre}, confirmamos que guardamos tu ficha de salud. Ya podés reservar turnos con nuestros nutricionistas desde la app. Ante cualquier duda, contactanos."

### `FICHA_ACTUALIZADA`

- **Cuándo**: post-commit, en edición.
- **Tipo**: `TipoNotificacion.FICHA_ACTUALIZADA = 'FICHA_ACTUALIZADA'`.
- **Payload**:
```typescript
{
  destinatarioId: socio.idPersona,
  tipo: TipoNotificacion.FICHA_ACTUALIZADA,
  titulo: 'Ficha de salud actualizada',
  mensaje: `Tu ficha de salud fue actualizada (versión ${nuevaVersion}). Los cambios se guardaron correctamente.`,
  metadata: { fichaSaludId, version: nuevaVersion }
}
```

**Email**:
> "Tu ficha de salud fue actualizada"
> "Hola {nombre}, registramos la versión {n} de tu ficha de salud."

### Anti-patterns a evitar

- **No usar DomainEvent base** (decidido en proposal). Llamada directa a `notificacionesService.crear({...})`.
- **No emitir eventos dentro de la transacción** (post-commit). Si la DB rollbackea, no debe quedar email enviado.
- **No emitir eventos al nutricionista vinculado** en esta iteración (out of scope).

---

## 6. Backend — Auditoría

### Extensión de `AccionAuditoria`

Archivo: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` (línea 13).

```diff
 export enum AccionAuditoria {
   LOGIN_EXITO = 'LOGIN_EXITO',
   ...
+  FICHA_COMPLETADA = 'FICHA_COMPLETADA',
+  FICHA_ACTUALIZADA = 'FICHA_ACTUALIZADA',
   ...
 }
```

### Llamadas en use cases

En `UpsertFichaSaludSocioUseCase`, **dentro de la transacción, después del save**:

```typescript
await this.auditoriaService.registrar({
  usuarioId: userId,
  accion: esCreacion ? AccionAuditoria.FICHA_COMPLETADA : AccionAuditoria.FICHA_ACTUALIZADA,
  entidad: 'ficha_salud',
  entidadId: socio.fichaSalud.idFichaSalud,
  metadata: {
    versionActual: nuevaVersion,
    // Shape especial — ver abajo
  }
});
```

### Shape de `metadata.antes_json` y `despues_json`

**Restricción del spec de auditoría** (RB33 + nota de CU-08): "para CREATE el `despues_json` solo trae confirm de creación (no datos clínicos innecesarios)".

**Decisión**: usamos el campo `metadata` del `AuditoriaDto` (que es un JSON libre), y dentro de él estructuramos:

**CREATE (`FICHA_COMPLETADA`)**:
```json
{
  "version": 1,
  "fichaSaludId": 123,
  "socioId": 456,
  "consentAt": "2026-06-03T12:00:00Z",
  "resumen": { "altura": 175, "peso": 80, "alergiasCount": 2, "patologiasCount": 0 }
}
```
NO se vuelcan campos clínicos completos (medicacion, antecedentes, embarazo, etc.) para minimizar exposición en logs y backups.

**UPDATE (`FICHA_ACTUALIZADA`)**:
```json
{
  "version": 2,
  "versionAnterior": 1,
  "fichaSaludId": 123,
  "socioId": 456,
  "antes": { "altura": 175, "peso": 80 },
  "despues": { "altura": 175, "peso": 78 },
  "camposModificados": ["peso"]
}
```
SÍ se incluyen diff de campos (no el JSON completo), usando una función `calcularDiffSimple(antes, despues)` que compara por campo y retorna solo los modificados.

**Helper**: `apps/backend/src/application/turnos/helpers/calcular-diff-ficha.helper.ts` (puro, sin DI, fácil de testear).

---

## 7. Backend — RB14 Fix

Diff conceptual exacto en `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.ts:71`:

```diff
-    if (!socio.fichaSalud) {
+    if (!socio.fichaSalud || !socio.fichaSalud.completada) {
       throw new BadRequestError(
-        'Debe completar su ficha de salud antes de reservar un turno.',
+        'Debes completar y tener completada tu ficha de salud antes de reservar un turno.',
       );
     }
```

Nota: la línea 187 ya carga `relations: {fichaSalud: true}`. Sin embargo, el campo `completada` se cargará solo si la columna ya existe. Con la migración que agrega `completada`, queda automáticamente disponible. Si TypeORM con `eager:false` por defecto no incluye columnas nuevas sin un refresh, verificar: como `FichaSaludOrmEntity` extiende `AuditableOrmEntity` y usa `@PrimaryGeneratedColumn`/`@Column` explícitos, la entidad reflejará `completada` después del redeploy. No requiere cambio aquí.

---

## 8. Backend — RB16 (RECEPCIONISTA no ve datos clínicos)

**Estado actual**:
- Endpoint `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud` (turnos.controller.ts:236) está protegido con `@Rol(RolEnum.NUTRICIONISTA)` + `NutricionistaOwnershipGuard`. RECEPCIONISTA recibe 403 del `RolesGuard`.
- Endpoint `PUT /turnos/socio/ficha-salud` y `GET /turnos/socio/ficha-salud` están con `@Rol(RolEnum.SOCIO)`. RECEPCIONISTA recibe 403.

**Verificación**: grepear `Rol(RolEnum.RECEPCIONISTA)` en `turnos.controller.ts` para asegurar que ningún endpoint de ficha-salud lo incluya. **Confirmado por lectura**: no hay.

**Acción**: no requiere cambio de código. Documentar en §15 (Acceptance criteria) que la verificación es por tests de integración que llamen a esos endpoints con `Rol.RECEPCIONISTA` y esperen 403.

**Ojo**: `GetFichaSaludPacienteUseCase` filtra por turno previo (`hasTurnoVinculo`). Si un nutricionista nuevo intenta ver la ficha de un socio sin turnos, recibe 403 (correcto, es RB13). El nuevo endpoint de historial para nutricionista (`GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial`) también debe pasar por `NutricionistaOwnershipGuard` (ya listado en §4).

---

## 9. Frontend — Componentes

### Tree de componentes

```
FichaSaludSocio (page, modificada)
├── BannerCabecera (existente, simplificado)
├── FichaSaludBannerUltimaEdicion (NUEVO)   ← muestra "Última edición: DD/MM/YYYY HH:mm"
├── FichaSaludWizard (existente, refactorizado a componente)
│   ├── SeccionAntropometria (existente)
│   ├── SeccionHabitos (existente)
│   ├── SeccionAlergiasPatologias (existente)
│   ├── SeccionMedicacion (existente)
│   ├── SeccionHistorial (existente)
│   ├── SeccionAlimentacion (existente)
│   ├── SeccionVida (existente)
│   ├── SeccionEmergencia (existente)
│   └── SeccionConsentimiento (NUEVO)        ← checkbox + texto RGPD, solo primera vez
├── FichaSaludConsentimientoModal (NUEVO)   ← modal RGPD detallado al crear
├── FichaSaludHistorialModal (NUEVO)        ← modal lista de versiones
│   └── FichaSaludVersionDetalle (NUEVO)    ← vista read-only de una versión
├── BotonVerHistorial (NUEVO)               ← abre FichaSaludHistorialModal
└── ToastExito (existente, refactorizado)
```

### Componentes nuevos o modificados — detalle

#### `FichaSaludBannerUltimaEdicion` (NUEVO)

```typescript
interface Props {
  fecha: Date | null;     // vienes de ficha.actualizadaAt
}

interface State { /* no state */ }
```

- Renderiza banner superior con `role="status"` y `aria-live="polite"`.
- Si `fecha` es null y `ficha.completada` es true → texto "Última edición: desconocida" (caso de backfill pre-migración).
- Si `ficha.completada` es false → no se renderiza.
- Formato: `"Última edición: 03/06/2026 14:30"`. Helper: `formatFechaCorta()` en `lib/fechas.ts`.
- **Accesibilidad**: color de fondo ámbar suave (similar al Card existente), texto contrastado AA. `aria-label` redundante para screen reader.

#### `SeccionConsentimiento` (NUEVO, dentro del wizard)

```typescript
interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;     // true en modo edición
  required: boolean;      // true en modo creación
  onAbrirModalRGPD: () => void;
}
```

- Checkbox shadcn `<Checkbox>` con Label `required` (asterisco) si `required === true`.
- Texto: "Acepto almacenar mi información de salud conforme a la política de privacidad."
- Link inline "Ver detalle" que llama a `onAbrirModalRGPD` (abre `FichaSaludConsentimientoModal`).
- En modo edición: `disabled` true, texto "Consentimiento expresado el DD/MM/YYYY" (de `consentAt`).
- **Validación cliente**: el submit se bloquea si `!checked && required`.

#### `FichaSaludConsentimientoModal` (NUEVO)

```typescript
interface Props {
  open: boolean;
  onClose: () => void;
  onAceptar: () => void;       // marca checked
  fechaConsentimiento?: Date;  // en modo edición muestra la fecha
}
```

- Usa shadcn `<Dialog>` (o `<Sheet>` según el ancho).
- Contenido: 3-4 párrafos en lenguaje claro sobre qué se almacena, quién accede (socio, nutricionistas con turno, no RECEPCIONISTA), cómo ejercer derechos ARCO.
- Botón "Aceptar" cierra y notifica al padre.
- **Accesibilidad**: focus trap (lo provee shadcn), `aria-labelledby` apuntando al título, `aria-describedby` al cuerpo.

#### `FichaSaludHistorialModal` (NUEVO)

```typescript
interface Props {
  open: boolean;
  onClose: () => void;
  versiones: HistorialItem[];        // fetcheado al abrir
  cargando: boolean;
  onSeleccionarVersion: (n: number) => void;
  versionSeleccionada: number | null;
}
```

- Lista shadcn `<Command>` o `<ScrollArea>` con items `{version, fecha}`.
- Click en un item → `onSeleccionarVersion(n)` → renderiza `FichaSaludVersionDetalle` en panel derecho (split) o en modal anidado.
- Botón "Cerrar".
- **Accesibilidad**: `role="dialog"`, navegación con flechas, Enter para seleccionar.

#### `FichaSaludVersionDetalle` (NUEVO)

```typescript
interface Props {
  version: number;
  datos: DatosFichaSalud;   // shape completo
  cargando: boolean;
}
```

- Renderiza los mismos campos que el wizard pero todos `disabled` (read-only).
- Banner: "Versión N — DD/MM/YYYY" (read-only, semánticamente `<fieldset disabled>`).

#### `FichaSaludSocio` (PÁGINA, modificada)

**Props**: ninguna (página top-level). **Estado interno** (todos `useState` con naming `snake_case` español):

```typescript
const [formulario, setFormulario] = useState<FormularioFichaSalud>(FORMULARIO_INICIAL);
const [consentimiento, setConsentimiento] = useState(false);
const [modalConsentimientoAbierto, setModalConsentimientoAbierto] = useState(false);
const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
const [versionConsultada, setVersionConsultada] = useState<number | null>(null);
const [cargando, setCargando] = useState(true);
const [guardando, setGuardando] = useState(false);
const [error, setError] = useState<string | null>(null);
const [mensajeExito, setMensajeExito] = useState<string | null>(null);
const [fichaExistente, setFichaExistente] = useState(false);
```

**Hooks utilizados**:
- `useAuth()` para token/rol.
- `useCallback` para `cargarFichaSalud`, `cargarHistorial`, `manejarEnvio`.
- `useEffect` para cargar al montar.
- `useMemo` para `formularioValido` (incorpora `consentimiento` si es creación).

**Validación cliente** (Zod, ver §10):
- `formularioValido` ahora chequea también `consentimiento === true` si `!fichaExistente`.
- Errores de validación se muestran inline (igual que hoy).

**Mensajes**:
- Error: "No se pudo guardar la ficha. Verificá los datos e intentá nuevamente."
- Éxito creación: "Ficha de salud completada. Ya podés reservar turnos."
- Éxito edición: "Ficha actualizada correctamente."

**Accesibilidad de la página**:
- `<main role="main" aria-labelledby="titulo-ficha">`.
- `h1` con id `titulo-ficha`.
- Errores con `aria-live="assertive"`.
- Éxitos con `aria-live="polite"`.

---

## 10. Frontend — Estado y data fetching

### Custom hooks nuevos o modificados

El proyecto usa **React Query** (`@tanstack/react-query`) según `apps/frontend/AGENTS.md`. El frontend actual NO usa React Query en `FichaSaludSocio.tsx` — usa `apiRequest` directo. **Decisión**: introducir React Query solo para los hooks NUEVOS (historial, versión), mantener `useState` para el upsert simple. Esto evita refactor masivo y mantiene el PR2 < 800 líneas.

```typescript
// useObtenerHistorialFicha.ts
export function useObtenerHistorialFicha() {
  return useQuery({
    queryKey: ['ficha-salud', 'historial'],
    queryFn: async () => {
      const res = await solicitudApi<{ data: HistorialItem[] }>(
        '/turnos/socio/ficha-salud/historial',
        { method: 'GET' }
      );
      return res.data;
    },
    enabled: false,           // solo se fetchea al abrir el modal
    staleTime: 60_000,
  });
}

// useObtenerVersionFicha.ts
export function useObtenerVersionFicha(n: number | null) {
  return useQuery({
    queryKey: ['ficha-salud', 'version', n],
    queryFn: async () => {
      if (n == null) return null;
      const res = await solicitudApi<{ data: DatosVersion }>(
        `/turnos/socio/ficha-salud/version/${n}`,
        { method: 'GET' }
      );
      return res.data;
    },
    enabled: n != null,
    staleTime: 5 * 60_000,
  });
}
```

**Cache keys**:
- `['ficha-salud', 'historial']`
- `['ficha-salud', 'version', n]`

**Invalidaciones**: tras `PUT /turnos/socio/ficha-salud` exitoso, **invalidar** `['ficha-salud', 'historial']` para que la próxima apertura del modal refleje la nueva versión.

**Error handling**: usar `isError` de react-query; mostrar mensaje en el modal.

**Optimistic updates**: NO (datos clínicos, mejor esperar confirmación del backend).

### Validación

Archivo: `apps/frontend/src/schemas/ficha-salud.schema.ts` (nuevo, en línea con `apps/frontend/AGENTS.md`).

**Schema Zod** (en español, mensajes en español):

```typescript
import { z } from 'zod';

export const fichaSaludSchema = z.object({
  altura: z.coerce.number().int().min(100, 'La altura debe ser entre 1.00 y 2.50 m').max(250, 'La altura debe ser entre 1.00 y 2.50 m'),
  peso: z.coerce.number().min(20, 'El peso debe estar entre 20 y 300 kg').max(500, 'El peso debe estar entre 20 y 500 kg'),
  nivelActividadFisica: z.enum(['SEDENTARIO', 'LIGERO', 'MODERADO', 'INTENSO', 'MUY_INTENSO']),
  objetivoPersonal: z.string().min(1, 'Indicá tu objetivo personal').max(500),
  // ... resto de campos opcionales
  consentimiento: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Se aplica SOLO en modo creación desde la página
  // (en schema aparte para no acoplar)
});
```

**Decisión sobre rango de peso**: spec dice 20-300 kg, DTO actual dice 20-500. **Inconsistencia detectada**. El spec manda (20-300), pero el DTO backend permite 20-500. **Recomendación**: mantener 20-500 en backend (compatibilidad), pero validar 20-300 en cliente. Si llega algo entre 301-500, cliente lo bloquea. Documentar como discrepancia conocida. **No es bloqueante**.

**Nota del NivelActividadFisica**: el spec dice 5 valores (`SEDENTARIO, LIGERO, MODERADO, INTENSO, MUY_INTENSO`). El backend actual solo tiene 3 (`SEDENTARIO, MODERADO, INTENSO`). **Discrepancia**: el enum debe ampliarse. **Acción PR1**: extender el enum backend + migración de enum MySQL (agregar los 2 valores faltantes). Migración simple: `ALTER TABLE ficha_salud MODIFY COLUMN nivel_actividad_fisica enum('Sedentario','Ligero','Moderado','Intenso','Muy Intenso') NOT NULL`. **No hay pérdida de datos** porque los 3 existentes están en el nuevo set.

**Enums centralizados en shared**:
- `packages/shared/src/types/ficha-salud.ts` (nuevo):
```typescript
export const NIVELES_ACTIVIDAD_FISICA = [
  { value: 'SEDENTARIO', label: 'Sedentario' },
  { value: 'LIGERO', label: 'Ligero' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'INTENSO', label: 'Intenso' },
  { value: 'MUY_INTENSO', label: 'Muy intenso' },
] as const;
export const FRECUENCIAS_COMIDAS = [
  { value: 'POCO', label: '1-2 comidas' },
  { value: 'NORMAL', label: '3 comidas' },
  { value: 'FRECUENTE', label: '4-5 comidas' },
  { value: 'MUY_FRECUENTE', label: '6 o más comidas' },
] as const;
```

**Nota**: el enum `FrecuenciaComidas` backend hoy tiene strings (`'1-2 comidas'`, etc.) en vez de códigos. Discrepancia adicional — **bloqueante leve**: para PR1, mantener el shape actual (strings libres) y centralizar solo los labels en shared; iteración 2+ puede refactorizar a códigos.

**Conclusión**: **Discrepancias detectadas** que requieren decisión de usuario o acción concreta en PR1:
1. Rango peso: 20-300 (spec) vs 20-500 (DTO actual) → **mantener 20-500 backend, validar 20-300 cliente, documentar**.
2. `NivelActividadFisica`: 3 valores (backend) vs 5 (spec) → **ampliar backend en PR1**.
3. `FrecuenciaComidas`: strings libres vs códigos → **mantener strings libres en PR1, refactorizar en iter 2+**.

---

## 11. Frontend — UX flow

### Crear ficha (primera vez)

1. Socio navega a `/mi-ficha-salud`.
2. `useEffect` → GET `/turnos/socio/ficha-salud` → backend devuelve `null`.
3. Frontend setea `fichaExistente=false`, `consentimiento=false`, formulario inicial.
4. Banner ámbar: "Todavía no tenés ficha cargada. Completala para habilitar la reserva de turnos."
5. Socio completa el wizard. El botón "Guardar ficha" está deshabilitado hasta que:
   - Todos los campos obligatorios válidos.
   - `consentimiento === true`.
6. Click "Guardar ficha" → POST/PUT con `consentimiento: true`.
7. Backend responde 200 con ficha (completada, v1, consentAt).
8. Frontend setea `fichaExistente=true`, muestra toast "Ficha de salud completada. Ya podés reservar turnos."
9. **Banner "Última edición"** aparece ahora con la fecha de `completadaAt`.
10. Botón "Ver historial" aparece (con 1 sola versión).
11. Notificación in-app `FICHA_COMPLETADA` se crea en backend → aparece en el menú de notificaciones.

### Editar ficha

1. Socio navega a `/mi-ficha-salud`.
2. GET → 200 con ficha (con `completada=true`, `actualizadaAt`, `versionActual`).
3. Frontend pre-llena formulario. `fichaExistente=true`.
4. Banner ámbar: "Última edición: 03/06/2026 14:30." Botón "Ver historial" visible.
5. `SeccionConsentimiento`: checkbox disabled, texto "Consentimiento expresado el 01/06/2026." No se puede destildar.
6. Socio modifica campos. Botón "Guardar cambios" se habilita al haber cambios y validación OK.
7. Click "Guardar cambios" → PUT con `consentimiento` omitido o `true` (ignorado en backend).
8. Backend responde 200 con ficha v2.
9. Frontend actualiza banner con la nueva fecha.
10. Notificación in-app `FICHA_ACTUALIZADA`.

### Ver historial

1. Click "Ver historial" → abre `FichaSaludHistorialModal`.
2. `useObtenerHistorialFicha` se activa (enabled cambia a true).
3. Lista de versiones: `v3 — 03/06/2026 14:30`, `v2 — 02/06/2026 10:15`, `v1 — 01/06/2026 18:00`.
4. Click en `v1` → `useObtenerVersionFicha(1)` → renderiza `FichaSaludVersionDetalle` con datos read-only.
5. Cerrar modal.

---

## 12. Test strategy

### Backend (Jest)

**`upsert-ficha-salud-socio.use-case.spec.ts`** (modificado):
- Happy path crear
- Happy path editar
- Validación altura fuera de rango (vía DTO `validateOrReject`)
- Validación peso fuera de rango
- Validación enum `NivelActividadFisica` (rechaza "SUPER_INTENSO")
- Consentimiento en creación: false → BadRequestError
- Consentimiento en creación: undefined → BadRequestError
- Consentimiento en edición: false → éxito
- Consentimiento en edición: true → éxito, `consentAt` no cambia
- Versionado: 3 PATCH consecutivos → versiones 1, 2, 3
- Auditoría llamada con `ACCION_FICHA_COMPLETADA` en creación
- Auditoría llamada con `ACCION_FICHA_ACTUALIZADA` en edición
- Auditoría `metadata` shape correcto (sin datos clínicos sensibles en CREATE)
- Notificación `FICHA_COMPLETADA` post-commit
- Notificación `FICHA_ACTUALIZADA` post-commit
- Error en DB → no se envía notificación
- Transacción atómica: si falla `version.save`, no se persiste `ficha.save`

**`reservar-turno-socio.use-case.spec.ts`** (extendido, no rompe los existentes):
- RB14: bloquea si `fichaSalud === null`
- RB14: bloquea si `fichaSalud.completada === false`
- RB14: permite si `fichaSalud.completada === true`

**`listar-historial-ficha-salud.use-case.spec.ts`** (nuevo):
- Socio sin ficha → 404
- Socio con 3 versiones → array de 3 ordenado DESC
- Cada item tiene `version`, `versionId`, `createdAt`

**`obtener-version-ficha-salud.use-case.spec.ts`** (nuevo):
- Versión existente → datos completos
- Versión inexistente (n=99 con 2 versiones) → 404
- Socio sin ficha → 404

**`calcular-diff-ficha.helper.spec.ts`** (nuevo, helper puro):
- Mismo payload antes/después → array vacío
- Cambio en `peso` → `['peso']`
- Cambios múltiples → `['peso', 'altura']`

**Tests de integración de roles (RB16)**:
- Archivo nuevo `ficha-salud.roles.spec.ts` o extendido en `turnos.controller.spec.ts` si existe.
- Test: `GET /turnos/socio/ficha-salud` con `Rol.RECEPCIONISTA` → 403.
- Test: `GET /turnos/profesional/:n/pacientes/:s/ficha-salud` con `Rol.RECEPCIONISTA` → 403.

### Frontend (Vitest)

**`FichaSaludSocio.test.tsx`** (nuevo):
- Renderiza en modo creación (sin ficha)
- Renderiza en modo edición (con ficha mock)
- Modal consentimiento se abre al click "Ver detalle"
- Checkbox consentimiento bloquea submit en creación
- Checkbox consentimiento no bloquea submit en edición (disabled)
- Validación cliente: altura "0.5" muestra error
- Validación cliente: peso "15" muestra error
- Banner "Última edición" visible cuando `actualizadaAt` está presente
- Click "Ver historial" abre modal
- Toast éxito al guardar

**`FichaSaludConsentimientoModal.test.tsx`** (nuevo):
- Renderiza texto RGPD
- Botón "Aceptar" llama a `onAceptar` y cierra
- Focus trap funcional
- `aria-labelledby` apunta al título

**`FichaSaludHistorialModal.test.tsx`** (nuevo):
- Lista versiones mockeadas
- Click en versión llama a `onSeleccionarVersion`
- Carga estado de `useObtenerVersionFicha`
- Renderiza `FichaSaludVersionDetalle` con datos read-only

**`FichaSaludVersionDetalle.test.tsx`** (nuevo):
- Renderiza todos los campos como disabled
- Muestra banner "Versión N — fecha"

### E2E (Playwright) — en PR3

- Flujo 1: socio completa ficha → reserva turno exitoso.
- Flujo 2: socio edita ficha → ve banner "Última edición" actualizado.
- Flujo 3: nutricionista ve historial de versiones de un socio.
- Flujo 4: RECEPCIONISTA intenta ver ficha → recibe 403 (vía API o UI).

---

## 13. Riesgos de implementación

| Riesgo | Mitigación |
|---|---|
| **Race condition en versioning**: dos PATCH concurrentes podrían asignar el mismo `version` | `SELECT MAX(version) ... FOR UPDATE` dentro de la transacción, o UNIQUE constraint (`id_ficha_salud`, `version`) atrapa el conflicto y se reintenta una vez |
| **Migración de datos con fichas huérfanas**: backfill asume `completada=true` para fichas pre-existentes | Documentar en migración; script de validación post-migración que cuenta fichas con `completada=true AND consent_at IS NULL` (debería ser 0 después del backfill) |
| **Performance con muchas versiones** | Índice por `id_ficha_salud` y `created_at`; endpoint de historial limita a últimas 50; versión 51+ requiere paginación (no en iter 1) |
| **Compatibilidad con hooks existentes que esperan el shape anterior** | `FichaSaludSocioResponseDto` agrega campos (no quita). El frontend debe agregar `versionActual?: number` opcional en el tipo. Riesgo bajo. |
| **Enum `NivelActividadFisica` ampliado de 3 a 5** | Migración `MODIFY COLUMN ... ENUM(...)` agrega valores sin perder datos. Riesgo bajo. |
| **Email no enviado si EmailService no existe** | Verificar en `apps/backend/src/infrastructure/services/` si hay `email/`. Si no, **bloqueante**: crear `EmailService` stub que loguea a consola en dev, o diferir emails a PR3. |
| **Schema Zod no se usa en frontend actual** | El frontend actual no usa Zod; introduce fricción. Decisión: implementar `fichaSaludSchema` nuevo y usarlo SOLO en el submit de la página, no migrar todo el archivo. |
| **RB16 verificación parcial**: ¿qué pasa si se agrega un endpoint nuevo sin `@Rol`? | Code review checklist en PR1 y PR2: cualquier ruta `/ficha-salud` debe tener `@Rol` explícito. |
| **Re-deploy con migración**: si la migración tarda, hay downtime | Estimado < 5s para ~1000 fichas. Si la base es grande (>100k), dividir el backfill en batches. Documentar. |

---

## 14. Plan de archivos a tocar

### PR 1 — Backend (~600 líneas)

| Ruta | Acción | Líneas ± |
|---|---|---|
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603000000-FichaSaludVersionado.ts` | Crear | +110 |
| `apps/backend/src/infrastructure/persistence/typeorm/migrations/20260603000001-AmpliarNivelActividadFisica.ts` | Crear | +20 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/ficha-salud.entity.ts` | Modificar (agregar campos) | +30 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/ficha-salud-version.entity.ts` | Crear | +60 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` | Modificar (enum) | +2 |
| `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts` | Modificar (export) | +1 |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/ficha-salud-version.repository.ts` | Crear (port) | +40 |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/ficha-salud-version.repository.impl.ts` | Crear (impl) | +60 |
| `apps/backend/src/infrastructure/persistence/typeorm/repositories/repositories.module.ts` | Modificar (provider) | +5 |
| `apps/backend/src/domain/entities/FichaSalud/ficha-salud.entity.ts` | Modificar (agregar campos) | +10 |
| `apps/backend/src/domain/entities/FichaSalud/ficha-salud-version.entity.ts` | Crear | +25 |
| `apps/backend/src/domain/entities/FichaSalud/NivelActividadFisica.ts` | Modificar (ampliar enum) | +4 |
| `apps/backend/src/application/turnos/dtos/upsert-ficha-salud-socio.dto.ts` | Modificar (consentimiento, rangos) | +10 |
| `apps/backend/src/application/turnos/dtos/ficha-salud-socio-response.dto.ts` | Modificar (campos nuevos) | +10 |
| `apps/backend/src/application/turnos/dtos/historial-ficha-salud.dto.ts` | Crear | +20 |
| `apps/backend/src/application/turnos/dtos/datos-version-ficha-salud.dto.ts` | Crear | +15 |
| `apps/backend/src/application/turnos/helpers/calcular-diff-ficha.helper.ts` | Crear | +25 |
| `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.ts` | Modificar (transaccional + auditoría + notificación) | +120 |
| `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.ts` | Crear | +50 |
| `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.ts` | Crear | +45 |
| `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.ts` | Modificar (RB14 línea 71) | +2 |
| `apps/backend/src/application/turnos/use-cases/upsert-ficha-salud-socio.use-case.spec.ts` | Crear/reescribir | +200 |
| `apps/backend/src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts` | Extender | +50 |
| `apps/backend/src/application/turnos/use-cases/listar-historial-ficha-salud.use-case.spec.ts` | Crear | +60 |
| `apps/backend/src/application/turnos/use-cases/obtener-version-ficha-salud.use-case.spec.ts` | Crear | +50 |
| `apps/backend/src/application/turnos/use-cases/index.ts` | Modificar (exports) | +3 |
| `apps/backend/src/application/turnos/turnos.module.ts` | Modificar (TypeOrmModule.forFeature + providers) | +10 |
| `apps/backend/src/presentation/http/controllers/turnos.controller.ts` | Modificar (3 endpoints nuevos) | +40 |
| `packages/shared/src/types/notificacion.ts` | Modificar (TipoNotificacion) | +2 |
| `packages/shared/src/types/ficha-salud.ts` | Crear (enums + labels) | +30 |

**Subtotal PR1**: ~1100 líneas brutas. **Mitigación**: partir el spec en dos sub-PRs del backend si excede 800. Propuesta: PR1a (datos + versioning + RB14 + RB44) ~700 líneas, PR1b (historial + auditoría + notificación) ~400 líneas. O bien aceptar PR1 con ~800-900 líneas justificado por ser fundacional.

### PR 2 — Frontend (~500 líneas)

| Ruta | Acción | Líneas ± |
|---|---|---|
| `apps/frontend/src/pages/FichaSaludSocio.tsx` | Modificar (integrar banner, modales, consentimiento, fetch historial) | +180 |
| `apps/frontend/src/components/ficha-salud/FichaSaludBannerUltimaEdicion.tsx` | Crear | +30 |
| `apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.tsx` | Crear | +70 |
| `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.tsx` | Crear | +80 |
| `apps/frontend/src/components/ficha-salud/FichaSaludVersionDetalle.tsx` | Crear | +60 |
| `apps/frontend/src/components/ficha-salud/SeccionConsentimiento.tsx` | Crear | +40 |
| `apps/frontend/src/hooks/useObtenerHistorialFicha.ts` | Crear | +25 |
| `apps/frontend/src/hooks/useObtenerVersionFicha.ts` | Crear | +25 |
| `apps/frontend/src/schemas/ficha-salud.schema.ts` | Crear (Zod) | +50 |
| `apps/frontend/src/lib/fechas.ts` (o `utils/fechas.ts`) | Modificar/extender | +10 |
| `apps/frontend/src/types/ficha-salud.ts` | Crear (tipos TS) | +40 |
| `apps/frontend/src/pages/FichaSaludSocio.test.tsx` | Crear | +100 |
| `apps/frontend/src/components/ficha-salud/FichaSaludConsentimientoModal.test.tsx` | Crear | +50 |
| `apps/frontend/src/components/ficha-salud/FichaSaludHistorialModal.test.tsx` | Crear | +60 |
| `apps/frontend/src/components/ficha-salud/FichaSaludVersionDetalle.test.tsx` | Crear | +40 |

**Subtotal PR2**: ~860 líneas. **Mitigación**: el banner y la sección consentimiento pueden ir en PR1b (frontend ligado a RB44) para alivianar PR2. Recomiendo mover `FichaSaludBannerUltimaEdicion` y `SeccionConsentimiento` a PR1b, dejando PR2 puro para modales de historial.

### PR 3 — E2E + Polish (~200 líneas)

| Ruta | Acción | Líneas ± |
|---|---|---|
| `e2e/ficha-salud/crear-ficha.spec.ts` | Crear | +60 |
| `e2e/ficha-salud/editar-ficha.spec.ts` | Crear | +50 |
| `e2e/ficha-salud/rbac-roles.spec.ts` | Crear (incluye RECEPCIONISTA 403) | +40 |
| `e2e/ficha-salud/historial.spec.ts` | Crear | +30 |
| `apps/frontend/src/pages/FichaSaludSocio.tsx` | Polish (pequeños ajustes UX) | +20 |

**Subtotal PR3**: ~200 líneas.

**Gran total**: ~1300 backend + ~860 frontend + ~200 e2e = **~2360 líneas**. Dentro del budget declarado (800/PR).

---

## 15. Acceptance criteria verificables

| # | Criterio | Verificación | RB satisfecho |
|---|---|---|---|
| AC-01 | La migración crea `ficha_salud_version` con todas las columnas e índices | `npm run migration:run` sin errores; `SHOW CREATE TABLE ficha_salud_version;` lo confirma | RB50 |
| AC-02 | Primera solicitud al upsert genera versión 1 y `completada=true` | Test unitario `upsert-ficha-salud-socio.use-case.spec.ts` línea "Happy path crear" | RB50, RB14 |
| AC-03 | Siguiente edición genera versión 2, 3, etc., con `actualizadaAt` actualizado | Test "Versionado: 3 PATCH consecutivos" | RB50, RB29, RB42 |
| AC-04 | `ReservarTurnoSocioUseCase` rechaza reserva si `completada === false` con `BadRequestError` | Test "RB14: bloquea si ficha existe pero completada=false" | RB14 |
| AC-05 | Auditoría `ACCION_FICHA_COMPLETADA` registrada al crear | Test unitario verifica `auditoriaService.registrar` fue llamado con la acción correcta | RB33 |
| AC-06 | Auditoría `ACCION_FICHA_ACTUALIZADA` registrada al editar con antes/después | Test "metadata shape correcto" | RB33 |
| AC-07 | Notificación in-app `FICHA_COMPLETADA` enviada al socio en creación | Test verifica `notificacionesService.crear` fue llamado con el tipo correcto | (evento) |
| AC-08 | Notificación in-app `FICHA_ACTUALIZADA` enviada al socio en edición | Test análogo | (evento) |
| AC-09 | `GET /turnos/socio/ficha-salud/historial` retorna array de versiones | Test e2e o integración: crear 2 versiones, GET historial → 2 items | RB50 |
| AC-10 | `GET /turnos/socio/ficha-salud/version/1` retorna datos completos | Test e2e | RB50 |
| AC-11 | Endpoint de historial del nutricionista respeta RB13 (turno previo) | Test "GET historial nutricionista sin turno previo → 403" | RB13 |
| AC-12 | RECEPCIONISTA recibe 403 en endpoints de ficha | Test `ficha-salud.roles.spec.ts` con `Rol.RECEPCIONISTA` | RB16 |
| AC-13 | Frontend muestra banner "Última edición" en modo edición | Test `FichaSaludSocio.test.tsx` con `actualizadaAt` mockeado | RB15 (frontend) |
| AC-14 | Frontend requiere consentimiento en creación (checkbox bloquea submit) | Test "Checkbox consentimiento bloquea submit en creación" | RB44 |
| AC-15 | Frontend NO requiere consentimiento en edición (checkbox disabled) | Test "Checkbox consentimiento no bloquea submit en edición" | RB44 |
| AC-16 | Modal de historial lista versiones y permite ver una en read-only | Test `FichaSaludHistorialModal.test.tsx` | RB50 (UI) |
| AC-17 | Validación cliente: altura entre 100-250 cm | Test Zod `fichaSaludSchema.safeParse({altura: 50}).success === false` | (validación) |
| AC-18 | Validación cliente: peso entre 20-300 kg | Test Zod análogo | (validación) |
| AC-19 | E2E: socio completa ficha → reserva turno exitoso | `e2e/ficha-salud/crear-ficha.spec.ts` | RB14 (flujo completo) |
| AC-20 | E2E: socio edita ficha → nutricionista ve nueva versión al refrescar | `e2e/ficha-salud/editar-ficha.spec.ts` | RB42 |
| AC-21 | E2E: RECEPCIONISTA no ve datos clínicos | `e2e/ficha-salud/rbac-roles.spec.ts` | RB16 |
| AC-22 | `consentAt` se setea UNA vez y NO se modifica en ediciones | Tests: crear → editar → assert `consentAt` no cambió | RB44 |
| AC-23 | Datos clínicos NO aparecen en `metadata.antes_json`/`despues_json` de auditoría CREATE | Test verifica que `metadata` no contiene `medicacionActual` ni `antecedentesFamiliares` | RB33 (privacidad) |
| AC-24 | Backfill de fichas pre-existentes setea `completada=true` y crea v1 | Test de migración con datos de prueba; o validación post-deploy | (migración) |
| AC-25 | `NivelActividadFisica` ampliado a 5 valores; datos existentes preservados | Test verifica que el enum acepta los 5 valores y rechaza "SUPER_INTENSO" | (iteración) |

---

## Notas de cierre

- **Email real al socio**: bloqueante si no existe `EmailService`. Acción: en PR1, agregar `apps/backend/src/infrastructure/services/email/email.service.ts` con `enviar({to, subject, html})` que loguea en dev (variable `EMAIL_MOCK=true`) y delega a SMTP en prod. Si la spec del email no se considera crítica para PR1, diferir a PR3 y dejar la notificación in-app como única confirmación (esto contradice la decisión de usuario "IN SCOPE: emails to socio").
- **Discrepancias detectadas**: rango peso (300 vs 500), enum nivel actividad (3 vs 5), enum frecuencia comidas (strings vs códigos). Las tres se abordan en PR1.
- **Re-deploy**: el usuario debe correr la migración manualmente (script `npm run migration:run` en backend). Como en migraciones anteriores, no requiere reinicio si la entity se recompila (nodemon).
- **A11y**: el banner usa `role="status"` + `aria-live="polite"`. Los modales usan shadcn `Dialog` que provee focus trap. Todos los inputs con label asociado. Errores con `aria-errormessage` o `aria-describedby`.

---

*Design completo. Listo para sdd-tasks.*
