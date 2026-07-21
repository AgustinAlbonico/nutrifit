# Spec: Cobertura del día + cumplimiento de macros (RF-006)

**Spec ID**: validacion-macros
**Change**: plan-alimentacion-ia-v2
**RBs aplicados**: RF-006
**Related docs**: proposal.md sección 4 (RF-006)

---

## Requisito (Requirement)

El sistema MUST validar que el plan generado cubra la cantidad de comidas configurada por día y que la suma de macros diarios esté dentro del rango aceptable del objetivo nutricional del socio. La validación de macros produce un indicador visual con 3 bandas:

- **Verde** (desvío ≤ ±5%): plan cumple perfectamente.
- **Amarillo** (desvío entre ±5% y ±10%): plan cumple con desvío menor.
- **Rojo** (desvío > ±10%): plan NO cumple macros.

**Comportamiento MUST:**
1. Parsear el plan JSON.
2. Validar cantidad de comidas por día == `comidasPorDia` configurado (default 4).
3. Validar días consecutivos desde `fechaInicio` y total == `diasAGenerar` (default 7).
4. Sumar kcal + proteínas + carbohidratos + grasas de TODAS las comidas y alternativas del día (promediando entre alternativas para no penalizar variación).
5. Comparar suma contra objetivo del socio (target diario de cada macro).
6. Asignar banda según desvío.
7. Persistir metadata de validación en `datos_json.macrosPorDia`.
8. La transición a `ACEPTADO` SHALL estar bloqueada si macros amarillo o rojo en 1+ días.

**Cálculo del desvío:**
```
desvioPorcentaje = ((sumaReal - objetivo) / objetivo) * 100
banda = desvioPorcentaje.abs() <= 5 ? 'VERDE'
      : desvioPorcentaje.abs() <= 10 ? 'AMARILLO'
      : 'ROJO'
```

**Manejo de alimentos sin macros registradas:** si un alimento del plan no tiene macros en la tabla `alimento`, el sistema MUST registrar warning "macros_no_registradas: {nombre}" y tratar como 0 para el cálculo (no rompe, pero reporta).

---

## Contexto / Estado actual

No existe `MacrosValidator`. El cálculo de macros actual se hace inline en el frontend al renderizar la grilla del plan, sin comparación contra objetivo. Este spec MUST crear el validador como lógica pura (sin dependencias de TypeORM ni NestJS) para facilitar testing.

---

## Escenarios (Given / When / Then)

### Escenario 1: Plan cumple macros perfectamente (verde)
- **Dado** un socio con objetivo 2000 kcal/día, 100g proteínas, 250g carbohidratos, 70g grasas.
- **Cuando** la IA genera un plan donde lunes suma 1980 kcal (-1%), 98g proteínas (-2%), 252g carbohidratos (+0.8%), 68g grasas (-2.9%).
- **Entonces** el validador MUST clasificar lunes como `VERDE`.
- **Y** MUST devolver `macrosPorDia.LUNES.banda = 'VERDE'`, `desvioPorcentaje = -1`.

### Escenario 2: Plan con desvío menor (amarillo)
- **Dado** un socio con objetivo 2000 kcal/día.
- **Cuando** la IA genera un plan donde miércoles suma 2180 kcal (+9%).
- **Entonces** el validador MUST clasificar miércoles como `AMARILLO`.
- **Y** MUST permitir la transición a `ACEPTADO` solo si el NUT regenera primero (de lo contrario, queda en BORRADOR).

### Escenario 3: Plan con desvío crítico (rojo)
- **Dado** un socio con objetivo 2000 kcal/día.
- **Cuando** la IA genera un plan donde viernes suma 2300 kcal (+15%).
- **Entonces** el validador MUST clasificar viernes como `ROJO`.
- **Y** MUST registrar `NotificacionesService.emitir(PLAN_MACROS_FUERA_RANGO)`.
- **Y** MUST bloquear cualquier intento de transición a `ACEPTADO` hasta regenerar.

### Escenario 4: Cobertura de días incompleta
- **Dado** un request con `diasAGenerar=7`.
- **Cuando** el plan devuelto por la IA solo tiene 6 días (falta domingo).
- **Entonces** el validador MUST devolver 422 con código `PLAN_ESTRUCTURA_INVALIDA` y mensaje "Faltan días en la estructura".
- **Y** MUST NO persistir el plan.

### Escenario 5: Cobertura de comidas incompleta
- **Dado** un request con `comidasPorDia=4`.
- **Cuando** el plan del lunes solo tiene 3 comidas (falta COLACION).
- **Entonces** el validador MUST devolver 422 con código `PLAN_ESTRUCTURA_INVALIDA` y mensaje "Faltan comidas en el día LUNES".

