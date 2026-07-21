# Spec: Versionado completo de planes (RF-009)

**Spec ID**: versionado
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-009
**Related docs**: proposal.md sección 4 (RF-009) + sección 3 (Máquina de estados)

---

## Requisito (Requirement)

Cada plan MUST tener un historial completo e inmutable de versiones. Cualquier regeneración (cualquier scope, RF-007), edición manual o re-generación MUST crear una nueva versión. Las versiones anteriores SHALL ser accesibles en modo lectura para auditoría clínica.

**Datos de cada versión:**
- `planAlimentacionId` (FK, obligatorio).
- `numeroVersion` (int, autoincremental por plan).
- `datosJson` (JSON con la estructura completa del plan).
- `motivoCambio` (varchar 255): `creacion_inicial`, `regeneracion_completa`, `regeneracion_dia`, `regeneracion_alternativa`, `edicion_manual`.
- `activa` (boolean, default false): solo 1 true por `planAlimentacionId`.
- `createdBy` (FK nutricionista).
- `createdAt` (timestamp).

**Comportamiento MUST:**
1. Plan v1 se genera por primera vez vía `POST /ia/plan-semanal` (RF-001).
2. Regenerar (cualquier scope) → crea v2 con referencia a v1 vía `motivo_cambio`.
3. Edición manual → crea v2 con `motivo_cambio='edicion_manual'`.
4. Solo la versión con `activa=true` es la que ve el socio en `MiPlanPage`.
5. Al activar una versión, todas las demás del mismo plan MUST pasar a `activa=false` (transacción).
6. NO hay límite de versiones: se guardan todas para auditoría.

**Máquina de estados del plan** (asociada a `plan_alimentacion.estado`):
```
BORRADOR ─(acepta macros verde)──► ACEPTADO ─(activa)──► ACTIVO ─(finaliza)──► FINALIZADO
   │                                  │                       │
   │                                  │                       │
   └────(regenera)──────────────────► nueva versión BORRADOR  │
                                                                  │
(sigue en BD para historial) ─────────────────────────────────────┘
```

Transiciones:
- `BORRADOR → ACEPTADO`: SOLO si macros verde (≤±5% de RF-006) — bloqueado si amarillo o rojo.
- `ACEPTADO → ACTIVO`: solo el NUT dueño. Marca `activa=true` en la versión, pone todas las demás en `activa=false`.
- `ACTIVO → FINALIZADO`: cuando termina la semana.
- `BORRADOR → BORRADOR`: por regeneración, crea nueva versión.
- `* → BORRADOR`: si el NUT decide descartar y volver a empezar.

---

## Contexto / Estado actual

`plan_alimentacion` existe sin versionado. No hay `plan_alimentacion_version`. La edición es hard-delete/replace. No hay máquina de estados. Este spec MUST crear todo.

---

## Escenarios (Given / When / Then)

### Escenario 1: Primera versión creada al generar
- **Dado** un socio sin plan previo.
- **Cuando** el NUT ejecuta `POST /ia/plan-semanal` exitosamente.
- **Entonces** MUST crearse fila en `plan_alimentacion` (BORRADOR) + fila en `plan_alimentacion_version` con `numeroVersion=1`, `motivo_cambio='creacion_inicial'`, `activa=false`, `createdBy=nutricionistaId`.

### Escenario 2: Listar versiones de un plan
- **Dado** un plan con 3 versiones (v1, v2, v3) — v2 activa.
- **Cuando** el NUT ejecuta `GET /planes-alimentacion/123/versiones`.
- **Entonces** MUST devolver array con 3 versiones ordenadas por `numeroVersion` DESC, cada una con todos los campos.

### Escenario 3: Obtener versión específica
- **Dado** un plan con v2.
- **Cuando** el NUT ejecuta `GET /planes-alimentacion/version/460`.
- **Entonces** MUST devolver la versión completa con `datosJson` parseado.

