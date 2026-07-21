# SDD Proposal: ficha-salud

**Change ID**: ficha-salud
**Phase**: propose
**Date**: 2026-06-03

---

## 1. Resumen ejecutivo
Implementación de versionamiento, auditoría y alertas para la ficha de salud del socio (CU-08 y CU-09). Actualiza la funcionalidad existente de un simple upsert a un modelo inmutable donde cada cambio genera una nueva versión, garantizando trazabilidad y el cumplimiento de las reglas de negocio, como el bloqueo de turnos por fichas incompletas.

## 2. Motivación
El código actual permite crear y editar la ficha de salud de forma básica, cubriendo cerca del 60% de los requisitos, pero carece de un modelo sólido en base a lo requerido por la iteración 1. Faltan características clave del spec: no hay historial de versiones (`FichaSaludVersion` no existe), la auditoría de este recurso está inactiva y falta integración estricta con los flujos de reservas de turno (RB14). Adicionalmente, el frontend carece del banner de edición reciente, la validación del consentimiento inicial (RB44), y requiere mejoras en la UX del formulario.

## 3. Alcance (IN SCOPE)
- **Backend (~600 líneas)**:
  - Nueva entidad y tabla `FichaSaludVersion` para guardar el historial inmutable de las fichas.
  - Modificación de la entidad `FichaSalud` para incluir los campos: `completada`, `completadaAt`, `actualizadaAt`, `versionActualId` y `consentimientoFecha`.
  - Actualización de `UpsertFichaSaludSocioUseCase` para gestionar la versión actual, el versionamiento en base de datos y la persistencia de `consentimientoFecha`.
  - Corrección en `ReservarTurnoSocioUseCase` para validar que la ficha esté verdaderamente `completada` antes de permitir la reserva (RB14).
  - Nuevos endpoints para listar el historial de versiones de una ficha particular (`GET /api/socios/me/ficha-salud/historial` y `version/:n`).
- **Frontend (~500 líneas)**:
  - Modificaciones en `FichaSaludSocio.tsx`:
    - Incorporación del banner superior indicando "Última edición".
    - Checkbox y lógica de validación del consentimiento expreso, exclusivo para la primera vez (RB44).
    - Mejora en los dropdowns mediante el mapeo de enums centralizados (desde el paquete `shared`).
- **Migración / datos**:
  - Migración de TypeORM para añadir los campos requeridos en la tabla `ficha_salud`.
  - Creación de la nueva tabla `ficha_salud_version` a través de la misma migración.
- **Tests**:
  - Tests unitarios enfocados en los casos de uso actualizados/creados (`UpsertFichaSaludSocioUseCase`, validación RB14, lógica de versioning).
- **Eventos / emails**:
  - Emisión de los eventos `FICHA_COMPLETADA` y `FICHA_ACTUALIZADA` para enviar emails únicamente al socio a través del `NotificacionesService`.

## 4. Fuera de alcance (OUT OF SCOPE)
- Implementación del badge y banner de "Ficha completada hace X minutos" en la agenda del profesional (pantallas `TurnosProfesional.tsx` y `ConsultaProfesionalPage.tsx`), correspondientes a partes descartadas de la RB15.
- Cualquier notificación (in-app o por correo electrónico) dirigida a los nutricionistas vinculados cuando el socio actualice la ficha.
- Cualquier funcionalidad que no esté explícitamente especificada en CU-08 o CU-09.
- Limitación o rate-limiting estricto sobre el número de versiones creadas por un usuario; todas las versiones se conservan en esta iteración.

## 5. Enfoque / Approach
- **Module organization**: El código de la ficha de salud permanecerá dentro del módulo actual de `turnos`. Su nivel de acoplamiento lógico y funcionalidad principal radican dentro de los flujos de reservas, por ende moverlo a `socios` o un nuevo módulo sobre-ingenierizaría la solución actual y provocaría un refactor complejo que no aporta valor directo.
- **Versioning storage**: Se implementará a través de una entidad separada `FichaSaludVersion` vinculada mediante una FK (`versionActualId` en `FichaSalud`). Separar la versión asegura inmutabilidad real en base de datos para la funcionalidad de historial, garantizando auditoría natural, en contraposición a campos JSON complejos.
- **Domain events**: Dado el scope actual, se utilizará una emisión directa delegada hacia el `NotificacionesService` (patrón existente de facto en base al hallazgo en `ReservarTurnoSocioUseCase`). Se enviarán los eventos necesarios sin necesidad de introducir un motor/bus de eventos de dominio base por el momento.
- **Audit integration**: Se agregarán explícitamente constantes en el enum `AccionAuditoria` (`ACCION_FICHA_COMPLETADA`, `ACCION_FICHA_ACTUALIZADA`) y la invocación a `AuditoriaService.registrar()` se realizará inline dentro del `UpsertFichaSaludSocioUseCase`.
- **Frontend state**: `FichaSaludSocio.tsx` mantendrá su formato de página unificada pero segregando sus responsabilidades. Las vistas de historial se acoplarán como modales dependientes (`FichaSaludHistorialModal`) para no saturar el estado inicial, manteniendo un renderizado performante.
- **Validation strategy**: En el backend, se preservará la validación apoyada en decorators con `class-validator`. En el frontend, se extenderá el esquema actual (Zod/Yup) ajustando los rangos e integrando la condicionalidad de validación estricta para el booleano del consentimiento en el momento de creación inicial.

