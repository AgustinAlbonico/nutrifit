# Spec: Notificaciones in-app (RF-011)

**Spec ID**: notificaciones
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-011
**Related docs**: proposal.md sección 4 (RF-011)

---

## Requisito (Requirement)

Los eventos del feature MUST disparar notificaciones in-app (campanita + contador) a los actores correspondientes. NO se envían emails en este feature.

**Eventos que disparan notificación:**

| Evento | Receptor | TipoNotificacion | Disparado por |
|---|---|---|---|
| Plan generado y listo para revisión | NUT dueño | `PLAN_REVISAR` | `GenerarPlanSemanalUseCase` post-persistencia |
| Plan pasa a ACTIVO | SOCIO titular | `PLAN_ACTIVO` | `ActivarPlanAlimentacionUseCase` post-transacción |
| Plan pasa a FINALIZADO | NUT dueño (y opcionalmente socio) | `PLAN_FINALIZADO` | `FinalizarPlanAlimentacionUseCase` |
| Validación de restricciones falla tras 2 reintentos | NUT dueño | `PLAN_VALIDACION_WARNING` | `GenerarPlanSemanalUseCase` o `RegenerarPlanSemanalUseCase` |
| Macros fuera de rango (>±10%) | NUT dueño | `PLAN_MACROS_FUERA_RANGO` | `GenerarPlanSemanalUseCase` o `RegenerarPlanSemanalUseCase` |

**Comportamiento MUST:**
1. Cada evento MUST crear UNA fila en tabla `notificacion` existente.
2. NO se envía email (canal in-app únicamente).
3. La campanita del header MUST mostrar contador de notificaciones no leídas (funcionalidad existente, se reusa).
4. Las notificaciones existentes se muestran en el dropdown de la campanita (existente).

---

## Contexto / Estado actual

Existe tabla `notificacion` y `NotificacionesService` (ver uso en `ReservarTurnoSocioUseCase` con `TURNO_RESERVADO`). El enum `TipoNotificacion` existente tiene algunos valores pero faltan los 5 nuevos. Este spec MUST extender el enum y agregar las emisiones correspondientes en cada use-case.

---

## Escenarios (Given / When / Then)

### Escenario 1: Plan generado → notificación al NUT
- **Dado** un NUT dueño que generó un plan exitosamente.
- **Cuando** el plan se persiste con v1.
- **Entonces** MUST emitirse `NotificacionesService.emitir(PLAN_REVISAR)` con `receptorId=nutricionistaId`, `payload={ planAlimentacionId, versionId }`.

### Escenario 2: Plan activado → notificación al socio
- **Dado** un plan con versión 460 activada.
- **Cuando** se ejecuta `POST /planes-alimentacion/123/activar`.
- **Entonces** MUST emitirse `NotificacionesService.emitir(PLAN_ACTIVO)` con `receptorId=socioIdDelPlan`, `payload={ planAlimentacionId, versionId }`.

### Escenario 3: Plan finalizado → notificación al NUT (y socio)
- **Dado** un plan con `estado='ACTIVO'`.
- **Cuando** se ejecuta `POST /planes-alimentacion/123/finalizar`.
- **Entonces** MUST emitirse `NotificacionesService.emitir(PLAN_FINALIZADO)` con `receptorId=nutricionistaId` Y `receptorId=socioId` (2 notificaciones).

### Escenario 4: Validación de restricciones falla → warning
- **Dado** una generación donde tras 2 reintentos hay 1+ restricciones no cumplidas.
- **Cuando** el plan se persiste con warning.
- **Entonces** MUST emitirse `NotificacionesService.emitir(PLAN_VALIDACION_WARNING)` con `receptorId=nutricionistaId`, `payload={ planAlimentacionId, restriccionesNoCumplidas }`.

### Escenario 5: Macros fuera de rango
- **Dado** una generación con macros rojo en 1+ días.
- **Cuando** el plan se persiste.
- **Entonces** MUST emitirse `NotificacionesService.emitir(PLAN_MACROS_FUERA_RANGO)` con `receptorId=nutricionistaId`, `payload={ planAlimentacionId, diasConMacrosRojo }`.

### Escenario 6: El receptor ya tiene una notificación similar reciente
- **Dado** que el NUT ya recibió `PLAN_REVISAR` para el mismo plan en los últimos 5 minutos.
- **Cuando** se intenta emitir otra `PLAN_REVISAR` para el mismo plan.
- **Entonces** SHOULD NO duplicar la notificación (deduplicación por `receptorId + tipo + planAlimentacionId` en ventana de 5 min).
- **Y** MAY loggear "notificación deduplicada" para auditoría.

