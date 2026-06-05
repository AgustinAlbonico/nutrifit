# 18 — Registrar consulta nutricional

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-18
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `17-ver-agenda-dia.md`, `19-registrar-mediciones.md`, `notificaciones.md`, `agenda/15-ver-perfil-profesional.md`

## Descripción
Permite al nutricionista registrar la consulta nutricional realizada durante un turno. Estructura semiestructurada con cálculos automáticos donde posible. Secciones: motivo, anamnesis alimentaria, examen físico, diagnóstico, plan a seguir, recomendaciones. **Editable con motivo después de cerrada** (decisión de Q&A). **No se puede reabrir** (decisión de Q&A). Al cerrar la consulta, se publican las mediciones asociadas al socio (RB48).

El flujo está integrado con `17-ver-agenda-dia.md`: la transición a EN_CURSO la hace el endpoint `POST /api/turnos/:id/iniciar-consulta` (allí), que automáticamente crea la consulta vacía.

## Actores
- NUTRICIONISTA

## Precondiciones
- Nutricionista autenticado.
- Turno en estado PRESENTE/EN_CURSO/REALIZADO (RB13).
- Socio vinculado (ha tenido al menos un turno con este nutricionista).

## Postcondiciones
- Consulta registrada y asociada al turno.
- `cerrada_at` y `completada=true` al cerrar.
- Mediciones asociadas se publican (`publicada_at=now()`).
- Notificaciones (email al socio).
- Auditoría.

## Estructura de la consulta

### Secciones
| Campo | Tipo | Obligatorio | Max |
|---|---|---|---|
| `motivo_consulta` | text | ✅ | 1000 chars |
| `anamnesis_alimentaria` | text | ❌ | 5000 chars |
| `examen_fisico` | text | ❌ | 2000 chars |
| `diagnostico_nutricional` | text | ❌ | 2000 chars |
| `plan_a_seguir` | text | ❌ | 5000 chars |
| `recomendaciones` | text | ❌ | 5000 chars |
| `plan_alimentario_referenciado_id` | UUID (nullable) | ❌ | — |

### Cálculos automáticos (NO se persisten, se calculan al abrir la consulta)
- **IMC actual** del socio: peso de última ficha / altura².
- **Tendencia de peso**: vs última medición, vs peso objetivo de ficha.
- **Días desde la última consulta**.
- **% adherencia al plan activo** (cuando exista plan).

Estos se calculan en el backend al hacer `GET /api/consultas/:id` o `POST /api/turnos/:turnoId/consulta` y se incluyen en el response.

## Camino principal

### 1. Iniciar consulta (vía `17-ver-agenda-dia.md`)
1. Nutricionista en la agenda ve un turno PRESENTE.
2. Click "Iniciar consulta" → `POST /api/turnos/:id/iniciar-consulta` (ver `17-ver-agenda-dia.md`).
3. Backend: turno pasa a EN_CURSO. **Crea consulta vacía automáticamente** (asociada al turno).
4. Frontend redirige al formulario de consulta.

### 2. Completar consulta
1. Nutricionista completa las secciones.
2. (Opcional) Carga mediciones (ver `19-registrar-mediciones.md`).
3. Puede guardar borrador en cualquier momento (`POST /api/consultas/:id/borrador` o `PATCH /api/consultas/:id`).
4. Cuando termina:
   - Click "Cerrar consulta" → `POST /api/consultas/:id/cerrar`.
   - `completada=true`, `cerrada_at=now()`.
   - **Mediciones asociadas se publican** (`publicada_at=now()`).
   - Email al socio: "Tu nutricionista completó la consulta. Tenés nuevas mediciones visibles en tu progreso."

### 3. Editar consulta cerrada
- Nutricionista puede editar la consulta cerrada con motivo obligatorio (decisión de Q&A).
- `PATCH /api/consultas/:id/editar` con `motivoEdicion`.
- `editada_at=now()`, `motivo_edicion=...`.
- Auditoría con antes/después.

### 4. NO se puede reabrir
- Una consulta cerrada no se puede reabrir (decisión de Q&A). Solo se edita.

## Caminos alternativos
- **A1**: Turno no en PRESENTE/EN_CURSO/REALIZADO → "Solo se puede registrar consulta en turnos presentes, en curso o realizados".
- **A2**: Falta motivo_consulta al cerrar → "El motivo de consulta es obligatorio".
- **A3**: Error al adjuntar → ver `archivos.md`. Rollback parcial.

