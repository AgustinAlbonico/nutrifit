# Spec: Generación de plan semanal mejorado (RF-001)

**Spec ID**: ia-generacion
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-001 (PRD completo)
**Related docs**: proposal.md sección 4 (RF-001) + sección 7.1 (endpoint)

---

## Requisito (Requirement)

El sistema MUST permitir al nutricionista disparar la generación de un plan de alimentación semanal asistido por IA para un socio específico. La IA MUST producir un plan completo respetando el objetivo nutricional del socio, las restricciones duras declaradas (alergias, intolerancias, patologías, patrón dietario) y las directrices del nutricionista (notas persistentes + notas de esta generación).

**Datos requeridos en el request:**
- `socioId` (int, obligatorio) — socio titular del plan.
- `nutricionistaId` (int, obligatorio) — extraído del JWT.
- `diasAGenerar` (int, default 7, rango 1-14).
- `comidasPorDia` (int, default 4, rango 1-5; valores válidos según enum `TipoComida`: DESAYUNO, ALMUERZO, MERIENDA, CENA, COLACION).
- `alternativasPorComida` (int, default 3, rango 1-5).
- `notasGeneracion` (string, opcional, max 1000 chars) — directrices específicas para esta generación.
- `fechaInicio` (date, opcional, default = lunes de la semana actual Argentina timezone).

**Comportamiento MUST:**
1. Cargar la ficha clínica del socio (objetivo, restricciones, alergias, patologías, nivel de actividad).
2. Cargar las notas persistentes del nutricionista (`nutricionista.preferencias_ia`).
3. Cargar la memoria de feedback del nutricionista (1-3 ejemplos adaptativos vía `SeleccionarEjemplosMemoriaUseCase`).
4. Construir un prompt estructurado combinando todo lo anterior + notas de generación + estructura esperada.
5. Llamar a Groq con `temperature: 0.7`, `max_tokens: 4096`, `response_format: { type: 'json_object' }`.
6. Parsear JSON de respuesta y validar estructura (`diasAGenerar × comidasPorDia` slots, sin repetidos).
7. Validar restricciones alimentarias (`RestriccionesValidatorV2`).
8. Validar macros por día contra objetivo (`MacrosValidator`).
9. Si pasa validaciones → persistir `plan_alimentacion` (BORRADOR) + `plan_alimentacion_version v1`.
10. Si NO pasa restricciones → regenerar con instrucción correctiva (max 2 reintentos).
11. Devolver plan validado + metadata de validación + razonamiento al nutricionista.

**Estados:** El plan se crea en estado `BORRADOR`. La transición a `ACEPTADO` SHALL bloquearse si macros amarillo o rojo.

---

## Contexto / Estado actual

Hoy `GenerarPlanSemanalUseCase` (en `apps/backend/src/application/ai/use-cases/generar-plan-semanal.use-case.ts`) invoca Groq con un prompt mínimo (ficha + objetivo) y persiste el plan sin validación post-generación. No inyecta notas del nutricionista, no inyecta memoria, no maneja reintentos. El nutricionista regenera manualmente 3-5 veces cada plan. Este spec MUST cerrar esa brecha reemplazando completamente el use-case (misma ruta `POST /ia/plan-semanal`, payload ampliado, mismo frontend que se actualiza en el mismo PR).

---

## Escenarios (Given / When / Then)

### Escenario 1: Generación exitosa con restricciones cumplidas
- **Dado** un socio con ficha clínica completa (objetivo 2000 kcal, vegano estricto, nivel actividad MODERADO).
- **Y** un nutricionista con preferencias persistentes "Priorizar proteínas vegetales, predominio de fibra".
- **Cuando** el nutricionista genera plan con `notasGeneracion: "Semana de transición, evitar ultraprocesados"`.
- **Entonces** el sistema MUST llamar a Groq con un prompt que incluya ficha + preferencias + notas + 1-3 ejemplos de memoria.
- **Y** MUST persistir `plan_alimentacion` (BORRADOR) + `plan_alimentacion_version` con `numeroVersion=1`, `activa=false`, `motivoCambio='creacion_inicial'`.
- **Y** MUST devolver 201 con `validacion.restriccionesCumplidas` listando "vegano: ✓ Ningún alimento contiene carne/lácteos/huevos/miel".
- **Y** MUST devolver `macrosPorDia` con cada día en banda ±5% (verde).

