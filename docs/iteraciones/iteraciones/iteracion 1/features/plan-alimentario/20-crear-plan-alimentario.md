# 20 — Crear plan alimentario

> **Source of truth**: `01-iteracion-base-nutricional.md` §CU-20
> **Estado**: Por implementar
> **Prioridad**: Alta
> **Dependencias**: `08-completar-ficha-salud.md`, `sistema-alimentos.md`, `notificaciones.md`, `auditoria.md`

## Descripción
Permite al nutricionista crear un plan alimentario para un socio. Estructura por día de la semana con comidas configurables (RB51), grupos de intercambio múltiples (RB52), base de alimentos propia con creación on-the-fly, validación de ingredientes contra alergias/intolerancias con warning + override (RB24), versionado activo + histórico (RB22), visibilidad limitada (RB53).

## Actores
- NUTRICIONISTA

## Precondiciones
- Nutricionista autenticado.
- Tuvo al menos un turno previo con el socio (RB13).
- Socio con ficha completa (RB14).

## Postcondiciones
- Plan creado en estado ACTIVO.
- Plan activo anterior (si existía) → HISTORICO en la misma transacción (RB22).
- Auditoría con antes_json del plan anterior.

## Camino principal
1. Nutricionista abre perfil del socio → "Crear plan".
2. Completa datos del plan:
   - **Objetivo** (texto, obligatorio, max 500 chars).
   - **Calorías diarias objetivo** (opcional, kcal).
   - **Macros objetivo** (opcional, gramos por macro): proteínas, carbohidratos, grasas.
   - **Notas generales** (opcional, max 2000 chars).
3. Por cada día de la semana (L-D):
   - Elige comidas del set permitido: `DESAYUNO, COLACION, ALMUERZO, MERIENDA, CENA, SNACK` (RB51).
   - Por cada comida:
     - Crea 1..N grupos de intercambio (ej. "Lácteo", "Fruta", "Cereal").
     - Por cada grupo, agrega 1..N alimentos con cantidad en gramos.
4. El sistema valida:
   - ≥1 día con ≥1 comida.
   - Objetivo no vacío.
   - Para cada alimento del plan: cruzar con `ficha.alergias`, `ficha.intolerancias`, `ficha.restricciones`. Si hay incompatibilidad:
     - **Warning** con override: "El alimento X contiene [alérgeno], declarado por el socio. ¿Confirmar igualmente?" (RB24).
     - Si confirma: se guarda + `motivo_override` en auditoría.
5. Calcula automáticamente:
   - Calorías totales del plan (suma de alimentos × sus kcal/100g × gramos).
   - Macros totales.
6. Pre-confirmación: muestra resumen del plan con calorías calculadas.
7. Confirma.
8. En transacción:
   - Marca plan activo anterior como HISTORICO (`activo=false, fecha_fin=now()`).
   - Crea nuevo plan como ACTIVO.
9. Notifica al socio (email).
10. Auditoría con antes_json del plan anterior.

## Caminos alternativos
- **A1**: Falta objetivo → "El objetivo del plan es obligatorio".
- **A2**: No se cargó ninguna comida → "Cargá al menos una comida".
- **A3**: Socio sin ficha completa → "El socio no tiene ficha completa, no se puede crear plan".
- **A4**: Alimento incompatible con alergia/intolerancia → warning + override (RB24).
- **A5**: Alimento no encontrado en base → permite crearlo on-the-fly (ver `sistema-alimentos.md`).
- **A6**: Cambio de alergias del socio después de crear plan → el plan NO se re-valida automáticamente.

## Casos borde
- **B1**: Plan creado con 1 día y 1 comida (mínimo válido).
- **B2**: Plan con 7 días × 6 comidas × 5 grupos × 3 alimentos = 630 registros → performance: usar UI con load lazy, transaccional.
- **B3**: Crear dos planes seguidos en rápida sucesión → constraint de unicidad: el segundo espera o falla con 409 "ya existe un plan activo, desactívelo primero".
- **B4**: Cantidad de alimento en gramos con decimales (ej. 150.5g) → permitido.
- **B5**: Alimento con cantidad 0g → no permitido, warning.
- **B6**: Grupo de intercambio con 0 alimentos → no permitido.
- **B7**: Cambio de alergias entre crear borrador y confirmar → re-validar al confirmar.
- **B8**: Alimento desactivado en la base mientras se arma el plan → badge "No disponible" en la UI, NO permite agregarlo.
- **B9**: Plan creado por error → admin puede ayudar a marcarlo como histórico manualmente.

