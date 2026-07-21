# Delta Spec: 15 — Ver perfil profesional

## ADDED Requirements

### Requirement: presentacion-y-certificaciones
The `Nutricionista` entity SHALL include `presentacion` (text, nullable) and `certificaciones` (text, nullable).
- The `perfil-publico` response DTO SHALL expose these fields.

#### Scenario: Visualizar datos descriptivos del profesional
- **WHEN** the socio requests the public profile of a professional who has filled out their presentation and certifications
- **THEN** the DTO includes the `presentacion` and `certificaciones` fields.

### Requirement: foto-perfil-publica
The response DTO SHALL include `fotoUrl` (string | null), computed from the internal `fotoPerfilKey`.

#### Scenario: Profesional con foto configurada
- **WHEN** the professional has an uploaded profile picture
- **THEN** the API returns a resolved `fotoUrl`.

### Requirement: duracion-turno-publica
The response DTO SHALL include `duracionTurnoMin` (number), resolved from the professional's default agenda block.

#### Scenario: Mostrar duración de sesiones
- **WHEN** the public profile is requested
- **THEN** the DTO includes the expected session duration `duracionTurnoMin`.

### Requirement: reglas-tarifa
The frontend UI layer SHALL enforce specific display rules for the `tarifaSesion` value returned by the backend.
- The frontend SHALL hide the explicit monetary value when `tarifaSesion <= 0`.
- The frontend SHALL render the fallback text "A convenir" in such cases.
- When `tarifaSesion > 0`, it SHALL be rendered rounded to 2 decimals.

#### Scenario: Mostrar tarifa gratuita
- **WHEN** the API returns a `tarifaSesion` of 0
- **THEN** the UI displays "A convenir".

### Requirement: multi-tenant-perfil
The `get-perfil-profesional-publico` use-case SHALL enforce RB25.
- A SOCIO SHALL only be able to retrieve the profile of a nutricionista if the professional is associated with the socio's `gimnasioId`.

#### Scenario: Intento de ver perfil de otro gimnasio
- **WHEN** a SOCIO requests the profile of a professional from a different gym
- **THEN** the system returns a `404 Not Found` or `403 Forbidden` per standard RB25 handling.

## MODIFIED Requirements

### Requirement: perfil-publico-datos
The `perfil-publico` response DTO MUST NOT include private fields such as `email`, `telefono`, or `direccion`.
The use-case mapper MUST explicitly omit these fields to prevent data leakage.

#### Scenario: Consulta del perfil público oculta datos privados
- **WHEN** the socio requests the public profile
- **THEN** the returned object does not contain `email`, `telefono`, or `direccion`.

### Requirement: paths-divergence-note
Paths referencing the professional's public profile SHALL be updated to `/api/profesional/publico/:id/perfil` to reflect the current implementation (Decision 1A).

#### Scenario: Requesting public profile current path
- **WHEN** the frontend requests the professional's profile
- **THEN** it uses `/api/profesional/publico/:id/perfil`.

### Requirement: ui-sticky-reservar
The profile detail UI SHALL include a sticky "Reservar turno" button that remains visible during scroll.

#### Scenario: Scroll en el perfil del nutricionista
- **WHEN** the user scrolls down through the professional's profile
- **THEN** the "Reservar turno" button remains continuously visible on the screen.

## REMOVED Requirements

*(None in Spec 15)*
