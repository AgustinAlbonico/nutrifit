# Spec: Memoria de feedback por nutricionista (RF-004)

**Spec ID**: memoria-ia
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-004
**Related docs**: proposal.md sección 4 (RF-004)

---

## Requisito (Requirement)

El sistema MUST mantener un "perfil de preferencias aprendidas" por nutricionista, construido a partir de votos 👍/👎 con comentarios. Este perfil se inyecta automáticamente en futuros prompts de generación.

**Datos de cada entrada de memoria:**
- `nutricionistaId` (int, FK, obligatorio).
- `tipoEjemplo` (enum: `POSITIVO` | `NEGATIVO`).
- `comentario` (string, max 500 chars).
- `planAlimentacionVersionId` (FK opcional, referencia al plan que originó el ejemplo).
- `archivada` (boolean, default false).

**Comportamiento MUST:**
1. Al guardar un feedback con comentario (RF-003), el sistema MUST crear una entrada en `nutricionista_ia_memoria`.
2. Antes de generar un plan, el backend MUST seleccionar 1-3 ejemplos relevantes para el socio/objetivo actual:
   - **Selección adaptativa**:
     - Si hay ≥3 ejemplos activos del NUT → tomar los 3 más relevantes por matching de keywords.
     - Si hay 1-2 → tomar todos.
     - Si hay 0 → omitir la sección del prompt.
   - **Algoritmo de matching**: scoring por keywords (palabras del comentario vs palabras del objetivo del socio + tipo_ejemplo).
   - **Positivos primero**: si hay ≥1 POSITIVO, se prefieren POSITIVOS.
3. El NUT MUST poder ver su memoria desde `GET /nutricionistai/memoria` y eliminar entradas desde `DELETE /nutricionistai/memoria/:id`.
4. La memoria MUST rotar con FIFO: al llegar a 100 entradas activas por nutricionista, la entrada más vieja MUST marcarse como `archivada=true` y NO inyectarse.
5. `SeleccionarEjemplosMemoriaUseCase` MUST ser lógica pura testeable.

---

## Contexto / Estado actual

No existe sistema de memoria IA. No existe tabla `nutricionista_ia_memoria`. No existe selección adaptativa de ejemplos. Este spec MUST crear todo desde cero.

---

## Escenarios (Given / When / Then)

### Escenario 1: Memoria se crea al votar con comentario
- **Dado** que el NUT votó `POSITIVO` con comentario "Excelente balance de macros".
- **Cuando** el feedback se guarda.
- **Entonces** MUST crearse una entrada en `nutricionista_ia_memoria` con `tipo_ejemplo='POSITIVO'`, `comentario='Excelente balance de macros'`, `archivada=false`.

### Escenario 2: Selección adaptativa con 3+ ejemplos
- **Dado** un NUT con 25 entradas en memoria (15 POSITIVOS, 10 NEGATIVOS).
- **Y** un socio con objetivo "perder peso, vegano".
- **Cuando** el NUT genera plan para este socio.
- **Entonces** `SeleccionarEjemplosMemoriaUseCase` MUST scoring cada entrada:
  - POSITIVO + keyword match con "vegano" → score alto.
  - POSITIVO + keyword match con "perder peso" → score alto.
  - NEGATIVO + keyword match → score medio.
- **Y** MUST retornar los top 3 por score.

### Escenario 3: Selección con 0 ejemplos
- **Dado** un NUT que aún no votó ningún plan.
- **Cuando** genera plan.
- **Entonces** MUST omitir la sección de memoria en el prompt.

### Escenario 4: Selección con 1-2 ejemplos
- **Dado** un NUT con 2 entradas en memoria.
- **Cuando** genera plan.
- **Entonces** MUST inyectar las 2 entradas.

### Escenario 5: Rotación FIFO a 100 entradas
- **Dado** un NUT con 100 entradas activas en memoria.
- **Cuando** se crea la entrada 101 (por nuevo voto).
- **Entonces** la entrada más vieja (ordenada por `created_at` ASC) MUST marcarse como `archivada=true`.
- **Y** MUST NO inyectarse en futuros prompts.

### Escenario 6: NUT consulta su memoria
- **Dado** un NUT con 50 entradas activas.
- **Cuando** ejecuta `GET /nutricionistai/memoria`.
- **Entonces** MUST devolver `{ positivos: [...], negativos: [...] }` con todas las entradas activas (no archivadas).

### Escenario 7: NUT elimina una entrada
- **Dado** una entrada de memoria con id=42.
- **Cuando** el NUT ejecuta `DELETE /nutricionistai/memoria/42`.
- **Entonces** MUST marcarse como `archivada=true` (NO delete físico, para auditoría).
- **Y** MUST NO inyectarse en futuros prompts.

---

