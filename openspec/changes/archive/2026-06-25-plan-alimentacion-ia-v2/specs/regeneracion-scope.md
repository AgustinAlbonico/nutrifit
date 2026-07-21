# Spec: Regeneración con scope (3 granularidades) (RF-007)

**Spec ID**: regeneracion-scope
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-007
**Related docs**: proposal.md sección 4 (RF-007) + sección 3 (Flujo 2)

---

## Requisito (Requirement)

El nutricionista MUST poder regenerar partes del plan sin tener que regenerar todo desde cero. El sistema MUST soportar 3 niveles de granularidad:

1. **`PLAN`** — regenera todo el plan completo con la misma configuración (días, comidas, alternativas).
2. **`DIA`** — regenera las comidas de UN día puntual, mantiene el resto del plan intacto.
3. **`ALTERNATIVA`** — regenera UNA alternativa puntual de UNA comida de UN día.

En todos los casos, el sistema MUST crear una nueva `plan_alimentacion_version` referenciando a la versión anterior y MUST re-ejecutar las validaciones de RF-005 (restricciones) y RF-006 (macros) sobre la nueva versión.

**Datos requeridos en el request:**
- `planAlimentacionVersionId` (int, FK al plan actual, obligatorio).
- `scope` (enum: `PLAN` | `DIA` | `ALTERNATIVA`, obligatorio).
- `dia` (enum `DiaSemana`, requerido SOLO si `scope=DIA` o `scope=ALTERNATIVA`).
- `comidaSlot` (enum `TipoComida`, requerido SOLO si `scope=ALTERNATIVA`).
- `alternativaIndex` (int 0-based, requerido SOLO si `scope=ALTERNATIVA`).

**Comportamiento MUST:**
1. Cargar la versión actual del plan.
2. Construir sub-prompt que incluya:
   - Ficha clínica del socio (igual que generación inicial).
   - Notas del nutricionista (preferencias + notas de generación actual).
   - Memoria IA (1-3 ejemplos).
   - **Contexto preservado**: para `DIA` y `ALTERNATIVA`, incluir las comidas ya generadas de los OTROS días para mantener variedad.
3. Llamar a Groq con `temperature: 0.7`, `max_tokens: 2048` (más bajo para regeneración parcial).
4. Parsear JSON de respuesta y validar estructura (según scope).
5. Merge quirúrgico en `datos_json`:
   - `PLAN`: reemplazar `estructura` completo.
   - `DIA`: reemplazar solo `estructura[DIA_INDEX].comidas`.
   - `ALTERNATIVA`: reemplazar solo `estructura[DIA_INDEX].comidas[COMIDA_INDEX].alternativas[ALT_INDEX]`.
6. Re-ejecutar `RestriccionesValidatorV2` y `MacrosValidator` sobre el `datos_json` resultante.
7. Persistir nueva `plan_alimentacion_version` con `motivo_cambio`:
   - `regeneracion_completa` (scope=PLAN).
   - `regeneracion_dia` (scope=DIA).
   - `regeneracion_alternativa` (scope=ALTERNATIVA).
8. Si la versión anterior tenía `activa=true`, la nueva versión queda como candidata (`activa=false`). El NUT debe activarla explícitamente.

---

## Contexto / Estado actual

No existe `RegenerarPlanSemanalUseCase`. Solo existe la generación inicial. Este spec MUST crear el use-case con la lógica de merge quirúrgico y la construcción del sub-prompt.

---

## Escenarios (Given / When / Then)

### Escenario 1: Regeneración completa (scope=PLAN)
- **Dado** un plan con versión v3 (`activa=false`, motivo=`regeneracion_dia`).
- **Cuando** el NUT ejecuta `POST /ia/plan-semanal/regenerar { planAlimentacionVersionId: 460, scope: 'PLAN' }`.
- **Entonces** el sistema MUST llamar a Groq con el mismo prompt que la generación inicial.
- **Y** MUST crear `plan_alimentacion_version` con `numeroVersion=4`, `motivo_cambio='regeneracion_completa'`, `activa=false`.
- **Y** MUST reemplazar `datos_json.estructura` completo.
- **Y** MUST re-ejecutar validaciones de restricciones y macros.