## Casos borde
- **B1**: Nutricionista edita la consulta cerrada → permitido con motivo (ver §3 arriba).
- **B2**: La ficha cambió durante la atención (socio la editó mientras el nutricionista atendía) → al abrir la consulta, mostrar diff "La ficha del paciente cambió desde la última consulta. ¿Querés recargarla?".
- **B3**: Valores de medición fuera de rango → ver CU-19.
- **B4**: Consulta sin mediciones → permitido, son independientes.
- **B5**: Consulta con plan referenciado → el nutricionista puede seleccionar el plan activo del socio (link real) y queda referenciado en la consulta.
- **B6**: Edición de consulta cerrada sin motivo → rechazado.
- **B7**: Cierre de consulta sin mediciones (no había) → igual se cierra, no se publican mediciones.
- **B8**: Lock optimista con `version` en la consulta (RB30) → 409 si dos nutricionistas editan al mismo tiempo.
- **B9**: Nutricionista cierra la consulta pero ya pasaron 30 min del horario → sigue siendo válido, el turno ya está en PRESENTE/EN_CURSO.
- **B10**: Nutricionista inicia consulta pero el socio no vino (PRESENTE marcado por error) → puede marcar AUSENTE manual (ver `17-ver-agenda-dia.md`).

## Reglas de negocio aplicadas
- **RB13**: Socio vinculado.
- **RB30**: Lock optimista en consulta con `version`.
- **RB33**: Auditoría.
- **RB48**: Publicación de mediciones al cerrar consulta.

## Eventos disparados
- `CONSULTA_REGISTRADA` → email al socio al cerrar.
- `MEDICIONES_PUBLICADAS` → email al socio si hay mediciones (ver `19-registrar-mediciones.md`).

## Auditoría
- `CONSULTA_CREADA` cuando se crea la consulta vacía (en `iniciar-consulta`).
- `CONSULTA_ACTUALIZADA` cuando se actualiza (borrador o edición cerrada).
- `CONSULTA_CERRADA` cuando se cierra.
- `CONSULTA_EDITADA_CERRADA` con `motivo_edicion` cuando se edita una cerrada.

## Endpoints API

### `POST /api/turnos/:turnoId/consulta`
- **Auth**: NUTRICIONISTA (del turno)
- **Body**: `CreateConsultaDto` con secciones (todas opcionales al crear, pero se valida `motivo_consulta` al cerrar).
- **Response 201**: `{ id, completada: false, version: 0, ... }`
- **Errors**: 400, 403, 404, 409 (ya existe consulta)
- **Nota**: en la práctica este endpoint se llama automáticamente desde `POST /api/turnos/:id/iniciar-consulta` (en `17-ver-agenda-dia.md`). También está disponible standalone para casos edge.

