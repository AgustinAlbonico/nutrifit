# Spec: Cierre automático de consultas en `EN_CURSO`

> **Fecha**: 2026-06-18
> **Estado**: Diseño aprobado por el usuario, pendiente de revisión del spec
> **Alcance**: cierre automático por inactividad del estado `EN_CURSO`, pre-aviso al nutricionista, reapertura manual

## Decisión

Cuando un nutricionista abre una consulta y queda en `EN_CURSO` durante 30 minutos sin finalizarla manualmente, el sistema la cierra automáticamente a `REALIZADO` con un flag de cierre automático. Cinco minutos antes del cierre, el sistema notifica al nutricionista para darle oportunidad de terminar correctamente.

El nutri puede reabrir la consulta desde la UI para cargar los datos clínicos que haya olvidado (medición base, comentario clínico). El flag de cierre automático se conserva como histórico y la consulta pasa a `EN_CURSO` nuevamente para que el flujo de "Finalizar consulta" valide como en cualquier cierre manual.

## Hallazgos del código actual

| Área | Hallazgo | Impacto |
|------|----------|---------|
| Enum de estados | `EstadoTurno` define `EN_CURSO` y `REALIZADO` como estados distintos de la consulta activa. | Ya hay punto de inserción claro. |
| Cierre manual | `finalizar-consulta.use-case.ts` exige medición base y comentario clínico (`validar-cierre-consulta.helper.ts`). | El cierre automático debe poder saltear esa validación. |
| Schedulers existentes | `AusenciaTurnoScheduler` (`*/5 * * * *`) usa `PoliticaOperativaRepository.getUmbralAusente(gimnasioId)` y notifica via `NotificacionesService`. | Patrón exacto a replicar. |
| Timestamp de inicio | `TurnoOrmEntity` ya persiste `inicioConsultaEn` cuando se pasa a `EN_CURSO`. | No se necesita campo adicional para medir el umbral. |
| Notificaciones | `NotificacionesService.crear({...})` + `TipoNotificacion` enum ya soporta distintos tipos y metadata. | Reutilizable con dos entradas nuevas. |
| Validación clínica | Bugfix previo impide finalizar sin medición base + comentario clínico. | El cierre automático debe coexistir con esa validación, no romperla. |
| KPIs e historial | `get-profesional-kpi.use-case.ts` y `get-historial-consultas-paciente.use-case.ts` filtran por `REALIZADO`. | No requieren cambios; siguen contando la consulta. |

## Objetivos

- Cerrar automáticamente las consultas abandonadas en `EN_CURSO` después de 30 minutos.
- Avisar al nutricionista 5 minutos antes del cierre para que pueda finalizar manualmente.
- Permitir reabrir la consulta cerrada automáticamente para cargar los datos clínicos faltantes.
- Hacer el umbral configurable por gimnasio vía `PoliticaOperativa`, con defaults razonables.
- No romper la validación clínica del cierre manual (`Finalizar consulta`).
- No crear un nuevo estado: se reutiliza `REALIZADO` con flags adicionales.

## No objetivos

- No se cambia el flujo de "Finalizar consulta" manual.
- No se obliga al nutricionista a reabrir y completar la consulta.
- No se notifica al socio por el cierre automático (la consulta igual figura como atendida en su historial).
- No se rediseña `ConsultaProfesionalPage` más allá del banner y el botón de reapertura.
- No se modifica la lógica de KPIs ni del historial de paciente.

## Diseño

### Comportamiento

**1. Notificación de pre-aviso (a los 25 minutos de `EN_CURSO`)**

- Una notificación in-app al nutricionista: *"Tu consulta #N va a cerrarse automáticamente en 5 minutos. Finalizala para cargar tus datos clínicos."*
- Metadata: `{ turnoId, motivo: 'PREAVISO_CIERRE_AUTO' }`.
- Sin acción obligatoria del lado del nutri.

**2. Cierre automático (a los 30 minutos de `EN_CURSO`)**

- El turno pasa a `REALIZADO` con:
  - `cierreAutomatico: true`
  - `motivoCierreAutomatico: 'INACTIVIDAD'`
  - `cierreAutomaticoEn: <timestamp>`
  - `reabiertaPorCierreAuto: false` (default)
