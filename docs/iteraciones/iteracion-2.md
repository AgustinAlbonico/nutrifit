# Iteración 2 — Consulta Clínica y Plan Nutricional Asistido por IA

> **Fecha de referencia del TFI**: 01/10/2025
> **Alcance**: Segunda iteración "Consulta clínica y Plan nutricional asistido por IA"
> **Estado basado en exploración de código**: ver `estado-actual.md`

---

## RESUMEN EJECUTIVO

Iteración 2 agrega el circuito completo de atención clínica y plan nutricional. El profesional inicia/registra/cierra consultas; crea/edita/elimina planes alimentarios; usa IA para sugerir ideas de comidas. Todo queda auditado y notificado al socio. Según exploración de código, **IMPLEMENTADO** en su mayoría.

| Módulo | Estado | Gaps |
|---|---|---|
| Consulta clínica (iniciar, mediciones, observaciones, finalizar) | IMPLEMENTADO | — |
| Plan alimentario (crear, editar, eliminar, ver) | IMPLEMENTADO | Audit logs parciales; soft delete funcional |
| IA nutricional (sugerencias, recetas, análisis) | IMPLEMENTADO | Timeout/Sin respuesta sin reintento automático |
| Progreso (gráficos, exportación CSV/PDF) | IMPLEMENTADO | — |
| Notificaciones (consulta finalizada, plan creado/editado/eliminado) | IMPLEMENTADO | — |

---

## 1. ALCANCE

### Inclusiones iteración 2
- **Consulta clínica**: iniciar solo con turno PRESENTE, registrar mediciones (peso, perímetros), observaciones, adjuntos, finalizar (turno → REALIZADO).
- **Plan alimentario**: crear (≥1 día, ≥1 comida), editar (con motivo y auditoría), eliminar (soft delete con motivo), ver (por día/comidas, exportar).
- **IA como recepcionista**: sugerencias de comidas con 3 campos (Objetivo oblig., Restricciones opc., Info extra oblig.), 2 propuestas por solicitud, agregar o descartar.
- **Progreso del socio**: gráficos y tablas con evolución, exportar CSV/PDF.
- **Notificaciones**: al finalizar consulta y al crear/editar/eliminar plan.

### Exclusiones
- Reemplazo de criterio profesional por IA.
- Generación autónoma de planes completos por IA.
- Videollamada, chat en tiempo real, telemedicina.
- Módulo de rutinas de entrenamiento.

---

## 2. REQUISITOS FUNCIONALES (RF27–RF40)

| ID | Descripción | Actor | Prioridad |
|---|---|---|---|
| RF27 | Iniciar consulta solo si turno estado = PRESENTE | Profesional | Alta |
| RF28 | Registrar observaciones clínicas (texto) y adjuntos en consulta | Profesional | Alta |
| RF29 | Registrar mediciones (peso, perímetros, otras) con validación de rango | Profesional | Alta |
| RF30 | Finalizar consulta → turno TERMINADO; bloquear edición directa (permitir anexos con auditoría) | Profesional | Alta |
| RF31 | Crear plan para socio (requiere ≥1 día y ≥1 comida con ítems) | Profesional | Alta |
| RF32 | Editar plan (agregar/quitar comidas, cambiar notas/macros) con motivo y auditoría | Profesional | Alta |
| RF33 | Eliminar plan (soft delete) con motivo; socio queda sin plan activo | Profesional | Alta |
| RF34 | Ver plan por día/comidas (Profesional, Socio, Entrenador solo lectura) | Todos | Alta |
| RF35 | Validar que plan no incluya ingredientes en alergias/restricciones del socio; bloquear con incidencias | Sistema | Alta |
| RF36 | Sugerir con IA durante crear/editar plan con 3 campos: Objetivo (oblig.), Restricciones (opcional), Info extra (oblig.) | Profesional | Alta |
| RF37 | Recibir 2 ideas (nombre, ingredientes+cantidades/unidades, pasos≤5, notas) y permitir Agregar o Descartar | Profesional | Alta |
| RF38 | Si propuesta contiene ingredientes prohibidos, descartarla automáticamente y permitir reintentar | Sistema | Media |
| RF39 | Ver progreso del socio (curvas/tabla por período) usando datos de consulta; exportar CSV/PDF | Profesional/Socio | Alta |
| RF40 | Notificar al socio al crear/editar/eliminar plan y al finalizar consulta | Sistema | Media |

