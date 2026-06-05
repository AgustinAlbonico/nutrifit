# 21 — Editar plan alimentario

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-21
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `20-crear-plan-alimentario.md`, `sistema-alimentos.md`

## Descripción
Permite al nutricionista editar un plan alimentario existente. Requiere motivo (RB23). Valida ingredientes contra alergias/intolerancias con warning + override (RB24). Lock optimista con campo `version` (RB30). Maneja alimentos desactivados mostrando badge "No disponible". Advertencias en operaciones destructivas (eliminar última comida del día, etc.).

## Actores
- NUTRICIONISTA (creador del plan)

## Precondiciones
- Plan existe.
- Plan está ACTIVO y no eliminado (`deleted_at IS NULL`).
- Nutricionista es el creador del plan.

## Postcondiciones
- Plan actualizado.
- `version+=1` (lock optimista, RB30).
- `editada_at=now()`, `motivo_edicion=...`.
- Auditoría con antes/después.
- Notificación al socio.

## Camino principal
1. Nutricionista abre el plan activo del socio.
2. Frontend hace `GET /api/planes/:id` para cargar la versión actual con `version`.
3. UI muestra: objetivo, calorías objetivo, macros objetivo, notas generales, días × comidas × grupos × alimentos.
4. Nutricionista modifica los campos que quiere.
5. Ingresa motivo de edición (obligatorio, RB23).
6. Confirma.
7. Frontend envía `PATCH /api/planes/:id` con los cambios + `motivoEdicion` + `version` actual.
8. Backend valida en transacción:
   1. **Lock optimista (RB30)**: el `version` enviado debe coincidir con el de DB. Si no: 409 "El plan fue modificado por otro usuario. Recargá la página."
   2. Mismas validaciones que CU-20 (objetivo, ≥1 comida, ingredientes vs alergias con override).
   3. **Alimentos desactivados**: si el plan tiene un alimento desactivado, se permite guardar pero se muestra badge "No disponible" en la UI.
9. Actualiza:
   - `version+=1`
   - `editada_at=now()`
   - `motivo_edicion=...`
   - Versión actual de los datos
10. Auditoría con antes/después completo y `version` antes/después.
11. Notificación al socio: "Tu plan alimentario fue actualizado. Revisá los cambios en tu perfil."

## Caminos alternativos
- **A1**: Motivo no informado → "El motivo de edición es obligatorio".
- **A2**: Ingrediente incompatible con alergias → warning + override (RB24). Si confirma, se guarda con `motivo_override` en auditoría.
- **A3**: Plan eliminado o inactivo → "El plan no se puede editar en su estado actual".
- **A4**: Lock optimista (otro nutricionista modificó al mismo tiempo, en el caso de multi-nutri) → "El plan fue modificado por otro usuario. Recargá la página.".
- **A5**: Plan con alimento desactivado (B7 de sistema-alimentos) → permitido, badge "No disponible".
- **A6**: Plan con ingrediente que es el ÚNICO de una comida del día → warning explícito (ver B2).

## Casos borde

### B1: Socio está viendo el plan mientras se edita
- Al recargar, ve la nueva versión. No hay merge.
- Si el socio edita un campo (no aplica, socio no edita el plan).

### B2: Elimina una comida que era la única del día
- **Warning explícito** (más fuerte que en creación): "Esta comida es la única del día [X]. El día quedará sin comidas. ¿Continuar?".
- Si confirma, se eliminan la comida, sus grupos y alimentos.
- El día queda con 0 comidas (no permitido al crear, pero la edición lo permite por compatibilidad con planes legacy).

### B3: Elimina un grupo de intercambio que tenía alimentos
- Se eliminan los `PlanAlimento` del grupo en cascada.
- Si el grupo era el único de la comida → cae en B2.

### B4: Se crea una versión sin cambios reales
- **Warning**: "No detectaste cambios. ¿Querés guardar igual?".
- Si confirma: se actualiza `editada_at` y se incrementa `version` (auditoría registra la edición sin cambios).

### B5: Cambia la cantidad de un alimento
- Válido, recalcular calorías mostradas.
- Triggera la actualización del snapshot (no se guarda en plan, se calcula al ver).

### B6: Cambia el objetivo
- Recalcular resumen de calorías vs objetivo en la UI.

### B7: Elimina todos los grupos de una comida
- Warning (ver B2).

### B8: Edición con plan eliminado concurrentemente
- Si el plan fue soft-deleted entre que el nutricionista lo abrió y guardó → 409 "El plan fue eliminado por otro usuario.".

### B9: Plan con consulta referenciándolo
- Si la edición cambia alimentos referenciados por una consulta, la consulta sigue con su `plan_alimentario_referenciado_id` apuntando al mismo plan, pero con los nuevos datos. La consulta NO se invalida.

### B10: Re-edición rápida (varias ediciones seguidas)
- Cada edición genera una nueva versión inmutable del plan (¿O solo el plan mismo se actualiza?).
- **Decisión**: el plan es UN SOLO registro que se actualiza. NO hay "historial de planes" como las versiones de ficha.
- El `version` se incrementa y se registra en auditoría.

## Reglas de negocio aplicadas
- **RB22**: Activo + histórico (transaccional al crear nuevo).
- **RB23**: Motivo obligatorio.
- **RB24**: Validación ingredientes.
- **RB30**: Lock optimista con `version`.
- **RB33**: Auditoría.

## Eventos disparados
- `PLAN_ACTUALIZADO` → email al socio con resumen de cambios.

