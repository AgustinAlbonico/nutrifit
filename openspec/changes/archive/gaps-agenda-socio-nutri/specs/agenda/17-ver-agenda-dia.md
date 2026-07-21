# Delta Spec: 17 — Ver agenda del día

## ADDED Requirements

### Requirement: marcar-ausente-manual
The system SHALL allow the NUTRICIONISTA (or RECEPCIONISTA/ADMIN) to mark a CONFIRMADO or PRESENTE turno as AUSENTE manually via `POST /api/turnos/profesional/turnos/:id/marcar-ausente-manual` (using current routing norms for turnos context). A `motivo` MUST be required.
- The system SHALL transition the turno's state to AUSENTE.
- The system SHALL record an audit log with action `MANUAL_ABSENT`.
- The system SHALL send an "ausente" notification to the SOCIO.
- The system SHALL enforce RB13 and RB25.

#### Scenario: Nutricionista marca paciente ausente con motivo
- **WHEN** the nutricionista submits a valid `motivo` for a `PRESENTE` turno
- **THEN** the turno transitions to `AUSENTE`, a `MANUAL_ABSENT` audit is logged, and the socio is notified.

### Requirement: lock-optimista-consulta
The system SHALL use optimistic locking on the `ObservacionClinica` entity via a `@Version` column.
- The system SHALL return `409 Conflict` if the version submitted does not match the database version.
- The frontend SHOULD provide UX guidance to retry or merge changes.

#### Scenario: Conflicto de versiones en observación clínica
- **WHEN** a client saves an observation with a stale version number
- **THEN** the API returns `409 Conflict`.

### Requirement: abrir-ficha-desde-turno
The system SHALL provide a use-case for opening a patient's health record from an agenda turno.
- The system SHALL update `revisada_por_nutricionista_at = now()` on the socio's record (RB45) when accessed through this path.

#### Scenario: Nutricionista abre la ficha desde un turno del día
- **WHEN** the nutricionista requests the socio's health record via the turno detail
- **THEN** `revisada_por_nutricionista_at` is set to the current timestamp.

### Requirement: ficha-actualizada-badge
The system SHALL expose a boolean field `fichaActualizada` in the turno DTO.
- The system SHALL compute `fichaActualizada` as `true` IF `ficha.actualizadaAt > MAX(consulta.createdAt)` for that socio/nutricionista, ELSE `false` (RB15).
- The frontend SHALL surface this as a badge in agenda and detail views.

#### Scenario: Ficha actualizada luego de la última consulta
- **WHEN** a socio updates their health record after their most recent consultation with the given nutricionista
- **THEN** the next turno's DTO includes `fichaActualizada: true`.

### Requirement: agenda-dia-nutricionista
The system SHALL provide `GET /api/turnos/profesional/:nutricionistaId/hoy` with query parameters `fecha`, `estado[]`, `page`, and `limit`.
- The response DTO MUST include socio details, tipoConsulta, estado, fichaActualizada, and consultaId.

#### Scenario: Petición de la agenda de hoy
- **WHEN** the nutricionista fetches `/api/turnos/profesional/me/hoy` (or using their ID)
- **THEN** the system returns the paginated turnos for the given date.

## MODIFIED Requirements

### Requirement: iniciar-consulta
The system SHALL log the action `CONSULTA_INICIADA` when the consultation begins.
The system MUST NOT create an empty `ObservacionClinica` at this stage; it is created on the first save.

#### Scenario: Nutricionista inicia consulta presente
- **WHEN** the nutricionista starts the consultation for a `PRESENTE` turno
- **THEN** the turno transitions to `EN_CURSO`, and a `CONSULTA_INICIADA` audit is logged without creating an empty clinical observation.

### Requirement: finalizar-consulta
The system SHALL log the action `CONSULTA_FINALIZADA` and send the corresponding notification (confirming alignment with the original spec).

#### Scenario: Nutricionista finaliza la consulta
- **WHEN** the nutricionista ends an `EN_CURSO` consultation
- **THEN** the turno transitions to `REALIZADO` and the `CONSULTA_FINALIZADA` audit log is recorded.

### Requirement: ver-detalle-turno
Accessing the socio's file from the turno detail SHALL use the `abrir-ficha-desde-turno` use case to enforce RB45 alongside the standard `get-ficha-salud-paciente` logic.

#### Scenario: Ver detalle y abrir ficha
- **WHEN** the nutricionista clicks "Ver ficha de salud" from the turno detail
- **THEN** the system returns the health record and triggers the `abrir-ficha-desde-turno` use case logic.

### Requirement: agenda-rbac
The endpoint `GET /api/turnos/profesional/:nutricionistaId/hoy` SHALL allow roles RECEPCIONISTA and ADMIN to view ANY nutricionista's agenda by passing the target `nutricionistaId`.

#### Scenario: Recepcionista ve la agenda de un profesional
- **WHEN** a RECEPCIONISTA fetches the agenda passing a specific `nutricionistaId`
- **THEN** the system returns the agenda for that professional, provided they belong to the same multi-tenant environment.

### Requirement: paths-divergence-note
Paths referenced as `/api/nutricionistas/me/agenda*` in the original CU-17 spec SHALL be updated to `/api/turnos/profesional/:nutricionistaId/hoy*` to match current implementation routing (Decision 1A).

#### Scenario: Requesting current implementation path
- **WHEN** the frontend requests the professional's agenda
- **THEN** it uses `/api/turnos/profesional/:nutricionistaId/hoy`.

## REMOVED Requirements

### Requirement: get-nutricionistas-me-agenda
**Reason**: Replaced to align with current routing logic and implementation details.
**Migration**: Replaced by `agenda-dia-nutricionista`.
