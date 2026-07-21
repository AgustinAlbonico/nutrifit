# Spec: Sistema de feedback 👍/👎 del nutricionista (RF-003)

**Spec ID**: feedback
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-003
**Related docs**: proposal.md sección 4 (RF-003) + sección 3 (Flujo 3)

---

## Requisito (Requirement)

El nutricionista MUST poder votar 👍 (`POSITIVO`) o 👎 (`NEGATIVO`) sobre un plan generado, con un comentario opcional. El voto SHALL ser único por versión (constraint UNIQUE) y SHALL ser editable vía PUT.

**Datos del feedback:**
- `planAlimentacionVersionId` (int, FK, obligatorio).
- `voto` (enum: `POSITIVO` | `NEGATIVO`, obligatorio).
- `comentario` (string, opcional, max 500 chars).

**Comportamiento MUST:**
1. `POST /planes-alimentacion/version/:versionId/feedback` MUST crear el feedback.
2. `PUT` sobre el mismo endpoint MUST editar voto y/o comentario.
3. UNIQUE constraint: un solo feedback por `planAlimentacionVersionId` (intent duplicado → 409 con código `FEEDBACK_DUPLICADO`).
4. Al guardar un feedback con comentario no vacío, el sistema MUST crear automáticamente una entrada en `nutricionista_ia_memoria` con `tipo_ejemplo`:
   - `POSITIVO` si voto es 👍.
   - `NEGATIVO` si voto es 👎.
5. El CTA de feedback SHOULD ser visible pero opcional en cada plan aceptado (no bloquea el flujo).
6. Solo el nutricionista dueño del plan puede votar (chequeo por `id_nutricionista` del `plan_alimentacion`).

---

## Contexto / Estado actual

No existe sistema de feedback. No existe tabla `plan_feedback`. Este spec MUST crear ambos.

---

## Escenarios (Given / When / Then)

### Escenario 1: Voto positivo con comentario
- **Dado** un plan v3 con `estado='ACEPTADO'`.
- **Cuando** el NUT ejecuta `POST /planes-alimentacion/version/456/feedback { voto: 'POSITIVO', comentario: 'Excelente, respetó vegano y predominio de fibra.' }`.
- **Entonces** MUST crear fila en `plan_feedback` con FK a `plan_alimentacion_version.id=456`.
- **Y** MUST crear fila en `nutricionista_ia_memoria` con `tipo_ejemplo='POSITIVO'`, `comentario='Excelente, respetó vegano y predominio de fibra.'`, FK a `plan_alimentacion_version.id=456`.
- **Y** MUST devolver 201 con el feedback creado.

### Escenario 2: Voto sin comentario (no crea memoria)
- **Dado** un plan v3.
- **Cuando** el NUT vota `POSITIVO` sin comentario.
- **Entonces** MUST crear fila en `plan_feedback` (con `comentario=null`).
- **Y** MUST NO crear entrada en `nutricionista_ia_memoria` (memoria solo se crea si hay comentario).

### Escenario 3: Voto duplicado (409)
- **Dado** un plan v3 que ya tiene feedback del NUT.
- **Cuando** el NUT intenta `POST` otro feedback sobre v3.
- **Entonces** MUST devolver 409 con código `FEEDBACK_DUPLICADO` y mensaje "Ya existe un feedback para esta versión, usar PUT para editar".

### Escenario 4: Edición de feedback existente (PUT)
- **Dado** un feedback existente con `voto='POSITIVO'`.
- **Cuando** el NUT ejecuta `PUT /planes-alimentacion/version/456/feedback { voto: 'NEGATIVO', comentario: 'Repitió mucho pollo' }`.
- **Entonces** MUST actualizar el voto y comentario existentes.
- **Y** si el voto cambió de POSITIVO a NEGATIVO y el comentario es no vacío, MUST crear una nueva entrada en `nutricionista_ia_memoria` (la vieja queda archivada? ver spec `memoria-ia.md`).
- **Y** MUST devolver 200 con el feedback actualizado.