### Escenario 4: Activar versión (transacción)
- **Dado** un plan con v1, v2, v3 — v2 es la activa actualmente.
- **Cuando** el NUT ejecuta `POST /planes-alimentacion/123/activar { versionId: 460 }` (asumiendo 460=v3).
- **Entonces** MUST ejecutarse transacción:
  - `UPDATE plan_alimentacion_version SET activa=false WHERE id_plan_alimentacion=123`
  - `UPDATE plan_alimentacion_version SET activa=true WHERE id_plan_alimentacion_version=460`
- **Y** MUST emitirse `NotificacionesService.emitir(PLAN_ACTIVO)` al socio titular.
- **Y** MUST registrarse auditoría `'PLAN_ACTIVADO'`.

### Escenario 5: Solo 1 versión activa por plan (constraint)
- **Dado** un plan con v2 activa.
- **Cuando** se intenta activar v3 sin desactivar v2 primero (por race condition).
- **Entonces** el UNIQUE INDEX o la lógica transaccional MUST garantizar que solo quede 1 activa.
- **Y** MUST NO haber 2 versiones con `activa=true` simultáneas.

### Escenario 6: Finalizar plan
- **Dado** un plan con `estado='ACTIVO'`.
- **Cuando** el NUT ejecuta `POST /planes-alimentacion/123/finalizar`.
- **Entonces** MUST transicionar `plan_alimentacion.estado='FINALIZADO'`.
- **Y** MUST emitirse `NotificacionesService.emitir(PLAN_FINALIZADO)` al NUT.
- **Y** MUST emitirse `NotificacionesService.emitir(PLAN_FINALIZADO)` también al socio (opcional).
- **Y** MUST registrarse auditoría `'PLAN_FINALIZADO'`.
- **Y** el plan MUST NO aceptar más activaciones de versiones (puede tener versiones pero ninguna puede pasar a `activa=true`).

### Escenario 7: Intentar activar versión de otro plan (409)
- **Dado** una versión 999 que pertenece al plan 123.
- **Cuando** el NUT ejecuta `POST /planes-alimentacion/456/activar { versionId: 999 }` (plan 456 ≠ 123).
- **Entonces** MUST devolver 409 con código `VERSION_NO_PERTENECE_AL_PLAN`.

### Escenario 8: Transición BORRADOR → ACEPTADO bloqueada por macros amarillo
- **Dado** un plan en BORRADOR con macros amarillo en 2 días.
- **Cuando** el NUT intenta aceptar.
- **Entonces** MUST devolver 422 con código `MACROS_NO_PERMITEN_ACEPTAR`.
- **Y** mensaje "Hay macros amarillo o rojo. Regenerá o editá manualmente antes de aceptar".

### Escenario 9: Edición manual crea nueva versión
- **Dado** un plan con v1.
- **Cuando** el NUT edita una comida manualmente (cambia nombre de un alimento).
- **Entonces** MUST crearse v2 con `motivo_cambio='edicion_manual'`, copia de v1 con la modificación.
- **Y** MUST NO modificar v1 (inmutabilidad).

---

## Modelo de datos

Tabla nueva `plan_alimentacion_version`:

| Columna | Tipo | Constraints |
|---|---|---|
| `id_plan_alimentacion_version` | INT AUTO_INCREMENT | PK |
| `id_plan_alimentacion` | INT | FK a `plan_alimentacion.id_plan_alimentacion` |
| `numero_version` | INT | NOT NULL |
| `datos_json` | JSON | NOT NULL |
| `motivo_cambio` | VARCHAR(255) | NULL |
| `activa` | BOOLEAN | DEFAULT false |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `created_by` | INT | FK a `persona.id_persona` |

Constraints:
- `UNIQUE(id_plan_alimentacion, numero_version)`.
- `INDEX(id_plan_alimentacion, activa)`.

