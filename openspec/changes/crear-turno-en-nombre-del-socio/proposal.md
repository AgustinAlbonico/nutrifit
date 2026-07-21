# Proposal: Crear turno en nombre del socio

## Intent

Permitir que roles administrativos y profesionales (RECEPCIONISTA, ADMIN, NUTRICIONISTA) puedan crear turnos médicos en nombre de un socio (CU-12 expandido). Actualmente, el sistema no permite que un recepcionista o nutricionista agende un turno para un paciente, bloqueando flujos operativos básicos de un gimnasio.

## Scope

### In Scope
- Creación de turnos por parte de `RECEPCIONISTA`, `ADMIN`, y `NUTRICIONISTA`.
- Validación de alcance por gimnasio: el actor solo puede crear turnos para socios de su mismo gimnasio (o gimnasios que administra, en el caso de ADMIN).
- Soporte para nuevos valores en el enum de creación de turno (`creado_por`): `'RECEPCION'`, `'NUTRICIONISTA'`, `'ADMIN'`.
- Emisión de eventos específicos de creación (`TURNO_CREADO_POR_NUTRICIONISTA`, etc.) manteniendo `TURNO_CONFIRMADO` como el canónico.
- Reutilización de la lógica de validación de reservas existente (`POST /turnos/socio/reservar`).
- Regla de excepción RB14: `RECEPCIONISTA` y `ADMIN` pueden omitir la restricción de ficha médica completa (con advertencia), mientras que para `NUTRICIONISTA` la restricción se mantiene estricta.

### Out of Scope
- Edición de turnos creados por un nutricionista (sujeto a otro CU).

## Capabilities

### New Capabilities
- `crear-turno-admin`: Endpoint y validaciones para la creación de turnos por parte de roles no-socio (ADMIN, RECEPCIONISTA, NUTRICIONISTA) con alcance de gimnasio.

### Modified Capabilities
- `reservar-turno`: Adaptación del use-case de reservas para aceptar el creador del turno y relajar la regla RB14 cuando aplique.

## Approach

Se expondrá un nuevo endpoint o se adaptará uno para los roles `RECEPCIONISTA`, `ADMIN` y `NUTRICIONISTA`. Este endpoint delegará en el use-case de creación de turnos existente (o uno nuevo que re-utilice sus validaciones base como horarios y conflictos). Se implementará un mecanismo de control de alcance para asegurar que el actor y el socio pertenecen al mismo gimnasio. Se modificará la entidad de dominio `Turno` para registrar quién creó el turno a nivel sistema. Se adaptará la regla de la ficha completa para que sea condicional en función del rol que invoca la acción.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/backend/src/domain/entities/Turno` | Modified | Ampliar el campo `creadoPor` en la base de datos/entidad. |
| `apps/backend/src/application/turnos/use-cases` | Modified/New | Ajustar la validación de RB14 y emisión de eventos. |
| `apps/backend/src/presentation/http/controllers` | Modified/New | Añadir endpoints para roles administrativos y profesionales. |
| `apps/frontend/src/pages/` | New | Nueva vista o modalidad dentro de la agenda para crear turnos de pacientes. |
| `packages/shared/` | Modified | Actualizar enums de origen de turno. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflictos al reutilizar la lógica de `POST /turnos/socio/reservar` | Medium | Abstraer la lógica común en un helper o clase base, manteniendo controladores y DTOs de entrada separados. |
| ADMIN multi-gimnasio no resolviendo correctamente el scope | Low | Asegurar que la verificación de pertenencia del socio se alinee con los gimnasios a cargo del ADMIN. |
| ¿Qué sucede si el socio no tiene ficha y la recepcionista crea el turno? | Low | El frontend mostrará una advertencia, pero no bloqueará; el sistema enviará el turno y el nutricionista deberá pedir al socio completarla antes de la consulta. |

## Rollback Plan

- Revertir los commits de backend y frontend.
- Si se modificó la base de datos (enum `creado_por`), la migración de rollback deberá revertir la columna a su estado previo.

## Dependencies

- Requiere que la migración y lógica de ficha de salud (CU-08 / RB14) esté implementada para poder relajarla o aplicarla condicionalmente.

## Success Criteria

- [ ] RECEPCIONISTA y ADMIN pueden crear un turno para un socio sin tener ficha completa (recibiendo un warning en UI).
- [ ] NUTRICIONISTA puede crear un turno para un socio pero es bloqueado si la ficha no está completa.
- [ ] El creador del turno queda registrado y se emiten los eventos de auditoría y notificación correspondientes.