### Escenario 5: NUT que no es dueño del plan (403)
- **Dado** un plan creado por NUT A.
- **Cuando** NUT B intenta votar sobre ese plan.
- **Entonces** MUST devolver 403 con código `FEEDBACK_NO_AUTORIZADO`.

### Escenario 6: Versión inexistente (404)
- **Dado** que la versión 999 no existe.
- **Cuando** el NUT intenta votar.
- **Entonces** MUST devolver 404 con código `VERSION_NO_ENCONTRADA`.

---

## Modelo de datos

Tabla nueva `plan_feedback`:

| Columna | Tipo | Constraints |
|---|---|---|
| `id_plan_feedback` | INT AUTO_INCREMENT | PK |
| `id_plan_alimentacion_version` | INT | FK CASCADE a `plan_alimentacion_version.id_plan_alimentacion_version`, UNIQUE |
| `id_nutricionista` | INT | FK a `persona.id_persona` |
| `voto` | ENUM('POSITIVO','NEGATIVO') | NOT NULL |
| `comentario` | VARCHAR(500) | NULL |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP |

Constraint UNIQUE en `id_plan_alimentacion_version` garantiza 1 voto por versión.

---

## Endpoints / contratos

### `POST /planes-alimentacion/version/:versionId/feedback`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_FEEDBACK`.

**Request body:**
```typescript
{
  voto: 'POSITIVO' | 'NEGATIVO',
  comentario?: string  // max 500 chars
}
```

**Response 201:**
```typescript
{
  id: number,
  planAlimentacionVersionId: number,
  voto: 'POSITIVO' | 'NEGATIVO',
  comentario: string | null,
  createdAt: string,
  updatedAt: string
}
```

**Códigos de error:** 400 (voto inválido, comentario > 500), 403, 404, 409.

### `PUT /planes-alimentacion/version/:versionId/feedback`

Mismo path, mismo body. Edita el feedback existente. Si cambia el voto y hay comentario, crea nueva entrada en memoria (ver `memoria-ia.md`).

**Response 200:** mismo formato que POST.

---

## Tests requeridos

### Unit (backend)
- `CrearFeedbackPlanUseCase`:
  - Caso POST exitoso con voto + comentario → asertar INSERT en `plan_feedback` + INSERT en `nutricionista_ia_memoria`.
  - Caso POST con voto sin comentario → asertar solo INSERT en `plan_feedback`.
  - Caso POST duplicado → asertar throw de `ConflictError('FEEDBACK_DUPLICADO')`.
- `EditarFeedbackPlanUseCase`:
  - Caso PUT cambiando voto → asertar UPDATE en `plan_feedback` + INSERT en memoria.

### Integration (backend)
- POST 2 veces sobre misma versión → 201 la primera, 409 la segunda.
- PUT sobre versión sin feedback previo → 404 con código `FEEDBACK_NO_ENCONTRADO`.

---

## Out of scope

- Voto del socio (explícitamente fuera: solo el NUT vota).
- Voto anónimo o de profesionales externos.
- Reacciones rápidas tipo emoji (solo 👍/👎).
- Métricas agregadas de satisfacción (no se construye dashboard).
- Notificación al NUT cuando alguien vota sobre su plan (no aplica — el NUT es el votante).

---

## Acceptance criteria

- [ ] Endpoint POST/PUT `/planes-alimentacion/version/:versionId/feedback` MUST existir.
- [ ] UNIQUE constraint MUST garantizar 1 feedback por versión.
- [ ] POST duplicado MUST devolver 409.
- [ ] Voto sin comentario MUST NO crear entrada en memoria.
- [ ] Voto con comentario MUST crear entrada en `nutricionista_ia_memoria` con tipo_ejemplo correspondiente.
- [ ] PUT MUST actualizar el feedback existente (no crear uno nuevo).
- [ ] Solo el NUT dueño del plan MUST poder votar (403 en otro caso).
- [ ] Comentario MUST tener max 500 chars.
- [ ] Auditoría: `AuditoriaService.registrar('FEEDBACK_CREADO' | 'FEEDBACK_EDITADO')` en cada acción.