Modificación a `plan_alimentacion`:
- `notas_generacion` (VARCHAR 1000) NULL — agregado en este PR.

`plan_alimentacion.estado` (campo existente, se usa la máquina de estados): valores `BORRADOR`, `ACEPTADO`, `ACTIVO`, `FINALIZADO`.

---

## Endpoints / contratos

### `GET /planes-alimentacion/:id/versiones`

**Auth**: Bearer JWT, rol NUTRICIONISTA / ADMIN, acción implícita (lectura).

**Response 200:**
```typescript
{
  planAlimentacionId: number,
  versiones: Array<{
    id: number,
    numeroVersion: number,
    motivoCambio: string,
    activa: boolean,
    createdAt: string,
    createdBy: number,
    resumen: { diasGenerados, macrosPromedio }
  }>
}
```

### `GET /planes-alimentacion/version/:versionId`

**Auth**: Bearer JWT, NUT dueño / ADMIN.

**Response 200:** versión completa con `datosJson` parseado.

### `POST /planes-alimentacion/:id/activar`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_ACTIVAR`.

**Request body:**
```typescript
{ versionId: number }
```

**Response 200:**
```typescript
{ planAlimentacionId, versionActivaId: number, mensaje: "Plan activado correctamente" }
```

**Códigos de error:** 403, 404, 409 (versión no pertenece), 422 (macros no permiten).

### `POST /planes-alimentacion/:id/finalizar`

**Auth**: Bearer JWT, rol NUTRICIONISTA / ADMIN, acción `PLANES_FINALIZAR`.

**Response 200:**
```typescript
{ planAlimentacionId, estado: 'FINALIZADO', finalizadoAt: string }
```

---

## Tests requeridos

### Unit (backend)
- `ActivarPlanAlimentacionUseCase`:
  - Mockear repositorio, verificar transacción (UPDATE todas + UPDATE una).
  - Verificar que se emite notificación.
  - Verificar que se registra auditoría.
- `FinalizarPlanAlimentacionUseCase`:
  - Verificar transición de estado.
  - Verificar notificaciones.
- `ListarVersionesPlanUseCase`: verificar orden DESC por numeroVersion.
- `ObtenerVersionPlanUseCase`: verificar parseo de datosJson.

### Integration (backend)
- POST `/planes-alimentacion/123/activar` con versionId válida → 200 + plan_alimentacion_version con activa=true (verificable con SELECT).
- POST con versionId de otro plan → 409.
- POST sin permisos → 403.
- POST `/finalizar` con estado ACTIVO → 200 + estado FINALIZADO.
- POST `/finalizar` con estado BORRADOR → 422 (debe estar ACTIVO primero).

---

## Out of scope

- Diff visual entre versiones (el frontend muestra cada versión completa).
- Branching de planes (un plan tiene UNA línea de versiones, no múltiples).
- Merge entre versiones (no hay).
- Restore de versión anterior (la activación siempre es forward).
- Versionado del schema del plan (no aplica — `datos_json` es flexible).

---

## Acceptance criteria

- [ ] Tabla `plan_alimentacion_version` MUST existir con todas las columnas e índices especificados.
- [ ] Cada plan MUST tener al menos 1 versión (la inicial).
- [ ] Cada regeneración / edición MUST crear nueva versión con `motivo_cambio` específico.
- [ ] Solo 1 versión por plan MUST tener `activa=true` en cualquier momento.
- [ ] Activar versión MUST ser transaccional (no race condition).
- [ ] Finalizar plan MUST cambiar estado y emitir notificación.
- [ ] Versión de otro plan NO MUST poder activarse en este plan (409).
- [ ] Transición BORRADOR → ACEPTADO MUST estar bloqueada si macros no son todas verdes.
- [ ] Auditoría MUST registrarse en cada acción clínica.
- [ ] `plan_alimentacion.notas_generacion` (VARCHAR 1000) MUST agregarse en este PR.