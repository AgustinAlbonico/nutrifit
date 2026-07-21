# Spec: Bloqueo de Reserva por Ficha Incompleta

**Spec ID**: ficha-salud-rb14-bloqueo-reserva
**Change**: ficha-salud
**RBs aplicados**: RB14
**Related docs**: CU-08 §Reglas de negocio aplicadas

## Requisito (Requirement)
No se puede permitir la reservación de un turno si el socio no tiene su ficha de salud debidamente `completada=true`.

## Contexto / Estado actual
En `ReservarTurnoSocioUseCase` (líneas 71-75), se verifica si el socio tiene una fila de ficha de salud (`!socio.fichaSalud`), pero no evalúa si se encuentra efectivamente completada.

## Escenarios (Given / When / Then)

### Escenario: Bloqueo por falta de ficha o ficha no completada
- **Dado** un socio con `fichaSalud` nula o `fichaSalud.completada === false`.
- **Cuando** intenta realizar la acción de reservar un turno.
- **Entonces** se rechaza con un 400 BadRequest o Conflict, informando al usuario "La ficha de salud es obligatoria y debe estar completa antes de reservar".

### Escenario: Permiso concedido
- **Dado** un socio cuya `fichaSalud` existe y tiene `completada === true`.
- **Cuando** intenta realizar la reserva.
- **Entonces** el proceso continúa exitosamente su flujo de dominio.

## Tests requeridos
- Unit test sobre `ReservarTurnoSocioUseCase` inyectando un socio con ficha completada y otro con ficha incompleta.

## Acceptance criteria
- [ ] La reserva falla estrictamente si `completada === false`.
- [ ] La reserva procede si `completada === true`.