---

## 3. REGLAS DE NEGOCIO (ITERACIÓN 2)

| ID | Regla | Aplicación |
|---|---|---|
| RB18 | Un solo plan activo por socio + profesional; si existe, bloquear creación | Plan alimentario |
| RB19 | Plan validado contra alergias/restricciones del socio; si hay contraindicación, bloquear con detalle | Plan alimentario |
| RB20 | IA no recibe PII del socio (patologías, medicaciones solo del contexto clínico, no identificable) | IA |
| RB21 | IA devuelve exactamente 2 ideas por solicitud (nombre, ingredientes, cantidades/unidades, pasos≤5, notas) | IA |
| RB22 | Consulta solo con turno PRESENTE; al comenzar turno → EN_CURSO; al finalizar → TERMINADO | Consulta clínica |
| RB23 | Edición de plan y cierre de consulta en transacción; soft delete coherente | Plan/Consulta |
| RB24 | Visibilidad por rol: Entrenador ve solo plan y observaciones públicas; Recepción no accede a datos clínicos | Permisos |
| RB25 | Auditoría en crear/editar/eliminar plan y finalizar consulta (quién, cuándo, motivo) | Plan/Consulta |
| RB26 | anexos post-cierre de consulta deben tener auditoría y no modificar datos originales | Consulta |

---

## 4. DIAGRAMA DE ESTADOS (TURNO AMPLIADO ITERACIÓN 2)

```
PROGRAMADO → CONFIRMADO → PRESENTE → EN_CURSO → REALIZADO
     ↓            ↓           ↓          (profesional inicia)
  CANCELADO   CANCELADO    CANCELADO    ↓
  (regla aus.)(socio)      (regla aus.) FINALIZADO
                                         (profesional cierra)
```

**Diferencia clave vs iteración 1**: Estado final = `REALIZADO` (no `TERMINADO` como dice el TFI; revisar nomenclatura en código). El estado `EN_CURSO` es nuevo en iteración 2.

---

## 5. CASOS DE USO (CUD23–CUD30)

---

### CUD23 — Registrar datos de consulta
**Actor**: Profesional | **Pre-condición**: Turno PRESENTE

**Principal**:
1. Desde CUD07 → "Comenzar turno" → valida estado PRESENTE → turno pasa a EN_CURSO
2. Abre pantalla con: ficha de salud (lectura), progreso (si hay), observaciones clínicas, mediciones (peso, perímetros, otros), adjuntos
3. Profesional registra datos y guarda
4. Presiona "Cerrar consulta" → turno pasa a REALIZADO

**Bordes**:
- **A1**: sin historial → progreso muestra "Sin datos previos"
- **E2**: valores fuera de rango → resaltar y bloquear cierre
- **A2**: guardado parcial → turno permanece EN_CURSO hasta cerrar
- **E3**: adjuntos inválidos → informar y no adjuntar

**Extiende**: CUD26 (CTA "Crear plan de alimentación" dentro de la consulta)

---

### CUD30 — Ver progreso de socio
**Actor**: Profesional | **Actor Secundario**: Socio

**Pre-condiciones**: Profesional autenticado; existen registros de mediciones previas (opcional).

**Principal**:
1. Sistema carga series históricas del socio con el profesional
2. Muestra gráficos y tabla por período
3. Opción exportar

**Bordes**:
- **A1**: sin datos → "Sin progresos registrados"

**Nota**: Incluida en CUD23 cuando hay datos, pero también accesible como caso independiente.

---

### CUD24 — Gestionar plan de alimentación
**Actor**: Profesional | **Extiende**: CUD25, CUD26, CUD27, CUD28

**Principal**:
1. Accede a "Gestionar plan"
2. Elige: Crear / Editar / Eliminar / Ver
3. Redirige al caso específico

**Faltante en código**: Este es un caso de uso contenedor sin lógica propia; la navegación en frontend debería manejarlo.

---

### CUD25 — Crear plan de alimentación
**Actor**: Profesional | **Actor Secundario**: Sistema IA

**Pre-condición**: Profesional autenticado; socio no posee plan activo.

**Principal**:
1. Abrir "Crear plan"
2. Completar objetivo y estructura: Días → Comidas → Ítems (alimento, cantidad, unidad)
3. Botón "Sugerir con IA" (CUD29)
4. Guardar
5. Sistema valida contra alergias/restricciones del socio
6. Si válido → crea plan, registra auditoría, notifica al socio