### Escenario 2: Regeneración de un día (scope=DIA)
- **Dado** un plan con 7 días, miércoles con comidas que el NUT no aprueba.
- **Cuando** el NUT ejecuta `POST /ia/plan-semanal/regenerar { planAlimentacionVersionId: 460, scope: 'DIA', dia: 'MIERCOLES' }`.
- **Entonces** el sistema MUST llamar a Groq con sub-prompt que incluya las comidas de lunes, martes, jueves, viernes, sábado y domingo para mantener variedad.
- **Y** MUST crear nueva versión con `numeroVersion=5`, `motivo_cambio='regeneracion_dia'`.
- **Y** MUST reemplazar solo `datos_json.estructura[2]` (índice de miércoles).
- **Y** MUST preservar intactos los otros 6 días.
- **Y** MUST re-ejecutar validaciones solo sobre miércoles + globales (por si los macros del día cambiaron el global).

### Escenario 3: Regeneración de una alternativa puntual (scope=ALTERNATIVA)
- **Dado** un plan donde la ALTERNATIVA 2 del DESAYUNO del lunes incluye un alimento que el NUT no aprueba.
- **Cuando** el NUT ejecuta `POST /ia/plan-semanal/regenerar { planAlimentacionVersionId: 460, scope: 'ALTERNATIVA', dia: 'LUNES', comidaSlot: 'DESAYUNO', alternativaIndex: 1 }`.
- **Entonces** el sistema MUST llamar a Groq con sub-prompt que incluya las alternativas 0 y 2 ya generadas (para no repetir).
- **Y** MUST crear nueva versión con `numeroVersion=6`, `motivo_cambio='regeneracion_alternativa'`.
- **Y** MUST reemplazar solo `datos_json.estructura[0].comidas[0].alternativas[1]`.
- **Y** MUST preservar intactas las alternativas 0 y 2.
- **Y** MUST re-ejecutar validaciones.

### Escenario 4: Versión activa anterior se mantiene hasta activación explícita
- **Dado** un plan con versión v2 marcada como `activa=true` (la que ve el socio).
- **Cuando** el NUT regenera con cualquier scope y crea v3.
- **Entonces** v3 MUST persistirse con `activa=false`.
- **Y** v2 MUST seguir con `activa=true` (el socio sigue viendo v2 hasta que el NUT active v3).
- **Y** el NUT SHALL llamar a `POST /planes-alimentacion/:id/activar { versionId: <v3> }` para hacer el switch.

### Escenario 5: Plan finalizado no se puede regenerar
- **Dado** un plan con `estado='FINALIZADO'`.
- **Cuando** el NUT intenta regenerar.
- **Entonces** MUST devolver 409 con código `PLAN_FINALIZADO_NO_REGENERABLE`.

### Escenario 6: Regeneración parcial con cambio manual previo
- **Dado** que el NUT editó manualmente una comida antes de regenerar (ver spec `versionado.md` para edición manual).
- **Cuando** el NUT regenera el día que contiene la comida editada.
- **Entonces** el frontend MUST mostrar confirm: "Esta comida fue editada manualmente. ¿Regenerar igual y perder los cambios?".
- **Y** el backend MUST aceptar el parámetro `confirmarPerdidaEdicionManual=true` antes de proceder (defensa en profundidad, aunque el frontend ya confirma).

---

## Modelo de datos

`RegenerarPlanSemanalUseCase` (NUEVO en `apps/backend/src/application/ai/use-cases/regenerar-plan-semanal.use-case.ts`):

```typescript
export interface SolicitudRegeneracionPlan {
  planAlimentacionVersionId: number;
  scope: 'PLAN' | 'DIA' | 'ALTERNATIVA';
  dia?: DiaSemana;
  comidaSlot?: TipoComida;
  alternativaIndex?: number;
  confirmarPerdidaEdicionManual?: boolean;
}

export interface RespuestaRegeneracionPlan {
  nuevaVersionId: number;
  numeroVersion: number;
  motivoCambio: 'regeneracion_completa' | 'regeneracion_dia' | 'regeneracion_alternativa';
  cambios: {
    dias_modificados?: DiaSemana[];
    comidas_modificadas?: Array<{ dia: DiaSemana; slot: TipoComida; alternativa: number }>;
  };
  validacion: ResultadoValidacionRestricciones;
  macros: ResultadoValidacionMacros;
}
```

`PromptRegeneracionBuilder` (NUEVO en `apps/backend/src/application/ai/builders/prompt-regeneracion.builder.ts`): construye el sub-prompt según scope, incluyendo el contexto preservado.