### Escenario 2: Reintento por restricción no cumplida
- **Dado** un socio con alergia declarada a frutos secos.
- **Cuando** la primera generación de la IA incluye almendras en el desayuno del lunes.
- **Entonces** el sistema MUST detectar la violación vía `RestriccionesValidatorV2`.
- **Y** MUST regenerar con instrucción correctiva explícita: "EXCLUIR: almendras, nueces, avellanas, maní. Generar alternativa con semillas o frutas".
- **Y** SHOULD resolver la violación en el primer reintento.
- **Si** tras 2 reintentos la restricción sigue sin cumplirse → MUST devolver el plan con `validacion.restriccionesNoCumplidas` poblado y warning visible "⚠️ El plan no cumple el 100% de las restricciones, revisar manualmente".

### Escenario 3: Timeout de Groq
- **Dado** que el endpoint de Groq no responde en 30 segundos.
- **Cuando** el sistema intenta generar el plan.
- **Entonces** MUST reintentar 1 vez con backoff de 5 segundos.
- **Si** el segundo intento también falla → MUST devolver 503 con código `GROQ_TIMEOUT` y mensaje "Servicio de IA no disponible, reintentá en unos minutos".
- **Y** MUST NO persistir nada en BD.

### Escenario 4: JSON malformado de Groq
- **Dado** que Groq devuelve texto que no es JSON válido.
- **Cuando** el sistema intenta parsear.
- **Entonces** MUST reintentar 1 vez con `temperature: 0.3`.
- **Si** el segundo intento también devuelve JSON inválido → MUST devolver 502 con código `GROQ_INVALID_JSON` y mensaje "No se pudo interpretar el plan generado".
- **Y** MUST NO persistir nada en BD.

### Escenario 5: Validación de macros falla (bloqueo)
- **Dado** un plan generado con desvío de macros > ±10% en 3+ días.
- **Cuando** el sistema ejecuta `MacrosValidator`.
- **Entonces** MUST devolver 201 con `validacion.macrosPorDia.{DIA}.desvioPorcentaje > 10` marcado como rojo.
- **Y** MUST persistir el plan igual (no rechaza la creación).
- **Y** SHOULD registrar `NotificacionesService.emitir(PLAN_MACROS_FUERA_RANGO)` al nutricionista.
- **Y** la transición a `ACEPTADO` SHALL estar bloqueada hasta regenerar o editar manualmente.

---

## Modelo de datos

`plan_alimentacion_version` (NUEVA, ver spec `versionado.md` para detalle completo). En la primera generación:

| Columna | Valor |
|---|---|
| `numero_version` | 1 |
| `motivo_cambio` | `'creacion_inicial'` |
| `activa` | false |
| `created_by` | `nutricionistaId` del JWT |

`plan_alimentacion.notas_generacion` (NUEVA, ver spec `notas-nutricionista.md`): persiste el input `notasGeneracion` del request.

`plan_alimentacion.datos_json` (NUEVA estructura): contiene la forma:

```typescript
{
  estructura: Array<{
    dia: DiaSemana,
    comidas: Array<{
      tipo: TipoComida,
      alternativas: Array<{
        nombre: string,
        alimentos: Array<{ alimentoId: number, cantidad: number, unidad: string }>,
        calorias: number,
        proteinas: number,
        carbohidratos: number,
        grasas: number
      }>
    }>
  }>,
  macrosPorDia: Record<DiaSemana, { calorias: number, proteinas: number, carbohidratos: number, grasas: number, desvioPorcentaje: number, banda: 'VERDE' | 'AMARILLO' | 'ROJO' }>,
  razonamientoCumplimiento: {
    restriccionesCumplidas: Array<{ restriccion: string, detalle: string }>,
    restriccionesNoCumplidas: Array<{ restriccion: string, detalle: string, comida?: string }>
  }
}
```

---

## Endpoints / contratos

### `POST /ia/plan-semanal`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_GENERAR`.

**Request body:**
```typescript
{
  socioId: number,
  diasAGenerar?: number,           // default 7, range 1-14
  comidasPorDia?: number,          // default 4, range 1-5
  alternativasPorComida?: number,  // default 3, range 1-5
  notasGeneracion?: string,        // max 1000 chars
  fechaInicio?: string             // ISO date YYYY-MM-DD, default lunes actual AR
}
```

