# Cierre del módulo de planes de alimentación con IA

> Diseño validado para llevar el módulo de planes alimentarios a un modo clínico estricto: generación confiable, validación fuerte, revisión humana y persistencia segura.

## Quick path

1. Separar **generación IA** de **persistencia final**.
2. Reemplazar placeholders/rellenos silenciosos por **validación + reintentos + error explícito**.
3. Cerrar el flujo completo de frontend y backend para recomendaciones, ideas, sustituciones, análisis y plan semanal.

## Estado actual resumido

El módulo ya tiene una base importante:

- CRUD de planes alimentarios funcional.
- Editor semanal de plan en frontend.
- Endpoints IA implementados para:
  - recomendación de comida
  - plan semanal
  - sustitución
  - análisis nutricional
  - ideas de comida
- Integración con proveedor IA (`GroqService`) y contexto clínico del paciente.

Los huecos críticos detectados son:

- La generación semanal actual puede maquillarse con **comidas clonadas** y **placeholders hardcodeados**.
- No existe una validación fuerte de **diversidad mínima**.
- El plan generado por IA no queda cerrado como flujo confiable de **borrador validado -> revisión -> persistencia real**.
- Hay hooks y endpoints IA ya hechos que no están integrados en UX real.
- La cobertura de tests de IA es insuficiente para considerar el módulo estable.

## Decisión principal

Se adopta un **modo estricto clínico**.

Esto significa:

- La IA no crea directamente el plan final persistido.
- La IA produce un **borrador validado**.
- El backend rechaza respuestas incompletas, repetitivas o clínicamente inválidas.
- El nutricionista revisa/aprueba el borrador antes de aplicarlo al plan real.
- Se eliminan placeholders silenciosos y rellenos automáticos que oculten una mala generación.

## Objetivo funcional final

Al terminar este módulo, un nutricionista debe poder:

1. Generar un plan semanal completo con IA.
2. Ver un borrador claro, completo y validado.
3. Revisarlo, editarlo y aplicarlo al plan real del socio.
4. Generar opciones por comida.
5. Generar ideas de comida y aplicarlas a un slot concreto.
6. Pedir sustitución de un alimento concreto.
7. Analizar nutricionalmente un plan o borrador.
8. Guardar el resultado con persistencia consistente, trazabilidad y pruebas automatizadas relevantes.

## Arquitectura objetivo

## Backend

### Flujo A — Generación de plan semanal IA

1. Preparar contexto clínico del paciente.
2. Construir prompt estricto.
3. Generar plan semanal vía proveedor IA.
4. Validar resultado.
5. Si falla, reintentar con feedback técnico interno.
6. Si pasa, devolver borrador validado.
7. Si agota intentos, devolver error claro sin persistir nada.

### Flujo B — Aplicación del borrador IA al plan real

1. Recibir borrador aprobado.
2. Mapear ingredientes/comidas al modelo persistente.
3. Resolver alimentos del catálogo.
4. Detectar conflictos de mapeo.
5. Persistir días/opciones/items en el plan del socio.
6. Registrar auditoría y motivo si corresponde.

### Flujo C — IA puntual sobre el editor

Las demás capacidades IA deben operar sobre slots y entidades reales del editor:

- recomendación por comida
- ideas de comida
- sustitución
- análisis nutricional

Ninguna de estas capacidades debe quedar aislada como endpoint sin consumo real en UI.

## Frontend

### Dos estados explícitos

El frontend debe distinguir visualmente entre:

- **Plan persistido actual**
- **Borrador IA**

Esto evita que el usuario confunda contenido generado con contenido ya guardado.

### Reglas de UX

- Nunca sobrescribir contenido sin confirmación.
- Nunca mostrar como “válido” un plan incompleto.
- Nunca ocultar errores de generación.
- Siempre mostrar qué parte es borrador y qué parte es plan real.

## Reglas de validación obligatorias

## 1. Estructura

Un plan semanal IA solo es válido si cumple:

- exactamente 7 días
- exactamente 5 comidas por día
- presencia obligatoria de:
  - DESAYUNO
  - ALMUERZO
  - MERIENDA
  - CENA
  - COLACION

Si falta cualquiera de estas condiciones, el resultado falla.

## 2. Calidad mínima por comida

Cada comida debe incluir:

- nombre útil
- descripción útil
- ingredientes no vacíos
- calorías estimadas
- proteínas
- carbohidratos
- grasas
- tipo de comida válido

No se aceptan comidas vacías, genéricas sin contenido o nutricionalmente absurdas.

## 3. Guardrails clínicos

Validaciones mínimas:

- alergias
- restricciones alimentarias
- patologías relevantes
- incompatibilidades evidentes con el contexto del paciente

