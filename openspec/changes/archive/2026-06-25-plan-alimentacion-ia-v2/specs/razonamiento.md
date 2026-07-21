# Spec: Razonamiento de cumplimiento de restricciones (RF-008)

**Spec ID**: razonamiento
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-008
**Related docs**: proposal.md sección 4 (RF-008)

---

## Requisito (Requirement)

Por cada plan generado, la IA MUST exponer un "razonamiento de cumplimiento" que muestra por qué el plan cumple (o no) las restricciones del socio. El razonamiento se persiste en el plan y se muestra en una sección colapsable del frontend.

**Estructura del razonamiento (parte del JSON devuelto por la IA):**

```typescript
{
  razonamientoCumplimiento: {
    restriccionesCumplidas: Array<{
      restriccion: string,        // ej: "vegano"
      estado: '✓',
      detalle: string             // ej: "Ninguna comida incluye carne, lácteos ni huevos."
    }>,
    restriccionesNoCumplidas: Array<{
      restriccion: string,
      estado: '✗',
      detalle: string,            // ej: "Incluye almendras (frutos secos) en DESAYUNO LUNES alternativa 1"
      comida?: string             // opcional: nombre de la comida donde se incumplió
    }>
  }
}
```

**Comportamiento MUST:**
1. La IA MUST incluir `razonamientoCumplimiento` en su JSON de respuesta.
2. El validador (`RestriccionesValidatorV2`) MUST cross-checkear las afirmaciones del razonamiento contra la validación real — si la IA dice "vegano cumplido" pero hay carne, MUST descartarse el razonamiento y regenerarse.
3. El razonamiento se persiste dentro de `plan_alimentacion_version.datos_json.razonamientoCumplimiento`.
4. El frontend MUST mostrarlo en una sección colapsable.
5. Si la validación no fue 100%, MUST incluirse también qué restricción no se cumplió y por qué (la IA explica el fallo en lenguaje natural).

---

## Contexto / Estado actual

La IA actual emite el campo `razonamiento_cumplimiento` (snake_case) en su JSON, pero no se cross-checkea ni se valida. Se guarda como parte de `datos_json` pero no se trata con un campo específico en el response. Este spec MUST formalizar el cross-check y la estructura de respuesta.

---

## Escenarios (Given / When / Then)

### Escenario 1: Razonamiento coherente con validación real
- **Dado** un plan generado para socio vegano donde la IA afirma: "vegano cumplido — Ninguna comida incluye carne, lácteos ni huevos".
- **Y** la validación real confirma 0 violaciones.
- **Cuando** el sistema procesa la respuesta.
- **Entonces** MUST aceptar el razonamiento tal cual.
- **Y** MUST persistirlo en `datos_json.razonamientoCumplimiento.restriccionesCumplidas`.

### Escenario 2: Razonamiento incoherente con validación real
- **Dado** un plan donde la IA afirma: "sin gluten cumplido".
- **Y** la validación real detecta trigo en una comida.
- **Cuando** el sistema procesa la respuesta.
- **Entonces** MUST descartar la afirmación "sin gluten cumplido".
- **Y** MUST regenerar el plan con instrucción correctiva: "Tu razonamiento dice sin_gluten cumplido pero hay trigo. Regenerá excluyendo trigo/avena/cebada/centeno".

### Escenario 3: Razonamiento ausente
- **Dado** que la IA no incluye `razonamientoCumplimiento` en su respuesta.
- **Cuando** el sistema parsea el JSON.
- **Entonces** MUST descartar la generación y regenerar con instrucción: "Incluir campo razonamientoCumplimiento con restriccionesCumplidas (array) y restriccionesNoCumplidas (array)".

### Escenario 4: Razonamiento con estructura inválida
- **Dado** que la IA incluye `razonamientoCumplimiento` pero como string en vez de objeto.
- **Cuando** el sistema parsea.
- **Entonces** MUST descartar y regenerar con instrucción: "razonamientoCumplimiento debe ser objeto con restriccionesCumplidas y restriccionesNoCumplidas".

