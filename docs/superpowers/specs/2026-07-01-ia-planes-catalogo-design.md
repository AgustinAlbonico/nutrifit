# Diseño: IA de Planes de Alimentación integrada al Catálogo de Alimentos

**Fecha:** 2026-07-01
**Fase:** 1 de 2 (plan-semanal primero; ideas-comida en Fase 2)
**Estado:** Aprobado por el usuario

---

## 1. Problema

El sistema tiene dos pipelines de IA para generar comidas:

- **Pipeline A — Plan semanal** (`POST /ia/plan-semanal` → `GenerarPlanSemanalUseCase`): **desconectado del catálogo**. El prompt pide `alimentoId: 0` como placeholder y el LLM inventa IDs arbitrarios. Los `alimentoId` que se persisten en `datos_json` son ficticios (no hay FK en JSON, la DB no los rechaza).
- **Pipeline B — Ideas por slot** (`POST /planes-alimentacion/:id/ideas-comida` → `GenerarIdeasComidaUseCase`): **catalog-aware**. Carga el catálogo, pasa los nombres al prompt, resuelve por matching de nombre. Pero **descarta** las ideas con alimentos desconocidos.

El catálogo de alimentos (412 alimentos seed) y el sistema de categorías (`GrupoAlimenticio`, M:N con alimentos) son invisibles para el Pipeline A y solo parcialmente aprovechados por el Pipeline B.

Además, el campo `preparacionId` en `ItemComidaSnapshot` nunca se setea desde la IA: las comidas generadas no se guardan como recetas reutilizables.

---

## 2. Objetivo

Unificar la IA con el catálogo de alimentos para que:

1. La IA genere comidas que referencien alimentos **reales** del catálogo.
2. Cuando la IA necesite un alimento que no existe, lo **cree silenciosamente** (sin badge ni revisión del nutricionista) con macros y categoría correctos.
3. Las comidas generadas con 2+ alimentos se guarden como `Preparacion` entities reutilizables (biblioteca de recetas del gimnasio).
4. Todo lo generado sea **editable** (cantidades, unidades, intercambiar alimentos).

---

## 3. Decisiones del usuario

| # | Decisión | Detalle |
|---|----------|---------|
| D1 | Creación de alimentos | Silenciosa. Sin badge, sin revisión. El dedup fuzzy fuerte evita duplicados. |
| D2 | Comidas como Preparacion | Sí. Las comidas con 2+ alimentos se guardan como `Preparacion` reutilizable. Las de 1 alimento quedan como snapshot. |
| D3 | Categorías | Solo etiquetado. La IA asigna la categoría correcta al crear alimentos nuevos. No filtra qué alimento va en qué tipo de comida. La tabla hardcodeada `GUIA_ALIMENTOS_POR_TIPO_COMIDA` se mantiene como está. |
| D4 | Alcance | Faseado. Fase 1: plan-semanal (generar + regenerar). Fase 2: ideas-comida. |
| D5 | Enfoque técnico | Approach A: resolución post-generación determinística. La IA devuelve nombres; un servicio determinístico resuelve a IDs y crea lo faltante. |
| D6 | Editabilidad | Todo lo que genera la IA es editable: cantidades, unidades, alimentos, macros. |

---

## 4. Arquitectura — Flujo nuevo (Fase 1: plan-semanal)

```
1. Prompt (pide alimentoNombre + alimentosNuevos, NO alimentoId)
2. Groq → JSON con nombres + declaración de alimentos nuevos
3. Validar estructura (días/comidas/alternativas)  [existente]
4. ★ ResolvedorCatalogoIA  ← NUEVO
   ├─ fuzzy-match nombres → alimentoId existente
   └─ crea Alimento nuevo (silencioso) con macros + categoría
5. ★ CreadorPreparacionesIA  ← NUEVO
   ├─ dedup por nombre fuzzy (gym-scoped)
   └─ crea Preparacion + items para comidas de 2+ alimentos
6. Validar restricciones (ahora con datos reales + categorías)  [existente]
7. Validar macros  [existente]
8. Persistir datos_json (con alimentoIds reales + preparacionIds)  [existente]
```

Los pasos 4 y 5 se insertan entre la validación de estructura (3) y la validación de restricciones (6). La validación de restricciones se beneficia: ahora tiene acceso a los alimentos reales y sus categorías.

### 4.1 Ubicación de componentes (Clean Architecture)

