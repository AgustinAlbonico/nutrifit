# Spec: Validación dura de restricciones alimentarias (RF-005)

**Spec ID**: validacion-restricciones
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-005
**Related docs**: proposal.md sección 4 (RF-005)

---

## Requisito (Requirement)

Antes de devolver un plan generado por IA, el sistema MUST validar que ningún alimento propuesto esté en la lista de restricciones/alergias declaradas del socio. Si se detecta una violación, el sistema MUST regenerar el plan con instrucción correctiva (max 2 reintentos). Si tras los reintentos la violación persiste, el sistema MUST devolver el plan con warning visible al nutricionista detallando qué restricción no se cumplió y en qué comida.

**Fuentes de restricciones (TODAS MUST validarse):**
1. **Alergias declaradas** — tabla `ficha_salud_alergias`.
2. **Intolerancias** — campo `ficha_salud.restricciones_alimentarias` (CSV) + matching con `RestriccionesValidator.generarIncidencias`.
3. **Patologías con restricciones derivadas** — tabla `ficha_salud_patologias`, mapeo:
   - `DIABETES` →禁止 azúcar refinada, harina blanca, bebidas azucaradas.
   - `HIPERTENSION` →禁止 sodio > 2300 mg/día.
   - `CELIAQUIA` →禁止 gluten (trigo, avena, cebada, centeno).
   - `INSUFICIENCIA_RENAL` →禁止 exceso de proteínas, potasio, fósforo.
4. **Patrones dietarios declarados** — campo `ficha_salud.patron_dietario`:
   - `VEGANO` →禁止 carne, pescado, lácteos, huevos, miel.
   - `VEGETARIANO` →禁止 carne, pescado.
   - `PESCETARIANO` →禁止 carne (roja y blanca).
   - `SIN_GLUTEN` →禁止 gluten.
   - `SIN_LACTOSA` →禁止 lácteos.
   - `KOSHER` / `HALAL` →禁止 cerdo, derivados según corresponda.

**Comportamiento MUST:**
1. Parsear el plan JSON.
2. Extraer todos los alimentos de todas las comidas y alternativas (todas las iteraciones).
3. Cruzar contra las 4 fuentes anteriores.
4. Si hay match → regenerar con instrucción correctiva (max 2 reintentos).
5. Si tras 2 reintentos hay conflicto → devolver plan con warning + detalle explícito de qué restricción no se cumplió y en qué comida (nombre comida + nombre alternativa).
6. El validador MUST ser case-insensitive y tolerar singular/plural ("leche" y "leches").
7. `RestriccionesValidatorV2` MUST extender/reusar `RestriccionesValidator` existente (no duplicar lógica).

---

## Contexto / Estado actual

`RestriccionesValidator` existe en `apps/backend/src/domain/validators/restricciones-validator.ts` con lógica de matching básica (CSV de `restricciones_alimentarias`). No existe validación del PLAN completo post-generación, no hay reintentos, no hay matching con patologías ni patrones dietarios. Este spec MUST crear `RestriccionesValidatorV2` que extiende el existente y agrega estas capacidades.

---

## Escenarios (Given / When / Then)

### Escenario 1: Plan vegano cumple restricción
- **Dado** un socio con patrón dietario `VEGANO`.
- **Cuando** la IA genera plan con lentejas, quinoa, garbanzos, almendras.
- **Entonces** el sistema MUST detectar 0 violaciones.
- **Y** MUST devolver `validacion.restriccionesCumplidas` con `[{restriccion: "vegano", detalle: "..."}]`.

### Escenario 2: Violación detectada y corregida en reintento
- **Dado** un socio con alergia a "frutos secos".
- **Cuando** la primera generación incluye almendras en desayuno del lunes.
- **Entonces** el sistema MUST detectar la violación vía matching case-insensitive de "almendra" vs lista de "frutos secos".
- **Y** MUST regenerar con instrucción correctiva: "EXCLUIR frutos secos (almendras, nueces, avellanas, maní, castañas, piñones). Generar alternativas con semillas (chia, lino, girasol) o frutas".
- **Y** en el segundo intento la IA MUST sustituir almendras por semillas de chia.
- **Y** MUST devolver 201 con 0 restricciones no cumplidas.

### Escenario 3: Violación persistente tras 2 reintentos (warning)
- **Dado** un socio con multi-restricción: vegano + alergia soja + intolerancia lactosa + diabético.
- **Cuando** la IA genera un plan que en el 3er intento todavía incluye tofu (soja) en almuerzo del miércoles.
- **Entonces** el sistema MUST devolver 201 con `validacion.restriccionesNoCumplidas` poblado:
  ```
  [{restriccion: "alergia_soja", detalle: "Comida: ALMUERZO MIERCOLES alternativa 1 incluye tofu (soja)"}]
  ```
- **Y** MUST incluir en `validacion.advertencias`: "⚠️ El plan no cumple el 100% de las restricciones. Revisar manualmente o regenerar".
- **Y** SHOULD registrar `NotificacionesService.emitir(PLAN_VALIDACION_WARNING)`.
- **Y** MUST persistir el plan igual (no rechaza la creación — nutricionista decide qué hacer).

