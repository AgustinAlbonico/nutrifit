# Spec: Permisos, vistas y aislamiento (RF-010)

**Spec ID**: permisos-aislamiento
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-010
**Related docs**: proposal.md sección 4 (RF-010) + sección 3 (Roles y permisos)

---

## Requisito (Requirement)

El sistema MUST garantizar aislamiento de permisos sobre los planes de alimentación:

**Matriz de permisos por rol:**

| Acción | NUTRICIONISTA | SOCIO | ADMIN | RECEPCIONISTA | SUPERADMIN |
|---|---|---|---|---|---|
| Generar plan con IA | ✓ (solo planes propios) | ✗ | ✓ (gimnasio) | ✗ | ✓ |
| Regenerar plan | ✓ (solo planes propios) | ✗ | ✓ (gimnasio) | ✗ | ✓ |
| Votar plan | ✓ (solo planes propios) | ✗ | ✗ | ✗ | ✓ |
| Activar/Finalizar plan | ✓ (solo planes propios) | ✗ | ✓ (gimnasio) | ✗ | ✓ |
| Editar notas persistentes IA | ✓ (perfil propio) | ✗ | ✗ | ✗ | ✓ |
| Ver plan | ✓ (solo planes propios) | ✓ (planes donde es titular, solo versión activa) | ✓ (gimnasio) | ✗ | ✓ |
| Ver historial versiones | ✓ (solo planes propios) | ✗ | ✓ (gimnasio) | ✗ | ✓ |
| Ver/editar planes de OTRO NUT | ✗ | n/a | ✓ (gimnasio) | ✗ | ✓ |

**Acciones RBAC nuevas** (agregar a `packages/shared/src/types/acciones.ts`):

```typescript
PLANES_IA_GENERAR         // Generar plan con IA
PLANES_IA_REGENERAR       // Regenerar (cualquier scope)
PLANES_IA_FEEDBACK        // Votar sobre un plan
PLANES_IA_MEMORIA_EDITAR  // Editar memoria o preferencias IA
PLANES_ACTIVAR            // Pasar plan a ACTIVO
PLANES_FINALIZAR          // Pasar plan a FINALIZADO
```

**Comportamiento MUST:**
1. Cada endpoint nuevo MUST tener `@Actions(...)` con la acción correspondiente.
2. Los chequeos de ownership (NUT dueño del plan) MUST aplicarse vía `NutricionistaOwnershipGuard` existente o lógica equivalente en el use-case.
3. Los chequeos de multi-tenant (gimnasioId) MUST aplicarse vía `TenantContextService` existente.
4. SUPERADMIN MUST bypasear todos los chequeos.
5. Socio con múltiples nutricionistas MUST ver N cards separadas, una por nutricionista (sin consolidación).

---

## Contexto / Estado actual

`ActionsGuard` existe pero el código actual NO aplica `@Actions(...)` en los endpoints de plan (gap conocido). Este spec MUST cerrar ese gap.

---

## Escenarios (Given / When / Then)

### Escenario 1: NUT A intenta ver planes de NUT B (403)
- **Dado** un plan creado por NUT A.
- **Y** NUT B autenticado.
- **Cuando** NUT B ejecuta `GET /planes-alimentacion/123/versiones` (plan 123 es de NUT A).
- **Entonces** MUST devolver 403 con código `PLAN_NO_AUTORIZADO`.

### Escenario 2: SOCIO ve plan donde es titular
- **Dado** un plan con versión activa donde SOCIO X es titular.
- **Cuando** SOCIO X ejecuta `GET /planes-alimentacion/socio/mis-planes-activos` (o endpoint equivalente).
- **Entonces** MUST devolver el plan con su versión activa.
- **Y** NO MUST devolver versiones no activas.

### Escenario 3: SOCIO intenta votar (403)
- **Dado** un plan donde SOCIO X es titular.
- **Cuando** SOCIO X intenta `POST /planes-alimentacion/version/456/feedback`.
- **Entonces** MUST devolver 403 con código `FEEDBACK_SOLO_NUTRICIONISTA`.

### Escenario 4: RECEPCIONISTA intenta acceder (403)
- **Dado** un recepcionista autenticado.
- **Cuando** intenta cualquier endpoint de planes.
- **Entonces** MUST devolver 403 (rechazo total — recepcionistas no acceden a contenido clínico).

### Escenario 5: ADMIN de OTRO gimnasio intenta acceder (403)
- **Dado** un plan del gimnasio G1.
- **Y** un ADMIN del gimnasio G2 autenticado.
- **Cuando** intenta acceder al plan.
- **Entonces** MUST devolver 403 con código `PLAN_OTRO_GIMNASIO`.

### Escenario 6: SUPERADMIN accede a cualquier plan
- **Dado** un SUPERADMIN autenticado.
- **Cuando** accede a cualquier plan de cualquier gimnasio.
- **Entonces** MUST bypasear todos los chequeos y devolver el recurso.