| Componente | Capa | Ruta propuesta | Responsabilidad |
|-----------|------|----------------|-----------------|
| `ResolvedorCatalogoIA` | application | `application/ia/services/resolvedor-catalogo-ia.service.ts` | Matching fuzzy + auto-create de alimentos. Puro, testeable. |
| `CreadorPreparacionesIA` | application | `application/ia/services/creador-preparaciones-ia.service.ts` | Dedup + create de Preparaciones. Gym-scoped. |
| `PromptPlanSemanalBuilder` | application | `application/ai/builders/prompt-plan-semanal.builder.ts` (existente, modificar) | Nuevo schema (names + alimentosNuevos, no IDs). |
| `PromptRegeneracionBuilder` | application | `application/ai/builders/prompt-regeneracion.builder.ts` (existente, modificar) | Mismo cambio de schema para regeneración. |
| `GenerarPlanSemanalUseCase` | application | `application/ai/use-cases/generar-plan-semanal.use-case.ts` (existente, modificar) | Orquesta: llama resolver+creator entre step 3 y 6. |
| `RegenerarPlanSemanalUseCase` | application | `application/ai/use-cases/regenerar-plan-semanal.use-case.ts` (existente, modificar) | Mismo orquestación. |
| Util shared | application | `application/ia/services/util-matching-ia.ts` | `normalizarTexto` + `obtenerClavesBusquedaAlimento` extraídos de Pipeline B para reutilizar. |

**Nota de carpetas:** el proyecto tiene `application/ai/` y `application/ia/` duplicados. Los servicios nuevos van en `application/ia/services/` (junto a `prompt-ideas-comida.builder.ts`). Los builders existentes de plan-semanal viven en `application/ai/builders/`. No se reorganiza la estructura de carpetas en esta fase — se documenta el smell para una refactor futura.

---

## 5. Componente: ResolvedorCatalogoIA

### 5.1 Input / Output

**Input:**
- `nombresUsados: string[]` — todos los `alimentoNombre` extraídos de las alternativas del plan.
- `alimentosNuevos: AlimentoNuevoDto[]` — array del output de la IA con macros + categoría.
- `catalogoExistente: { idAlimento, nombre }[]` — alimentos de la base.
- `categoriasExistentes: { idGrupoAlimenticio, descripcion }[]` — las 26 categorías.

**Output:**
- `Map<string, number>` — `alimentoNombre → alimentoId` (todos resueltos a IDs reales).
- `creados: { nombre, idAlimento, categoria }[]` — para observabilidad/log.

### 5.2 Algoritmo de matching (3 niveles, en orden)

Para cada `alimentoNombre`:

1. **EXACTO normalizado**
   - `normalizarTexto()` + singularizar + strip acentos (NFD).
   - "Papas" → "papa" == "Papa" → match → usar ID existente.

2. **FUZZY (si no hay exacto)**
   - Token-overlap (Dice coefficient) sobre palabras + score de similitud.
   - Umbral ≥ 0.85.
   - "Pechuga de pollo" vs "Pechuga pollo" → 1.0 → match.
   - "Pan integral" vs "Pan blanco" → 0.33 → no match (correcto).

3. **NO MATCH → crear nuevo**
   - Buscar en `alimentosNuevos[]` del output de la IA.
   - Si está declarado → crear `Alimento` con sus macros + categoría.
   - Si NO está declarado → lanzar error de validación que dispara reintento con prompt correctivo.

### 5.3 Reutilización de utilidades

`normalizarTexto` y `obtenerClavesBusquedaAlimento` (sinónimos) ya existen en el código de Pipeline B. Se extraen a `application/ia/services/util-matching-ia.ts` para que ambos pipelines los compartan.

### 5.4 Auto-create del Alimento

| Campo | Valor |
|-------|-------|
| `nombre` | El que dio la IA (capitalizado: primera letra mayúscula). |
| `cantidad` | `cantidadBase` del `alimentosNuevos` (default 100). |
| `unidadMedida` | `unidadBase` del `alimentosNuevos` (default "g"). |
| `calorias` / `proteinas` / `carbohidratos` / `grasas` | Per base portion, del `alimentosNuevos`. |
| `grupos` | Match fuzzy de `categoriaNombre` contra las 26 existentes → link a la relación M:N. |

### 5.5 Match fuzzy ambiguo

Si un nombre matchea 2+ alimentos al mismo score (≥ 0.85):
- Tomar el de mayor score; en empate, el primero alfabéticamente.
- Log de warning para observabilidad.

### 5.6 Categoría inexistente

