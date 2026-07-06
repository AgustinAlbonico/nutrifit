# Generación IA en background con fallback automático

NutriFit va a mover la generación completa del plan de alimentación a un flujo asincrónico, con estado persistido, fallback automático entre proveedores gratuitos y bloqueo global de edición mientras el plan está en generación.

## Decisión principal

La generación activa se guarda en base de datos y bloquea la edición del plan para ese socio/plan aunque el usuario refresque, abra otra pestaña o vuelva más tarde.

| Tema | Decisión |
|------|----------|
| Proveedores | Mantener Groq y agregar Gemini + OpenRouter como fallback. |
| Orden | `groq -> gemini -> openrouter`, configurable por `.env`. |
| Fallback | Solo ante límite/cuota o errores transitorios del proveedor. |
| Sin fallback | JSON inválido, schema inválido o validación nutricional fallida. |
| Background | Job persistido en DB, ejecutado por servicio interno NestJS. |
| UI | Badge fijo con estado de generación y bloqueo de edición. |
| Comunicación UI | Polling simple; no WebSocket/SSE por ahora. |

## Alcance funcional

### Lo que pidió Agustín

- Agregar Gemini y OpenRouter como opciones gratuitas junto a Groq.
- Si un proveedor devuelve error de límite, pasar automáticamente al siguiente.
- Generar el plan en background para no bloquear el uso del sistema.
- Mostrar un badge fijo con el estado de generación.
- Mientras se genera con IA, impedir edición del plan de alimentación.
- No usar modelos locales.

### Lo que debe verse

- Al iniciar la generación, el formulario se cierra o queda confirmado rápidamente.
- El editor muestra un badge fijo tipo “Generando plan con IA”.
- Los botones de edición/guardado/generación quedan deshabilitados mientras el job está activo.
- La grilla no permite cambios mientras el job está activo.
- Si Groq llega al límite, el backend intenta Gemini; si Gemini llega al límite, intenta OpenRouter.
- Cuando el job termina, el editor refresca el plan/versiones y desbloquea la edición.
- Si el job falla definitivamente, muestra error y desbloquea la edición.

## Arquitectura backend

### Orquestador de proveedores

`AI_PROVIDER_SERVICE` deja de apuntar directo a `GroqService` y pasa a apuntar a un orquestador.

Responsabilidades:

1. Leer `AI_PROVIDER_CHAIN` desde configuración.
2. Ejecutar el proveedor actual.
3. Detectar errores de cuota/transitorios.
4. Intentar el siguiente proveedor con el mismo prompt/configuración.
5. Devolver el JSON del primer proveedor exitoso.
6. Propagar errores de estructura o validación sin cambiar de proveedor.

Proveedores previstos:

- `GroqService`: implementación actual.
- `GeminiService`: adapter nuevo para Gemini API.
- `OpenRouterService`: adapter nuevo compatible con API tipo OpenAI.
- `AiProviderOrchestratorService`: adapter compuesto que implementa `IAiProviderService`.

### Configuración esperada

```env
AI_PROVIDER_CHAIN=groq,gemini,openrouter

GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=

GEMINI_API_KEY=
GEMINI_MODEL=

OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=
```

### Estado de generación

Crear una entidad persistida para la generación de planes IA.

Campos principales:

- `idGeneracionPlanIa`
- `socioId`
- `nutricionistaId`
- `gimnasioId`
- `planAlimentacionId`
- `estado`: `PENDIENTE | GENERANDO | COMPLETADO | ERROR`
- `proveedorActual`
- `intentosProveedores`
- `mensajeEstado`
- `errorMensaje`
- `resultadoPlanAlimentacionId`
- `resultadoVersionId`
- `creadoEn`, `actualizadoEn`, `finalizadoEn`

Regla: solo puede existir una generación activa por socio/plan en estados `PENDIENTE` o `GENERANDO`.

### Endpoints nuevos

Agregar endpoints async sin romper el endpoint sincrónico existente hasta migrar consumidores.

