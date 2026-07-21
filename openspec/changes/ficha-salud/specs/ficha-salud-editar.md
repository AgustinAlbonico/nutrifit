# Spec: Editar ficha de salud

**Spec ID**: ficha-salud-editar
**Change**: ficha-salud
**RBs aplicados**: RB21, RB29, RB42, RB50
**Related docs**: CU-09 §Camino principal

## Requisito (Requirement)
Permitir la edición de la ficha mediante upsert/patch sin recalcular métricas históricas ajenas a la ficha y registrando el momento de la edición.

## Contexto / Estado actual
El `UpsertFichaSaludSocioUseCase` no cambia `actualizada_at` y no respeta del todo la inmutabilidad histórica con versioning.

## Escenarios (Given / When / Then)

### Escenario: Edición exitosa (Happy path)
- **Dado** un socio con ficha completada.
- **Cuando** edita uno o varios campos.
- **Entonces** se actualiza `actualizada_at` a now() y se genera nueva versión.

### Escenario: Edición de peso no afecta histórico (RB21, B2)
- **Dado** que el socio modifica su peso actual.
- **Cuando** guarda los cambios de su ficha.
- **Entonces** el peso se guarda en la ficha pero NO recalcula el IMC histórico almacenado en otros registros médicos.

### Escenario: Last-write-wins (RB29, B3)
- **Dado** que hay ediciones concurrentes.
- **Cuando** se persiste en la BD.
- **Entonces** prevalece el último UPDATE por orden de llegada con `actualizada_at` posterior.

### Escenario: Edición con plan activo (B1)
- **Dado** un socio que cambia sus alergias.
- **Cuando** edita la ficha.
- **Entonces** el cambio se guarda. (El nutricionista será alertado al abrir el plan, lo cual depende del módulo de planes, pero para la ficha simplemente se guarda el nuevo JSON).

## Tests requeridos
- Unit tests: RB21 (modificar peso no debe llamar a servicios externos para recalcular histórico si estuvieran inyectados) y Last-write-wins (chequear updatedAt/actualizadaAt).

## Acceptance criteria
- [ ] Se actualiza el campo `actualizada_at` cada vez que ocurre un cambio.
- [ ] La lógica del IMC de turnos/planes no se ve afectada en este use-case (RB21).