## 6. Plan de entrega (3 PRs chained)

Se recomienda una cadena `stacked-to-main` debido a que es la iteración 1 y las dependencias entre los PRs (Frontend dependiendo de los contratos y schema del Backend) son enteramente lineales.

**PR 1 — Backend (Alta complejidad, ~600 líneas)**
- **Archivos**: Migración de TypeORM, entidades nuevas/modificadas (`FichaSalud`, `FichaSaludVersion`), DTOs actualizados, `UpsertFichaSaludSocioUseCase`, `ReservarTurnoSocioUseCase`, y los controladores para el historial de versiones.
- **Acceptance criteria**: 
  - La migración persiste el modelo correcto. 
  - Primera solicitud al upsert genera la versión 1 de la entidad `FichaSaludVersion`. Siguientes ediciones generan versión 2, 3, etc. 
  - Regla RB14 bloquea las reservas de turnos si la ficha no está completada.
  - Auditoría se registra efectivamente.
- **Rollback plan**: Revert de git del PR1 en main sumado al down de la migración de base de datos.

**PR 2 — Frontend (Media complejidad, ~500 líneas)**
- **Archivos**: `FichaSaludSocio.tsx`, subcomponentes de modal/historial, DTOs del front y la capa de peticiones para nuevos endpoints.
- **Acceptance criteria**: 
  - El checkbox de consentimiento es obligatorio si la ficha no existe (creación inicial).
  - El banner de "Última edición" se muestra si es una vista de edición.
  - Modal de historial en lista de versiones opera sin errores.
- **Rollback plan**: Revert git del frontend.

**PR 3 — E2E + Polish (Baja complejidad, ~200 líneas)**
- **Archivos**: Archivos de pruebas E2E (Playwright), integración final para notificaciones a socios, detalles UI de último momento y enum syncs en `@nutrifit/shared`.
- **Acceptance criteria**: 
  - El flujo E2E desde un usuario de tipo socio permite loguearse, dar su consentimiento, completar la ficha de salud y recibir el email correspondiente, y por último efectuar la reserva de su turno con éxito.
- **Rollback plan**: Revert del PR en git.

## 7. Reglas de negocio aplicadas
- [x] RB14 — bloqueo de reserva por ficha incompleta
- [x] RB16 — RECEPCIONISTA no ve datos clínicos (verificar que hoy se cumpla o ajustarlo)
- [x] RB21 — IMC histórico no se recalcula (backend: no tocar entidad IMC; frontend: no mostrar IMC recalculado)
- [x] RB29 — Last-write-wins
- [x] RB33 — Auditoría antes/después
- [x] RB42 — Ficha editable
- [x] RB44 — Consentimiento una sola vez
- [x] RB50 — Historial de versiones

## 8. Riesgos y mitigaciones
- **Migración de datos existentes**: Pueden existir fichas creadas previamente en el entorno de desarrollo u staging que carezcan de los valores iniciales para las nuevas columnas (`completada`, `completadaAt`, `consentimientoFecha`).
  - *Mitigación*: La migración de base de datos de TypeORM será construida contemplando actualizar estas filas a valores default funcionales (ej. asumiendo pre-consentimiento u obligando actualización con nullable constraints temporales).
- **Backend sin hot-reload**: El reinicio manual que el usuario experimenta es necesario únicamente tras cambios fuertes a la base. 
  - *Mitigación*: El flujo natural de `start:dev` capturará todo cambio a nivel código. Se le advertirá al usuario sobre la corrida de migraciones que pudiesen requerir reinicio del servidor NestJS si resultara mandatorio.
- **Conflictos entre OpenSpec y trabajo manual**: Solapamiento.
  - *Mitigación*: Entregas cortas y aisladas apiladas en ramas de desarrollo cortas.

## 9. Criterios de éxito
- Los tests unitarios implementados se completan satisfactoriamente en los PRs sin errores de concurrencia.
- La ejecución del flujo de extremo a extremo E2E no reporta trabas.
- Los nuevos endpoints responden exitosamente con los historiales previstos según CU-09.
- El correo electrónico se envía al socio de manera efectiva ante los eventos de creación (`FICHA_COMPLETADA`) y edición (`FICHA_ACTUALIZADA`).
- Regla de Negocio RB14 opera correctamente, imposibilitando reservaciones por `completada=false`.
- El consentimiento se persiste la primera vez y el frontend previene envíos nulos o no aprobados en este escenario.

## 10. Referencias
- [CU-08 — Completar ficha de salud](docs/iteraciones/iteraciones/iteracion%201/features/ficha-salud/08-completar-ficha-salud.md)
- [CU-09 — Editar ficha de salud](docs/iteraciones/iteraciones/iteracion%201/features/ficha-salud/09-editar-ficha-salud.md)
- [Explore Artifact](openspec/changes/ficha-salud/explore.md)