- Se omite la validación clínica dura (`validar-cierre-consulta.helper.ts`).
- Notificación al nutri: *"Tu consulta #N fue cerrada automáticamente por inactividad. Podés reabrirla para editarla."*
- Metadata: `{ turnoId, motivo: 'CIERRE_AUTO_INACTIVIDAD' }`.

**3. Reapertura manual (acción del nutri)**

- Endpoint: `POST /turnos/:idTurno/reabrir-cierre-auto`.
- Solo válido si `estadoTurno === REALIZADO && cierreAutomatico === true`.
- Transición: `REALIZADO` → `EN_CURSO`.
- Setea `reabiertaPorCierreAuto: true`. El flag `cierreAutomatico` no se borra (queda histórico para reportes y auditoría).
- Devuelve el `TurnoClinicoResponseDto` para que la UI refresque la pantalla.

**4. Cierre manual posterior a la reapertura**

- El nutri vuelve a usar "Finalizar consulta" como siempre.
- La validación clínica dura aplica normalmente.
- Al cerrar, el turno queda en `REALIZADO` con `cierreAutomatico: true` y `reabiertaPorCierreAuto: true` (ambos quedan como histórico).

### Componentes backend

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| `CierreConsultaScheduler` | `infrastructure/schedulers/cierre-consulta.scheduler.ts` | Cron cada 5 min. Busca turnos `EN_CURSO` con `inicioConsultaEn` viejo. Dispara pre-aviso y/o cierre automático. Idempotente. |
| `PoliticaOperativaRepository` (extendido) | `application/politicas/politica-operativa.repository.ts` (interfaz + impl) | `getUmbralCierreConsultaMin(gimnasioId)` y `getPreavisoCierreConsultaMin(gimnasioId)`, con defaults `30` y `5`. |
| `PoliticaOperativa` entity (extendido) | `infrastructure/persistence/typeorm/entities/politica-operativa.entity.ts` | Columnas nuevas `umbral_cierre_consulta_min` y `preaviso_cierre_consulta_min`, nullable. |
| `FinalizarConsultaPorInactividadUseCase` | `application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.ts` | Aplica el cierre automático. Sin validación clínica dura. Persiste flags. |
| `NotificarPreavisoCierreConsultaUseCase` | `application/turnos/use-cases/notificar-preaviso-cierre-consulta.use-case.ts` | Envía la notificación de pre-aviso. Setea `preavisoCierreAutoEnviadoEn` con timestamp para no repetir. |
| `ReabrirConsultaCerradaAutoUseCase` | `application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.ts` | Valida estado y flag, transiciona `REALIZADO → EN_CURSO`, setea `reabiertaPorCierreAuto: true`. |
| `TipoNotificacion` (extendido) | `domain/entities/Notificacion/tipo-notificacion.enum.ts` | `CONSULTA_PREAVISO_CIERRE_AUTO`, `CONSULTA_CERRADA_AUTO`. |
| `TurnoOrmEntity` (extendido) | `infrastructure/persistence/typeorm/entities/turno.entity.ts` | Columnas nuevas `cierre_Automatico`, `motivo_cierre_Automatico`, `cierre_Automatico_en`, `preaviso_cierre_Auto_enviado_en`, `reabierta_por_cierre_Auto`. |
| `TurnoController` (extendido) | `presentation/http/controllers/turnos/turno.controller.ts` | Endpoint nuevo `POST /turnos/:idTurno/reabrir-cierre-auto`. |
| `MotivoCierreAutomatico` (enum) | `domain/entities/Turno/motivo-cierre-automatico.enum.ts` | `INACTIVIDAD` (extensible a futuro). |
| Migración TypeORM | nueva | `YYYYMMDDHHMMSS-CierreAutomaticoConsulta.ts` para columnas de `turno` y `politica_operativa`. |

### Componentes frontend

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| `ConsultaProfesionalPage` (extendido) | `apps/frontend/src/pages/profesional/consulta/ConsultaProfesionalPage.tsx` | Mostrar banner amarillo si `cierreAutomatico && estado === REALIZADO`. Mostrar botón "Reabrir consulta" en la misma condición. |
| `useReabrirConsultaCerradaAuto` (hook) | nuevo | Llama al endpoint, refresca el estado del turno, maneja error. |
| Servicio `turnoService` (extendido) | `apps/frontend/src/services/turnoService.ts` (o el módulo de services que ya aloja las llamadas a `/turnos/*`) | `reabrirConsultaCerradaAuto(turnoId)`. |

