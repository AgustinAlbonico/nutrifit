# CU-15 — Realizar check-in — Design

> **Fecha**: 2026-06-17
> **Autor**: brainstorming (opencode)
> **Estado**: Aprobado por el usuario, pendiente de writing-plans
> **Alcance**: CU-15 completo + refactor de modelo de estados + bug de feedback en UI

---

## 1. Contexto y motivación

El CU-15 (check-in por recepción) ya tiene una implementación parcial en el código: use-case, endpoint, modal y página de recepción. Sin embargo, dos problemas bloquean su cierre como caso de uso:

1. **Bug de diseño en el modelo de estados del turno**: el código actual interpreta `Reservar → PROGRAMADO → Confirmar (por email) → PRESENTE`, mientras que el spec y el dominio real indican `Reservar → CONFIRMADO → Check-in → PRESENTE → Iniciar consulta → EN_CURSO`. Esto causa que el `CheckInTurnoUseCase` valide contra `PROGRAMADO` y que `ConfirmarTurnoSocioUseCase` salte a `PRESENTE` sin haber pasado por check-in.
2. **Spec del CU-15 incompleto en código**: faltan `POST /:id/revertir-checkin`, auditoría del check-in (`CHECKIN`, `REVERT_CHECKIN`), búsqueda en la lista de turnos del día, e idempotencia del doble click (A3). Además, hay un bug de UI conocido donde el toast de error no se muestra (reporte `iteracion 1/errores/CasosDeUso_Turnos.md` bug 3).

Este design cierra el CU-15 en su totalidad y resuelve el bug de diseño de estados en el mismo cambio (entrega atómica, testeable, con auditoría).

---

## 2. Objetivos y no-objetivos

### Objetivos

- Refactorizar el modelo de estados a `Reservar → CONFIRMADO → PRESENTE → EN_CURSO → REALIZADO`.
- Implementar `POST /:id/check-in` con A3 idempotente, ventana `-10min/+30min`, auditoría `CHECKIN` y notificación al nutricionista.
- Implementar `POST /:id/revertir-checkin` para admin (PRESENTE → CONFIRMADO, con motivo y auditoría `REVERT_CHECKIN`).
- Agregar input de búsqueda en la lista de turnos del día (filtro client-side).
- Arreglar el feedback de error en el modal de check-in con banner interno.
- Cubrir todos los criterios de aceptación del spec con tests unitarios backend y E2E Playwright.

### No-objetivos (quedan fuera de scope)

- Scheduler automático de ausentes (CU-16) — ya existe como `MarcarAusenteManualUseCase` pero el cron real no está en este CU; se mantiene tal cual.
- Self check-in desde el celular del socio (decisión de iter 1, documentada en el spec).
- Revertir ausente sigue siendo `PATCH` (no `POST` como dice el spec) para no romper el frontend actual.
- Auditoría del `ConfirmarTurnoSocioUseCase` (no es parte de CU-15).

---

## 3. Diseño backend

### 3.1 Refactor del flujo de estados

Cambiar todas las referencias a `EstadoTurno.PROGRAMADO` por `EstadoTurno.CONFIRMADO` en los use-cases de creación y validación. Mantener `EstadoTurno.PROGRAMADO` en el enum para registrar datos legacy, pero no se usa en código nuevo.

**Use-cases a modificar** (cambian `PROGRAMADO` → `CONFIRMADO`):