Persistencia: nueva fila en `plan_alimentacion_version` con `datos_json` mergeado.

---

## Endpoints / contratos

### `POST /ia/plan-semanal/regenerar`

**Auth**: Bearer JWT, rol NUTRICIONISTA, acción `PLANES_IA_REGENERAR`.

**Request body:**
```typescript
{
  planAlimentacionVersionId: number,
  scope: 'PLAN' | 'DIA' | 'ALTERNATIVA',
  dia?: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO',
  comidaSlot?: 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION',
  alternativaIndex?: number,           // 0-based
  confirmarPerdidaEdicionManual?: boolean
}
```

**Response 201:**
```typescript
{
  nuevaVersionId: number,
  numeroVersion: number,
  motivoCambio: string,
  cambios: { dias_modificados?: DiaSemana[], comidas_modificadas?: Array<...> },
  validacion: { ... },                  // mismo formato que RF-001
  macros: { ... },                      // mismo formato que RF-006
  plan: { estructura, macrosPorDia, razonamientoCumplimiento }
}
```

**Códigos de error:**

| Código | Cuándo |
|---|---|
| 400 | Falta campo obligatorio según scope (ej: `scope=DIA` sin `dia`) |
| 403 | NUT no es dueño del plan |
| 404 | Versión no existe |
| 409 | Plan está FINALIZADO |
| 422 | Plan regenerado con macros rojo + estructura inválida |
| 502 | Groq devolvió JSON inválido 2 veces |
| 503 | Groq no responde tras 2 intentos |

---

## Tests requeridos

### Unit (backend)
- `RegenerarPlanSemanalUseCase`:
  - Mockear GroqService con respuesta fija.
  - Verificar merge quirúrgico según scope (PLAN, DIA, ALTERNATIVA).
  - Verificar que se crea nueva versión con motivo_cambio correcto.
  - Verificar que versiones anteriores no se modifican (inmutabilidad).
- `PromptRegeneracionBuilder`:
  - Verificar que incluye contexto preservado según scope.

### Integration (backend)
- POST `/ia/plan-semanal/regenerar` con `scope=PLAN` → 201 con `numeroVersion=4`, `motivoCambio='regeneracion_completa'`.
- POST con `scope=DIA, dia=MIERCOLES` → 201 con `dias_modificados=['MIERCOLES']`.
- POST con `scope=ALTERNATIVA, dia=LUNES, comidaSlot=DESAYUNO, alternativaIndex=1` → 201 con `comidas_modificadas=[{dia:'LUNES',slot:'DESAYUNO',alternativa:1}]`.
- POST con plan FINALIZADO → 409.
- POST con `scope=DIA` sin `dia` → 400.

### Tests de validación de IA
- Fixture socio vegano estricto: regenerar 10 veces el mismo día, asertar que las 10 alternativas son distintas entre sí (no repetición dentro del mismo día).

---

## Out of scope

- Historial de regeneraciones con preview/diff visual (el NUT compara manualmente entre versiones con `VersionHistory`).
- Auto-regeneración cuando se edita una nota persistente (solo aplica a futuras generaciones, no regenera planes existentes).
- Cancelación de regeneración en curso (no hay streaming; el NUT espera el response).

---

## Acceptance criteria

- [ ] Endpoint `POST /ia/plan-semanal/regenerar` MUST aceptar scope PLAN/DIA/ALTERNATIVA.
- [ ] Cada regeneración MUST crear nueva `plan_alimentacion_version` con `motivo_cambio` específico del scope.
- [ ] Scope=PLAN MUST reemplazar `datos_json.estructura` completo.
- [ ] Scope=DIA MUST reemplazar solo el día indicado.
- [ ] Scope=ALTERNATIVA MUST reemplazar solo la alternativa indicada.
- [ ] Versión anterior MUST permanecer inmutable.
- [ ] Si versión anterior era `activa=true`, la nueva MUST ser `activa=false` hasta activación explícita.
- [ ] Plan FINALIZADO MUST rechazar regeneración con 409.
- [ ] Validaciones de RF-005 y RF-006 MUST re-ejecutarse sobre la nueva versión.
- [ ] Sub-prompt MUST incluir contexto preservado (comidas de otros días) para mantener variedad.
- [ ] Confirmación MUST requerirse si se regenera sobre comida editada manualmente.