# Spec: Notificaciones por Email al Socio — **DROPPED**

**Spec ID**: ficha-salud-eventos-email
**Change**: ficha-salud
**Status**: ❌ **DROPPED** (decisión de scope del usuario 2026-06-03)
**RBs aplicados**: N/A
**Related docs**: CU-08 §Eventos disparados, CU-09 §Eventos disparados

> ⚠️ Este spec se conserva como referencia histórica. **NO implementar**.
> El usuario decidió explícitamente no enviar emails de `FICHA_COMPLETADA` ni `FICHA_ACTUALIZADA` por simplicidad en iteración 1. Ver `openspec/changes/ficha-salud/proposal.md` y session memory `sdd/ficha-salud/final-scope`.

## Razón del drop

- **Complejidad innecesaria para iter 1**: integrar `NotificacionesService.crear()` + `EmailService.enviar()` por cada upsert agrega 2 puntos de falla por cada guardado de ficha.
- **RB44 ya cubre el consentimiento**: el socio sabe que su ficha se guardó porque recibe el toast en UI.
- **Notificaciones a nutricionistas ya están fuera de scope** (decidido en proposal). Las únicas que quedarían serían al socio, lo que es redundante con la UI.

## Requisito original (no implementar)

El sistema debía enviar un correo electrónico al socio notificándole que su ficha ha sido completada exitosamente, así como en futuras actualizaciones de la misma.

## Out of scope (CONFIRMADO)

- ❌ Email `FICHA_COMPLETADA` al socio
- ❌ Email `FICHA_ACTUALIZADA` al socio
- ❌ Notificaciones a nutricionistas vinculados (cubierto por la decisión previa de drop de RB15)
- ❌ Cualquier integración con `NotificacionesService` o `EmailService` desde `UpsertFichaSaludSocioUseCase`

## Si en iteración futura se revierte esta decisión

Pasos a seguir:
1. Agregar el método en `NotificacionesService` si no existe
2. Inyectar `NotificacionesService` en `UpsertFichaSaludSocioUseCase`
3. Llamar `notificacionesService.crear({...})` post-commit (afuera de la transacción)
4. Extender `TipoNotificacion` enum con `FICHA_COMPLETADA` y `FICHA_ACTUALIZADA`
5. Crear los templates de email correspondientes
6. Re-habilitar este spec (quitar el banner DROPPED) y volver a verificar