### Escenario 6: Alimento sin macros registradas
- **Dado** un plan que incluye "quinoa inflada" en una alternativa.
- **Y** "quinoa inflada" no tiene registro en `alimento.macros`.
- **Cuando** el validador intenta sumar.
- **Entonces** MUST registrar warning `macros_no_registradas: quinoa inflada` en `validacion.advertencias`.
- **Y** MUST tratar como 0 kcal/macros para esa alternativa (no rompe el cálculo).

---

## Modelo de datos

`MacrosValidator` (NUEVO en `apps/backend/src/domain/validators/macros-validator.ts`):

```typescript
export type BandaMacro = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface ResumenMacrosDia {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  desvioPorcentaje: number;     // promedio ponderado de los 4 macros
  banda: BandaMacro;
  detallePorMacro: {
    calorias: { real: number; objetivo: number; desvio: number; banda: BandaMacro };
    proteinas: { real: number; objetivo: number; desvio: number; banda: BandaMacro };
    carbohidratos: { real: number; objetivo: number; desvio: number; banda: BandaMacro };
    grasas: { real: number; objetivo: number; desvio: number; banda: BandaMacro };
  };
}

export interface ResultadoValidacionMacros {
  cumpleEstructura: boolean;
  diasFaltantes: DiaSemana[];
  comidasFaltantes: Array<{ dia: DiaSemana; faltantes: TipoComida[] }>;
  advertencias: string[];           // ej: ["macros_no_registradas: quinoa inflada"]
  macrosPorDia: Record<DiaSemana, ResumenMacrosDia>;
  bandaGlobal: BandaMacro;          // peor banda de todos los días
  puedeAceptar: boolean;            // true SOLO si todos los días están en VERDE
}

export class MacrosValidator {
  static validar(
    plan: PlanGeneradoIA,
    objetivo: ObjetivoNutricional,
    diasAGenerar: number,
    comidasPorDia: number,
    fechaInicio: Date
  ): ResultadoValidacionMacros;
}
```

Persistencia en `plan_alimentacion_version.datos_json.macrosPorDia` (ver spec `ia-generacion.md`).

---

## Endpoints / contratos

Este spec NO introduce endpoints nuevos. Su resultado es consumido por:
- `POST /ia/plan-semanal` (spec `ia-generacion.md`).
- `POST /ia/plan-semanal/regenerar` (spec `regeneracion-scope.md`).
- `POST /planes-alimentacion/:id/aceptar` (futuro, cuando se implemente — ver spec `versionado.md`).

---

## Tests requeridos

### Unit (backend)
- `MacrosValidator.validar()`:
  - Caso verde: 4 macros dentro de ±5% → banda VERDE en cada uno, bandaGlobal VERDE, puedeAceptar=true.
  - Caso amarillo: kcal +7% → banda AMARILLO en kcal, bandaGlobal AMARILLO, puedeAceptar=false.
  - Caso rojo: kcal +15% → banda ROJO en kcal, bandaGlobal ROJO, puedeAceptar=false.
  - Caso mixto: 3 días verde + 1 día amarillo → bandaGlobal AMARILLO, puedeAceptar=false.
  - Caso estructura incompleta: 6 días cuando diasAGenerar=7 → 422 PLAN_ESTRUCTURA_INVALIDA.
  - Caso comida faltante: lunes sin COLACION → 422 PLAN_ESTRUCTURA_INVALIDA.
  - Caso alimento sin macros: warning + continuar.

### Tests de validación de IA (con fixtures)
- Para cada fixture (vegano, diabético, etc.): asertar que 9 de 10 generaciones caen en VERDE y al menos 7 días de cada plan están en VERDE.

---

## Out of scope

- Cálculo de macros para alimentos compuestos (ej: "ensalada César con pollo"): se calcula sumando macros de cada ingrediente.
- Edición manual de macros por el NUT (no es parte del flujo actual).
- Visualización detallada por comida (solo por día se persiste).
- Objetivos nutricionales diferenciados por día (target es el mismo para todos los días).

---

## Acceptance criteria

- [ ] `MacrosValidator` MUST ser lógica pura (sin TypeORM ni NestJS) — facilita unit testing.
- [ ] Validador MUST clasificar cada día en banda VERDE/AMARILLO/ROJO según umbrales ±5% / ±10%.
- [ ] `bandaGlobal` MUST ser la peor banda de todos los días del plan.
- [ ] `puedeAceptar` MUST ser true SOLO si todos los días están en VERDE.
- [ ] Si estructura incompleta → MUST devolver 422 sin persistir.
- [ ] Alimento sin macros registradas MUST generar warning sin romper el cálculo.
- [ ] Resultado MUST persistirse en `plan_alimentacion_version.datos_json.macrosPorDia`.
- [ ] Plan con macros rojo MUST disparar `NotificacionesService.emitir(PLAN_MACROS_FUERA_RANGO)`.
- [ ] La transición a `ACEPTADO` SHALL estar bloqueada si `puedeAceptar=false`.