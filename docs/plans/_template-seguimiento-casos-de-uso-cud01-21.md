# Template reutilizable - Seguimiento de avance por casos de uso (CUD01-CUD21)

## 1) Como usar esta plantilla

1. Duplicar este archivo y renombrarlo con fecha de corte.
   - Ejemplo: `YYYY-MM-DD-seguimiento-cud01-21.md`
2. Usar solo estos estados en la columna `Estado`:
   - `Pendiente`
   - `En curso`
   - `Hecho`
   - `Bloqueado`
3. Actualizar el tablero cada vez que cambie el estado de un CU.
4. Completar `Evidencia` con pruebas, endpoints o pantallas validadas.

## 2) Resumen de control

- Fecha de inicio:
- Ultima actualizacion:
- Responsable general:
- Objetivo del periodo (semana/sprint):

Totales:

- Pendiente:
- En curso:
- Hecho:
- Bloqueado:

Riesgos globales:

-

Decisiones clave:

-

## 3) Tablero de estado por CU

| CU | Nombre | Actor principal | Estado | Prioridad | Dependencias | Responsable | Inicio | Fin objetivo | Fin real | Evidencia | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CUD01 | Gestionar profesionales | Asistente | Pendiente | Alta | - | - | - | - | - | - | - |
| CUD02 | Registrar profesional | Asistente | Pendiente | Alta | CUD01 | - | - | - | - | - | - |
| CUD03 | Modificar profesional | Asistente | Pendiente | Alta | CUD01 | - | - | - | - | - | - |
| CUD04 | Desactivar o suspender profesional | Asistente | Pendiente | Alta | CUD01 | - | - | - | - | - | - |
| CUD05 | Ver listado de profesionales | Asistente | Pendiente | Media | CUD01 | - | - | - | - | - | - |
| CUD06 | Gestionar agenda | Profesional | Pendiente | Alta | CUD11 | - | - | - | - | - | - |
| CUD07 | Ver turnos del dia | Profesional | Pendiente | Alta | CUD06, CUD11 | - | - | - | - | - | - |
| CUD08 | Ver pacientes | Profesional | Pendiente | Alta | CUD06 | - | - | - | - | - | - |
| CUD09 | Ver ficha de salud del paciente | Profesional | Pendiente | Alta | CUD08, CUD16 | - | - | - | - | - | - |
| CUD10 | Ver historial de consultas del paciente | Profesional | Pendiente | Alta | CUD08 | - | - | - | - | - | - |
| CUD11 | Configurar horario de atencion | Profesional | Pendiente | Alta | - | - | - | - | - | - | - |
| CUD12 | Asignar turno a paciente | Profesional | Pendiente | Alta | CUD11, CUD08 | - | - | - | - | - | - |
| CUD13 | Ver lista de profesionales | Socio | Pendiente | Alta | CUD05 | - | - | - | - | - | - |
| CUD14 | Solicitar turno con profesional | Socio | Pendiente | Alta | CUD13, CUD11 | - | - | - | - | - | - |
| CUD15 | Ver perfil de profesional | Socio | Pendiente | Media | CUD13 | - | - | - | - | - | - |
| CUD16 | Cargar datos de salud | Socio | Pendiente | Alta | CUD14 (primer turno) | - | - | - | - | - | - |
| CUD17 | Ver turnos reservados | Socio | Pendiente | Alta | CUD14 | - | - | - | - | - | - |
| CUD18 | Reprogramar turno | Socio | Pendiente | Alta | CUD17 | - | - | - | - | - | - |
| CUD19 | Cancelar turno | Socio | Pendiente | Alta | CUD17 | - | - | - | - | - | - |
| CUD20 | Confirmar turno | Socio | Pendiente | Media | CUD14, notificaciones | - | - | - | - | - | - |
| CUD21 | Registrar asistencia del socio al turno | Profesional | Pendiente | Alta | CUD07, CUD20 | - | - | - | - | - | - |

## 4) Bitacora corta por CU

Usar esta seccion cuando un CU entre en `En curso` o `Bloqueado`.

### CU actual

- CU:
- Estado:
- Ultimo avance:
- Proximo paso:
- Bloqueo actual:
- Fecha estimada de desbloqueo:

### Historial de cambios de estado

| Fecha | CU | Estado anterior | Estado nuevo | Motivo | Responsable |
|---|---|---|---|---|---|
| - | - | - | - | - | - |

## 5) Checklist de cierre (antes de pasar un CU a Hecho)

- Flujo principal implementado.
- Flujos alternativos criticos implementados.
- Validaciones de negocio aplicadas.
- Seguridad por rol validada.
- Mensajes de error y estados vacios verificados.
- Pruebas ejecutadas (unitarias/integracion/e2e segun impacto).
- Evidencia documentada en el tablero.
