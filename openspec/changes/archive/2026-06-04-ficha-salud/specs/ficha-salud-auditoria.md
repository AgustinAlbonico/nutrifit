# Spec: Auditoría de Cambios Clínicos

**Spec ID**: ficha-salud-auditoria
**Change**: ficha-salud
**RBs aplicados**: RB33
**Related docs**: CU-08 §Auditoría, CU-09 §Auditoría

## Requisito (Requirement)
Cualquier modificación o creación de la ficha de salud debe estar auditada utilizando el `AuditoriaService` preexistente, resguardando el JSON del antes y del después de la operación.

## Contexto / Estado actual
El sistema posee el servicio de auditoría, pero los métodos dentro de `UpsertFichaSaludSocioUseCase` no lo están invocando, y faltan las acciones correspondientes en los enums globales.

## Escenarios (Given / When / Then)

### Escenario: Auditoría al crear (CREATE)
- **Dado** un socio que completa por primera vez su ficha.
- **Cuando** el use-case la guarda en DB.
- **Entonces** se dispara `AuditoriaService.registrar()` con `accion=ACCION_FICHA_COMPLETADA`, `entidad=ficha_salud`, `antes_json=null`, y `despues_json=datos`.

### Escenario: Auditoría al editar (UPDATE)
- **Dado** un socio con ficha que realiza una edición.
- **Cuando** el use-case procesa la edición.
- **Entonces** dispara `AuditoriaService.registrar()` con `accion=ACCION_FICHA_ACTUALIZADA`, `antes_json=datos_viejos`, `despues_json=datos_nuevos`.

## Eventos y Acciones
- Modificar Enum de auditoria: Agregar `ACCION_FICHA_COMPLETADA` y `ACCION_FICHA_ACTUALIZADA`.

## Acceptance criteria
- [ ] Todo upsert invoca al `AuditoriaService`.
- [ ] El objeto `antes_json` es nulo en la primera ejecución y populado adecuadamente en posteriores.