# Tasks: gaps-agenda-socio-nutri

> Descomposición atómica del diseño `openspec/changes/gaps-agenda-socio-nutri/design.md` en 35 work units, organizados en 2 PR encadenados (stacked-to-main). Aplica las decisiones 1A (paths `/api/profesional/*` y `/api/turnos/*`), 2B (solo `presentacion`+`certificaciones`), 3A (chained PRs), D1 (foto por endpoint propio), D2 (refactor `get-ficha-salud-paciente`), D3 (ajustar guard en PR #1) y D4 (ruta `/nutricionistas/catalogo`).

## Resumen

- **Total tasks**: 35
- **PR #1 (Workstream A — spec 17)**: 19 tasks
- **PR #2 (Workstreams B + C + D — spec 15 + spec 10 + tests)**: 16 tasks
- **Estimación total**: ~1500 líneas (review budget custom = 1500)
- **Chain strategy**: stacked-to-main (PR #1 → main → PR #2 → main)
- **Strict TDD**: false (tests siguen a implementación)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1500 |
| Review budget risk | Medium-High (rozando el budget) |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 (~1100 líneas: backend ~700 + frontend ~250 + tests ~150) → PR #2 (~1500 líneas: backend ~800 + frontend ~500 + tests ~200) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: No (estrategia chained pre-resuelta por 3A)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High (mitigado con chained PRs y budget custom 1500)
```

### Suggested Work Units

| Unit | Goal | Likely PR | Base branch | Notas |
|------|------|-----------|-------------|-------|
| PR #1 | Operativa crítica diaria (spec 17) | PR #1 | main | Incluye `TurnoNutricionistaAccessGuard` extendido para RECEPCIONISTA (D3) |
| PR #2 | Discovery por socio (specs 15 + 10) + tests | PR #2 | main (apilado sobre PR #1) | Incluye seed update + CREDENCIALES_SEED.md |

---

## PR #1 — Workstream A (spec 17 crítica)

> Base branch: `main`. Merge PR #1 antes de arrancar PR #2.

### TASK-1.1: Migración + `@VersionColumn` en `ObservacionClinicaOrmEntity`
- **Tipo**: migration + entity
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/migrations/<timestamp>-AddVersionToObservacionClinica.ts` (crear)
  - `apps/backend/src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity.ts` (modificar)
- **Spec/diseño referencia**: §3.1, §3.2
- **Criterios de aceptación**:
  - `up` ejecuta `ALTER TABLE observacion_clinica ADD COLUMN version INT NOT NULL DEFAULT 1`; `down` la elimina.
  - `ObservacionClinicaOrmEntity` declara `@VersionColumn({ name: 'version' }) version: number`.
  - Filas existentes no rompen (default 1).
- **Dependencias**: ninguna
- **Notas**: usar timestamp en ms siguiendo convención de la carpeta `migrations/`.

### TASK-1.2: Catch de `OptimisticLockVersionMismatchError` en use-cases
- **Tipo**: refactor (error handling)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/guardar-observaciones.use-case.ts` (modificar)
  - `apps/backend/src/application/turnos/use-cases/guardar-mediciones.use-case.ts` (modificar — solo si persiste `ObservacionClinica`)
- **Spec/diseño referencia**: §3.3
- **Criterios de aceptación**:
  - Ambos use-cases envuelven `observacionRepository.save(...)` en try/catch.
  - Si el error es `OptimisticLockVersionMismatchError` de TypeORM, lanzan `ConflictError("La consulta fue modificada por otro usuario. Recargá los cambios.")`.
  - El `AppErrorFilter` global traduce `ConflictError` a HTTP 409 (verificar que no requiere cambios).
- **Dependencias**: TASK-1.1

### TASK-1.3: Test optimistic lock concurrente
- **Tipo**: test
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/guardar-observaciones.use-case.spec.ts` (modificar — el archivo YA EXISTE)
- **Spec/diseño referencia**: §3.4
- **Criterios de aceptación**:
  - Agregar 1 test case al spec existente: dos `save` en paralelo; el segundo `mockResolvedValue` rechaza con `OptimisticLockVersionMismatchError`; assert `ConflictError` con mensaje exacto.
  - Convención del proyecto: `Test.createTestingModule` + `jest.mocked` (ver spec existente).
- **Dependencias**: TASK-1.2
- **Notas**: ⚠️ La design §3.4 dice "Archivo nuevo", pero el spec **ya existe** (verificado por grep en la fase de planning). Esta task es **modificación**.

### TASK-1.4: Enums `MANUAL_ABSENT` y `TURNO_AUSENTE`
- **Tipo**: enum
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts` (modificar — agregar `MANUAL_ABSENT`)
  - `apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts` (modificar — agregar `TURNO_AUSENTE`)
- **Spec/diseño referencia**: §5.6
- **Criterios de aceptación**:
  - `AccionAuditoria.MANUAL_ABSENT = 'MANUAL_ABSENT'` exportado.
  - `TipoNotificacion.TURNO_AUSENTE = 'TURNO_AUSENTE'` exportado.
  - Compilan sin errores.
- **Dependencias**: ninguna

### TASK-1.5: Migración + entity `Turno.ausenteMotivo`
- **Tipo**: migration + entity
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/migrations/<timestamp>-AddAusenteMotivoToTurno.ts` (crear)
  - `apps/backend/src/infrastructure/persistence/typeorm/entities/turno.entity.ts` (modificar)
- **Spec/diseño referencia**: §5.2, §5.3
- **Criterios de aceptación**:
  - `up`: `ALTER TABLE turno ADD COLUMN ausente_motivo VARCHAR(500) NULL`; `down`: la elimina.
  - `TurnoOrmEntity` agrega `@Column({ name: 'ausente_motivo', type: 'varchar', length: 500, nullable: true }) ausenteMotivo: string | null`.
- **Dependencias**: ninguna

### TASK-1.6: DTO `MarcarAusenteManualDto`
- **Tipo**: dto
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/dtos/marcar-ausente-manual.dto.ts` (crear)
  - `apps/backend/src/application/turnos/dtos/index.ts` (modificar — agregar export)
- **Spec/diseño referencia**: §5.1
- **Criterios de aceptación**:
  - Clase con `motivo: string` con `@IsString()`, `@MinLength(3)`, `@MaxLength(500)` y mensajes en español.
  - Exportado desde el barrel `dtos/index.ts`.
- **Dependencias**: ninguna

### TASK-1.7: Use-case `MarcarAusenteManualUseCase`
- **Tipo**: use-case
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/marcar-ausente-manual.use-case.ts` (crear)
  - `apps/backend/src/application/turnos/use-cases/index.ts` (modificar — agregar export)
- **Spec/diseño referencia**: §5.4
- **Criterios de aceptación**:
  - Implementa el pseudocódigo del §5.4: fetch turno con filtro tenant → validar estado ∈ {CONFIRMADO, PRESENTE} → guardar `estadoTurno=AUSENTE`, `ausenteAt=now`, `ausenteMotivo` → registrar auditoría `MANUAL_ABSENT` → notificar al socio con `TURNO_AUSENTE` → devolver `TurnoOperacionResponseDto`.
  - RB13: lanza `ForbiddenError` si el nutricionista no es el dueño y no es RECEPCIONISTA/ADMIN del mismo gimnasio.
  - Exportado desde el barrel.
- **Dependencias**: TASK-1.4, TASK-1.5, TASK-1.6

### TASK-1.8: Controller `POST /api/turnos/profesional/turnos/:id/marcar-ausente-manual` + extender `TurnoNutricionistaAccessGuard`
- **Tipo**: controller + refactor (guard)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/presentation/http/controllers/turnos.controller.ts` (modificar)
  - `apps/backend/src/infrastructure/auth/guards/turno-nutricionista-access.guard.ts` (modificar)
- **Spec/diseño referencia**: §5.5, §12.3, §12.4
- **Criterios de aceptación**:
  - Endpoint decorado con `@Post('profesional/turnos/:id/marcar-ausente-manual')`, `@Rol(NUTRICIONISTA, RECEPCIONISTA, ADMIN)`, `@UseGuards(TurnoNutricionistaAccessGuard)`.
  - El guard extendido permite RECEPCIONISTA y ADMIN del mismo gimnasio (gimnasioId match con `tenantContext`). Cambio <30 líneas.
  - El use-case se invoca con `turnoId, payload, tenantContext`.
- **Dependencias**: TASK-1.7
- **Notas**: aplicar decisión D3 (ajustar guard en PR #1).

### TASK-1.9: Test use-case `marcar-ausente-manual`
- **Tipo**: test
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/marcar-ausente-manual.use-case.spec.ts` (crear)
- **Spec/diseño referencia**: §5.7
- **Criterios de aceptación**:
  - 5 casos: happy path (PRESENTE → AUSENTE + auditoría + notificación), estado wrong (REALIZADO → `ConflictError`), foreign gym (`NotFoundError`), RECEPCIONISTA cross-gym (`NotFoundError`), ADMIN bypass gym propio permitido.
  - Mockea `turnoRepository`, `auditoriaService.registrar`, `notificacionesService.crear`, `tenantContext`.
- **Dependencias**: TASK-1.7

### TASK-1.10: Use-case `AbrirFichaDesdeTurnoUseCase` + DTO
- **Tipo**: use-case + dto
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/abrir-ficha-desde-turno.use-case.ts` (crear)
  - `apps/backend/src/application/turnos/dtos/abrir-ficha-desde-turno.dto.ts` (crear)
  - `apps/backend/src/application/turnos/use-cases/index.ts` (modificar)
- **Spec/diseño referencia**: §6.1, §6.2
- **Criterios de aceptación**:
  - DTO con `turnoId`, `nutricionistaId`, `socioId`.
  - Use-case implementa: fetch turno con tenant filter → si NUTRICIONISTA, valida RB13 (count turnos previos con ese socio) → si RB25 falla lanza `NotFoundError` → si hay ficha, `fichaSaludRepository.update(idFicha, { revisadaPorNutricionistaAt: new Date() })` → retorna `{ fichaId, revisada, revisadaAt }`.
  - Si no hay ficha: retorna `{ ficha: null, revisada: false }` sin fallar.
  - Exportado.
- **Dependencias**: ninguna

### TASK-1.11: Refactor `GetFichaSaludPacienteUseCase` para delegar en `AbrirFichaDesdeTurnoUseCase`
- **Tipo**: refactor (RB45 single source of truth)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/get-ficha-salud-paciente.use-case.ts` (modificar)
- **Spec/diseño referencia**: §6.3
- **Criterios de aceptación**:
  - El bloque que setea `revisadaPorNutricionistaAt` (líneas ~78-84) se reemplaza por `await this.abrirFichaDesdeTurnoUseCase.execute(turnoIdPrevio, currentUser)`.
  - El use-case debe encontrar el turno previo entre `(nutricionistaId, socioId)` y pasar su `idTurno` (1 query extra acceptable).
  - `revisadaPorNutricionistaAt` se sigue seteando — comportamiento idéntico al actual.
- **Dependencias**: TASK-1.10
- **Notas**: aplicar decisión D2 (refactor, no duplicación).

### TASK-1.12: Test use-case `abrir-ficha-desde-turno`
- **Tipo**: test
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/abrir-ficha-desde-turno.use-case.spec.ts` (crear)
- **Spec/diseño referencia**: §6.4
- **Criterios de aceptación**:
  - 4 casos: happy path nutricionista con turno previo + ficha existente → setea `revisadaPorNutricionistaAt`; sin ficha → `{ ficha: null, revisada: false }`; sin turno previo (RB13) → `ForbiddenError`; otro gimnasio → `NotFoundError`.
  - Mockea `turnoRepository`, `fichaSaludRepository`, `tenantContext`.
- **Dependencias**: TASK-1.10

### TASK-1.13: DTO `TurnoDelDiaResponseDto` + `DatosTurnoResponseDto` con `fichaActualizada` y `consultaId`
- **Tipo**: dto
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/dtos/turno-del-dia-response.dto.ts` (modificar)
  - `apps/backend/src/application/turnos/dtos/datos-turno-response.dto.ts` (modificar — agregar mismos campos)
- **Spec/diseño referencia**: §7.1, §7.2
- **Criterios de aceptación**:
  - Ambos DTOs agregan `fichaActualizada: boolean` y `consultaId: number | null`.
  - Compilan sin errores.
- **Dependencias**: ninguna

### TASK-1.14: `GetTurnosDelDiaUseCase` computa `fichaActualizada`
- **Tipo**: use-case (refactor + 1 query extra)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/get-turnos-del-dia.use-case.ts` (modificar)
- **Spec/diseño referencia**: §7.3
- **Criterios de aceptación**:
  - Después de obtener la lista de turnos, ejecuta 1 query agregada: `MAX(observacion_clinica.created_at) GROUP BY socio_id WHERE nutricionistaId = :id AND socioId IN (...)`.
  - Construye un `Map<socioId, maxCreatedAt>`.
  - En el `.map` final: `fichaActualizada = fichaSalud.actualizadaAt != null ? (fichaSalud.actualizadaAt > maxConsultaMap.get(socioId) ?? true) : false`.
  - Si `turnos.length === 0`, no ejecuta la segunda query.
- **Dependencias**: TASK-1.13

### TASK-1.15: `GetTurnoByIdUseCase` computa `fichaActualizada`
- **Tipo**: use-case (refactor)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/use-cases/get-turno-by-id.use-case.ts` (modificar)
- **Spec/diseño referencia**: §7.3
- **Criterios de aceptación**:
  - Misma lógica que TASK-1.14 pero para 1 turno: fetch `MAX(observacion_clinica.created_at)` para el par (nutricionistaId, socioId) del turno.
  - Setea `fichaActualizada` y `consultaId` en el DTO de salida.
- **Dependencias**: TASK-1.13

### TASK-1.16: Frontend `TurnosProfesional.tsx` switch a `/hoy` + botones contextuales
- **Tipo**: frontend-page (refactor)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/TurnosProfesional.tsx` (modificar)
- **Spec/diseño referencia**: §12.1
- **Criterios de aceptación**:
  - Cambia el fetch de `/turnos/profesional/:id/disponibilidad?fecha=` a `/turnos/profesional/:id/hoy?fecha=`.
  - Renderiza lista de turnos con datos del socio (`socio.nombreCompleto`).
  - Botones contextuales por `estadoTurno`:
    - `CONFIRMADO` → "Marcar ausente manual" (secundario)
    - `PRESENTE` → "Iniciar consulta" (primario) + "Marcar ausente manual" (secundario)
    - `EN_CURSO` → "Finalizar consulta" (primario)
    - `REALIZADO` → readonly badge "Realizado"
    - `AUSENTE` → readonly badge "Ausente"
  - Mantiene compatibilidad con selector ADMIN de nutricionista.
- **Dependencias**: TASK-1.14, TASK-1.15

### TASK-1.17: Frontend modal "Marcar ausente manual"
- **Tipo**: frontend-component
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/TurnosProfesional.tsx` (modificar)
- **Spec/diseño referencia**: §12.1, §12.2
- **Criterios de aceptación**:
  - Modal `Dialog` de shadcn con `<Textarea>` required (min 3 chars via Zod).
  - Submit → `POST /api/turnos/profesional/turnos/:id/marcar-ausente-manual` con `{ motivo }`.
  - Toast success en 200; toast error mostrando `err.message` en 4xx/5xx.
  - Recarga la agenda (`cargarAgenda()`) al cerrar el modal con éxito.
- **Dependencias**: TASK-1.16

### TASK-1.18: Frontend badge "Ficha actualizada"
- **Tipo**: frontend-component
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/TurnosProfesional.tsx` (modificar)
- **Spec/diseño referencia**: §7.4, §12.1
- **Criterios de aceptación**:
  - Si `turno.fichaActualizada === true`, muestra badge verde (`bg-emerald-100 text-emerald-800`) con ícono `FileCheck` de `lucide-react` al lado del nombre del socio.
  - Tooltip: "El socio actualizó su ficha de salud después de la última consulta."
- **Dependencias**: TASK-1.16

### TASK-1.19: Frontend manejo de HTTP 409 en `ConsultaProfesionalPage`
- **Tipo**: frontend-page (refactor error handling)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/ConsultaProfesionalPage.tsx` (modificar)
- **Spec/diseño referencia**: §1.1, §14 (riesgo UX optimistic lock)
- **Criterios de aceptación**:
  - El catch del `POST /api/turnos/:id/observaciones` detecta status 409.
  - En 409: muestra toast "La consulta fue modificada por otro usuario. Recargá los cambios." y ejecuta `cargarDatosTurno()` para recargar el estado.
  - NO hay merge automático — el usuario debe revisar los cambios manualmente.
- **Dependencias**: TASK-1.2
- **Notas**: ⚠️ Esta task NO depende de TASK-1.16/1.17/1.18 — solo necesita TASK-1.2 (backend tira 409). Se puede implementar en paralelo a las otras frontend tasks.

---

## PR #2 — Workstreams B + C + D (spec 15 + spec 10 + tests)

> Base branch: `main` (mergeado PR #1). PR #2 se apila sobre PR #1.

### TASK-2.1: Migración `presentacion` + `certificaciones` en `persona`
- **Tipo**: migration
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/migrations/<timestamp>-AddPresentacionCertificacionesNutricionista.ts` (crear)
- **Spec/diseño referencia**: §2.1
- **Criterios de aceptación**:
  - `up` ejecuta 2 `ALTER TABLE persona ADD COLUMN ... TEXT NULL`; `down` las elimina.
  - Documenta en comentario que aplica a `tipo_persona='nutricionista'` (single-table inheritance).
- **Dependencias**: ninguna

### TASK-2.2: Entity `NutricionistaOrmEntity` + `NutricionistaEntity` agregan `presentacion`/`certificaciones`
- **Tipo**: entity (ORM + domain)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/entities/persona.entity.ts` (modificar)
  - `apps/backend/src/domain/entities/Persona/Nutricionista/nutricionista.entity.ts` (modificar)
- **Spec/diseño referencia**: §2.2, §2.3
- **Criterios de aceptación**:
  - ORM: `@Column({ name: 'presentacion', type: 'text', nullable: true })` y `@Column({ name: 'certificaciones', type: 'text', nullable: true })`.
  - Domain: campos opcionales `presentacion: string | null` y `certificaciones: string | null`.
  - Constructor del domain acepta ambos como últimos parámetros opcionales.
- **Dependencias**: TASK-2.1

### TASK-2.3: Migración + entity + domain `ExcepcionDisponibilidad`
- **Tipo**: migration + entity (ORM + domain)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/infrastructure/persistence/typeorm/migrations/<timestamp>-AddExcepcionDisponibilidad.ts` (crear)
  - `apps/backend/src/infrastructure/persistence/typeorm/entities/excepcion-disponibilidad.entity.ts` (crear)
  - `apps/backend/src/domain/entities/Agenda/excepcion-disponibilidad.entity.ts` (crear)
- **Spec/diseño referencia**: §4.1, §4.3
- **Criterios de aceptación**:
  - Migración: `CREATE TABLE excepcion_disponibilidad` con columnas `id_excepcion`, `fecha_inicio`, `fecha_fin`, `motivo`, `id_nutricionista`, `created_at`, `updated_at`, índices `(id_nutricionista)` y `(fecha_inicio, fecha_fin)`.
  - ORM entity con `@Entity('excepcion_disponibilidad')`, relaciones con `NutricionistaOrmEntity` y `AuditableOrmEntity`.
  - Domain entity con `idExcepcion: number | null`, `nutricionista: NutricionistaEntity`, `fechaInicio: Date`, `fechaFin: Date`, `motivo: string | null`.
- **Dependencias**: ninguna

### TASK-2.4: Repositorio `ExcepcionDisponibilidadRepository`
- **Tipo**: repository (abstracción)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/domain/entities/Agenda/excepcion-disponibilidad.repository.ts` (crear)
  - `apps/backend/src/infrastructure/persistence/typeorm/repositories/excepcion-disponibilidad.repository.ts` (crear)
  - Registrar provider en módulo correspondiente (verificar `AgendaModule` o `ProfesionalesModule`).
- **Spec/diseño referencia**: §4.1 (implícito)
- **Criterios de aceptación**:
  - Interface con método `findVigentesEnVentana(nutricionistaId, fechaDesde, fechaHasta): Promise<ExcepcionDisponibilidadEntity[]>`.
  - Implementación TypeORM con query `WHERE id_nutricionista = :id AND fecha_inicio <= :hasta AND fecha_fin > :desde`.
  - Inyectable vía token `EXCEPCION_DISPONIBILIDAD_REPOSITORY` (siguiendo patrón `NUTRICIONISTA_REPOSITORY`).
- **Dependencias**: TASK-2.3

### TASK-2.5: Algoritmo de slots + tests unitarios (60d, 2h, excepciones, ocupación)
- **Tipo**: use-case + test
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/turnos/services/slot-computation.service.ts` (crear)
  - `apps/backend/src/application/turnos/services/slot-computation.service.spec.ts` (crear)
- **Spec/diseño referencia**: §4.4, §4.5
- **Criterios de aceptación**:
  - Servicio con método `calcularSlotsDisponibles(nutricionistaId, fechaDesde?, fechaHasta?)` implementando el pseudocódigo del §4.4.
  - Usa `America/Argentina/Buenos_Aires` para todas las operaciones (helper `getArgentinaTodayDate`, `combineArgentinaDateAndTime` — ver `apps/backend/src/common/utils/argentina-datetime.util.ts`).
  - Tests cubren: ventana por defecto (now+2h → now+60d), `fechaDesde` < now+2h → `BadRequestError`, `fechaHasta` > now+60d → `BadRequestError`, slot en excepción → no aparece, slot ocupado → no aparece, slot en pasado → no aparece.
  - Sin nutricionista sin bloques semanales → retorna `{ slots: [] }`.
- **Dependencias**: TASK-2.4

### TASK-2.6: Extender endpoint `GET /api/turnos/socio/profesional/:id/disponibilidad` con `fechaDesde`/`fechaHasta`
- **Tipo**: controller (refactor)
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/presentation/http/controllers/turnos.controller.ts` (modificar)
  - `apps/backend/src/application/turnos/dtos/disponibilidad-socio-response.dto.ts` (crear si no existe)
- **Spec/diseño referencia**: §4.6
- **Criterios de aceptación**:
  - Acepta query params `fechaDesde` y `fechaHasta` (opcionales, ambos opcionales → defaults del §4.4).
  - Si solo viene `fecha` (legacy) → comportamiento actual se mantiene.
  - Response: `{ nutricionistaId, duracionMin, slots: [{ fechaHora, disponible }] }`.
- **Dependencias**: TASK-2.5

### TASK-2.7: `ListarNutricionistasCatalogoUseCase` con paginación, filtros, sort
- **Tipo**: use-case
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/profesionales/use-cases/listar-nutricionistas-catalogo.use-case.ts` (crear)
- **Spec/diseño referencia**: §1.1 (workstream C)
- **Criterios de aceptación**:
  - Query params: `nombre?`, `disponible?` (boolean, filtra por `slotsProximos7Dias > 0`), `sort?` (nombre|disponible|recientes), `page?` (default 1), `limit?` (default 12, max 100).
  - Aplica RB25: solo nutricionistas del `tenantContext.gimnasioId`.
  - Aplica RB17: solo `estado='ACTIVO' AND fechaBaja IS NULL`.
  - Calcula `slotsProximos7Dias` por nutricionista (cuenta slots disponibles en los próximos 7 días usando el algoritmo de TASK-2.5).
  - Response: `{ items, total, page, limit, totalPages }`.
- **Dependencias**: TASK-2.5, TASK-2.10 (DTO)

### TASK-2.8: `GetPerfilProfesionalPublicoUseCase` cleanup DTO + RB25
- **Tipo**: use-case + dto
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/profesionales/use-cases/get-perfil-profesional-publico.use-case.ts` (modificar)
  - `apps/backend/src/application/profesionales/dtos/profesional-publico-response.dto.ts` (modificar — clase `PerfilProfesionalPublicoResponseDto`)
- **Spec/diseño referencia**: §8, §9.1
- **Criterios de aceptación**:
  - Inyecta `TenantContextService`.
  - Valida `nutricionista.gimnasioId === tenantContext.gimnasioId` → si no, `NotFoundError` (no `ForbiddenError` — convención del proyecto).
  - DTO `PerfilProfesionalPublicoResponseDto`: quita `email`, `telefono`, `direccion`, `genero`, `biografia`, `calificacionPromedio`, `totalOpiniones`. Agrega `presentacion`, `certificaciones`, `fotoUrl`, `duracionTurnoMin`, `formacionAcademica: { titulo, institucion, anio }[]`, `horarios: HorarioProfesionalPublicoDto[]`.
  - `fotoUrl` se computa con el patrón existente: `/api/profesional/${id}/foto?v=${fotoPerfilKey}` (decisión D1: endpoint propio).
- **Dependencias**: TASK-2.2 (campos nuevos)

### TASK-2.9: Tests use-cases catálogo y perfil
- **Tipo**: test
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/profesionales/use-cases/listar-nutricionistas-catalogo.use-case.spec.ts` (crear) — o `list-profesionales-publicos.use-case.spec.ts` si se conserva el nombre
  - `apps/backend/src/application/profesionales/use-cases/get-perfil-profesional-publico.use-case.spec.ts` (crear)
- **Spec/diseño referencia**: §8.2, §9.3
- **Criterios de aceptación**:
  - **Catálogo** (4 casos): lista vacía → `{ items: [] }`; 5 nutricionistas activos → 5 items sin email/telefono/direccion; 1 con `fechaBaja` → no aparece; `?disponible=true` filtra por `slotsProximos7Dias > 0`.
  - **Perfil** (3 casos): happy path mismo gym + activo → 200 con DTO; socio de otro gym → `NotFoundError`; nutricionista inactivo → `NotFoundError`.
- **Dependencias**: TASK-2.7, TASK-2.8

### TASK-2.10: DTO `ProfesionalPublicoResponseDto` (catálogo) con campos nuevos
- **Tipo**: dto
- **Stack**: backend
- **Archivos**:
  - `apps/backend/src/application/profesionales/dtos/profesional-publico-response.dto.ts` (modificar — clase `ProfesionalPublicoResponseDto`)
- **Spec/diseño referencia**: §9.1
- **Criterios de aceptación**:
  - Agrega `fotoUrl: string | null`, `presentacion: string | null`, `duracionTurnoMin: number`, `slotsProximos7Dias: number`.
  - NO incluye `email`, `telefono`, `direccion`.
  - Compila sin errores.
- **Dependencias**: TASK-2.2
- **Notas**: ⚠️ Esta task lógicamente debe ir **antes** de TASK-2.7 (el use-case catálogo usa este DTO). Se documenta como dependencia de TASK-2.7.

### TASK-2.11: Frontend rename `Nutricionistas.tsx` → `GestionNutricionistas.tsx` + update router
- **Tipo**: refactor (rename)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/Nutricionistas.tsx` (renombrar a `GestionNutricionistas.tsx`)
  - `apps/frontend/src/router.tsx` (modificar — actualizar import)
- **Spec/diseño referencia**: §11.1
- **Criterios de aceptación**:
  - El archivo se mueve (no se duplica) usando `git mv`.
  - `router.tsx` importa `GestionNutricionistas` en vez de `Nutricionistas`.
  - La ruta `/nutricionistas` sigue funcionando para ADMIN (sin cambios de UX).
- **Dependencias**: ninguna

### TASK-2.12: Frontend `NutricionistasCatalogo.tsx` con grid, filtros, paginación, empty states
- **Tipo**: frontend-page (nueva)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/NutricionistasCatalogo.tsx` (crear)
- **Spec/diseño referencia**: §11.2, §11.3
- **Criterios de aceptación**:
  - Grid 3-col desktop (`lg:grid-cols-3`), 2-col tablet, 1-col mobile.
  - Filtros sticky top: input `nombre`, toggle "Con disponibilidad próxima", select sort (nombre|disponible|recientes), select page size (6|12|24).
  - Cada card: foto 80×80 circular, nombre + matrícula, presentacion truncada a 3 líneas (`line-clamp-3`), badge verde "X slots esta semana" si `slotsProximos7Dias > 0`, badge tarifa ("$X" o "A convenir" si <= 0), botón "Ver perfil" → `/nutricionistas/$id/perfil`, botón "Reservar" → `/turnos/agendar?nutricionistaId=$id`.
  - Paginación anterior/siguiente + "Página X de Y".
  - 3 empty states distintos: "No hay nutricionistas", "Filtros sin resultados" (con botón "Limpiar filtros"), "Sin slots próximos" (en perfil — ver TASK-2.14).
  - Header gradiente naranja/rosa siguiendo patrón de `AgendarTurno.tsx` línea 361.
- **Dependencias**: TASK-2.7, TASK-2.10, TASK-2.11

### TASK-2.13: Frontend `CalendarioEmbed.tsx` componente compartido
- **Tipo**: frontend-component (nuevo)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/components/catalogo/CalendarioEmbed.tsx` (crear)
- **Spec/diseño referencia**: §10.2
- **Criterios de aceptación**:
  - Props: `{ nutricionistaId: number; duracionMin: number; onSeleccionarSlot?: (slot: SlotDisponible) => void }`.
  - Estado interno: `fechaSeleccionada` (default = now + 2h redondeado al próximo bloque).
  - useEffect: fetch slots del día seleccionado al endpoint de TASK-2.6.
  - Render: `<DatePicker>` + grid 2-col de botones por slot; si `slot.disponible` muestra hora, si no, hora tachada + "Ocupado".
  - Si `fechaSeleccionada < now + 2h`: warning "Muy pronto para reservar".
  - Reutilizable en `PerfilNutricionista` (TASK-2.14) y en modal de previsualización del catálogo.
- **Dependencias**: TASK-2.6

### TASK-2.14: Frontend rework `PerfilNutricionista.tsx`
- **Tipo**: frontend-page (refactor visual)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/pages/PerfilNutricionista.tsx` (modificar)
- **Spec/diseño referencia**: §10.1
- **Criterios de aceptación**:
  - Header: foto circular 200×200 a la izquierda.
  - Sticky button: `<Button className="sticky top-4 ...">Reservar turno</Button>` → `/turnos/agendar?nutricionistaId=:id`.
  - Sección "Sobre el profesional" con `whitespace-pre-line` para `presentacion`.
  - Sección "Certificaciones" (mismo tratamiento).
  - Sección "Formación académica": nueva, mapea `formacionAcademica` a cards.
  - Tarifa: badge evalúa `tarifaSesion > 0` → `"$" + toFixed(2)`; si `<= 0` → "A convenir" en gris.
  - Quita secciones "Email", "Teléfono", "Dirección" (data leak).
  - Avatar fallback: iniciales en círculo gris si `fotoUrl` es null.
  - Integra `<CalendarioEmbed>` de TASK-2.13 reemplazando "Horario de atención" actual.
- **Dependencias**: TASK-2.8, TASK-2.13

### TASK-2.15: Frontend nueva ruta `/nutricionistas/catalogo` + link en sidebar
- **Tipo**: refactor (routing)
- **Stack**: frontend
- **Archivos**:
  - `apps/frontend/src/router.tsx` (modificar — agregar `nutricionistasCatalogoRoute`)
  - `apps/frontend/src/components/sidebar/*` (modificar — el link "Nutricionistas" del SOCIO debe apuntar a `/nutricionistas/catalogo`)
- **Spec/diseño referencia**: §11.4, §11.5
- **Criterios de aceptación**:
  - Ruta `/nutricionistas/catalogo` registrada en el `routeTree`, parent `authLayoutRoute`, componente `NutricionistasCatalogo`.
  - Ruta `/nutricionistas` (admin) sigue apuntando a `GestionNutricionistas`.
  - Sidebar: si `rol === 'SOCIO'`, el link "Nutricionistas" navega a `/nutricionistas/catalogo`. Si es ADMIN, mantiene `/nutricionistas`.
- **Dependencias**: TASK-2.11, TASK-2.12
- **Notas**: aplicar decisión D4.

### TASK-2.16: Seed update + `CREDENCIALES_SEED.md`
- **Tipo**: seed + docs
- **Stack**: fullstack
- **Archivos**:
  - `apps/backend/src/seed-multi-tenant.ts` (modificar — agregar `presentacion`/`certificaciones` a nutricionistas seed)
  - `CREDENCIALES_SEED.md` (modificar — agregar sub-sección "Datos públicos de los nutricionistas seed")
- **Spec/diseño referencia**: §2.4
- **Criterios de aceptación**:
  - Los nutricionistas activos de los 2 gimnasios seed tienen `presentacion` (2-3 oraciones en español) y `certificaciones` (lista creíble de 1-3 cursos).
  - `CREDENCIALES_SEED.md` documenta que esos textos son mocks, no datos reales.
  - El seed no rompe con la migración aplicada (las columnas existen en la DB antes de ejecutar el seed).
- **Dependencias**: TASK-2.1, TASK-2.2

---

## Critical path

Tasks que, si fallan, bloquean gran parte del cambio:

1. **TASK-1.1** (migración + entity `@VersionColumn`) — sin esto, TASK-1.2 no puede integrar el catch, y el lock optimista nunca se aplica.
2. **TASK-1.8** (controller + ajuste guard para RECEPCIONISTA) — sin esto, el endpoint `marcar-ausente-manual` es inaccesible para RECEPCIONISTA, degradando la spec 17.
3. **TASK-1.14** (`get-turnos-del-dia` computa `fichaActualizada`) — bloquea TASK-1.16 (frontend switch a `/hoy`), que es la mitad del valor de PR #1.
4. **TASK-2.5** (algoritmo de slots + tests) — bloquea TASK-2.6 (endpoint extendido) y TASK-2.7 (catálogo con `slotsProximos7Dias`); sin esto, PR #2 no entrega discovery funcional.
5. **TASK-2.8** (perfil público + RB25 + DTO cleanup) — bloquea TASK-2.14 (rework `PerfilNutricionista`) y la spec 15 completa.

## Parallelizable work

Dentro de PR #1 se pueden trabajar en paralelo (siempre que las dependencias estén mergeadas):

- **TASK-1.6** (DTO ausente) + **TASK-1.13** (DTO `fichaActualizada`) — archivos distintos, sin dependencias cruzadas.
- **TASK-1.10** (AbrirFichaDesdeTurnoUseCase) + **TASK-1.7** (MarcarAusenteManualUseCase) — archivos distintos.
- **TASK-1.17** (modal ausente) + **TASK-1.18** (badge ficha) + **TASK-1.19** (manejo 409) — frontend, archivos distintos. TASK-1.19 además puede arrancar en paralelo con TASK-1.16/1.17/1.18 (no depende de ellas).

Dentro de PR #2:

- **TASK-2.11** (rename admin) + **TASK-2.1** (migración presentacion) + **TASK-2.3** (migración excepcion) — archivos totalmente independientes, arrancan en paralelo.
- **TASK-2.13** (CalendarioEmbed) + **TASK-2.12** (NutricionistasCatalogo) — se puede trabajar CalendarioEmbed en paralelo al catálogo (este último lo consume pero puede tener un mock o un placeholder).

## Definition of Done por PR

### PR #1 DoD
- [ ] Todas las tasks de PR #1 mergeadas a `main`
- [ ] Tests passing (`npm run test` en backend y frontend)
- [ ] TypeCheck passing (`npm run typecheck` en ambos)
- [ ] Lint passing (`npm run lint` en ambos)
- [ ] Migraciones ejecutan limpio contra DB seed (`npm run migration:run` o equivalente)
- [ ] Spec 17 acceptance criteria cumplidos:
  - [ ] `POST /api/turnos/profesional/turnos/:id/marcar-ausente-manual` end-to-end funciona (PRESENTE/CONFIRMADO → AUSENTE)
  - [ ] Auditoría `MANUAL_ABSENT` registrada en `auditoria`
  - [ ] Notificación `TURNO_AUSENTE` llega al socio
  - [ ] Lock optimista 409 funcional (2 tabs guardando observaciones a la vez, la 2da recibe 409 + toast "Recargá los cambios")
  - [ ] `abrir-ficha-desde-turno` setea `revisadaPorNutricionistaAt` (RB45) — único lugar (refactor de `get-ficha-salud-paciente` aplicado)
  - [ ] `fichaActualizada` se computa correctamente en `get-turnos-del-dia` y `get-turno-by-id`
  - [ ] Frontend `TurnosProfesional` consume `/hoy` y muestra botones contextuales por estado
  - [ ] Modal "Marcar ausente manual" con textarea + validación + toast
  - [ ] Badge "Ficha actualizada" verde con `FileCheck` cuando aplica
  - [ ] RECEPCIONISTA puede marcar ausente en el mismo gimnasio (guard extendido)
- [ ] Demo manual con seed data: socio reserva, nutricionista marca ausente manual, badge aparece, lock optimista testeable manualmente con 2 tabs

### PR #2 DoD
- [ ] Todas las tasks de PR #2 mergeadas a `main` (apilado sobre PR #1)
- [ ] Tests passing
- [ ] TypeCheck + Lint passing
- [ ] Migraciones ejecutan limpio
- [ ] Spec 15 acceptance criteria cumplidos:
  - [ ] DTO público `PerfilProfesionalPublicoResponseDto` NO contiene `email`/`teléfono`/`dirección` (verificable con `console.log` o test)
  - [ ] DTO público contiene `presentacion`/`certificaciones`/`fotoUrl`/`duracionTurnoMin`/`formacionAcademica`
  - [ ] `fotoUrl` se sirve por `GET /api/profesional/:id/foto` (decisión D1, no S3)
  - [ ] RB25 validado en `get-perfil-profesional-publico` (otro gym → 404)
  - [ ] UI perfil: foto 200×200, sticky button, calendario embebido, tarifa con regla 0→"A convenir", formación académica renderizada
- [ ] Spec 10 acceptance criteria cumplidos:
  - [ ] Endpoint detalle accesible a SOCIO con RB25 (otro gym → 404)
  - [ ] Slots: ventana 60d / 2h anticipación / `ExcepcionDisponibilidad` (test unitario verifica los 3 casos)
  - [ ] Catálogo: grid 3-col desktop, filtros (nombre, disponible, sort), paginación anterior/siguiente, 3 empty states distintos
  - [ ] Ruta `/nutricionistas/catalogo` funciona y el sidebar del SOCIO apunta ahí
  - [ ] Filtro `?disponible=true` oculta profesionales sin slots próximos 7 días
- [ ] Seed actualizado con `presentacion`/`certificaciones` de muestra
- [ ] `CREDENCIALES_SEED.md` documenta los textos como mocks
- [ ] Demo manual: socio navega catálogo, ve perfil completo con foto, sticky "Reservar turno", disponibilidad real con slots filtrados por 2h/60d

---

## Decisiones pendientes para `apply`

Las decisiones D1–D4 ya están **resueltas** (ver preflight). No requieren re-pregunta. Solo se listan para que `apply` las confirme al arrancar:

- **D1** ✅ foto por endpoint propio `GET /api/profesional/:id/foto` (sin S3).
- **D2** ✅ refactor `get-ficha-salud-paciente` para delegar en `abrir-ficha-desde-turno`.
- **D3** ✅ ajustar `TurnoNutricionistaAccessGuard` en PR #1 para RECEPCIONISTA.
- **D4** ✅ ruta `/nutricionistas/catalogo`.

No quedan decisiones abiertas para `sdd-tasks`.
