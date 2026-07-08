# Auditoria Specification

## Purpose

La capacidad `auditoria` define el rastro tecnico central de cambios sobre entidades. Cada registro MUST identificar tenant, actor, modulo, entidad, accion, descripcion, origen y valores auditados sanitizados.

## Requirements

### Requirement: Registro de cambios tecnicos

El sistema MUST registrar cambios con `id`, `fecha`, `gimnasioId`, `usuarioId`, `modulo`, `entidad`, `entidadId`, `accion`, `descripcion`, `ip`, `userAgent`, `valoresAntes` y `valoresDespues`. Los cambios HTTP autenticados SHALL capturar actor y origen; los cambios no HTTP MUST declarar actor y tenant.

#### Scenario: Registro automatico via HTTP autenticado

- GIVEN un usuario autenticado del gimnasio A modifica una entidad existente
- WHEN la operacion de negocio finaliza correctamente
- THEN el sistema MUST registrar un log con `usuarioId`, `gimnasioId`, `ip`, `userAgent`, modulo, entidad y accion
- AND `valoresDespues` MUST contener solo el diff por campo cambiado

#### Scenario: Registro explicito desde scheduler

- GIVEN una tarea programada modifica una entidad sin solicitud HTTP
- WHEN la tarea registra la auditoria del cambio
- THEN el log MUST guardar `usuarioId='system'` y el `gimnasioId` afectado
- AND el log MUST incluir modulo, entidad, accion y descripcion trazable

### Requirement: Snapshots por tipo de operacion

El sistema MUST representar CREATE, UPDATE y DELETE con snapshots sanitizados. UPDATE MUST persistir diff por campo, no objetos completos.

#### Scenario: Snapshot completo en CREATE

- GIVEN se crea una entidad por primera vez
- WHEN se registra la auditoria
- THEN `valoresAntes` MUST ser `null`
- AND `valoresDespues` MUST contener el snapshot completo sanitizado de la entidad creada

#### Scenario: Snapshot completo en DELETE

- GIVEN existe una entidad que sera eliminada
- WHEN se registra la auditoria previa al borrado
- THEN `valoresAntes` MUST contener el snapshot completo sanitizado previo
- AND `valoresDespues` MUST ser `null`

#### Scenario: Diff por campo en UPDATE

- GIVEN una entidad cambia `estadoTurno` y `observacion`
- WHEN se registra la auditoria
- THEN `valoresDespues` MUST tener formato `{ "cambios": [...] }`
- AND cada campo cambiado MUST aparecer una vez con `campo`, `antes` y `despues`

### Requirement: Proteccion de informacion sensible

El sistema MUST redactar campos sensibles antes de persistirlos. La blacklist SHALL incluir `password`, `passwordHash`, `hash`, `token`, `jwt`, `refreshToken` y `apiKey`.

#### Scenario: Sanitizacion de password

- GIVEN un cambio contiene el campo `password` en valores auditados
- WHEN el sistema prepara el registro de auditoria
- THEN el valor persistido para `password` MUST ser `[REDACTED]`
- AND el valor original MUST NOT quedar en `valoresAntes` ni `valoresDespues`

### Requirement: Alcance multi-tenant de consulta

El sistema MUST aislar logs por `gimnasioId`. Administradores SHALL ver solo su gimnasio; superadministradores SHALL ver solo el gimnasio impersonado con contexto tenant.

#### Scenario: Usuario de gimnasio A consulta logs

- GIVEN existen logs de los gimnasios A y B
- WHEN un usuario del gimnasio A consulta auditoria
- THEN la respuesta MUST incluir solo registros con `gimnasioId` A
- AND registros de otros gimnasios MUST NOT ser visibles

### Requirement: Auditoria no bloqueante

El sistema SHOULD registrar errores de auditoria sin impedir que la operacion de negocio confirmada complete.

#### Scenario: Falla de auditoria no bloquea operacion

- GIVEN una operacion de negocio finalizo correctamente
- WHEN falla la persistencia del registro de auditoria
- THEN la operacion de negocio MUST conservar su resultado exitoso
- AND el error de auditoria SHOULD quedar registrado para diagnostico tecnico

### Requirement: Metadata semantica de accion

El sistema MUST soportar `tipoAccion` para distinguir estados sobrecargados que comparten el mismo valor visible.

#### Scenario: CONFIRMADO reservado versus bloqueo

- GIVEN dos cambios producen `estadoTurno=CONFIRMADO`, uno con socio y otro sin socio
- WHEN se registran ambos cambios
- THEN cada log MUST incluir `tipoAccion` que diferencie reserva de bloqueo
- AND la interpretacion del evento MUST NOT depender solo de `estadoTurno`