### Política operativa

- Defaults globales: `umbralCierreConsultaMin = 30`, `preavisoCierreConsultaMin = 5`.
- Si el gimnasio tiene `umbralCierreConsultaMin` definido en `PoliticaOperativa`, se usa ese.
- Si tiene `preavisoCierreConsultaMin` definido, se usa ese para calcular cuándo se dispara el aviso.
- Si ambos son `null`, se usan los defaults.
- Se mantiene el patrón actual de `getUmbralAusente(gimnasioId)`.

### Reglas del scheduler

- Cron: `*/5 * * * *` (mismo que `AusenciaTurnoScheduler`).
- Solo actúa sobre turnos con `estadoTurno === EN_CURSO`.
- Solo actúa sobre turnos con `inicioConsultaEn` no nulo.
- Pre-aviso:
  - Si `ahora - inicioConsultaEn >= (umbral - preaviso)` y `preavisoCierreAutoEnviadoEn` es null → enviar pre-aviso y setear `preavisoCierreAutoEnviadoEn`.
- Cierre:
  - Si `ahora - inicioConsultaEn >= umbral` y `estadoTurno === EN_CURSO` → cerrar con `FinalizarConsultaPorInactividadUseCase`.
- Idempotencia: si el turno ya está `REALIZADO` o cualquier otro estado distinto de `EN_CURSO`, no hace nada.
- Multi-tenant: filtra por gimnasio usando el mismo `getUmbralAusente`-style helper.

## Esquema de datos

### Nuevas columnas en `turno`

| Columna | Tipo | Null | Default | Descripción |
|---|---|---|---|---|
| `cierre_Automatico` | `BOOLEAN` | NO | `FALSE` | Indica si el cierre fue automático. |
| `motivo_cierre_Automatico` | `VARCHAR(50)` | YES | `NULL` | Enum textual: `INACTIVIDAD`, etc. |
| `cierre_Automatico_en` | `DATETIME` | YES | `NULL` | Timestamp del cierre automático. |
| `preaviso_cierre_Auto_enviado_en` | `DATETIME` | YES | `NULL` | Timestamp del pre-aviso, para no repetir. |
| `reabierta_por_cierre_Auto` | `BOOLEAN` | NO | `FALSE` | Indica si el nutri reabrió tras un cierre automático. |

### Nuevas columnas en `politica_operativa`

| Columna | Tipo | Null | Default | Descripción |
|---|---|---|---|---|
| `umbral_cierre_consulta_min` | `INT` | YES | `NULL` | Override por gimnasio. Default global 30. |
| `preaviso_cierre_consulta_min` | `INT` | YES | `NULL` | Override por gimnasio. Default global 5. |

## API

### `POST /turnos/:idTurno/reabrir-cierre-auto`

- **Auth**: requiere sesión de nutricionista.
- **Path param**: `idTurno: number`.
- **Body**: vacío.
- **Respuesta 200**: `TurnoClinicoResponseDto` con `estadoTurno = EN_CURSO` y los flags actualizados.
- **Errores**:
  - `404 NotFoundError` si el turno no existe.
  - `403 ForbiddenError` si el nutri no es el dueño del turno.
  - `409 ConflictError` si el turno no está en `REALIZADO` o no tiene `cierreAutomatico === true`.

## UI

### Banner de cierre automático

- Color: amarillo (`bg-amber-50 border-amber-200` o similar del design system).
- Contenido: *"Esta consulta fue cerrada automáticamente por inactividad. Reabrí para editarla o finalizala manualmente."*
- Visible solo si `turno.cierreAutomatico === true && turno.estadoTurno === 'REALIZADO'`.
- Incluye botón "Reabrir consulta" alineado a la derecha.

### Botón "Reabrir consulta"

- Solo visible en la misma condición del banner.
- Llama al endpoint nuevo.
- Mientras la llamada está en curso: estado `disabled` con texto "Reabriendo...".
- En éxito: la pantalla vuelve a `EN_CURSO` y se refresca el contexto de la consulta.
- En error: toast con el mensaje del backend y se mantiene el estado `REALIZADO`.

## Testing

### Backend (unit + integración)