## Auditoría
- `accion='UPDATE'`, `entidad='plan_alimentario'`, `motivo_edicion`, `antes_json` y `despues_json` completos (con `version` antes y después).

## Criterios de aceptación
- [ ] Nutricionista puede editar plan con motivo.
- [ ] Validación de ingredientes incompatibles.
- [ ] Lock optimista detecta edición concurrente (RB30).
- [ ] Warning al eliminar última comida del día.
- [ ] Warning si no hay cambios.
- [ ] Manejo de alimentos desactivados con badge.
- [ ] Auditoría con antes/después y motivo.
- [ ] Test unitario: use-case `editar-plan-alimentario.use-case.ts` cubre happy path, A1, A4, B2, B4.

## Endpoints API

### `GET /api/planes/:id`
- **Auth**: NUTRICIONISTA (creador), SOCIO (con permiso RB53), otros nutricionistas con turno previo.
- **Response 200**:
  ```json
  {
    "id": "uuid",
    "socioId": "uuid",
    "nutricionistaId": "uuid",
    "objetivo": "...",
    "caloriasDiariasObjetivo": 2000,
    "proteinasObjetivoG": 100,
    "carbohidratosObjetivoG": 250,
    "grasasObjetivoG": 70,
    "notasGenerales": "...",
    "fechaInicio": "2026-06-01",
    "fechaFin": null,
    "activo": true,
    "version": 5,
    "editadaAt": "2026-06-02T...",
    "motivoEdicion": "...",
    "dias": [
      {
        "id": "uuid",
        "diaSemana": "LUNES",
        "comidas": [
          {
            "id": "uuid",
            "tipoComida": "DESAYUNO",
            "orden": 1,
            "observaciones": null,
            "grupos": [
              {
                "id": "uuid",
                "nombreGrupo": "Lácteo",
                "orden": 1,
                "alimentos": [
                  {
                    "id": "uuid",
                    "alimentoId": "uuid",
                    "alimentoNombre": "Yogur natural",
                    "cantidadGramos": 200,
                    "alimentoDisponible": true,
                    "alergenos": ["lácteos"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Errors**: 403, 404, 500

### `GET /api/socios/:id/planes`
- **Auth**: NUTRICIONISTA (con RB13), SOCIO (el propio).
- **Query**: `?activo=true&limit=20&page=1` (default: solo activos).
- **Response 200**: `[{ id, objetivo, fechaInicio, fechaFin, activo, version }]`.
- **Errors**: 403, 404, 500

### `PATCH /api/planes/:id`
- **Auth**: NUTRICIONISTA (creador).
- **Body**:
  ```json
  {
    "motivoEdicion": "string (obligatorio)",
    "version": 5,
    "objetivo": "...",
    "caloriasDiariasObjetivo": 2000,
    "proteinasObjetivoG": 100,
    "carbohidratosObjetivoG": 250,
    "grasasObjetivoG": 70,
    "notasGenerales": "...",
    "dias": [
      {
        "diaSemana": "LUNES",
        "comidas": [
          {
            "tipoComida": "DESAYUNO",
            "orden": 1,
            "grupos": [
              {
                "nombreGrupo": "Lácteo",
                "orden": 1,
                "alimentos": [
                  { "alimentoId": "uuid", "cantidadGramos": 200 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Response 200**: plan actualizado con `version: 6`.
- **Errors**: 400 (motivo faltante, validaciones), 403, 404, 409 (lock optimista, plan eliminado), 500

## Modelo de datos

### Entidad `PlanAlimentario` (campo nuevo)
- `version: INT NOT NULL DEFAULT 0` (lock optimista, RB30).
- `editada_at: DATETIME NULL`.
- `motivo_edicion: TEXT NULL`.

### Constraints
- `version >= 0`.

## UI / UX

Idéntica a la pantalla de creación (CU-20), pero pre-llena. Cambios específicos:
- Banner arriba: "Estás editando el plan (versión {version}). Indica el motivo de la edición."
- Botón "Guardar cambios" reemplazando a "Crear plan".
- Indicador de alimentos no disponibles con badge gris "No disponible".
- Warning de cambios destructivos con confirmación fuerte.

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Socio ve plan durante edición | Al refrescar ve nueva versión |
| Elimina última comida del día | Warning + confirmación |
| Elimina único grupo de comida | Warning + confirmación (cascada) |
| Sin cambios reales | Warning + confirmación |
| Cambia cantidad de alimento | Válido, recalcular UI |
| Plan eliminado concurrentemente | 409 |
| Lock optimista | 409 "Recargá la página" |

## Tests

### Unitarios
- `editar-plan-alimentario.use-case.ts`:
  - Edición mínima (cambiar objetivo)
  - Edición máxima (cambiar estructura completa)
  - A1: sin motivo
  - A2: ingrediente incompatible + override
  - A4: lock optimista → 409
  - A5: alimento desactivado en plan → permitido
  - B2: warning última comida
  - B4: sin cambios
  - B8: plan eliminado concurrentemente

## Notas
- La edición del plan puede ser destructiva (eliminar días, comidas, grupos, alimentos). Se confirma cada acción destructiva.
- NO hay "deshacer" en iter 1. Si el nutricionista elimina algo por error, debe volver a agregarlo.
- El campo `version` se incrementa en CADA edición exitosa.
- **El plan es UN SOLO registro**, no tiene versiones históricas como la ficha. La historia se conserva en auditoría.
- Alimentos desactivados siguen visibles en planes existentes con badge "No disponible" (UX transparente).
