# Specs: ficha-salud

Este directorio contiene las especificaciones detalladas para la implementación del feature `ficha-salud`.

1. `ficha-salud-versioning.md`: Implementación del historial inmutable (RB50, RB29, RB42).
2. `ficha-salud-completar.md`: Lógica core para creación inicial de la ficha.
3. `ficha-salud-editar.md`: Lógica core para la edición de fichas existentes.
4. `ficha-salud-rb14-bloqueo-reserva.md`: Validar ficha completada antes de reservar (RB14).
5. `ficha-salud-rb44-consentimiento.md`: Requerir consentimiento RGPD solo en creación (RB44).
6. `ficha-salud-auditoria.md`: Integración con auditoría al crear/editar (RB33).
7. `ficha-salud-eventos-email.md`: Envío de correos por ficha completada o actualizada.
8. `ficha-salud-endpoints-historial.md`: Endpoints para historial de versiones.
9. `ficha-salud-ui-wizard.md`: Mejoras en interfaz (banner de edición, modal de historial).
10. `ficha-salud-ui-validaciones.md`: Restricciones de rangos y enums centralizados en UI.
11. `ficha-salud-rb16-acceso.md`: Prevención de acceso a clínicos por RECEPCIONISTA (RB16).