Si la IA elige un `categoriaNombre` que no existe:
- Fuzzy match contra las 26 categorías.
- Si hay match razonable (≥ 0.7) → asignar.
- Si no → asignar a la categoría más cercana + log de warning. No frena la generación.

---

## 6. Componente: CreadorPreparacionesIA

### 6.1 Cuándo crea

- Alternativas con **2+ alimentos** (ya resueltos a IDs por el resolvedor) Y un nombre descriptivo.
- Alternativas con 1 alimento → solo snapshot, no se crea `Preparacion`.

### 6.2 Dedup (gym-scoped)

Antes de crear:
- Buscar si ya existe una `Preparacion` con nombre normalizado igual o fuzzy ≥ 0.85 en el mismo gimnasio.
- Si match → **reutilizar** el `preparacionId` existente (no crear duplicado).
- Si no → crear nueva.

### 6.3 Al crear

| Campo | Valor |
|-------|-------|
| `nombre` | El que dio la IA (ej: "Pollo al horno con papas"). |
| `gimnasioId` | El gimnasio del nutricionista que disparó la generación. |
| `creadoPorId` | El nutricionista. |
| `items[]` | Un `PreparacionItem` por alimento: `alimentoId` (real), `cantidadDefault` (cantidad de la comida), `unidadDefault` (unidad de la comida). |

### 6.4 Resultado en el plan

- La alternativa queda con `preparacionId` seteado + los alimentos referenciados con `alimentoId` real.
- La `Preparacion` aparece en el buscador de preparaciones para futuros planes.

---

## 7. Schema nuevo de la IA

### 7.1 Output de la IA (lo que devuelve ahora)

```json
{
  "estructura": [
    {
      "dia": "LUNES",
      "comidas": [
        {
          "tipo": "ALMUERZO",
          "alternativas": [
            {
              "nombre": "Pollo al horno con papas",
              "alimentos": [
                { "alimentoNombre": "Pechuga de pollo", "cantidad": 200, "unidad": "g" },
                { "alimentoNombre": "Papa", "cantidad": 150, "unidad": "g" }
              ],
              "calorias": 450,
              "proteinas": 45,
              "carbohidratos": 30,
              "grasas": 15
            }
          ]
        }
      ]
    }
  ],
  "alimentosNuevos": [
    {
      "nombre": "Papa",
      "categoriaNombre": "Verduras, hortalizas y tubérculos",
      "cantidadBase": 100,
      "unidadBase": "g",
      "calorias": 77,
      "proteinas": 2,
      "carbohidratos": 17,
      "grasas": 0.1
    }
  ],
  "macrosPorDia": { "LUNES": { "calorias": 0, "proteinas": 0, "carbohidratos": 0, "grasas": 0 } },
  "razonamientoCumplimiento": {
    "restriccionesCumplidas": [],
    "restriccionesNoCumplidas": []
  }
}
```

### 7.2 Cambios vs schema actual

- `alimentoId: 0` → `alimentoNombre: "Papa"` (la IA usa nombres, no IDs).
- `alimentosNuevos[]`: array top-level que declara cada alimento nuevo con macros + categoría.
- Los macros agregados por alternativa (calorias/proteinas/carbohidratos/grasas) se mantienen.
- La IA recibe la lista de 26 categorías (`categoriaNombre` válido) en el prompt.

### 7.3 Prompt

El `PromptPlanSemanalBuilder` y `PromptRegeneracionBuilder` se modifican para:
- Pedir `alimentoNombre` en vez de `alimentoId`.
- Incluir la lista de 26 `GrupoAlimenticio` para que la IA elija `categoriaNombre` válido.
- Documentar el array `alimentosNuevos[]` con su schema.
- Mantener las reglas duras existentes (alergias, restricciones, estructura).

---

## 8. Orquestación en el use-case

`GenerarPlanSemanalUseCase.execute()` y `RegenerarPlanSemanalUseCase.execute()` se modifican:

1. Tras recibir el JSON de Groq y validar estructura (existente).
2. **Inyectar resolvedor:**
   - Extraer todos los `alimentoNombre` del plan.
   - Cargar catálogo (`alimentoRepo.find`) + categorías (`grupoAlimenticioRepo.find`).
   - Llamar `resolvedorCatalogoIA.resolver(nombresUsados, alimentosNuevos, catalogo, categorias)`.
   - Si lanza error (alimento no declarado) → dispara reintento con prompt correctivo (igual que `RestriccionesValidatorV2`).