- `ReservarTurnoSocioUseCase`: `turno.estadoTurno = EstadoTurno.CONFIRMADO` en creación.
- `AsignarTurnoManualUseCase`: idem.
- `CrearTurnoEnNombreDeSocioUseCase`: idem.
- `BloquearTurnoUseCase`: idem (turno bloqueado se crea en CONFIRMADO con socio=null).
- `ConfirmarTurnoSocioUseCase`: ahora valida `CONFIRMADO` y se mantiene en `CONFIRMADO` (antes saltaba a `PRESENTE`). La notificación al socio sigue siendo `TURNO_CONFIRMADO`.
- `CancelarTurnoSocioUseCase`: valida `CONFIRMADO`.
- `ReprogramarTurnoSocioUseCase`: valida `CONFIRMADO`.
- `DesbloquearTurnoUseCase`: valida `CONFIRMADO`.
- `AvisoLlegadaTardeUseCase`: valida `CONFIRMADO`.
- `MarcarAusenteManualUseCase`: valida `CONFIRMADO` o `PRESENTE` (sin cambios en la lógica, solo cambia la constante).
- `RevertirAusenteTurnoUseCase`: estado final `CONFIRMADO` (antes era `PROGRAMADO`).
- `GetTurnosRecepcionDiaUseCase`: filtra por `CONFIRMADO, PRESENTE, EN_CURSO, AUSENTE` (reemplaza `PROGRAMADO` por `CONFIRMADO`).
- `GetTurnosDelDiaUseCase` (nutri): filtra por `CONFIRMADO, PRESENTE, EN_CURSO`.

**Tests a actualizar** (cambian aserción `PROGRAMADO` → `CONFIRMADO`):

- `reservar-turno-socio.use-case.spec.ts`
- `confirmar-turno-socio.use-case.spec.ts`
- `cancelar-turno-socio.use-case.spec.ts`
- `reprogramar-turno-socio.use-case.spec.ts`
- `marcar-ausente-manual.use-case.spec.ts`
- `crear-turno-en-nombre-de-socio.use-case.spec.ts`
- `get-turno-by-id.use-case.spec.ts`
- `get-turno-socio-by-id.use-case.spec.ts`
- `iniciar-consulta.use-case.spec.ts` (verifica el `PRESENTE` previo, sin cambios de comportamiento, solo confirmar que no rompe).

### 3.2 Check-in use-case (CU-15 happy path)

**Archivo**: `apps/backend/src/application/turnos/use-cases/check-in-turno.use-case.ts`

Comportamiento:

1. Carga el turno con `socio` y `nutricionista`, filtrando por `gimnasioId` del tenant.
2. Valida estado `CONFIRMADO` (lanza `BadRequestError` si no).
3. Valida que `fechaTurno` sea hoy en TZ Argentina (lanza `BadRequestError` si no).
4. Calcula `diffMinutos` = `ahora - horaTurnoReal`. Si está fuera de la ventana `[-10, +30]`, lanza `BadRequestError`.
5. Calcula `llegadaTardeMin` si `diffMinutos > 0`.
6. Setea `estadoTurno = PRESENTE`, `checkInAt = ahora`, `llegadaTardeMin` (si aplica).
7. Persiste con `save`.
8. Audita `CHECKIN` con `metadata: { antes: { estado, checkInAt, llegadaTardeMin }, despues: { ... }, ventana: { diffMinutos } }`.
9. Notifica al nutricionista con `TipoNotificacion.TURNO_CHECKIN`.

**A3 — Idempotencia**:

- Si el turno ya está `PRESENTE`, retorna `{ success: true, estado: PRESENTE, checkInAt: turno.checkInAt, fueIdempotente: true }` **sin** guardar ni auditar.
- Esto evita doble auditoría por doble click y maneja el caso del scheduler de ausentes que podría intentar revertir ausente + check-in.

### 3.3 Revertir check-in (nuevo)

**Archivos**:

- `apps/backend/src/application/turnos/use-cases/revertir-checkin-turno.use-case.ts` (nuevo)
- `apps/backend/src/application/turnos/dtos/revertir-checkin.dto.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/index.ts` (exporta el nuevo)
- `apps/backend/src/application/turnos/dtos/index.ts` (exporta el DTO nuevo)

**Comportamiento**:

