# Reglas de Negocio — NutriFit Supervisor

## Turnos — Reserva (socio)

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R01 | El socio debe tener la ficha de salud completada antes de reservar un turno. | `reservar-turno-socio.use-case.ts` |
| R02 | El nutricionista debe estar activo (sin `fechaBaja`) para poder recibir turnos. | `reservar-turno-socio.use-case.ts` |
| R03 | No se puede reservar en fechas pasadas. | `reservar-turno-socio.use-case.ts` |
| R04 | Si la reserva es para hoy, el horario debe ser al menos 1 hora después del momento actual. | `reservar-turno-socio.use-case.ts` |
| R05 | Un socio no puede tener más de un turno activo (PROGRAMADO, PRESENTE o EN_CURSO) a la vez. | `reservar-turno-socio.use-case.ts` |
| R06 | No debe existir otro turno no-cancelado para el mismo nutricionista, misma fecha y misma hora. | `reservar-turno-socio.use-case.ts` |
| R07 | El horario debe caer dentro de un bloque de agenda del nutricionista, alineado con la duración del turno. | `reservar-turno-socio.use-case.ts` |

## Turnos — Cancelación

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R08 | Solo se pueden cancelar turnos en estado PROGRAMADO. | `cancelar-turno-socio.use-case.ts` |
| R09 | La cancelación debe hacerse con al menos N horas de anticipación (configurable por gimnasio, default: 24h). Se salta si se usa un token de confirmación. | `cancelar-turno-socio.use-case.ts`, `politica_operativa.plazo_cancelacion_horas` |

## Turnos — Reprogramación

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R10 | Solo se pueden reprogramar turnos en estado PROGRAMADO. | `reprogramar-turno-socio.use-case.ts` |
| R11 | La reprogramación debe hacerse con al menos N horas de anticipación (configurable por gimnasio, default: 24h). | `reprogramar-turno-socio.use-case.ts`, `politica_operativa.plazo_reprogramacion_horas` |
| R12 | Si la nueva fecha es hoy, el nuevo horario debe ser al menos 1 hora después del momento actual. | `reprogramar-turno-socio.use-case.ts` |
| **R13** | **El socio no puede exceder 3 reprogramaciones en el mes calendario.** | `reprogramar-turno-socio.use-case.ts` |
| **R14** | **Recepcionistas y nutricionistas pueden reprogramar turnos de socios sin estar sujetos al límite de 3 reprogramaciones por mes.** El límite solo aplica cuando el propio socio reprograma. | `reprogramar-turno-socio.use-case.ts` (flag `esStaff`), `turnos.controller.ts` — `PATCH /turnos/:turnoId/reprogramar` |
| R15 | La nueva fecha no puede ser anterior a hoy. | `reprogramar-turno-socio.use-case.ts` |
| R16 | El nuevo horario no debe chocar con otro turno no-cancelado del mismo profesional. | `reprogramar-turno-socio.use-case.ts` |
| R17 | El nuevo horario debe ser válido según la agenda del nutricionista. | `reprogramar-turno-socio.use-case.ts` |

## Turnos — Check-in, Consulta y Asistencia

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R18 | Solo se puede hacer check-in en turnos PROGRAMADO. Transiciona a PRESENTE. | `check-in-turno.use-case.ts` |
| R19 | Solo se puede iniciar consulta en turnos PRESENTE. Transiciona a EN_CURSO. | `iniciar-consulta.use-case.ts` |
| R20 | Solo se puede registrar asistencia en turnos PRESENTE. | `registrar-asistencia-turno.use-case.ts` |
| R21 | La asistencia solo se puede registrar después de la hora programada del turno. | `registrar-asistencia-turno.use-case.ts` |
| R22 | Solo el nutricionista propietario, recepcionista o admin pueden marcar ausente manualmente. | `marcar-ausente-manual.use-case.ts` |
| R23 | Solo se puede marcar ausente un turno en estado PROGRAMADO o PRESENTE. | `marcar-ausente-manual.use-case.ts` |

## Turnos — Bloqueo / Desbloqueo

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R24 | No se pueden bloquear turnos en fechas pasadas. | `bloquear-turno.use-case.ts` |
| R25 | El horario bloqueado debe ser válido según la agenda del nutricionista. | `bloquear-turno.use-case.ts` |
| R26 | Solo se puede desbloquear un turno PROGRAMADO sin socio asociado. | `desbloquear-turno.use-case.ts` |

## Turnos — Confirmación

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R27 | Solo se pueden confirmar turnos en estado PROGRAMADO. | `confirmar-turno-socio.use-case.ts` |
| R28 | La confirmación solo puede hacerse el mismo día del turno. | `confirmar-turno-socio.use-case.ts` |
| R29 | La confirmación debe realizarse antes de la hora programada del turno. | `confirmar-turno-socio.use-case.ts` |

## Disponibilidad (Slots)

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R30 | Se excluyen slots que caen dentro de las próximas 2 horas desde el momento actual. | `slot-computation.service.ts` |
| R31 | La disponibilidad no se puede consultar para más de 60 días en el futuro. | `slot-computation.service.ts` |

## Asignación Manual (staff)

| ID | Regla | Implementado en |
|----|-------|-----------------|
| R32 | El nutricionista debe estar activo para recibir asignaciones manuales. | `asignar-turno-manual.use-case.ts` |
| R33 | El socio debe tener una ficha de salud cargada. | `asignar-turno-manual.use-case.ts` |

## Políticas Operativas Configurables

| Política | Default | Tabla |
|----------|---------|-------|
| `plazoCancelacionHoras` | 24 | `politica_operativa.plazo_cancelacion_horas` |
| `plazoReprogramacionHoras` | 24 | `politica_operativa.plazo_reprogramacion_horas` |
| `umbralAusenteMinutos` | 15 | `politica_operativa.umbral_ausente_minutos` (definido pero no usado actualmente) |

## Máquina de Estados del Turno

```
PROGRAMADO → PRESENTE → EN_CURSO → REALIZADO
                                        ↓
                                   AUSENTE
       ↓
  CANCELADO (desde PROGRAMADO)
```