El plan se rechaza completo ante una violación clínica.

## 4. Diversidad mínima

Se deben validar, como mínimo:

- repetición excesiva del mismo nombre de comida
- repetición excesiva de combinación dominante de ingredientes
- semana con almuerzos/cenas casi clonados
- colaciones idénticas en bloque si exceden el umbral definido

La diversidad no necesita ser gourmet, pero sí suficiente para evitar planes pobres o artificialmente repetidos.

## 5. Coherencia nutricional global

Debe existir una tolerancia razonable sobre:

- calorías objetivo diarias
- distribución de macros
- balance entre comidas
- valores absurdamente bajos o altos por slot

## 6. Política de reintentos

Cuando la generación falle por estructura, diversidad o guardrails:

- se reintenta automáticamente
- con feedback técnico interno para la próxima generación
- con un máximo definido de intentos

Si todos fallan:

- se devuelve error claro al frontend
- no se aplican correcciones silenciosas
- no se persistirá un borrador inválido

## Decisiones técnicas concretas

| Área | Decisión |
|------|----------|
| Placeholders | Eliminarlos del flujo de aceptación |
| Clonado de comidas | Prohibido como fallback silencioso |
| Persistencia automática | No; primero borrador validado |
| Aplicación al plan | Acción explícita del nutricionista |
| Mapeo a catálogo | Requerido antes de persistencia real |
| IA puntual | Debe integrarse al editor, no quedar aislada |
| Errores de IA | Visibles y accionables |

## Mapeo al catálogo de alimentos

Este punto es crítico para el cierre real del módulo.

La IA trabaja con texto libre de ingredientes/comidas. El sistema persiste items que deberían quedar alineados con `AlimentoOrmEntity`.

Se necesita una estrategia explícita:

1. normalización de texto
2. búsqueda exacta o fuerte por nombre
3. búsqueda aproximada/fuzzy controlada
4. marcación de conflictos cuando no haya match confiable
5. prohibición de persistencia ciega de ingredientes ambiguos

Sin este cierre, el módulo no puede considerarse 100% completo.

## Integraciones IA a cerrar sí o sí

## Recomendación por comida

- generar varias opciones válidas
- aplicarlas a un slot concreto
- confirmar reemplazo si el slot ya tiene contenido

## Ideas de comida

- generar propuestas útiles
- elegir destino concreto en el plan
- permitir reintentar y descartar sin romper el flujo

## Sustitución

- partir desde un alimento concreto
- devolver reemplazo utilizable
- permitir aceptación localizada

## Análisis nutricional

- analizar borrador o plan actual
- mostrar alertas y observaciones útiles
- ayudar a decidir antes de persistir

## Testing requerido

## Backend

Se requiere cobertura mínima de:

- generación semanal IA
- validación estructural
- validación de guardrails clínicos
- validación de diversidad
- reintentos
- mapeo a catálogo
- aplicación del borrador al plan real
- recomendaciones, ideas, sustituciones y análisis

## Frontend

Se requiere cobertura mínima de:

- render de borrador IA
- confirmación de reemplazos
- errores de generación
- aplicación de propuestas a slots correctos
- separación visual entre borrador y plan actual

## Criterio de módulo “100%”

El módulo solo se considera completo si:

1. La IA genera borradores semanales válidos o falla explícitamente.
2. No existen placeholders silenciosos ni rellenos falsos.
3. El nutricionista puede revisar y aplicar el borrador al plan real.
4. Recomendaciones, ideas, sustituciones y análisis tienen flujo real en UI.
5. El mapeo al catálogo está resuelto de forma confiable.
6. Las restricciones y alergias están cubiertas por validación real.
7. Los errores son visibles y accionables.
8. Hay pruebas automáticas sobre los flujos críticos.

## Riesgos conocidos

| Riesgo | Mitigación |
|-------|------------|
| IA devuelve JSON correcto pero semánticamente malo | Validación fuerte + diversidad + reintentos |
| Ingredientes no mapeables | Resolver conflictos antes de persistir |
| UX confusa entre borrador y plan real | Separación explícita de estados |
| Reemplazos destructivos en editor | Confirmación antes de aplicar |
| Refactors sin red de seguridad | Tests backend/frontend antes de cerrar |

## Fuera de alcance de este cierre

No forma parte del cierre del módulo, salvo dependencia técnica directa:

- rediseño global del sistema
- notificaciones email completas de todo el producto
- multi-tenant general del sistema
- módulos ajenos a planes alimentarios

## Resultado esperado

Después de este trabajo, el módulo de planes alimentarios va a pasar de “tiene varias piezas IA que más o menos existen” a “flujo clínico completo, validado y aplicable en producción”.