**Bordes**:
- **E1**: ya existe plan activo → `ALREADY_HAS_PLAN`
- **E2**: plan vacío (sin día o sin comida) → `PLAN_EMPTY` (exige ≥1 día y ≥1 comida)
- **E3**: contraindicación (ingrediente en alergias) → `CONTRAINDICATION_FOUND` con detalle

**Faltante en código**: La validación de contraindicaciones (RB19) no está clara si se aplica al guardar o al recibir sugerencia IA.

---

### CUD26 — Editar plan de alimentación
**Actor**: Profesional | **Actor Secundario**: Sistema IA

**Pre-condición**: Profesional autenticado; existe plan activo del socio.

**Principal**:
1. Abrir "Editar plan"
2. Realizar cambios: agregar/quitar comidas o ítems, cambiar notas/macros
3. Ingresar motivo de edición (obligatorio)
4. Guardar
5. Sistema valida contra alergias/restricciones

**Bordes**:
- **E1**: plan inexistente → bloquear con mensaje
- **E2**: contraindicación → `CONTRAINDICATION_FOUND`

**Faltante en código**: Motivo de edición obligatorio parece estar implementado (tiene campo `motivo` en el DTO), verificar en el use-case.

---

### CUD27 — Eliminar plan de alimentación
**Actor**: Profesional

**Pre-condición**: Profesional autenticado; existe plan activo del socio.

**Principal**:
1. Abrir "Eliminar plan"
2. Ingresar motivo (obligatorio)
3. Confirmar
4. Soft delete del plan

**Bordes**:
- **E1**: plan inexistente → bloquear
- **A1**: cancelar → no se realizan cambios

**Faltante en código**: Verificar que el `motivo` sea obligatorio y no solo un string opcional.

---

### CUD28 — Ver plan de alimentación
**Actor**: Profesional / Asistente | **Actor Secundario**: Profesional

**Pre-condición**: Profesional autenticado; existe plan (activo o histórico).

**Principal**:
1. Abrir "Ver plan"
2. Sistema renderiza por día/comidas con ítems, notas y macros
3. Opciones: Exportar / Imprimir

**Bordes**:
- **A1**: sin plan → "El socio no posee plan activo"

**Nota**: En TFI dice "Asistente" como actor principal, pero el plan lo gestiona el profesional. Verificar en código qué roles pueden ver plan (debería ser Profesional, Socio, y Entrenador en modo lectura).

---

### CUD29 — Generar idea con IA
**Actor**: Profesional | **Actor Secundario**: Motor IA

**Pre-condiciones**: Profesional autenticado; está en CUD25 o CUD26 con editor abierto; sistema dispone de ficha de salud del socio.

**Principal**:
1. Presiona "Generar idea con IA" en el editor
2. Completa: Objetivo (oblig.), Restricciones (opcional), Info extra (oblig.)
3. Sistema arma prompt con: objetivo, restricciones, info extra + datos clínicos del socio (patologías, medicaciones, alergias) — sin PII
4. Envía al motor IA
5. IA retorna 2 propuestas: nombre, ingredientes (con cantidades/unidades), pasos (≤5), notas
6. Sistema filtra propuestas que contradigan alergias/restricciones
7. Profesional: Agregar una/o ambas, o Descartar

**Bordes**:
- **E1**: falta objetivo o info extra corta → bloquear
- **E2**: timeout o respuesta inválida de IA → `IA_TIMEOUT` / `PROPUESTA_INVALIDA`; ofrecer "Reintentar"

**Faltante en código**: La ficha de salud del socio se incluye en el prompt? Revisado en `groq.service.ts` — no hay acceso directo a la ficha desde el prompt; el profesional debería ingresarla manualmente como "Info extra". Confirmar si el código actual incluye los datos clínicos reales del socio o no.

---

## 6. FLUJO COMPLETO DE CONSULTA CLÍNICA (CUD23)

```
Socio tiene turno PRESENTE
       ↓
Profesional hace click "Comenzar turno"
       ↓
Sistema valida estado = PRESENTE
       ↓
Turno pasa a EN_CURSO
       ↓
Pantalla de consulta:
  - Ficha de salud (solo lectura)
  - Progreso (si hay datos previos)
  - Observaciones clínicas (texto libre)
  - Mediciones (peso, perímetros, otros)
  - Adjuntos (PDF, imágenes)
  - Botón "Crear plan de alimentación"
       ↓
Profesional registra datos y guarda (parcial)
       ↓
Profesional click "Cerrar consulta"
       ↓
Sistema valida mediciones (rango válido)
       ↓
Turno pasa a REALIZADO
Consulta guardada
Auditoría registrada
Notificación enviada al socio
```

