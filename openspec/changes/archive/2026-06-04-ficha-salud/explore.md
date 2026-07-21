# SDD Explore: ficha-salud (CU-08 + CU-09)

**Change ID**: ficha-salud
**Phase**: explore
**Date**: 2026-06-03
**Source docs**: CU-08 (completar-ficha-salud.md, 176 líneas), CU-09 (editar-ficha-salud.md, 137 líneas)
**Persistence**: Openspec + Engram

---

## Executive Summary

La feature ficha-salud tiene un partial implementation funcional que cubre ~60% de los requisitos. Faltan: versioning con historial navegable, auditoría de cambios, bloqueo de turnos por ficha incompleta, banner de edición reciente, consentimiento RGPD, y mejora de UX del formulario. El enfoque de "upsert" unificado (PUT `/turnos/socio/ficha-salud`) ya permite crear y editar — pero sin historial, auditoría ni los features premium.

**Veredicto**: Implementable en 2 PRs; requiere nueva entidad `FichaSaludVersion`, servicio de auditoría, y cambios en frontend.

---

## Key Findings

### Backend — use-cases parcialmente implementados

| Use Case | Estado | Notas |
|---|---|---|
| `UpsertFichaSaludSocioUseCase` | ⚠️ Parcial | Solo hace save simple — NO hay versioning, NO hay auditoría, NO hay domain events. La lógica de upsert ya existe (crea o actualiza). |
| `GetFichaSaludSocioUseCase` | ✅ Listo | Retorna la ficha actual. No tiene lógica de versionado. |
| `GetFichaSaludPacienteUseCase` | ✅ Listo | Solo retorna fields básicos. |
| `ReservarTurnoSocioUseCase` | ⚠️ RB14 falta | Línea 71-75: verifica `if (!socio.fichaSalud)` y lanza `BadRequestError`. PERO no verifica si la ficha está "completada" vs solo "exists". RB14 requiere verificar `completada=true`. |
| `BuscarSociosConFichaUseCase` | ❓ No inspeccionado | Spec CU-08 dice que lista socios con ficha — podría no filtrar por `completada`. |

### Backend — modelo de datos necesita campos nuevos

La ORM entity `FichaSaludOrmEntity` (y la domain entity) carecen de:
- `completada: boolean` — RB13, RB14, RB15
- `completadaAt: Date | null` — RB13
- `consentAt: Date | null` — RB44 (consentimiento RGPD)
- `actualizadaAt: Date` — RB15 badge
- `versionActualId: FK → FichaSaludVersion` — versioning
- `consentimientoFecha: Date | null` — RB44

**No existe** `FichaSaludVersion` entity en el codebase.

### Backend — auditoría no registra cambios de ficha

`AuditoriaService` existe y funciona. Pero grep confirma: **no hay entradas de auditoría para `ficha_salud`**. Se necesita agregar:
- `ACCION_FICHA_COMPLETADA` / `ACCION_FICHA_ACTUALIZADA` en `AccionAuditoria` enum
- Llamadas a `auditoriaService.registrar()` en `UpsertFichaSaludSocioUseCase`

### Backend — no hay domain events

- No existe `DomainEvent` base class
- No existe `FichaCompletadaEvent` / `FichaActualizadaEvent`
- `NotificacionesService` existe pero no recibe estos eventos
- `ReservarTurnoSocioUseCase` línea 149-156 ya llama a notificaciones para `TURNO_RESERVADO`, pero no para ficha completada/actualizada

### Frontend — `FichaSaludSocio.tsx` (693 líneas)

| Sección | Estado | Notas |
|---|---|---|
| Header con gradiente | ✅ Implementado | Banner de recordatorio (línea 255-278) ya existe |
| Campos básicos | ✅ Implementado | Altura, peso, nivel actividad, objetivo (líneas 298-381) |
| Secciones 5+ | ✅ Implementado | Medicación, historial, hábitos, emergencia (líneas 417-660) |
| Validación | ⚠️ Incompleta | Solo altura≥100, peso≥20, objetivo no vacío. Falta validar todos los RB de CU-08. |
| Mensaje éxito | ✅ Line 230 | `'Ficha de salud guardada correctamente. Ya podés reservar turnos.'` |
| Banner "actualizada recientemente" (RB15) | ❌ No existe | No hay badge ni banner después de guardar |
| Modal de confirmación | ❌ No existe | No hay modal post-guardado |
| Autoguardado | ❌ No existe | Solo submit manual |
| Campos faltantes | ⚠️ `consentimiento` | RB44 requiere checkbox con consentimiento RGPD en frontend — no existe |