### `GET /api/consultas/:id`
- **Auth**: NUTRICIONISTA (dueño), SOCIO (la propia, si está cerrada)
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "turnoId": "uuid",
    "socioId": "uuid",
    "nutricionistaId": "uuid",
    "motivoConsulta": "...",
    "anamnesisAlimentaria": "...",
    "examenFisico": "...",
    "diagnosticoNutricional": "...",
    "planASeguir": "...",
    "recomendaciones": "...",
    "planAlimentarioReferenciadoId": "uuid | null",
    "completada": false,
    "cerradaAt": null,
    "editadaAt": null,
    "motivoEdicion": null,
    "version": 5,
    "calculos": {
      "imcActual": 24.5,
      "tendenciaPeso": -2.3,
      "diasUltimaConsulta": 30,
      "porcentajeAdherenciaPlan": 85
    },
    "mediciones": [
      { "id": "uuid", "fecha": "...", "peso": 75, "publicadaAt": null }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```
- **Errors**: 403, 404, 500

### `PATCH /api/consultas/:id`
- **Auth**: NUTRICIONISTA (dueño)
- **Body**: secciones a actualizar (parcial o total)
- **Response 200**: consulta actualizada
- **Errors**: 400, 403, 404, 409 (lock optimista), 500
- **Uso**: actualizar secciones mientras está en borrador.

### `POST /api/consultas/:id/cerrar`
- **Auth**: NUTRICIONISTA (dueño)
- **Body**: vacío
- **Side effect**:
  - `completada=true`, `cerrada_at=now()`, `version+=1`.
  - **Publica todas las mediciones asociadas** al turno: `medicion.publicada_at=now()`.
  - Email al socio.
- **Response 200**:
  ```json
  {
    "ok": true,
    "cerradaAt": "...",
    "medicionesPublicadas": 3
  }
  ```
- **Errors**: 400 (ya cerrada, falta motivo_consulta), 404, 500

### `PATCH /api/consultas/:id/editar`
- **Auth**: NUTRICIONISTA (dueño)
- **Body**:
  ```json
  {
    "motivoEdicion": "string (obligatorio)",
    "motivoConsulta": "...",
    "anamnesisAlimentaria": "...",
    ...
  }
  ```
- **Side effect**:
  - `editada_at=now()`, `motivo_edicion=...`, `version+=1`.
  - Auditoría con antes/después.
- **Response 200**: consulta actualizada
- **Errors**: 400 (motivo faltante, validaciones), 403, 404, 500

### `GET /api/socios/:id/plan-alimentario-activo`
- **Auth**: NUTRICIONISTA (con RB13), SOCIO (el propio)
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "objetivo": "...",
    "caloriasDiariasObjetivo": 2000,
    "fechaInicio": "2026-06-01",
    "version": 5
  }
  ```
- **Errors**: 404 (no tiene plan activo), 403, 500

## Modelo de datos

### Entidad `Consulta`
- `id, turno_id (UNIQUE), nutricionista_gimnasio_id, socio_id, motivo_consulta, anamnesis_alimentaria, examen_fisico, diagnostico_nutricional, plan_a_seguir, recomendaciones, plan_alimentario_referenciado_id (UUID nullable), completada, version (INT default 0), cerrada_at, editada_at, motivo_edicion, created_at, updated_at`

### Constraints
- `UNIQUE(consulta.turno_id)` — solo una consulta por turno.
- `version >= 0`.
- `CHECK(completada OR cerrada_at IS NULL)`.

## UI / UX

### Pantalla: Consulta
- Secciones colapsables con el orden de la lista.
- **Sidebar derecho** con cálculos automáticos (IMC actual, tendencia, días última consulta, % adherencia).
- Indicador de progreso de secciones completadas.
- Botón "Guardar borrador" siempre visible.
- Botón "Cerrar consulta" cuando motivo_consulta está lleno.
- Link al plan activo (si tiene) en una sección aparte.
- En modo edición cerrada: campo "motivo de edición" obligatorio en la parte superior, todos los campos editables.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Editar consulta cerrada | Con motivo, permitido |
| Ficha cambió durante atención | Diff al abrir |
| Sin mediciones | Cierre normal, sin publicación |
| Lock optimista | 409 "Recargá la página" |
| Cerrar sin motivo_consulta | 400 |
| Plan referenciado eliminado | El campo queda apuntando al plan con `deleted_at`, UI muestra "Plan eliminado" |

## Tests

### Unitarios
- `crear-consulta.use-case.ts`:
  - Happy path
  - A1: turno no válido
  - A2: falta motivo al cerrar
  - B4: sin mediciones
- `cerrar-consulta.use-case.ts`:
  - Cierre normal
  - Cierre con mediciones → publica
  - Cierre sin mediciones → solo cierra
  - Idempotencia: cerrar dos veces
  - B8: lock optimista
- `editar-consulta-cerrada.use-case.ts`:
  - Edición con motivo
  - Sin motivo → rechazado
- `calcular-context-consulta`:
  - IMC actual calculado
  - Tendencia de peso
  - Días desde última consulta
  - % adherencia al plan

## Notas
- La consulta NO tiene estado propio (no hay enum `estado_consulta`). Se considera "asociada" al estado del turno.
- El campo `plan_alimentario_referenciado_id` es opcional. Si el nutricionista quiere referenciar el plan activo del socio en la consulta, lo selecciona.
- "Editable con motivo" aplica SOLO a consultas cerradas. Mientras está en borrador, se edita libremente.
- **Lock optimista con `version`** evita ediciones concurrentes (RB30).
- Al cerrar, TODAS las mediciones del turno se publican (no solo las de la consulta). Esto es coherente con que las mediciones se asocian al turno.
- El campo `version` se incrementa en cada update exitoso.
- El endpoint de "crear consulta" puede ser invocado standalone, pero en la práctica se llama desde `iniciar-consulta`.
