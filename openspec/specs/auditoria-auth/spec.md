# Auditoria Auth Specification

## Purpose

La capacidad `auditoria-auth` define el registro separado de eventos de autenticacion. Cada evento MUST persistirse en `login_audit` y MUST NOT mezclarse con `audit_log`.

## Requirements

### Requirement: Registro de eventos de autenticacion

El sistema MUST registrar eventos auth con `id`, `fecha`, `usuarioId`, `emailIntentado`, `resultado`, `ip`, `userAgent` y `gimnasioId`. `resultado` SHALL ser `SUCCESS`, `FAILURE` o `BLOCKED`. `usuarioId` y `gimnasioId` MAY ser `null` cuando el intento falla antes de resolver usuario o tenant.

#### Scenario: Login exitoso

- GIVEN un usuario activo pertenece al gimnasio A y envia credenciales validas
- WHEN el login finaliza correctamente
- THEN el sistema MUST registrar `resultado=SUCCESS` con `usuarioId` resuelto
- AND el evento MUST incluir `gimnasioId` A, `ip` y `userAgent`

#### Scenario: Login fallido por credenciales invalidas

- GIVEN una solicitud de login usa un email existente o inexistente con credenciales invalidas
- WHEN el login es rechazado
- THEN el sistema MUST registrar `resultado=FAILURE` con `emailIntentado`
- AND `usuarioId` MUST ser `null` si no se autentico ningun usuario

### Requirement: Eventos de sesion

El sistema MUST auditar logout y refresh token como eventos de autenticacion. Los eventos exitosos SHALL conservar actor y tenant cuando esten disponibles.

#### Scenario: Logout autenticado

- GIVEN un usuario autenticado del gimnasio A cierra sesion
- WHEN el logout finaliza
- THEN el sistema MUST registrar un evento con `resultado=SUCCESS`
- AND el evento MUST incluir `usuarioId` y `gimnasioId` A

#### Scenario: Refresh token exitoso y fallido

- GIVEN una solicitud de refresh token contiene un token valido o invalido
- WHEN el sistema procesa el refresh
- THEN un token valido MUST registrar `resultado=SUCCESS` con `usuarioId`
- AND un token invalido MUST registrar `resultado=FAILURE` sin exigir `usuarioId`

### Requirement: Intentos bloqueados

El sistema MUST registrar como `BLOCKED` los intentos impedidos por rate limit, cuenta deshabilitada u otra politica de bloqueo auth.

#### Scenario: Cuenta bloqueada por rate limit

- GIVEN un origen supera el limite permitido de intentos de login
- WHEN una nueva solicitud es bloqueada antes de autenticar
- THEN el sistema MUST registrar `resultado=BLOCKED`
- AND el evento SHOULD conservar `emailIntentado`, `ip` y `userAgent`

### Requirement: Alcance multi-tenant de consulta

El sistema MUST aislar eventos auth por `gimnasioId` cuando el tenant este resuelto. Administradores SHALL ver solo su gimnasio; superadministradores SHALL poder ver todos los eventos auth.

#### Scenario: Admin consulta eventos de su gimnasio

- GIVEN existen eventos auth de los gimnasios A y B
- WHEN un administrador del gimnasio A consulta auditoria auth
- THEN la respuesta MUST incluir solo eventos con `gimnasioId` A
- AND eventos de B MUST NOT ser visibles

#### Scenario: Superadmin consulta eventos auth

- GIVEN existen eventos auth con y sin `gimnasioId` resuelto
- WHEN un superadministrador consulta auditoria auth
- THEN la respuesta MAY incluir eventos de todos los gimnasios
- AND eventos sin tenant resuelto SHOULD permanecer visibles para investigacion

### Requirement: Retencion separada de audit log

El sistema MUST tratar `login_audit` como retencion separada y event-based. Los eventos auth MUST NOT tener diff, snapshots ni payloads sanitizados.

#### Scenario: Eventos auth no aparecen en audit_log

- GIVEN existen eventos en `login_audit` y cambios tecnicos en `audit_log`
- WHEN se consulta el rastro tecnico general
- THEN los eventos auth MUST NOT aparecer como registros de `audit_log`
- AND la auditoria auth MUST conservar solo metadata de evento
