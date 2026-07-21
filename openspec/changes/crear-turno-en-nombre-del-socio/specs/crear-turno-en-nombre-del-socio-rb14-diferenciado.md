# Spec: Ficha Médica Completa Diferenciada (RB14)

**Spec ID**: crear-turno-en-nombre-del-socio-rb14-diferenciado
**Change**: crear-turno-en-nombre-del-socio
**Related docs**: CU-12, RB14

## Requisito (Requirement)

La regla de negocio RB14 establece que un socio debe tener su ficha médica completa para poder tener un turno. Sin embargo, en el contexto de creación de turnos por terceros, la aplicación de esta regla varía dependiendo del rol del actor que crea el turno.

## Escenarios de Comportamiento

### Comportamiento para RECEPCIONISTA y ADMIN (Exención con Warning)

Cuando un rol administrativo (`RECEPCIONISTA`, `ADMIN`) intenta agendar un turno para un socio que **no tiene** su ficha médica completa:

1. **Backend**: 
   - El endpoint `POST /turnos/crear` **NO DEBE** bloquear la creación del turno.
   - El use-case debe verificar el rol del actor inyectado en el contexto. Si el actor es `RECEPCIONISTA` o `ADMIN`, se bypassea el throw del error de RB14.
   - Opcionalmente, la respuesta puede incluir un flag `warning: "socio_sin_ficha"` para consumo del cliente.

2. **Frontend (UI)**:
   - Durante el flujo de selección de paciente, la UI debe consultar si el socio tiene ficha completa.
   - Si no la tiene, se debe mostrar un **Warning** visible: *"El socio seleccionado no tiene su ficha médica completa. Puede continuar con la reserva, pero recuérdele al paciente completarla antes de su consulta."*
   - El botón de "Confirmar Turno" sigue estando habilitado.

### Comportamiento para NUTRICIONISTA (Bloqueo Estricto)

Cuando un rol clínico (`NUTRICIONISTA`) intenta agendar un turno para un socio que **no tiene** su ficha médica completa:

1. **Backend**:
   - El endpoint `POST /turnos/crear` **DEBE** bloquear la creación del turno, devolviendo un error HTTP 400 Bad Request o 409 Conflict.
   - El error debe especificar explícitamente: *"No se puede crear el turno porque el paciente no ha completado su ficha médica."*

2. **Frontend (UI)**:
   - Durante el flujo de selección de paciente, si el socio no tiene ficha completa, se debe mostrar un **Bloqueo / Error** visible.
   - Mensaje sugerido: *"El paciente no cuenta con una ficha de salud completa. Como profesional, no puede agendar una consulta clínica sin la información base del paciente. Solicítele que complete la ficha en su portal."*
   - El botón de "Confirmar Turno" debe estar deshabilitado o redirigir inmediatamente.

## Criterios de Aceptación (Acceptance Criteria)

- [ ] Un test unitario en el use-case comprueba que si el actor es `RECEPCIONISTA`, la creación del turno para un socio sin ficha es exitosa.
- [ ] Un test unitario en el use-case comprueba que si el actor es `NUTRICIONISTA`, la creación del turno para un socio sin ficha lanza la excepción `FichaIncompletaError`.
- [ ] En la respuesta de éxito para administrativos, no se rompe la consistencia de datos de la agenda.