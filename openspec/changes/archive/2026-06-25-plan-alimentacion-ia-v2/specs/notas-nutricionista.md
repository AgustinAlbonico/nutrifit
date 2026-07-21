# Spec: Notas del nutricionista (2 niveles) (RF-002)

**Spec ID**: notas-nutricionista
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-002
**Related docs**: proposal.md sección 4 (RF-002)

---

## Requisito (Requirement)

El nutricionista MUST poder proveer directrices adicionales para la IA. Hay dos niveles:

1. **Notas persistentes** (privadas, viven en su perfil profesional): string libre, max 2000 chars, campo `nutricionista.preferencias_ia`. Aplican a TODAS las futuras generaciones del NUT.
2. **Notas por generación** (viven con el plan específico): string libre, max 1000 chars, campo `plan_alimentacion.notas_generacion`. Aplican SOLO a esa generación.

La IA MUST tratar las notas como **preferencias blandas** (a diferencia de las restricciones duras del socio, que son inquebrantables).

**Comportamiento MUST:**
1. El NUT edita sus notas persistentes desde `GET /profesional/mi-perfil/preferencias-ia` y `PUT /profesional/mi-perfil/preferencias-ia`.
2. En el formulario de generación, se muestra un campo adicional de notas que se concatenan a las persistentes al construir el prompt.
3. Las notas de generación se persisten con el plan (auditoría: qué notas se usaron para cada versión).
4. Al editar las notas persistentes, NO se regeneran planes ya generados — solo aplican a futuras generaciones.
5. Las notas MUST sanitizarse al guardar:
   - Trim de espacios al inicio/fin.
   - Collapse de saltos de línea múltiples (\n\n\n+ → \n\n).
   - NO se permiten tags HTML, scripts ni markdown inyectable (se almacena como texto plano).
6. Validación: max 2000 chars para persistentes, max 1000 chars para generación.

---

## Contexto / Estado actual

Existe campo `nutricionista.presentacion` (público, se muestra en la landing). No existe campo `preferencias_ia`. No existe `plan_alimentacion.notas_generacion`. Este spec MUST agregar ambos.

---

## Escenarios (Given / When / Then)

### Escenario 1: NUT edita notas persistentes
- **Dado** un NUT autenticado.
- **Cuando** ejecuta `PUT /profesional/mi-perfil/preferencias-ia { preferencias: "Soy deportóloga. Priorizar proteínas de alto valor biológico..." }`.
- **Entonces** MUST sanitizarse el input (trim + collapse + quitar HTML/scripts).
- **Entonces** MUST validarse max 2000 chars (si excede → 400).
- **Y** MUST persistirse en `nutricionista_orm.preferencias_ia`.
- **Y** MUST devolver 200 con el texto sanitizado.

### Escenario 2: NUT consulta sus notas persistentes
- **Dado** un NUT con notas guardadas.
- **Cuando** ejecuta `GET /profesional/mi-perfil/preferencias-ia`.
- **Entonces** MUST devolver `{ preferencias: "..." }` con el texto actual.

### Escenario 3: Notas por generación se concatenan con persistentes en el prompt
- **Dado** un NUT con persistentes "Priorizar fibra, evitar ultraprocesados".
- **Y** un plan con `notasGeneracion: "Semana de transición, sin gluten"`.
- **Cuando** se construye el prompt para generar el plan.
- **Entonces** el prompt MUST incluir una sección:
  ```
  DIRECTRICES DEL NUTRICIONISTA (preferencias blandas):
  - Persistentes: Priorizar fibra, evitar ultraprocesados.
  - Para esta generación: Semana de transición, sin gluten.
  ```
- **Y** las directrices se tratan como preferencias, no como restricciones duras.