1. Carga el turno con `nutricionista`, filtra por `gimnasioId`.
2. Valida estado `PRESENTE` (lanza `ConflictError 409` si no).
3. Setea `estadoTurno = CONFIRMADO`, `checkInAt = null`, `llegadaTardeMin = null`.
4. Persiste.
5. Audita `REVERT_CHECKIN` con `metadata: { motivo, antes: { estado, checkInAt, llegadaTardeMin }, despues: { ... } }`.

**DTO**:

```ts
export class RevertirCheckinDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;
}
```

### 3.4 Controller

**Archivo**: `apps/backend/src/presentation/http/controllers/turnos.controller.ts`

```ts
@Post(':id/check-in')
@Rol(RolEnum.RECEPCIONISTA, RolEnum.ADMIN)
@UseGuards(TurnoNutricionistaAccessGuard)
async checkInTurno(
  @Param('id', ParseIntPipe) turnoId: number,
): Promise<{ success: boolean; estado: EstadoTurno; checkInAt: string; fueIdempotente: boolean }> {
  return this.checkInTurnoUseCase.execute(turnoId);
}

@Post(':id/revertir-checkin')
@Rol(RolEnum.ADMIN)
@UseGuards(TurnoNutricionistaAccessGuard)
async revertirCheckin(
  @Param('id', ParseIntPipe) turnoId: number,
  @Body() dto: RevertirCheckinDto,
  @CurrentUserId() userId: number,
): Promise<{ success: boolean; estado: EstadoTurno }> {
  return this.revertirCheckinTurnoUseCase.execute(turnoId, dto.motivo, userId);
}
```

### 3.5 Enum auditoría

**Archivo**: `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts`

Agregar:

```ts
export enum AccionAuditoria {
  // ... existentes
  CHECKIN = 'CHECKIN',
  REVERT_CHECKIN = 'REVERT_CHECKIN',
}
```

### 3.6 Notificaciones

**Archivo**: `apps/backend/src/application/turnos/use-cases/check-in-turno.use-case.ts`

Solo se notifica al nutricionista (cumple el spec `TURNO_CHECKIN → email al nutricionista`). El socio ya recibió `TURNO_RESERVADO` al reservar y `TURNO_CONFIRMADO` al confirmar; no recibe notificación adicional por el check-in.

### 3.7 Dependencias del use-case

`CheckInTurnoUseCase` necesita `AuditoriaService` (no la tiene actualmente). Inyectar en el constructor y registrar en el módulo `turnos.module.ts`.

`RevertirCheckinTurnoUseCase` necesita `AuditoriaService`, `TenantContextService` y el repositorio de `TurnoOrmEntity`.

---

## 4. Diseño frontend

### 4.1 Ajuste del helper de estado

**Archivo**: `apps/frontend/src/lib/turnos/estadoTurno.ts`

```ts
export function puedeHacerCheckInTurno(estado: EstadoTurno): boolean {
  return estado === 'CONFIRMADO';
}
```

### 4.2 Página de recepción

**Archivo**: `apps/frontend/src/pages/RecepcionTurnosPage.tsx`

Cambios:

- **Input de búsqueda** (client-side): filtra por nombre del socio, DNI u hora del turno. Se aplica sobre el array `turnos` en memoria (no hay request extra). Estado local: `terminoBusqueda: string`. `turnosFiltrados = useMemo(() => filtrar(turnos, terminoBusqueda), [turnos, terminoBusqueda])`.
- **Banner de error en el modal de check-in**: estado local `errorCheckIn: string | null`, renderizado arriba del body del modal en color rojo (variante `destructive`). El modal NO se cierra en caso de error (el usuario puede reintentar o cancelar).
- **Caso A3 (idempotente)**: si el backend devuelve `fueIdempotente: true`, mostrar toast verde "Ya estaba presente desde las HH:MM" y cerrar el modal. Esto requiere cambiar el tipo de response esperado y agregar el flag en `turnoSeleccionado.checkInAt` para mostrar la hora.

### 4.3 Modal revertir check-in (nuevo)