---

## Modelo de datos

Extensión del enum `TipoNotificacion` en `apps/backend/src/domain/enums/tipo-notificacion.enum.ts`:

```typescript
export enum TipoNotificacion {
  // ... valores existentes ...
  PLAN_REVISAR = 'PLAN_REVISAR',
  PLAN_ACTIVO = 'PLAN_ACTIVO',
  PLAN_FINALIZADO = 'PLAN_FINALIZADO',
  PLAN_VALIDACION_WARNING = 'PLAN_VALIDACION_WARNING',
  PLAN_MACROS_FUERA_RANGO = 'PLAN_MACROS_FUERA_RANGO'
}
```

Tabla `notificacion` existente: no se modifica el schema, solo se agregan los 5 valores al enum.

Uso de `NotificacionesService`:
```typescript
await this.notificacionesService.emitir({
  tipo: TipoNotificacion.PLAN_REVISAR,
  receptorId: nutricionistaId,
  gimnasioId: gimnasioId,        // para multi-tenant
  payload: { planAlimentacionId, versionId },
  titulo: 'Plan listo para revisar',
  mensaje: 'Tu plan para ${socioNombre} está listo. Revisalo.'
});
```

---

## Endpoints / contratos

Este spec NO introduce endpoints nuevos. Las notificaciones se consumen vía:
- `GET /notificaciones/mias` (existente) — devuelve las notificaciones del usuario actual.
- `PATCH /notificaciones/:id/leida` (existente) — marca como leída.

El frontend MUST mostrar los 5 nuevos tipos con iconos y textos apropiados:
- `PLAN_REVISAR` → "Plan listo para revisar" + ícono ✏️
- `PLAN_ACTIVO` → "Tu plan está activo" + ícono ✅
- `PLAN_FINALIZADO` → "El plan fue finalizado" + ícono 📋
- `PLAN_VALIDACION_WARNING` → "Plan con advertencias de validación" + ícono ⚠️
- `PLAN_MACROS_FUERA_RANGO` → "Macros fuera de rango en el plan" + ícono 🚨

---

## Tests requeridos

### Unit (backend)
- `GenerarPlanSemanalUseCase`: mockear `NotificacionesService`, verificar que se llama `emitir(PLAN_REVISAR)` post-persistencia.
- `GenerarPlanSemanalUseCase` con restricciones no cumplidas: verificar `emitir(PLAN_VALIDACION_WARNING)`.
- `GenerarPlanSemanalUseCase` con macros rojo: verificar `emitir(PLAN_MACROS_FUERA_RANGO)`.
- `ActivarPlanAlimentacionUseCase`: verificar `emitir(PLAN_ACTIVO)` al socio.
- `FinalizarPlanAlimentacionUseCase`: verificar `emitir(PLAN_FINALIZADO)` al NUT y al socio.

### Integration (backend)
- POST `/ia/plan-semanal` exitoso → SELECT en `notificacion` con tipo='PLAN_REVISAR'.
- POST `/planes-alimentacion/123/activar` → SELECT con tipo='PLAN_ACTIVO' para el socioId del plan.
- POST `/planes-alimentacion/123/finalizar` → SELECT con tipo='PLAN_FINALIZADO' para nutricionistaId y socioId.

---

## Out of scope

- Emails (canal in-app únicamente).
- Push notifications móviles (no aplica).
- WebSockets para actualización en tiempo real (la campanita refresca con polling o al navegar).
- Configuración de preferencias de notificación por usuario (todos reciben todas las notificaciones clínicas).
- Snooze / mute de notificaciones.

---

## Acceptance criteria

- [ ] Enum `TipoNotificacion` MUST extenderse con los 5 valores nuevos.
- [ ] Cada uno de los 5 eventos MUST emitir una notificación al receptor correcto.
- [ ] Receptor MUST filtrarse correctamente (NUT para warnings/revisar/macros, socio para activo/finalizado).
- [ ] Multi-tenant MUST respetarse (`gimnasioId` en la notificación).
- [ ] Deduplicación SHOULD aplicarse para evitar spam (ventana 5 min por receptor + tipo + planId).
- [ ] NO se envían emails.
- [ ] Frontend MUST mostrar los 5 nuevos tipos con iconos y textos apropiados.