### Frontend — `Agenda.tsx` (763 líneas)

- Es la página de **configurar agenda del nutricionista** — NO es donde se ve RB15 badge
- RB15 dice que la agenda del nutricionista muestra "ficha actualizada recientemente" — se necesita verificar si esto aplica a la agenda del socio o del profesional

### Frontend — `TurnosProfesional.tsx` (607 líneas)

- Vista de turnos del profesional por día
- No tiene lógica de badge de "ficha actualizada"
- RB15 podría aplicarse a la lista de pacientes del profesional

### Backend — DTO `UpsertFichaSaludSocioDto` (117 líneas)

- No tiene campo `consentimientoAt` (RB44)
- No tiene campo `completada` (es un flag interno, no del DTO)

### Resumen de gaps críticos

```
✅ Campos existentes: altura, peso, nivelActividad, objetivo, alergias, patologias,
   medicación, suplementos, cirugías, antecedentes, frecuenciaComidas, consumoAgua,
   restricciones, consumoAlcohol, fumaTabaco, horasSueno, contactoNombre, contactoTelefono

❌ Campos faltantes en ORM + domain:
   - completada: boolean
   - completadaAt: Date
   - consentimientoFecha: Date (RB44)
   - actualizadaAt: Date (RB15)
   - versionActualId: FK → FichaSaludVersion

❌ FichaSaludVersion entity: NO EXISTE

❌ Auditoría para ficha_salud: NO EXISTE

❌ Domain events (FICHA_COMPLETADA, FICHA_ACTUALIZADA): NO EXISTEN

❌ NotificationService recibe eventos de ficha: NO

❌ RB14: ReservarTurnoSocioUseCase verifica solo existencia, no "completada=true"

❌ Frontend: no hay banner "editada recientemente" (RB15)

❌ Frontend: no hay modal post-guardado con consentimiento (RB44)

❌ Frontend: no hay autoguardado

❌ Frontend: enum labels hardcodeados — deberían venir de API/shared enum
```

---

## Gap Analysis — Detallado

### 1. Versionamiento de ficha (CU-08 RB07, RB08, RB09, RB10, RB11)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB07 | Crear nueva `FichaSaludVersion` en cada PUT | ❌ No existe entity | Crear entity + migración |
| RB08 | Primera versión = `version = 1` | ❌ No hay lógica | Agregar en `UpsertFichaSaludSocioUseCase` |
| RB09 | `versionActualId` FK en `FichaSalud` | ❌ No existe columna | Agregar columna + migración |
| RB10 | Incrementar `version` en cada actualización | ❌ No hay lógica | Agregar en use-case |
| RB11 | Endpoint GET con query `?version=X` | ❌ No existe | Crear endpoint nuevo |

**Complexidad**: Media. Requiere nueva entity, migración, y lógica de versioning.

### 2. Auditoría (CU-08 RB12)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB12 | Registrar en auditoría al crear/editar | ❌ No existe | Agregar `ACCION_FICHA_COMPLETADA`, `ACCION_FICHA_ACTUALIZADA` + llamada en use-case |

**Complexidad**: Baja. Solo agregar enum values + 2 llamadas a `AuditoriaService.registrar()`.

### 3. Resumen de progreso (CU-08 RB05)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB05 | GET `/turnos/socio/ficha-salud/resumen` retorna progreso | ❌ No existe | Crear endpoint + `FichaSaludResumenDto` |

**Complexidad**: Baja. DTO + endpoint simple.

### 4. Notificaciones (CU-08 RB06)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB06 | Notificar al socio cuando nutricionista edita su plan | ❌ No hay lógica en use-case | Agregar en `GetFichaSaludPacienteUseCase` + `NotificacionesService` |