**Archivo**: `apps/frontend/src/components/turnos/RevertirCheckinModal.tsx`

Componente:

- Input de motivo (textarea, obligatorio, 1-500 chars).
- Botón "Revertir check-in" con confirmación fuerte: "¿Estás seguro? Esto quedará auditado."
- Solo se renderiza en la página si `rol === 'ADMIN'` (botón "Revertir check-in" solo aparece para admin en filas de turnos `PRESENTE`).
- Llama a `apiRequest('/turnos/:id/revertir-checkin', { method: 'POST', body: { motivo } })`.

### 4.4 API client

Agregar en `apps/frontend/src/lib/turnos/` o donde estén los servicios de turnos:

```ts
export interface CheckInResponse {
  success: boolean;
  estado: EstadoTurno;
  checkInAt: string;
  fueIdempotente: boolean;
}

export interface RevertirCheckinResponse {
  success: boolean;
  estado: EstadoTurno;
}

export async function checkInTurno(turnoId: number): Promise<CheckInResponse> { ... }
export async function revertirCheckinTurno(turnoId: number, motivo: string): Promise<RevertirCheckinResponse> { ... }
```

### 4.5 Service / store

La página actual usa `apiRequest` directamente. Mantenemos ese patrón: los services nuevos son wrappers tipados sobre `apiRequest` y se importan en `RecepcionTurnosPage.tsx`.

---

## 5. Tests

### 5.1 Tests unitarios backend

**Actualizar**: `apps/backend/src/application/turnos/use-cases/check-in-turno.use-case.spec.ts`

- Happy path: turno CONFIRMADO del día → PRESENTE, notifica nutri, audita CHECKIN.
- A1: turno de ayer → `BadRequestError "Solo se puede hacer check-in de turnos del día actual"`.
- A2: turno CANCELADO → `BadRequestError "El turno no se puede marcar presente en su estado actual"`.
- A3: turno ya PRESENTE → retorna 200 con `fueIdempotente: true`, NO guarda, NO audita.
- B1 (doble click): cubierto por A3.
- B5: turno EN_CURSO o REALIZADO → `BadRequestError`.
- Fuera de ventana: turno CONFIRMADO con horario muy lejano → `BadRequestError "El check-in solo se permite entre 10 min antes y 30 min después del horario del turno."`.

**Crear**: `apps/backend/src/application/turnos/use-cases/revertir-checkin-turno.use-case.spec.ts`

- Happy path: turno PRESENTE → CONFIRMADO, `checkInAt = null`, audita REVERT_CHECKIN con motivo.
- Estado inválido (CONFIRMADO, CANCELADO, AUSENTE) → `ConflictError 409`.
- Motivo vacío → `BadRequestError`.

**Crear/actualizar**: `apps/backend/src/application/turnos/use-cases/revertir-ausente-turno.use-case.spec.ts` (si existe) — verificar motivo obligatorio y estado final CONFIRMADO.

**Actualizar**: tests afectados por el refactor de estados (ver lista §3.1).

### 5.2 Tests E2E Playwright

**Carpeta**: `e2e/checkin/`

- `happy-path.spec.ts`:
  - Login `recepcion-central@nutrifit.com`.
  - Ir a `/recepcion/turnos`.
  - Verificar que aparece la lista del día.
  - Click "Check-in" en un turno CONFIRMADO.
  - Confirmar en el modal.
  - Verificar toast verde y badge "Presente".
  - Verificar request `POST /turnos/:id/check-in` con response 200.

- `fuera-de-ventana.spec.ts`:
  - Login recepción.
  - Buscar un turno con horario fuera de la ventana `-10/+30`.
  - Click "Check-in" → confirmar.
  - Verificar banner rojo en el modal con mensaje "El check-in solo se permite entre 10 min antes y 30 min después del horario del turno."
  - Verificar que el modal NO se cerró.