### Escenario 4: Tolerancia a singular/plural
- **Dado** un socio con intolerancia a lactosa.
- **Y** el catálogo de alimentos tiene "leche" y "leches" como nombres distintos.
- **Cuando** la IA usa "leches" en una alternativa.
- **Entonces** el validador MUST matchear "leches" contra "leche" (normalización a singular) y reportar la violación correctamente.

### Escenario 5: Alimento no encontrado en catálogo
- **Dado** que la IA propone "quinoa inflada con arándanos" como alimento.
- **Y** "quinoa inflada" no existe en la tabla `alimento`.
- **Cuando** el validador intenta cruzar.
- **Entonces** MUST registrar warning "alimento_no_en_catalogo: quinoa inflada" en `validacion.advertencias`.
- **Y** MUST NO fallar la validación por esto (sigue intentando con los demás alimentos).

---

## Modelo de datos

`RestriccionesValidatorV2` (NUEVO en `apps/backend/src/domain/validators/restricciones-validator-v2.ts`):

```typescript
export interface ResultadoValidacionRestricciones {
  restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
  restriccionesNoCumplidas: Array<{
    restriccion: string;
    detalle: string;
    comida?: string;      // ej: "ALMUERZO MIERCOLES"
    alternativa?: number; // índice 0-based
    alimento?: string;
  }>;
  advertencias: string[];
}

export class RestriccionesValidatorV2 extends RestriccionesValidator {
  validarPlanCompleto(
    plan: PlanGeneradoIA,
    fichaClinica: FichaClinica,
    catalogos: CatalogosRestricciones
  ): ResultadoValidacionRestricciones;

  generarInstruccionCorrectiva(
    violaciones: ViolacionRestriccion[]
  ): string;
}
```

`CatalogosRestricciones` (inyectado al use-case):
```typescript
{
  patronesDietarios: Map<string, string[]>;  // "vegano" → ["pollo", "carne", "leche", ...]
  patologias: Map<string, string[]>;        // "diabetes" → ["azucar", "harina_blanca", ...]
  sinonimos: Map<string, string[]>;         // "frutos_secos" → ["almendra", "nuez", ...]
}
```

---

## Endpoints / contratos

Este spec NO introduce endpoints nuevos. Su resultado es consumido por `POST /ia/plan-semanal` (ver spec `ia-generacion.md`) y `POST /ia/plan-semanal/regenerar` (ver spec `regeneracion-scope.md`).

---

## Tests requeridos

### Unit (backend)
- `RestriccionesValidatorV2.validarPlanCompleto()`:
  - Caso vegano: asertar 0 violaciones con plan que solo tiene vegetales, legumbres, cereales sin gluten.
  - Caso alergia frutos secos: asertar detección de "almendra" en plan y reporte correcto.
  - Caso multi-restricción: asertar detección simultánea de 2+ violaciones.
  - Caso case-insensitive: asertar match con "LECHE" mayúsculas.
  - Caso singular/plural: asertar match "leches" vs "leche" mediante normalización.
  - Caso alimento no en catálogo: asertar warning sin crash.
- `RestriccionesValidatorV2.generarInstruccionCorrectiva()`:
  - Asertar que la instrucción incluye el nombre de la restricción violada y ejemplos concretos de exclusión.

### Tests de validación de IA (con fixtures)
- Fixture socio vegano estricto → asertar 0% alimentos prohibidos en 50 generaciones consecutivas.
- Fixture socio diabético → asertar 0% azúcar refinada.
- Fixture socio celíaco → asertar 0% gluten.
- Fixture socio multi-restricción → asertar cobertura 100% de las 4 restricciones tras 2 reintentos.

---

## Out of scope

- Modificación del catálogo de alimentos (ya existe en `apps/backend/src/application/alimento/`).
- Cambio en `ficha_salud` para soportar nuevos campos (no se agrega nada a ficha salud en este feature).
- Embeddings o matching semántico (matching por keywords simple).
- UI de revisión de restricciones (eso es frontend en spec de PlanEditorPage).

---

## Acceptance criteria

- [ ] `RestriccionesValidatorV2` MUST extender `RestriccionesValidator` (no duplicar lógica de matching CSV).
- [ ] Validador MUST cruzar contra: alergias, intolerancias, patologías (con mapeo), patrones dietarios.
- [ ] Matching MUST ser case-insensitive y tolerar singular/plural.
- [ ] Si hay violación → MUST regenerar con instrucción correctiva (max 2 reintentos).
- [ ] Si tras 2 reintentos la violación persiste → MUST devolver plan con `restriccionesNoCumplidas` poblado + warning + notificación.
- [ ] MUST NO rechazar la creación del plan (siempre persiste).
- [ ] Alimento no encontrado en catálogo MUST generar warning sin romper la validación.
- [ ] Catálogo de patrones dietarios MUST estar en código (no en BD) — lista cerrada de alimentos excluidos.