- `CierreConsultaScheduler`:
  - No hace nada si no hay turnos `EN_CURSO` viejos.
  - Envía pre-aviso a los 25 min y setea `preavisoCierreAutoEnviadoEn`.
  - No reenvía el pre-aviso en corridas siguientes.
  - Cierra a los 30 min con todos los flags correctos.
  - Es idempotente: si el turno ya no está `EN_CURSO`, no hace nada.
  - Respeta el umbral por gimnasio cuando está definido.
- `FinalizarConsultaPorInactividadUseCase`:
  - Cierra con flags aunque no haya medición base ni comentario clínico.
  - Rechaza si el turno no está `EN_CURSO`.
  - Notifica al nutri con el tipo `CONSULTA_CERRADA_AUTO`.
- `ReabrirConsultaCerradaAutoUseCase`:
  - Reabre correctamente cuando `cierreAutomatico === true && estado === REALIZADO`.
  - Setea `reabiertaPorCierreAuto: true` sin tocar `cierreAutomatico`.
  - Rechaza con `ConflictError` si el estado no es `REALIZADO` o el flag es false.
  - Rechaza con `ForbiddenError` si el nutri no es el dueño.
- `PoliticaOperativaRepository`:
  - Devuelve el umbral del gimnasio si está definido.
  - Devuelve el default global si el gimnasio no lo tiene configurado.
- Migración:
  - Sube y baja sin pérdida de datos.
  - Defaults aplicados correctamente.

### Frontend (Playwright + Vitest)

- Playwright:
  - Con turno en `REALIZADO` con `cierreAutomatico === true`: el banner aparece y el botón "Reabrir consulta" está visible.
  - Click en "Reabrir consulta" → la pantalla refresca y vuelve a `EN_CURSO`. El banner desaparece.
  - Click con error del backend → toast aparece, el estado se mantiene.
- Vitest:
  - Hook `useReabrirConsultaCerradaAuto` con mocks: éxito, error 409, error genérico.

## Out of scope (explícito)

- Cualquier lógica de recordatorio al socio por cierre automático.
- Migración del enum `EstadoTurno`.
- Cambios en el reporte de KPIs o en el historial de paciente.
- Reapertura múltiple más allá de la permitida por el flujo normal.
- Cierre automático de consultas que no sean de tipo nutricionista (no hay otras hoy, pero la regla queda atada al estado `EN_CURSO`).

## Estimación de complejidad

- **Backend**: 2 casos de uso nuevos + 1 scheduler + 1 use case de reapertura + 1 enum + 1 migración + tests. ~300-400 líneas totales.
- **Frontend**: 1 banner + 1 botón + 1 hook + 1 método en service. ~80-100 líneas totales.
- **Migración de datos**: no requerida (defaults manejan los registros existentes).

## Archivos a tocar (resumen)

### Backend

- `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.ts` (nuevo)
- `apps/backend/src/infrastructure/schedulers/cierre-consulta.scheduler.spec.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case.spec.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/notificar-preaviso-cierre-consulta.use-case.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/notificar-preaviso-cierre-consulta.use-case.spec.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.ts` (nuevo)
- `apps/backend/src/application/turnos/use-cases/reabrir-consulta-cerrada-auto.use-case.spec.ts` (nuevo)
- `apps/backend/src/domain/entities/Turno/motivo-cierre-automatico.enum.ts` (nuevo)
- `apps/backend/src/domain/entities/Notificacion/tipo-notificacion.enum.ts` (extendido)
- `apps/backend/src/application/politicas/politica-operativa.repository.ts` (extendido)
- `apps/backend/src/infrastructure/persistence/typeorm/entities/politica-operativa.entity.ts` (extendido)
- `apps/backend/src/infrastructure/persistence/typeorm/entities/turno.entity.ts` (extendido)
- `apps/backend/src/presentation/http/controllers/turnos/turno.controller.ts` (extendido)
- `apps/backend/src/application/turnos/turnos.module.ts` (extendido)
- Migración TypeORM nueva: `YYYYMMDDHHMMSS-CierreAutomaticoConsulta.ts`

### Frontend

- `apps/frontend/src/pages/profesional/consulta/ConsultaProfesionalPage.tsx` (extendido)
- `apps/frontend/src/hooks/useReabrirConsultaCerradaAuto.ts` (nuevo)
- `apps/frontend/src/services/turnoService.ts` (extendido; si no existe, seguir la convención del módulo de services que ya aloja las llamadas a `/turnos/*`)