### Escenario 5: Frontend muestra razonamiento colapsable
- **Dado** un plan con razonamiento persistido.
- **Cuando** el NUT abre la vista del plan en el frontend.
- **Entonces** MUST haber un componente `<RazonamientoCumplimiento />` colapsable.
- **Y** al expandirlo MUST listar cada restricción con su estado (✓ o ✗) y detalle.
- **Y** si hay restricciones no cumplidas, MUST resaltarlas en rojo/amarillo.

---

## Modelo de datos

Persistencia en `plan_alimentacion_version.datos_json.razonamientoCumplimiento`:

```typescript
{
  // ... otros campos de datos_json ...
  razonamientoCumplimiento: {
    restriccionesCumplidas: [
      { restriccion: string, detalle: string }
    ],
    restriccionesNoCumplidas: [
      { restriccion: string, detalle: string, comida?: string }
    ]
  }
}
```

No se requiere tabla nueva. El campo es parte de `datos_json`.

Helper de cross-check (en `RestriccionesValidatorV2`):

```typescript
export interface ValidacionRazonamiento {
  coherente: boolean;
  contradicciones: Array<{
    restriccion: string,
    diceCumplida: boolean,
    realidadViolada: boolean,
    detalleViolacion: string
  }>;
}

export class RestriccionesValidatorV2 {
  static validarCoherenciaRazonamiento(
    razonamiento: RazonamientoCumplimiento,
    validacion: ResultadoValidacionRestricciones
  ): ValidacionRazonamiento;
}
```

---

## Endpoints / contratos

Este spec NO introduce endpoints nuevos. El razonamiento es parte del response de:
- `POST /ia/plan-semanal` (spec `ia-generacion.md`).
- `POST /ia/plan-semanal/regenerar` (spec `regeneracion-scope.md`).
- `GET /planes-alimentacion/version/:versionId` (spec `versionado.md`).

El response siempre incluye el campo `razonamientoCumplimiento` parseado y validado.

---

## Tests requeridos

### Unit (backend)
- `RestriccionesValidatorV2.validarCoherenciaRazonamiento()`:
  - Caso coherente: razonamiento dice vegano cumplido, validación confirma 0 violaciones → coherente=true.
  - Caso incoherente: razonamiento dice sin_gluten cumplido, validación detecta trigo → coherente=false, contradicciones poblado.
  - Caso razonamiento ausente → asertar que se marca como inválido.
- `PromptPlanSemanalBuilder`: verificar que instruye a la IA a incluir `razonamientoCumplimiento`.

### Integration (backend)
- POST `/ia/plan-semanal` con socio vegano → response incluye `razonamientoCumplimiento.restriccionesCumplidas` con "vegano".
- GET `/planes-alimentacion/version/:id` → response incluye `razonamientoCumplimiento` parseado.

### Frontend (Vitest + Testing Library)
- `<RazonamientoCumplimiento />`:
  - Renderiza con 3 restricciones cumplidas y 0 no cumplidas → muestra 3 ✓ en verde.
  - Renderiza con 1 no cumplida → muestra ✗ en rojo con detalle.
  - Click en header colapsa/expande el contenido.

---

## Out of scope

- Generación de razonamiento por el backend (la IA lo genera).
- Edición manual del razonamiento por el NUT (es lo que dijo la IA, punto).
- Razonamiento para MACROS (las macros tienen su propio indicador visual verde/amarillo/rojo).
- Razonamiento para preferencias del NUT (no aplica — solo restricciones del socio).

---

## Acceptance criteria

- [ ] Response de generación MUST incluir `razonamientoCumplimiento` con estructura `{restriccionesCumplidas, restriccionesNoCumplidas}`.
- [ ] Sistema MUST cross-checkear razonamiento contra validación real.
- [ ] Si razonamiento es incoherente (dice X cumplido pero X violado) → MUST regenerar.
- [ ] Si razonamiento ausente o estructura inválida → MUST regenerar con instrucción correctiva.
- [ ] Razonamiento MUST persistirse en `datos_json.razonamientoCumplimiento`.
- [ ] Frontend MUST tener `<RazonamientoCumplimiento />` colapsable.
- [ ] Restricciones no cumplidas MUST resaltarse visualmente.