```txt
POST /ia/plan-semanal/generaciones
GET  /ia/plan-semanal/generaciones/activa?socioId=:socioId&planAlimentacionId=:planId
GET  /ia/plan-semanal/generaciones/:id
```

El `POST` responde rápido con el job creado, no con el plan final.

### Bloqueo backend

Antes de mutaciones manuales del plan, validar si hay generación activa para ese socio/plan.

Endpoints a proteger:

- crear plan manual si aplica sobre el mismo socio.
- persistir borrador manual.
- guardar versión definitiva.
- generación de ideas por slot si modifica el plan.

Respuesta esperada cuando está bloqueado:

```txt
409 Conflict
Hay una generación de plan con IA en curso. Esperá a que finalice para editar el plan.
```

## Arquitectura frontend

### Hook IA

`useIa()` suma operaciones asincrónicas:

- crear generación IA.
- consultar generación por ID.
- consultar generación activa del socio/plan.
- invalidar plan/versiones al completar.

### PlanEditorPage

`PlanEditorPage` pasa a tener una fuente de verdad de generación activa.

Estados derivados:

- `generacionIaActiva`
- `planBloqueadoPorIa`
- `mensajeBloqueoIa`

Efectos:

- consultar generación activa al montar o cambiar socio/plan.
- poll cada pocos segundos mientras el estado sea `PENDIENTE` o `GENERANDO`.
- al completar, refrescar versiones/plan y mostrar toast.
- al fallar, mostrar toast y desbloquear.

### Badge fijo

Crear un componente de UI específico para el estado de generación.

Información visible:

- estado actual.
- proveedor actual si existe.
- mensaje breve.
- indicación de que el plan está bloqueado temporalmente.

Ubicación recomendada: fixed bottom/right en desktop y bottom full-width en mobile, sin tapar acciones principales.

### Edición deshabilitada

Mientras `planBloqueadoPorIa` sea true:

- deshabilitar `Generar plan completo con IA`.
- deshabilitar `Guardar versión definitiva`.
- deshabilitar creación manual.
- impedir `handleEstructuraChange`.
- impedir drag/drop de ideas IA.
- impedir abrir generación de ideas por slot.
- pausar autosave silencioso para no persistir cambios durante el lock.

## Verificación visual con Playwright

Ruta principal:

```txt
/profesional/plan/$socioId/editar
```

Selectores clave actuales:

- `data-testid="abrir-generador-ia-btn"`
- `data-testid="guardar-version-btn"`
- `data-testid="plan-editor-layout"`
- `data-testid="link-preferencias-ia"`

Selectores nuevos propuestos:

- `data-testid="badge-generacion-ia"`
- `data-testid="estado-generacion-ia"`
- `data-testid="bloqueo-edicion-ia"`

Contrato de aceptación visual:

- El badge aparece al iniciar generación.
- El badge queda fijo al hacer scroll.
- El texto informa que el plan se está generando con IA.
- El botón de generar IA queda deshabilitado.
- El botón de guardar versión queda deshabilitado.
- La grilla no acepta edición ni drag/drop.
- Cuando el job completa, desaparece el bloqueo y se refresca el plan.
- Cuando el job falla, desaparece el bloqueo y aparece el error.

## Fuera de alcance

- Modelos locales.
- WebSockets/SSE.
- Cancelación manual de jobs.
- Reintentos infinitos.
- Cambiar la semántica nutricional del prompt actual.
- Escribir tests automáticos sin pedido explícito de Agustín.

## Riesgos

- Los tiers gratuitos no garantizan disponibilidad; el fallback aumenta margen, no crea IA gratuita infinita.
- Si el proceso NestJS se cae durante un job, el estado puede quedar en `GENERANDO`; se necesita recuperación simple al iniciar o timeout de jobs viejos.
- El use case actual de generación es grande; conviene no refactorizarlo completo en esta feature, solo encapsular el disparo y persistir estado alrededor.

## Próximo paso

Ejecutar el plan de implementación en `docs/superpowers/plans/2026-07-06-generacion-ia-background-fallback.md`.