- `revertir-checkin-admin.spec.ts`:
  - Login `admin-central@nutrifit.com`.
  - Ir a `/recepcion/turnos`.
  - En un turno con badge "Presente", click "Revertir check-in".
  - Llenar motivo, confirmar.
  - Verificar que el badge vuelve a "Confirmado".

- `busqueda-turnos.spec.ts`:
  - Login recepción.
  - Escribir en el input de búsqueda "juan" → la lista se filtra.
  - Limpiar y escribir "12345678" (DNI) → la lista se filtra.

---

## 6. Riesgos y tradeoffs

| Riesgo | Mitigación |
|---|---|
| Refactor de estados rompe 8+ tests existentes. | Actualización masiva en el mismo PR; correr suite completa antes de mergear. |
| Datos legacy en `PROGRAMADO` quedan huérfanos (no se les puede hacer check-in con la nueva lógica). | Documentar en el PR. Ofrecer script de migración: `UPDATE turno SET estado = 'CONFIRMADO' WHERE estado = 'PROGRAMADO' AND fecha >= CURDATE()`. |
| El scheduler de ausentes (CU-16) podría intentar revertir un turno que ya está `PRESENTE` por la nueva lógica. | Verificar que `RevertirAusenteTurnoUseCase` valide `AUSENTE` estrictamente (no `PRESENTE`). Ya lo hace, sin cambios. |
| El frontend actual podría tener aserciones de "Programado" hardcodeadas. | Buscar y reemplazar antes de mergear. |
| El `PATCH /:id/revertir-ausente` actual no se cambia a `POST` (spec dice POST). | Tradeoff documentado: romper el frontend por una cuestión de naming no vale la pena. |
| La notificación al socio del check-in se elimina. | El socio ya recibió `TURNO_RESERVADO` y `TURNO_CONFIRMADO`; el check-in es una confirmación silenciosa para él. Si el equipo quiere notificarlo, se puede agregar en otra iteración. |

---

## 7. Criterios de aceptación

- [x] Recepción puede marcar turno CONFIRMADO como PRESENTE solo el día del turno.
- [x] Idempotente (doble click devuelve 200 con `fueIdempotente: true` y mismo `checkInAt`).
- [x] Notificación al nutricionista.
- [x] Si el turno está AUSENTE por el job, admin puede revertir (PATCH /:id/revertir-ausente, sin cambios).
- [x] Si se marcó al socio equivocado, admin puede revertir (POST /:id/revertir-checkin, NUEVO).
- [x] Auditoría registrada: `CHECKIN` con antes/después, `REVERT_CHECKIN` con motivo.
- [x] Test unitario: `check-in-turno.use-case.ts` cubre happy path, A1, A2, A3.
- [x] Bug del feedback en UI arreglado: banner rojo en modal.
- [x] Búsqueda en lista de turnos del día.

---

## 8. Archivos a tocar (resumen)

**Backend (crear)**: 3 archivos

- `application/turnos/use-cases/revertir-checkin-turno.use-case.ts`
- `application/turnos/dtos/revertir-checkin.dto.ts`
- `application/turnos/use-cases/revertir-checkin-turno.use-case.spec.ts`

**Backend (modificar)**: ~17 archivos

- 13 use-cases (refactor de estados + check-in use-case)
- 1 controller
- 1 enum (`AccionAuditoria`)
- 2 índices de barrel exports
- 1 module (`turnos.module.ts` para inyectar `AuditoriaService` en `CheckInTurnoUseCase`)
- 8+ specs de tests

**Frontend (crear)**: 2 archivos

- `components/turnos/RevertirCheckinModal.tsx`
- `lib/turnos/checkin.service.ts` (o similar)

**Frontend (modificar)**: 3 archivos

- `lib/turnos/estadoTurno.ts` (helper)
- `pages/RecepcionTurnosPage.tsx` (búsqueda + banner + A3 + revertir)
- `e2e/checkin/*.spec.ts` (4 specs nuevos)

**Total estimado**: **25 archivos** entre backend y frontend.
