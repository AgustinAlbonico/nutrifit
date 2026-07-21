# Spec: Versionamiento de Ficha

**Spec ID**: ficha-salud-versioning
**Change**: ficha-salud
**RBs aplicados**: RB29, RB42, RB50
**Related docs**: CU-08 §Modelo de datos, CU-09 §Reglas de negocio aplicadas

## Requisito (Requirement)
Cada vez que se complete o edite una ficha de salud, se debe generar un registro inmutable en una nueva tabla `FichaSaludVersion` conservando el historial completo de los cambios a lo largo del tiempo.

## Contexto / Estado actual
Actualmente, `UpsertFichaSaludSocioUseCase` realiza un upsert (creación o actualización) básico mutando la entidad principal, pero no existe la entidad `FichaSaludVersion` ni hay inmutabilidad histórica (`RB50` no se cumple).

## Escenarios (Given / When / Then)

### Escenario: Creación de primera versión
- **Dado** que un socio no tiene ficha de salud.
- **Cuando** completa y guarda su ficha de salud.
- **Entonces** se crea `FichaSalud` y una fila en `FichaSaludVersion` con `version=1` y todos los datos en `datos_json`. `FichaSalud.version_actual_id` debe apuntar a la nueva fila (RB50).

### Escenario: Creación de nueva versión por edición
- **Dado** que un socio ya tiene una ficha en versión 1.
- **Cuando** actualiza su ficha de salud.
- **Entonces** se inserta una nueva fila en `FichaSaludVersion` con `version=2` (RB50). La fila de `FichaSalud` actualiza `version_actual_id` (RB29 - Last Write Wins).

## Modelo de datos
- Nueva entidad: `FichaSaludVersion` (`id`, `ficha_salud_id`, `socio_id`, `version`, `datos_json`, `created_at`). Inmutable.
- `FichaSalud`: Nuevas columnas `completada` (boolean, default false), `completada_at` (Date, nullable), `actualizada_at` (Date, nullable), `version_actual_id` (FK a FichaSaludVersion, nullable), `consent_at` (Date, nullable).
- Restricciones: `UNIQUE(ficha_salud.socio_id)`, `UNIQUE(ficha_salud_version.ficha_salud_id, version)`.

## Tests requeridos
- Unit tests: Verificación de que cada actualización genera una nueva instancia de versión incrementando el número correctamente y asignando el FK.

## Out of scope
- Archivar o purgar versiones viejas; límite de versiones o rate limits de actualización.

## Acceptance criteria
- [ ] La migración crea `FichaSaludVersion` y agrega columnas a `FichaSalud`.
- [ ] Cada put/patch genera una versión inmutable con número incrementado.