**Complexidad**: Media. Necesita verificar si existe el servicio de notificaciones y cómo enviar.

### 5. Bloqueo de reserva (CU-09 RB14)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB14 | No permitir reservar turno si `completada === false` | ⚠️ Verifica solo existencia | Cambiar a: `if (!socio.fichaSalud || !socio.fichaSalud.completada)` |

**Complexidad**: Muy baja. Un solo cambio en línea 71 de `reservar-turno-socio.use-case.ts`.

### 6. Badge en agenda profesional (CU-09 RB15)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB15 | Badge "ficha actualizada recientemente" en agenda profesional | ❌ No existe | Definir en qué página: ¿`TurnosProfesional.tsx`? ¿`Agenda.tsx`? Necesita clarificación |

**Complexidad**: Media. Requiere definir UI + endpoint para obtener `actualizadaAt`.

### 7. Consentimiento RGPD (CU-09 RB44)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB44 | Checkbox consentimiento + timestamp en backend | ❌ No existe | Agregar `consentimientoFecha` al DTO + entity + validación |

**Complexidad**: Baja. Campo + validación en DTO.

### 8. Frontend: Banner "actualizada recientemente" (CU-09 RB15)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB15 | Mostrar banner en FichaSaludSocio.tsx después de editar | ❌ No existe | Agregar estado `fichaEditada` + banner condicional |

**Complexidad**: Baja. Agregar estado + banner en componente existente.

### 9. Frontend: Modal post-guardado (CU-09 RB44)

| Spec | Descripción | Estado | Acción |
|---|---|---|---|
| RB44 | Modal de consentimiento RGPD | ❌ No existe | Crear modal + integrar en `FichaSaludSocio.tsx` |

**Complexidad**: Media. Componente modal nuevo + integración.

---

## Open Decisions

1. **RB15: ¿En qué página va el badge?** La spec dice "en la agenda del profesional" pero no especifica si es `TurnosProfesional.tsx`, `Agenda.tsx`, o ambas. ¿Aplica también a la agenda del socio?

2. **RB44: ¿El consentimiento es obligatorio para completar la ficha?** O sea, ¿se bloquea el submit hasta que el socio acepte el consentimiento? Necesita clarificación de negocio.

3. **Versioning: ¿Se mantiene un máximo de versiones?** La spec no dice si hay límite. ¿Se archivan versiones vieja? ¿Se borran?

4. **RB06: ¿Cómo notifica el profesional la edición del plan?** ¿Se notifica al socio automáticamente o el profesional decide? La spec habla de "el nutricionista puede notificar" — ¿es automático o manual?

---

## Scope Forecast

**PR 1 — Backend + Datos (Alta complejidad)**
- Entity `FichaSaludVersion` nueva
- Migración para nuevos campos (`completada`, `completadaAt`, `consentimientoFecha`, `actualizadaAt`, `versionActualId`)
- Lógica de versioning en `UpsertFichaSaludSocioUseCase`
- Auditoría en use-case (RB12)
- Fix RB14 en `ReservarTurnoSocioUseCase`
- Endpoint GET con versioning (RB11)
- Enum `AccionAuditoria` actualizado

**PR 2 — Frontend (Media complejidad)**
- Banner "actualizada recientemente" (RB15 frontend)
- Badge en página del profesional (RB15)
- Modal RGPD + checkbox consentimiento (RB44)
- Campos de consentimiento en formulario
- Fix enum labels (traer de shared enum en vez de hardcodear)

**PR 3 — Notificaciones + Detalles (Baja complejidad)**
- RB06: Notificación cuando nutricionista edita plan
- RB05: Endpoint resumen de progreso
- Clarificar decisiones pendientes

---

## Next Steps

- [ ] Orchestrator decide si avanza a **propose** con estas gaps
- [ ] Clarificar las 4 open decisions antes de entrar en design
- [ ] ¿User quiere explorar más a fondo alguna sección específica?

---

*Artifact written to openspec + Engram. Exploration phase complete.*