## Reglas de negocio aplicadas
- **RB13**: Socio vinculado.
- **RB14**: Ficha completa.
- **RB22**: Activo + histórico, transaccional.
- **RB24**: Validación ingredientes con warning + override.
- **RB30**: Lock optimista (al editar, no al crear).
- **RB33**: Auditoría.
- **RB51**: Comidas configurables.
- **RB52**: Grupos de intercambio múltiples.
- **RB53**: Visibilidad (socio + creador + nutricionistas con turno previo).
- **RB54**: Sin adherencia (no se modela).

## Eventos disparados
- `PLAN_CREADO` → email al socio con resumen del plan (objetivo, calorías calculadas, link al plan completo).

## Auditoría
- `CREATE` con `entidad='plan_alimentario'`, `despues_json` con plan completo (días, comidas, grupos, alimentos).
- `motivo_override` por cada alimento con alergia/intolerancia confirmada.

## Endpoints API

### `POST /api/socios/:socioId/plan-alimentario`
- **Auth**: NUTRICIONISTA (con RB13)
- **Body**:
  ```json
  {
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
- **Response 201**:
  ```json
  {
    "id": "uuid",
    "version": 0,
    "activo": true,
    "caloriasTotales": 1800,
    "macrosTotales": { "proteinas": 90, "carbohidratos": 220, "grasas": 60 }
  }
  ```
- **Errors**: 400 (validaciones, A1, A2), 403, 404, 409 (ya existe plan activo y no se desactivó), 500

## Criterios de aceptación
- [ ] Nutricionista puede crear plan con estructura por día de la semana.
- [ ] Comidas configurables del set permitido.
- [ ] Grupos de intercambio múltiples por comida.
- [ ] Alimento incompatible muestra warning con override auditado.
- [ ] Plan anterior pasa a histórico al crear nuevo.
- [ ] Calorías calculadas automáticamente.
- [ ] Macros objetivo opcionales (gramos).
- [ ] Test unitario: use-case `crear-plan-alimentario.use-case.ts` cubre happy path, A1, A2, A4, RB22, RB24.

## Modelo de datos

### Entidad `PlanAlimentario`
- `id, socio_id, nutricionista_gimnasio_id, objetivo, calorias_diarias_objetivo, proteinas_objetivo_g, carbohidratos_objetivo_g, grasas_objetivo_g, notas_generales, fecha_inicio, fecha_fin (nullable), activo (default true), version (default 0), deleted_at (nullable), motivo_eliminacion, created_at, updated_at`

### Entidad `PlanComida`
- `id, plan_id, dia_semana, tipo_comida, orden, observaciones`

### Entidad `GrupoIntercambio`
- `id, plan_comida_id, nombre_grupo, orden`

### Entidad `PlanAlimento`
- `id, grupo_intercambio_id, alimento_id, cantidad_gramos, orden, observaciones`

### Constraints
- **Solución MySQL para UNIQUE parcial** (no soportado nativamente): usar columna calculada `plan_activo_socio` que es `activo` cuando el plan no está eliminado, o usar trigger que enforce la unicidad. **Decisión**: usar índice UNIQUE con `NULL` para `fecha_fin` (cuando el plan está activo, `fecha_fin IS NULL`):
  ```sql
  UNIQUE(socio_id, nutricionista_gimnasio_id, fecha_fin)
  ```
  MySQL permite múltiples NULLs, pero solo uno cuando el resto de columnas coinciden. Esto efectivamente enforce "un plan activo por socio por nutricionista".
  Si hay múltiples nutricionistas en el mismo gimnasio atendiendo al socio (poco probable), cada uno puede tener su plan activo.
- `UNIQUE(plan_comida.plan_id, dia_semana, tipo_comida)` (no duplicar misma comida en mismo día).
- `CHECK(plan_alimento.cantidad_gramos > 0)`.

## Cálculo de calorías y macros del plan

```typescript
function calcularResumenPlan(plan: PlanCompleto): { calorias: number; proteinas: number; carbohidratos: number; grasas: number } {
  let calorias = 0, proteinas = 0, carbohidratos = 0, grasas = 0;
  for (const dia of plan.dias) {
    for (const comida of dia.comidas) {
      for (const grupo of comida.grupos) {
        for (const planAlimento of grupo.alimentos) {
          // Se asume UN alimento por grupo se consume.
          // El cálculo muestra el MÁXIMO (suma de todos los alimentos del grupo).
          // El socio elegirá UNO en la UI.
          calorias += planAlimento.alimento.caloriasPor100g * planAlimento.cantidadGramos / 100;
          proteinas += planAlimento.alimento.proteinasG * planAlimento.cantidadGramos / 100;
          carbohidratos += planAlimento.alimento.carbohidratosG * planAlimento.cantidadGramos / 100;
          grasas += planAlimento.alimento.grasasG * planAlimento.cantidadGramos / 100;
        }
      }
    }
  }
  return { calorias, proteinas, carbohidratos, grasas };
}
```

**Nota**: como el socio elige UNO por grupo, las calorías reales consumidas son la suma de UN alimento por grupo. El cálculo mostrado es el MÁXIMO (suma de todos). Decisión de iter 1: mostrar el máximo con disclaimer en la UI "Si elegís un alimento por grupo, consumís aprox X kcal/día".

## UI / UX

### Pantalla: Crear plan
- Header: objetivo, calorías objetivo, macros objetivo.
- Tabs por día de la semana (L, M, M, J, V, S, D).
- Por cada día: lista de comidas elegidas (con check de las 6 posibles).
- Por cada comida: lista de grupos de intercambio.
- Por cada grupo: lista de alimentos con cantidad.
- Botón "Agregar comida" (selector del set permitido).
- Botón "Agregar grupo" (input nombre del grupo).
- Buscador de alimentos con creación on-the-fly (ver `sistema-alimentos.md`).
- **Sidebar derecho**: resumen de calorías calculadas, macros calculados (actualiza en tiempo real al editar).
- Banner de warning si alimento es incompatible con ficha.
- Confirmación final con modal "Se creará el plan X. El plan activo anterior (si existe) pasará a histórico.".

## Edge cases (resumidos)

| Caso | Comportamiento |
|---|---|
| Plan mínimo | 1 día con 1 comida |
| Plan grande | Performance con lazy loading |
| Alimento desactivado | NO permite agregarlo |
| Alergia confirmada con override | Warning + `motivo_override` en auditoría |
| Cambio de alergias post-crear | Plan NO se re-valida (queda con la versión) |
| Ya existe plan activo | Marca como histórico y crea nuevo |
| Plan creado por error | Admin puede marcar manualmente como histórico |

## Tests

### Unitarios
- `crear-plan-alimentario.use-case.ts`:
  - Plan con 1 día 1 comida (mínimo)
  - Plan con 7 días
  - Plan con múltiples comidas por día
  - Plan con múltiples grupos por comida
  - Plan con intercambios múltiples en un grupo
  - A1: falta objetivo
  - A2: sin comidas
  - A4: ingrediente incompatible + override
  - B5: cantidad 0 → rechazado
  - B6: grupo sin alimentos → rechazado
  - B7: re-validar al confirmar
  - B8: alimento desactivado → rechazado
- `calcular-resumen-plan.use-case.ts`:
  - Suma correcta
  - Con decimales
  - Plan vacío (debería retornar 0)
- `crear-alimento-on-the-fly` (delegado a `sistema-alimentos.md`):
  - Crear desde el modal de búsqueda
  - Validar unicidad del nombre

## Notas
- El plan se crea SIEMPRE en estado ACTIVO. Si ya hay uno, el anterior pasa a HISTORICO.
- El nutricionista puede crear un plan sin haber tenido consulta previa con el socio, pero debe haber tenido al menos un turno (RB13).
- El plan NO tiene fecha de fin por defecto. Se considera activo hasta que se cree uno nuevo o se elimine.
- **Solución MySQL para UNIQUE parcial** (un plan activo por socio): usar `UNIQUE(socio_id, nutricionista_gimnasio_id, fecha_fin)` con la convención de que `fecha_fin IS NULL` significa activo. Esto efectivamente enforce "un plan activo por socio por nutricionista".
- La creación on-the-fly de alimentos es fluida desde el modal de creación de planes (UX crítica).