## Modelo de datos

Tabla nueva `nutricionista_ia_memoria`:

| Columna | Tipo | Constraints |
|---|---|---|
| `id_nutricionista_ia_memoria` | INT AUTO_INCREMENT | PK |
| `id_nutricionista` | INT | FK a `persona.id_persona` |
| `tipo_ejemplo` | ENUM('POSITIVO','NEGATIVO') | NOT NULL |
| `comentario` | VARCHAR(500) | NOT NULL |
| `id_plan_alimentacion_version` | INT NULL | FK CASCADE a `plan_alimentacion_version` |
| `archivada` | BOOLEAN | DEFAULT false |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

Índices: `(id_nutricionista, tipo_ejemplo, archivada)` para queries de selección.

`SeleccionarEjemplosMemoriaUseCase` (NUEVO en `apps/backend/src/application/ia-memoria/use-cases/seleccionar-ejemplos-memoria.use-case.ts`):

```typescript
export interface EjemploMemoria {
  id: number;
  tipo: 'POSITIVO' | 'NEGATIVO';
  comentario: string;
  score: number;          // calculado
}

export interface SolicitudSeleccion {
  nutricionistaId: number;
  contexto: {
    objetivoTexto: string;        // ej: "perder peso vegano"
    restricciones: string[];      // ej: ["vegano", "sin_gluten"]
  };
  cantidadMaxima: 3;
}

export class SeleccionarEjemplosMemoriaUseCase {
  ejecutar(solicitud: SolicitudSeleccion): Promise<EjemploMemoria[]>;
}
```

Algoritmo de scoring (lógica pura):
```
score = 0
+ 2 si tipo_ejemplo === 'POSITIVO'
+ 1 si tipo_ejemplo === 'NEGATIVO'  (negativos valen menos, pero se incluyen si hay pocos positivos)
+ contar_keywords(comentario, objetivoTexto) * 0.5
+ contar_keywords(comentario, restricciones) * 0.3
```

---

## Endpoints / contratos

### `GET /nutricionistai/memoria`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_MEMORIA_EDITAR`.

**Response 200:**
```typescript
{
  positivos: Array<{ id, comentario, planAlimentacionVersionId?, createdAt }>,
  negativos: Array<...>,
  totalActivas: number,
  archivadas: number
}
```

### `DELETE /nutricionistai/memoria/:id`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_MEMORIA_EDITAR`.

**Response 204** sin body.

**Códigos de error:** 403 (no es el dueño), 404 (id no existe).

---

## Tests requeridos

### Unit (backend)
- `SeleccionarEjemplosMemoriaUseCase`:
  - Caso 0 entradas → array vacío.
  - Caso 1-2 entradas → array con esas 1-2.
  - Caso 3+ entradas → array con 3 más relevantes por score.
  - Caso POSITIVOS优先: si hay ≥1 POSITIVO, no incluir NEGATIVOS a menos que falten ejemplos.
  - Mockear repositorio con lista fija de entradas.
- Algoritmo de scoring: verificar que keywords del objetivo pesan más que keywords random.

### Integration (backend)
- POST feedback con comentario → INSERT en memoria (verificable con SELECT).
- POST feedback sin comentario → NO INSERT en memoria.
- GET memoria → solo entradas activas del NUT actual.
- DELETE memoria:id → marca como archivada, no aparece en futuros GETs.
- 101 votos con comentario → entrada más vieja debe estar `archivada=true`.

---

## Out of scope

- Embeddings o matching semántico (matching por keywords simple).
- Visualización de memoria como "cloud" de tags (UI simple de lista).
- Exportar/importar memoria entre NUTs.
- Límite de caracteres diferentes entre memoria y feedback (ambos 500).
- Recordatorios automáticos basados en memoria.

---

## Acceptance criteria

- [ ] Tabla `nutricionista_ia_memoria` MUST existir con columnas e índices especificados.
- [ ] Voto con comentario MUST crear entrada de memoria.
- [ ] Voto sin comentario MUST NO crear entrada.
- [ ] Selección adaptativa MUST elegir 1-3 ejemplos según disponibilidad.
- [ ] Matching MUST priorizar POSITIVOS sobre NEGATIVOS.
- [ ] Rotación FIFO MUST activarse al llegar a 100 entradas activas.
- [ ] DELETE MUST marcar como archivada (no delete físico).
- [ ] `SeleccionarEjemplosMemoriaUseCase` MUST ser lógica pura testeable sin dependencias de framework.
- [ ] Memoria MUST inyectarse en prompt de `GenerarPlanSemanalUseCase` y `RegenerarPlanSemanalUseCase`.
- [ ] Endpoints MUST filtrar por `nutricionistaId` del JWT (no se puede ver/eliminar memoria de otro NUT).