---

## 7. FLUJO COMPLETO DE PLAN ALIMENTARIO (CUD25 → CUD26)

```
Profesional abre "Crear plan" (CUD25)
       ↓
Completa: objetivo, días, comidas, ítems
       ↓
[Opcional] Click "Sugerir con IA" (CUD29)
  → 3 campos: Objetivo, Restricciones, Info extra
  → IA devuelve 2 ideas
  → Profesional agrega o descarta
       ↓
Profesional guarda plan
       ↓
Sistema valida contra alergias/restricciones (RB19)
       ↓
¿Hay contraindicación?
  → Sí: BLOQUEAR con CONTRAINDICATION_FOUND
  → No: Crear plan, auditoría, notificar socio
       ↓
Plan activo creado

[Futuro] Editar plan (CUD26):
  → Profesional abre plan existente
  → Realiza cambios + ingresa motivo
  → Guardar → validar → actualizar + auditoría
  → Notificar socio

[Futuro] Eliminar plan (CUD27):
  → Profesional abre eliminar
  → Ingresa motivo + confirma
  → Soft delete → socio sin plan activo
  → Notificar socio
```

---

## 8. CHECKLIST DE ACEPTACIÓN ITERACIÓN 2

- [ ] Profesional puede iniciar consulta solo con turno en PRESENTE
- [ ] Turno pasa a EN_CURSO al iniciar; a REALIZADO al cerrar
- [ ] Mediciones con validación de rango (peso 20-300, altura 1-2.5m, perímetros 20-200cm)
- [ ] Observaciones clínicas y adjuntos se guardan en la consulta
- [ ] Profesional puede crear plan (≥1 día, ≥1 comida con ítems)
- [ ] Plan validado contra alergias/restricciones del socio antes de guardar
- [ ] Si plan tiene ingredientes en alergias → bloqueo con detalle
- [ ] Un solo plan activo por socio; segundo intento muestra ALREADY_HAS_PLAN
- [ ] Profesional puede editar plan (con motivo obligatorio y auditoría)
- [ ] Profesional puede eliminar plan (soft delete con motivo)
- [ ] Socio queda sin plan activo tras eliminación
- [ ] "Sugerir con IA" funciona con 3 campos y devuelve 2 ideas
- [ ] Ideas con ingredientes en alergias se descartan automáticamente
- [ ] Profesional puede agregar una, ambas o descartar las ideas
- [ ] Ver plan por día/comidas con opción exportar/imprimir
- [ ] Progreso muestra gráficos y tabla por período
- [ ] Progreso exportable a CSV/PDF
- [ ] Socio recibe notificación al finalizar consulta
- [ ] Socio recibe notificación al crear/editar/eliminar plan
- [ ] Auditoría completa en crear/editar/eliminar plan y consulta finalizada
- [ ] Entrenador ve plan en modo lectura, no datos clínicos
- [ ] Recepción no accede a datos clínicos

---

## 9. GAPS CONOCIDOS (ITERACIÓN 2)

| Gap | Gravedad | Notas |
|---|---|---|
| Ficha de salud del socio no se incluye automáticamente en prompt de IA | Alta | El profesional debe ingresar manualmente las restricciones como "Info extra"; el código no accede a la ficha para-armar el prompt automáticamente |
| Motivo obligatorio en editar/eliminar plan | Media | El DTO tiene el campo pero verificar que el use-case lo valide como obligatorio |
| Auditoría de edición de plan | Media | Puede haber logs pero confirmar que el `motivo` y `editorId` se guardan |
| Rol Entrenador en visor de plan | Media | El TFI dice que el Entrenador ve plan y observaciones públicas, pero en código no hay un rol Entrenador diferenciado |
| Timeout de IA no hace reintento automático | Baja | Solo muestra mensaje IA_TIMEOUT; el botón "Reintentar" existe en UI |
| Estados del turno: TFI dice "TERMINADO", código usa "REALIZADO" | Baja | Diferencia de nomenclatura; verificar一致性 |

---

*Documento generado por exploración de código + TFI. Ver `estado-actual.md` para mapeo de implementación vs faltante.*