3. **Reescribir el snapshot** reemplazando cada `alimentoNombre` por el `alimentoId` real del mapa.
4. **Inyectar creador:**
   - Para cada alternativa con 2+ alimentos → llamar `creadorPreparacionesIA.obtenerOCrear(alternativa, gimnasioId, nutricionistaId)`.
   - Setear `preparacionId` en el snapshot.
5. Continuar con validación de restricciones (existente) + macros (existente) + persistir (existente).

### 8.1 Presupuesto de reintentos

La resolución de catálogo agrega un punto de validación nuevo. Si falla (alimento no declarado), dispara reintento con instrucción correctiva que encaja en el mismo loop de reintentos que ya existe (estructura, restricciones). Mismo tope de reintentos (`MAX_REINTENTOS_*`).

---

## 9. Casos borde

| Caso | Comportamiento |
|------|----------------|
| La IA nombra un alimento que no existe Y no lo declara en `alimentosNuevos` | Error → reintento con prompt correctivo. Tras N reintentos, el plan falla con error claro. |
| La IA declara un alimento en `alimentosNuevos` que YA existe en catálogo | El resolvedor matchea primero → usa el existente, ignora la declaración. No crea duplicado. |
| La IA declara un alimento nuevo pero no lo usa en ninguna comida | Se descarta la declaración. No se crea alimento huérfano. |
| Match fuzzy ambiguo (un nombre matchea 2 alimentos) | Se toma el de mayor score + log de warning. |
| La categoría elegida por la IA no existe | Fuzzy match → si no hay match, asigna la más cercana + log. No frena. |
| La IA genera una comida idéntica a una Preparacion existente | El creador detecta el duplicado (fuzzy de nombre, gym-scoped) → reutiliza `preparacionId`. |
| Macros inconsistentes entre alimento y plato | Se tolera. El plan usa los macros del plato (nivel alternativa); los del alimento alimentan el catálogo. |

---

## 10. Editabilidad (D6)

Todo lo generado por la IA es editable vía el `DialogEditarAlternativa` existente:
- Modificar cantidades y unidades.
- Intercambiar alimentos (buscador con catálogo).
- Ajustar macros.
- Al guardar, los `alimentoId` son reales → los macros se recalculan correctamente al cambiar cantidades.

No se requiere nuevo componente frontend en Fase 1 — el flujo existente ya soporta edición. La diferencia clave es que ahora los `alimentoId` son reales, no inventados.

---

## 11. Fuera de alcance (Fase 1)

- ❌ Pipeline B (ideas-comida) — se abordará en Fase 2 reutilizando `ResolvedorCatalogoIA` y `CreadorPreparacionesIA`.
- ❌ Eliminar el endpoint legacy `/ia/ideas-comida` (`application/ai/use-cases/generar-ideas-comida.use-case.ts`).
- ❌ Reorganizar carpetas `ai/` vs `ia/`.
- ❌ Macros objetivo dinámicos (Harris-Benedict) — sigue hardcodeado 2000 kcal.
- ❌ Filtrado de alimentos por tipo de comida basado en categorías (la tabla `GUIA_ALIMENTOS_POR_TIPO_COMIDA` se mantiene).
- ❌ Badge/revisión de alimentos creados (silent mode).

---

## 12. Testing

- `ResolvedorCatalogoIA`: tests unitarios con catálogo mock — casos exacto, fuzzy, no-match-create, no-match-error, ambiguo.
- `CreadorPreparacionesIA`: tests unitarios — creación, dedup fuzzy, reutilización.
- `util-matching-ia`: tests de `normalizarTexto` y matching.
- `GenerarPlanSemanalUseCase`: test de integración que valida que los `alimentoId` del snapshot persistido son reales.

---

## 13. Archivos afectados (Fase 1)

### Nuevos
- `application/ia/services/resolvedor-catalogo-ia.service.ts`
- `application/ia/services/creador-preparaciones-ia.service.ts`
- `application/ia/services/util-matching-ia.ts`
- Tests correspondientes en `__tests__/` junto a cada servicio.

### Modificados
- `application/ai/builders/prompt-plan-semanal.builder.ts` — schema (names + alimentosNuevos).
- `application/ai/builders/prompt-regeneracion.builder.ts` — mismo schema.
- `application/ai/use-cases/generar-plan-semanal.use-case.ts` — orquestación resolvedor + creador.
- `application/ai/use-cases/regenerar-plan-semanal.use-case.ts` — mismo.
- `application/ai/ai.module.ts` — registrar servicios nuevos.