### Escenario 4: NUT edita notas persistentes, planes existentes NO se regeneran
- **Dado** un NUT con 3 planes ya generados (v1 cada uno).
- **Cuando** edita sus notas persistentes.
- **Entonces** MUST NO dispararse regeneración automática de los 3 planes.
- **Y** las nuevas notas aplican SOLO a futuras generaciones (a partir del próximo POST /ia/plan-semanal).

### Escenario 5: Validación de longitud
- **Dado** un NUT que intenta guardar 2001 caracteres.
- **Cuando** ejecuta `PUT` con ese texto.
- **Entonces** MUST devolver 400 con código `PREFERENCIAS_EXCEDEN_MAXIMO` y mensaje "Las preferencias no pueden superar 2000 caracteres".

### Escenario 6: Sanitización de HTML/scripts
- **Dado** un NUT que intenta guardar `<script>alert('xss')</script>Pollo`.
- **Cuando** ejecuta `PUT`.
- **Entonces** MUST quitarse `<script>alert('xss')</script>` antes de persistir.
- **Y** el texto guardado debe ser `Pollo`.

---

## Modelo de datos

Modificación a tabla `nutricionista_orm`:

| Columna | Tipo | Constraints |
|---|---|---|
| `preferencias_ia` | TEXT | NULL |

Modificación a tabla `plan_alimentacion`:

| Columna | Tipo | Constraints |
|---|---|---|
| `notas_generacion` | VARCHAR(1000) | NULL |

---

## Endpoints / contratos

### `GET /profesional/mi-perfil/preferencias-ia`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción implícita (lectura de perfil propio).

**Response 200:**
```typescript
{
  preferencias: string  // texto actual o '' si nunca se editó
}
```

### `PUT /profesional/mi-perfil/preferencias-ia`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_MEMORIA_EDITAR` (reusada para edición de IA).

**Request body:**
```typescript
{
  preferencias: string  // max 2000 chars
}
```

**Response 200:**
```typescript
{
  preferencias: string  // texto sanitizado persistido
}
```

**Códigos de error:**
- 400 si excede 2000 chars.
- 400 si tras sanitización queda vacío y se exige al menos 1 char (MAY).

---

## Tests requeridos

### Unit (backend)
- `ObtenerPreferenciasIaUseCase`: verificar lectura y retorno de string vacío si null.
- `ActualizarPreferenciasIaUseCase`:
  - Caso happy path: trim + collapse + guardar.
  - Caso > 2000 chars: throw `BadRequestError`.
  - Caso con HTML/scripts: sanitización.
- `SanitizadorTextoPlano` (helper): cubrir XSS, saltos de línea múltiples, espacios extremos.

### Integration (backend)
- PUT preferencias → SELECT verifica que se persistió.
- PUT con 2001 chars → 400.
- PUT con `<script>` → texto guardado sin script.

---

## Out of scope

- Editor rich text (Markdown/HTML) — texto plano fijo.
- Historial de versiones de las notas (solo se guarda la última versión).
- Notas por socio (las notas persistentes aplican a todos los socios del NUT).
- Compartir notas entre NUTs del mismo gimnasio.

---

## Acceptance criteria

- [ ] Campo `nutricionista.preferencias_ia` (TEXT NULL) MUST agregarse.
- [ ] Campo `plan_alimentacion.notas_generacion` (VARCHAR 1000 NULL) MUST agregarse.
- [ ] Endpoints GET/PUT `/profesional/mi-perfil/preferencias-ia` MUST existir.
- [ ] Validación MUST rechazar > 2000 chars con 400.
- [ ] Sanitización MUST quitar HTML/scripts antes de persistir.
- [ ] Trim + collapse de saltos de línea múltiples MUST aplicarse.
- [ ] Las notas MUST concatenarse en el prompt al generar plan.
- [ ] Las notas MUST tratarse como preferencias blandas (no restricciones duras).
- [ ] Edición de notas MUST NO regenerar planes existentes.
- [ ] Auditoría MUST registrarse (`PREFERENCIAS_IA_EDITADAS`).