**Response 201:**
```typescript
{
  planAlimentacionId: number,
  versionId: number,
  numeroVersion: 1,
  plan: {
    estructura: {...},             // ver Modelo de datos arriba
    macrosPorDia: {...},
    razonamientoCumplimiento: {...}
  },
  validacion: {
    restriccionesCumplidas: string[],
    restriccionesNoCumplidas: Array<{ restriccion: string, detalle: string }>,
    advertencias: string[]         // warnings globales (no bloquea)
  }
}
```

**Códigos de error:**

| Código | Cuándo |
|---|---|
| 400 | Parámetros fuera de rango (diasAGenerar, comidasPorDia, etc.) |
| 403 | NUT no tiene turno previo con el socio (chequeo `TurnoNutricionistaAccessGuard`) |
| 404 | Socio no existe o no pertenece al gimnasio del NUT |
| 422 | Plan generado con macros rojo en 5+ días (rechazo duro) |
| 502 | Groq devolvió JSON inválido 2 veces seguidas (`GROQ_INVALID_JSON`) |
| 503 | Groq no responde tras 2 intentos (`GROQ_TIMEOUT`) |

---

## Tests requeridos

### Unit (backend, target cobertura 80%)
- `GenerarPlanSemanalUseCase`: mockear `GroqService` con respuesta fija, verificar prompt construido, validaciones ejecutadas, persistencia llamada.
- `PromptPlanSemanalBuilder`: verificar combinación de ficha + preferencias + notas + 1-3 ejemplos de memoria en el orden correcto.
- `RestriccionesValidatorV2`: cobertura con fixtures vegano / diabético / celíaco / multi-restricción.
- `MacrosValidator`: cobertura con fixtures ±5%, ±10%, >10%.

### Integration (backend, BD de test)
- POST `/ia/plan-semanal` con socio válido → 201 con `versionId`.
- POST con socio inexistente → 404.
- POST con macros rojo → 201 con warning + persistencia igual.
- POST con notasGeneracion > 1000 chars → 400.

### Tests de validación de IA (fixtures específicas)
- Fixture socio vegano estricto: asertar 0% alimentos con carne/lácteos/huevos/miel en TODAS las comidas y alternativas.
- Fixture socio diabético: asertar 0% azúcar refinada, control carbohidratos < 50% kcal totales.
- Fixture socio celíaco: asertar 0% alimentos con gluten (trigo, avena, cebada, centeno).
- Fixture socio multi-restricción (vegano + alergia soja + intolerancia lactosa + diabético): asertar cobertura 100% de las 4 restricciones.
- Fixture socio sin restricciones: asertar estructura válida sin warnings de validación.

---

## Out of scope

- Regeneración parcial (ver spec `regeneracion-scope.md`).
- Feedback del nutricionista (ver spec `feedback.md`).
- Memoria IA persistente por nutricionista (ver spec `memoria-ia.md`) — este spec solo la CONSUME, no la CREA.
- Versionado histórico (ver spec `versionado.md`).
- Persistencia de notas del NUT (ver spec `notas-nutricionista.md`) — este spec solo las CONSUME.

---

## Acceptance criteria

- [ ] Endpoint `POST /ia/plan-semanal` acepta payload ampliado (diasAGenerar, comidasPorDia, alternativasPorComida, notasGeneracion, fechaInicio).
- [ ] Sistema MUST persistir `plan_alimentacion_version` con `numeroVersion=1` en primera generación.
- [ ] Validación de restricciones MUST ejecutarse post-generación con max 2 reintentos correctivos.
- [ ] Validación de macros MUST calcular desvío por día vs objetivo nutricional del socio.
- [ ] Response MUST incluir `validacion` con `restriccionesCumplidas`, `restriccionesNoCumplidas`, `advertencias`.
- [ ] Response MUST incluir `razonamientoCumplimiento` con explicación de cada restricción.
- [ ] Errores 502/503 MUST NO persistir nada en BD.
- [ ] Notas del nutricionista MUST concatenarse con preferencias persistentes en el prompt a Groq.
- [ ] Memoria del nutricionista MUST inyectarse en el prompt (1-3 ejemplos adaptativos).
- [ ] `GroqService` MUST invocarse con `temperature: 0.7`, `max_tokens: 4096`, `response_format: { type: 'json_object' }`.
- [ ] Reintento por timeout MUST usar backoff de 5 segundos.
- [ ] Reintento por JSON malformado MUST usar `temperature: 0.3`.