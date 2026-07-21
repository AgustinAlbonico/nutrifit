# Delta Spec: 10 — Ver nutricionistas disponibles

## ADDED Requirements

### Requirement: slots-60-dias-2h-anticipacion
The system SHALL expose `GET /api/turnos/socio/profesional/:nutricionistaId/disponibilidad` extended to accept `fechaDesde` and `fechaHasta`.
- By default, the window SHALL be from `now() + 2h` to `now() + 60 days` (RB07).
- The response MUST be shaped as `{ nutricionistaId, duracionMin, slots: [{ fechaHora, disponible }] }`.
- The availability computation SHALL incorporate `DisponibilidadSemanal`, `ExcepcionDisponibilidad`, and currently occupied `Turno` slots (where `estado IN (CONFIRMADO, PRESENTE, EN_CURSO)`).

#### Scenario: Listar slots con la anticipación correcta
- **WHEN** a socio requests availability without passing dates
- **THEN** the system computes slots starting at least 2 hours from the current moment, up to 60 days in the future, excluding occupied or exception slots.

### Requirement: detalle-publico-nutricionista
The endpoint `GET /api/profesional/:id` SHALL be accessible to the SOCIO role (currently admin-only) to return full professional info.
- The system SHALL enforce RB25 (multi-tenant check).
- The proxy for determining if the professional is available for discovery SHALL be `nutricionista.estado = 'ACTIVO' AND nutricionista.fechaBaja IS NULL` (reformulated RB17).

#### Scenario: Socio accede al detalle del profesional
- **WHEN** an authenticated SOCIO calls `GET /api/profesional/:id` for an active professional in their gym
- **THEN** the system returns `200 OK` with the professional's details.

### Requirement: paginacion-listado
The `GET /api/profesional/publico/disponibles` endpoint SHALL accept `page` (>=1) and `limit` (<=100) query parameters.
- The response MUST include `{ items, total, page, limit, totalPages }`.
- The endpoint SHALL support sorting via a `sort` parameter: `nombre` (default asc), `disponible` (more slots first), or `recientes`.

#### Scenario: Paginación y ordenamiento del catálogo
- **WHEN** a client requests page 2 with a limit of 10 sorted by availability
- **THEN** the system returns up to 10 professionals mapped correctly to the second page of results, sorted by the number of available slots in descending order.

### Requirement: filtro-disponible
The system SHALL support the query parameter `?disponible=true` on the catalog endpoint.
- When true, the system SHALL only return professionals who have at least 1 available slot in the next 7 days.

#### Scenario: Filtrar solo profesionales con turnos en los próximos 7 días
- **WHEN** the `?disponible=true` flag is sent
- **THEN** professionals with no slots in the upcoming 7 days are omitted from the results.

### Requirement: excepcion-disponibilidad
The system SHALL model an `ExcepcionDisponibilidad` (or equivalent) entity that blocks date ranges or specific dates from the slot computation.

#### Scenario: Profesional tiene una excepción en sus horarios
- **WHEN** a professional creates an exception for tomorrow
- **THEN** the availability computation yields no slots for tomorrow.

### Requirement: ui-grid-cards
The frontend SHALL present a grid catalog (3 columns desktop, 1 column mobile).
- Each card SHALL include: circular photo (80x80), name + matricula, truncated `presentacion` text, a badge showing "X slots esta semana", and a "Ver perfil" button.

#### Scenario: Visualización del catálogo en desktop
- **WHEN** the socio navigates to the list of professionals on a desktop device
- **THEN** a 3-column grid is displayed featuring the specified card components.

### Requirement: empty-states
The frontend SHALL handle three specific empty states.
- "No nutricionistas": When the gym has no active professionals.
- "Filtros sin resultados": When search/filter combinations yield zero items (must include a "Limpiar filtros" button).
- "Sin slots próximos": In the detail view when a professional has no available slots computed.

#### Scenario: Filtros muy restrictivos
- **WHEN** a socio filters for a non-existent name
- **THEN** the UI shows the "Filtros sin resultados" state with a clear "Limpiar filtros" action.

## MODIFIED Requirements

### Requirement: reglas-de-negocio-rb17
The original RB17 logic has been rewritten.
The system MUST NOT rely on `wizard_completado` or `setup_operativo` fields.
The operative status proxy SHALL be strictly evaluated as `estado = 'ACTIVO' AND fechaBaja IS NULL` (Decision 2B). Other rules (RB07, RB14, RB25) are preserved.

#### Scenario: Nutricionista activo se muestra en el catálogo
- **WHEN** a professional has `estado='ACTIVO'` and `fechaBaja` is NULL
- **THEN** they are eligible to appear in the socio catalog search.

### Requirement: paths-divergence-note
Paths referencing the availability and catalog endpoints SHALL be updated to `/api/profesional/publico/disponibles`, `/api/profesional/:id`, and `/api/turnos/socio/profesional/:nutricionistaId/disponibilidad` to reflect the current implementation (Decision 1A).

#### Scenario: Requesting available professionals
- **WHEN** the frontend requests the available professionals
- **THEN** it uses `/api/profesional/publico/disponibles`.

## REMOVED Requirements

### Requirement: wizard-completado-flag
**Reason**: Removed per Decision 2B to prevent redundant state flags.
**Migration**: Use the proxy `estado='ACTIVO' AND fechaBaja IS NULL`.

### Requirement: setup-operativo-flag
**Reason**: Removed per Decision 2B.
**Migration**: Use the proxy `estado='ACTIVO' AND fechaBaja IS NULL`.