### Escenario 7: SOCIO con 2 nutricionistas ve 2 cards
- **Dado** un SOCIO con planes activos de NUT A y NUT B.
- **Cuando** abre `MiPlanPage`.
- **Entonces** MUST ver 2 cards separadas, una por nutricionista.
- **Y** cada card muestra el plan del NUT correspondiente.

### Escenario 8: Edición de notas persistentes solo del perfil propio
- **Dado** un NUT A autenticado.
- **Cuando** ejecuta `PUT /profesional/mi-perfil/preferencias-ia`.
- **Entonces** MUST persistir en `nutricionista_orm` del NUT A (extraído del JWT).
- **Y** NO MUST permitir editar las notas de NUT B.

---

## Modelo de datos

Modificación a `packages/shared/src/types/acciones.ts`:

```typescript
export const ACCIONES_PLANES = {
  PLANES_IA_GENERAR: 'PLANES_IA_GENERAR',
  PLANES_IA_REGENERAR: 'PLANES_IA_REGENERAR',
  PLANES_IA_FEEDBACK: 'PLANES_IA_FEEDBACK',
  PLANES_IA_MEMORIA_EDITAR: 'PLANES_IA_MEMORIA_EDITAR',
  PLANES_ACTIVAR: 'PLANES_ACTIVAR',
  PLANES_FINALIZAR: 'PLANES_FINALIZAR'
} as const;
```

Seed: actualizar `apps/backend/src/seed-multi-tenant.ts` (o el archivo de seed correspondiente) para incluir las 6 acciones nuevas en los permisos de NUTRICIONISTA y ADMIN.

---

## Endpoints / contratos

Aplica `@Actions(...)` en los siguientes endpoints:

| Endpoint | Acción RBAC |
|---|---|
| `POST /ia/plan-semanal` | `PLANES_IA_GENERAR` |
| `POST /ia/plan-semanal/regenerar` | `PLANES_IA_REGENERAR` |
| `POST /planes-alimentacion/version/:id/feedback` | `PLANES_IA_FEEDBACK` |
| `PUT /planes-alimentacion/version/:id/feedback` | `PLANES_IA_FEEDBACK` |
| `GET /nutricionistai/memoria` | `PLANES_IA_MEMORIA_EDITAR` |
| `DELETE /nutricionistai/memoria/:id` | `PLANES_IA_MEMORIA_EDITAR` |
| `PUT /profesional/mi-perfil/preferencias-ia` | `PLANES_IA_MEMORIA_EDITAR` |
| `GET /profesional/mi-perfil/preferencias-ia` | (lectura perfil propio, sin acción explícita) |
| `POST /planes-alimentacion/:id/activar` | `PLANES_ACTIVAR` |
| `POST /planes-alimentacion/:id/finalizar` | `PLANES_FINALIZAR` |
| `GET /planes-alimentacion/:id/versiones` | (lectura, con ownership check) |
| `GET /planes-alimentacion/version/:id` | (lectura, con ownership check) |

Los endpoints de lectura usan `NutricionistaOwnershipGuard` o chequeo equivalente en el use-case.

---

## Tests requeridos

### Unit (backend)
- Use-cases nuevos con mocks de `TenantContextService` y `AccionesService`:
  - Caso NUT dueño → success.
  - Caso NUT que no es dueño → throw `ForbiddenError`.
  - Caso ADMIN de otro gimnasio → throw `ForbiddenError`.
  - Caso SOCIO → throw `ForbiddenError`.
  - Caso RECEPCIONISTA → throw `ForbiddenError`.
  - Caso SUPERADMIN → success sin chequeos.

### Integration (backend)
- Endpoint con `@Actions('PLANES_IA_GENERAR')` + JWT sin esa acción → 403.
- Endpoint con JWT con esa acción + ownership OK → 200/201.
- Endpoint con JWT de otro gimnasio → 403.

### Seed
- Verificar que el seed incluye las 6 acciones nuevas en NUTRICIONISTA y ADMIN.
- Verificar que RECEPCIONISTA NO tiene ninguna acción de planes.

---

## Out of scope

- Permisos granulares por campo (ej: "puede ver macros pero no editar notas") — son chequeos binarios rol-based.
- Roles custom definidos por admin (no existe esta feature).
- Audit log de accesos denegados (solo se loggean accesos exitosos en `auditoria`).
- Rate limiting por usuario.

---

## Acceptance criteria

- [ ] 6 acciones nuevas MUST agregarse a `packages/shared/src/types/acciones.ts`.
- [ ] Seed MUST actualizarse con las 6 acciones para NUTRICIONISTA y ADMIN.
- [ ] Cada endpoint nuevo MUST tener `@Actions(...)` declarado.
- [ ] NUT A MUST NO poder acceder a planes de NUT B (403).
- [ ] SOCIO MUST NO poder votar (403).
- [ ] RECEPCIONISTA MUST NO acceder a nada de planes (403 total).
- [ ] ADMIN MUST solo acceder a planes de su gimnasio.
- [ ] SUPERADMIN MUST bypasear todos los chequeos.
- [ ] Multi-tenant MUST filtrarse vía `gimnasioId` del JWT.
- [ ] SOCIO con 2+ NUTs MUST ver N cards separadas (no consolidación).