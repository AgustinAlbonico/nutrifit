# Planes de Alimentación — Ola 1: Bugs Críticos + Tests IA

**Fecha:** 2026-06-23
**Autor:** Sesión con Agustín
**Estado:** Pendiente de aprobación
**Alcance:** Primera ola de mejora del módulo de planes de alimentación.
**Estrategia general:** Tres olas. Esta es la ola 1 (estabilidad). La ola 2 (refactor estructural) y ola 3 (features nuevas) quedan fuera de este documento.

---

## 1. Contexto

El módulo de generación de planes de alimentación tiene dos sub-módulos:

- **CRUD manual** (`application/planes-alimentacion/`): 8 use-cases, 8 endpoints, validación de restricciones clínico-dietéticas, multi-tenant, auditoría, soft-delete. Maduro.
- **IA** (`application/ai/`): 5 use-cases (recomendación, plan semanal, ideas, sustitución, análisis) sobre `GroqService` que implementa `IAiProviderService`.

Frontend: 4 páginas principales (`GestionPlanesPage`, `PlanEditorPage`, `MiPlanPage`, `PlanSocioPage`) + componentes en `components/plan/` y `components/ia/`.

La verificación visual con Playwright (2026-06-23) reveló que el módulo **no se puede usar end-to-end en su estado actual** por cinco bugs críticos, cuatro de ellos no detectados por la exploración de código estático.

## 2. Objetivos de la ola 1

1. Restaurar la IA: que las 3 capacidades IA del `PlanEditorPage` funcionen end-to-end.
2. Restaurar la búsqueda de alimentos: que `FoodSearchDialog` no crashee al escribir.
3. Restaurar el modal de Ideas de Comida: que muestre las propuestas reales.
4. Restaurar `MiPlanPage` para socios: que un socio pueda ver su plan activo.
5. Cerrar el bug del hook `useVerificarConexionIa` que llama a un endpoint inexistente.
6. Subir la cobertura de tests del módulo IA del **0% actual** a ≥80% en use-cases, y agregar tests para los use-cases CRUD sin cobertura.
7. Reparar el E2E `crear-plan.spec.ts` que tiene `data-testid` inexistentes.
8. Actualizar `CREDENCIALES_SEED.md` con las credenciales reales.

## 3. No objetivos (van a la ola 2 o posterior)

- Refactor del `PlanEditorPage` (921 líneas) a hooks/componentes.
- Unificación del tipo `PlanAlimentacion` en `@nutrifit/shared`.
- Mover el mapeo IA→catálogo del frontend al backend.
- Alinear dominio↔ORM (entity `PlanAlimentacionEntity` desfasada).
- Estandarizar React Query en `MiPlanPage`, `PlanSocioPage`, `PlanEditorPage`.
- Eliminar placeholders/clonado en `generar-plan-semanal.use-case.ts`.
- Refactor del `RestriccionesValidator` (420 líneas).
- Features nuevas (tercera ola).

## 4. Bugs a resolver

### Bug 1 — IA caída: Groq 404 en `/chat/completions`

**Síntoma (Playwright):** Toda interacción con IA devuelve `404 Unknown request URL: POST /chat/completions`. Probado en `/ia/recomendacion`, `/ia/plan-semanal`, `/ia/ideas-comida`. La sección "Asistente IA" del `PlanEditorPage` es inutilizable.

**Causas raíz (3 combinadas):**

| Causa | Estado en `.env` | Estado deseado |
|---|---|---|
| URL base mal formada | `GROQ_BASE_URL=https://api.groq.com` | `GROQ_BASE_URL=https://api.groq.com/openai/v1` |
| Modelo deprecado | `GROQ_MODEL=mixtral-8x7b-32768` (retirado por Groq en marzo 2025) | `GROQ_MODEL=llama-3.3-70b-versatile` |
| API key | Cargada por Agustín (2026-06-23) | OK |

El SDK de OpenAI arma la URL como `baseURL + /chat/completions`. Con el baseURL actual resulta `https://api.groq.com/chat/completions` que no existe en Groq → 404.

**Fix:**

1. Actualizar `.env`:
   - `GROQ_BASE_URL=https://api.groq.com/openai/v1`
   - `GROQ_MODEL=llama-3.3-70b-versatile`
2. Actualizar `.env.example` con los mismos valores correctos.
3. Endurecer `EnvironmentConfigService.getGroqBaseUrl()`: si el valor no termina en `/openai/v1`, lanzar error en `bootstrap` con mensaje claro. Idem para modelo: mantener una lista de modelos soportados y rechazar los deprecados con error explícito.
4. Agregar test unitario al `EnvironmentConfigService` para los dos chequeos anteriores.

### Bug 2 — `FoodSearchDialog` crashea con `alimentos.map is not a function`

**Síntoma (Playwright):** Abrir `FoodSearchDialog` → escribir "pollo" → `TypeError: alimentos.map is not a function` en `FoodSearchDialog.tsx:273` → error boundary → página muerta con "Something went wrong!".

**Causa raíz probable:** El endpoint `GET /alimentos/buscar?texto=...` (o el que sea que use el hook `buscarAlimentosPorTexto`) devuelve respuesta paginada con shape `{ data: Alimento[], meta: {...} }` o similar, pero el componente asume que la respuesta es directamente `Alimento[]`.

**Fix:**

1. Confirmar el shape exacto de la respuesta del endpoint (caso "cuando hay resultados" y caso "cuando no hay").
2. Ajustar `FoodSearchDialog.tsx:273` para manejar ambos shapes (array directo o envoltorio paginado).
3. Idealmente normalizar en el hook `buscarAlimentosPorTexto` (`lib/api/alimentos.ts`) para que el componente siempre reciba `Alimento[]`.
4. Agregar test del componente que cubra: respuesta vacía, respuesta con datos, respuesta con shape inesperado (no romper, mostrar mensaje).

### Bug 3 — Modal "2 Propuestas generadas" vacío

**Síntoma (Playwright):** `IdeasComidaPanel` → completar campos → "Generar Ideas de Comida" → modal abre con título "2 Propuestas generadas" pero el contenido está **vacío** (solo botones Cerrar/Reintentar). El endpoint devuelve 201.

**Causa raíz probable:** El `useGenerarIdeasComida` devuelve un `RespuestaIdeasComida` (definido en `types/ia.ts`) cuyo shape no coincide con el que el componente renderiza. Posibles motivos:
- El componente espera `propuestas: PropuestaIA[]` pero el backend responde con `data: { propuestas: [...] }` o con `ideas: [...]`.
- El componente hace `propuestas.map(...)` pero el campo se llama distinto en runtime.

**Fix:**

1. Inspeccionar el payload real de la respuesta 201 (logs de red).
2. Alinear el tipo `RespuestaIdeasComida` en `@nutrifit/shared/src/types/ai.ts` con el shape real.
3. Asegurar que el componente extrae el array correcto.
4. Agregar test del componente con mock de respuesta real.

### Bug 4 — Socios no pueden ver su plan (`403 Forbidden`)

**Síntoma (Playwright):** Login como socio → `/mi-plan` → siempre muestra "No tienes un plan de alimentación activo" aunque exista uno. En consola: `GET /planes-alimentacion/socio/{personaId}/activo` → 403 "No tenés permisos para realizar esta acción.". Reproducido con 3 socios distintos.

**Causa raíz confirmada:** El `MiPlanPage.tsx:245` llama a `/planes-alimentacion/socio/${personaId}/activo` donde `personaId` viene de `useAuth()` → `AuthContext` → `profile.data.idPersona` (endpoint `/auth/perfil`).

El guard `SocioResourceAccessGuard.canActivate()` (líneas 76-84) compara ese `:socioId` del path contra `actorPersonaId` calculado como `usuarioRepository.findPersonaIdByUserId(user.id)` donde `user.id` es el `id` del JWT.

**Hay un mismatch entre dos fuentes de "personaId"**: el endpoint `/auth/perfil` y `findPersonaIdByUserId` no computan el mismo valor para el mismo usuario.

**Fix (a confirmar durante implementación con logs):**

1. Agregar logs temporales en ambos lados para ver el valor real de cada uno con un usuario de prueba.
2. Detectar la discrepancia (probables candidatos):
   - `/auth/perfil` retorna el `id` de la tabla `persona` directamente; `findPersonaIdByUserId` retorna el `persona.id` asociado al `usuario.id` vía FK. Si la FK está mal o el query es incorrecto, difieren.
   - Tipos numéricos: el JWT guarda `id` como número; el guard podría estar comparando número contra string.
3. Aplicar el fix mínimo que alinee ambos lados sin romper otros flujos (el guard se usa en 7 endpoints).
4. Tests del guard:
   - SOCIO accediendo a su propio plan → 200.
   - SOCIO accediendo al plan de otro socio → 403.
   - SOCIO accediendo a `/socio/me/activo` (si se agrega esa ruta) → 200.
   - NUTRICIONISTA con vínculo → 200.
   - NUTRICIONISTA sin vínculo → 403.
5. Verificación visual con Playwright: socio3-central logueado → ve su plan activo.

### Bug 5 — `useVerificarConexionIa` llama a `/ia/estado` inexistente

**Síntoma:** `apps/frontend/src/hooks/useIa.ts` define `useVerificarConexionIa` que hace `GET /ia/estado`. El `ai.controller.ts` no expone ningún `@Get`. El hook siempre cae al catch y devuelve `false`.

**Causa raíz:** El hook quedó apuntando a un endpoint que nunca se implementó.

**Fix (2 opciones, preferida A):**

- **Opción A (preferida):** Eliminar `useVerificarConexionIa` y cualquier UI que lo consuma. La verificación real de IA ocurre cuando el usuario intenta generar algo; si falla, el `alert` ya lo muestra. No tiene valor un endpoint que solo chequea formato de API key como hace hoy `verificarConexion()` en `groq.service.ts` (no hace ping real).
- **Opción B:** Exponer `GET /ia/estado` que llame a un `verificarConexion()` real (haciendo un ping al provider con un prompt mínimo) y devuelva `{ configurada: boolean, provider: string, modelo: string }`. Más trabajo, valor discutible.

Decisión: **Opción A.** Eliminar el hook y simplificar. Si en el futuro se quiere un health-check real de IA, se agrega con la Opción B.

## 5. Documentación

### `CREDENCIALES_SEED.md`

- Marcar `agusalbo2024@gmail.com` y `test-socio@nutrifit.com` con password correcta o eliminar si ya no aplican al seed actual.
- Verificar con Agustín antes de cambiar.

## 6. Tests a agregar

### Backend (Vitest/Jest — el runner ya configurado en `apps/backend`)

**Use-cases IA** (mock `IAiProviderService`):

| Use-case | Tests mínimos |
|---|---|
| `generar-recomendacion-comida.use-case.ts` | contexto válido → genera 5 opciones; alérgenos filtrados post-generación; error del provider → excepción tipada |
| `generar-plan-semanal.use-case.ts` | plan 7 días × 5 comidas; estructura validada; calorías clamp [1200, 3000]; alérgenos validados; provider cae → excepción |
| `generar-ideas-comida.use-case.ts` | **regenerar bug**: socio sin sugerencia previa NO debe romper (cuando se aplique el fix); genera exactamente 2 propuestas; persiste en `sugerencia_ia` |
| `sugerir-sustitucion.use-case.ts` | alimento válido → sugerencia; alimento no encontrado → NotFoundError; acepta rol SOCIO y NUTRICIONISTA |
| `analizar-plan-nutricional.use-case.ts` | plan existente → análisis; distribución de macros normalizada; plan inexistente → NotFoundError |

**Use-cases CRUD sin cobertura:**

| Use-case | Tests mínimos |
|---|---|
| `crear-plan-alimentacion.use-case.ts` | plan activo único por socio; validación de restricciones; emite notificación `PLAN_CREADO`; ADMIN asigna "primer nutricionista disponible" |
| `editar-plan-alimentacion.use-case.ts` | solo nutri dueño o ADMIN; motivoEdicion obligatorio; reconstruye días; auditoría `PLAN_EDITADO` |
| `eliminar-plan-alimentacion.use-case.ts` | soft delete (activo=false); motivoEliminacion guardado; auditoría `PLAN_DELETED` |
| `vaciar-contenido-plan.use-case.ts` | borra días y opciones, mantiene plan activo |
| `obtener-plan-activo-socio.use-case.ts` | plan activo existe → lo devuelve; no existe → null; multi-tenant |
| `listar-planes-nutricionista.use-case.ts` | lista solo planes del nutri; multi-tenant |

**Otros:**

- `EnvironmentConfigService` — validaciones de GROQ_BASE_URL y GROQ_MODEL.
- `SocioResourceAccessGuard` — los 5 casos del Bug 4.
- `FoodSearchDialog` y hook `buscarAlimentosPorTexto` (estos son frontend, ver abajo).

### Frontend (Vitest + Testing Library)

| Componente/Hook | Tests mínimos |
|---|---|
| `FoodSearchDialog` | render inicial sin búsqueda; búsqueda con resultados; búsqueda vacía; respuesta con shape inesperado no crashea |
| `IdeasComidaPanel` | render sin propuestas; con 2 propuestas renderiza ambas; error del backend muestra alerta |
| `useIa` (hooks IA) | mock de fetch con MSW; loading state; success state; error state |
| `WeeklyPlanGrid` | grilla 7×5 vacía; con datos; totales diarios calculados |

### E2E (Playwright — `e2e/flujos/crear-plan.spec.ts`)

El test actual usa selectores como `[data-testid="plan-card"]`, `[data-testid="planes-list"]`, `[data-testid="create-plan-button"]` que **no existen** en los componentes.

**Fix:**

1. Agregar `data-testid` estables a: `GestionPlanesPage` (lista de planes, botón crear), `PlanCard` (card individual), `PlanEditorPage` (botón guardar, slots de comida).
2. Actualizar el E2E para que use esos selectores y realmente pase.

## 7. Decisiones técnicas

| Tema | Decisión | Razón |
|---|---|---|
| Modelo Groq | `llama-3.3-70b-versatile` | Modelo actual de Groq, 32k contexto, buena relación calidad/precio |
| Frameworks de test | Backend: Jest (configurado). Frontend: Vitest + Testing Library + MSW | Mantener lo existente |
| Migración `.env` | Cambiar `GROQ_BASE_URL` y `GROQ_MODEL` directo | Fix mínimo, no requiere migración de DB |
| `useVerificarConexionIa` | Eliminar | Apunta a endpoint inexistente; `verificarConexion()` actual no hace ping real |
| Bug 4 fix approach | Alinear `personaId` entre `/auth/perfil` y `findPersonaIdByUserId` (decisión exacta tras logs) | Mínimo invasivo; el guard ya está bien diseñado |
| Commits | Uno conventional por bug fix + uno por bloque de tests | Trazabilidad |
| Branch | `main` directo | Política del repo (AGENTS.md) |

## 8. Criterios de aceptación

La ola 1 se considera completa cuando:

- [ ] Bug 1: `PlanEditorPage` → "Generar Recomendaciones" / "Generar Plan Semanal" / "Generar Ideas de Comida" funcionan end-to-end con IA real (Playwright lo verifica).
- [ ] Bug 2: `FoodSearchDialog` no crashea con ninguna query de búsqueda (Playwright: buscar "pollo", "leche", string vacío, símbolos raros).
- [ ] Bug 3: Modal "Ideas de Comida" muestra las 2 propuestas completas con ingredientes y pasos.
- [ ] Bug 4: socio3-central logueado ve su plan activo en `/mi-plan` (si tiene uno); si no tiene, ve empty state correcto, no "No tenés permisos".
- [ ] Bug 5: `useVerificarConexionIa` eliminado del frontend; no quedan referencias.
- [ ] Cobertura de tests IA ≥80% en use-cases.
- [ ] Cobertura CRUD: los 6 use-cases listados tienen sus tests mínimos.
- [ ] E2E `crear-plan.spec.ts` pasa verde.
- [ ] `CREDENCIALES_SEED.md` actualizado.
- [ ] Todos los cambios commiteados a `main` con conventional commits.
- [ ] Verificación visual Playwright final de todo el flujo: login nutricionista → crear plan → aplicar IA → guardar → login socio → ver plan.

## 9. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Bug 4 más profundo de lo esperado (query en `findPersonaIdByUserId` roto) | Media | Alto (afecta 7 endpoints) | Investigar primero con logs; si el fix es grande, separar en sub-bug |
| API key de Groq con cuota insuficiente | Baja | Medio | Monitorear 429s; cachear respuestas en dev |
| Modelo `llama-3.3-70b-versatile` produce respuestas con schema distinto a `mixtral-8x7b-32768` | Media | Medio | Validación post-generación ya existe; ajustar prompts si hace falta |
| Cambios en `.env` rompen otro módulo que use Groq | Baja | Bajo | Solo `application/ai/` usa Groq (verificado en exploración) |
| Tests agregados revelan más bugs | Alta | Medio | Bienvenido; cada bug nuevo se documenta y decide si entra en ola 1 o pasa a cola |

## 10. Plan de commits (estimado)

1. `fix(ai): corregir GROQ_BASE_URL y modelo deprecado en .env`
2. `feat(config): validar GROQ_BASE_URL y modelo en EnvironmentConfigService`
3. `test(config): tests de EnvironmentConfigService para validaciones Groq`
4. `fix(plan): FoodSearchDialog maneja respuesta paginada sin crashear`
5. `test(plan): tests de FoodSearchDialog`
6. `fix(ia): IdeasComidaPanel renderiza propuestas correctamente`
7. `test(ia): tests de IdeasComidaPanel`
8. `fix(auth): alinear personaId entre /auth/perfil y SocioResourceAccessGuard`
9. `test(auth): tests del SocioResourceAccessGuard`
10. `refactor(ia): eliminar useVerificarConexionIa y endpoint /ia/estado fantasma`
11. `test(ia): tests de use-cases IA (5 use-cases)`
12. `test(plan): tests de use-cases CRUD faltantes`
13. `test(e2e): agregar data-testid y arreglar crear-plan.spec.ts`
14. `docs: actualizar CREDENCIALES_SEED.md`

## 11. Verificación visual final

Después del commit 14, abrir Playwright y ejecutar el flujo completo:

1. Login nutricionista → `/planes` → "Crear Plan" → elegir paciente → editor.
2. Probar las 3 IA features → deben responder.
3. Probar búsqueda de alimentos → no crashea.
4. Guardar plan.
5. Logout → login socio → `/mi-plan` → debe verse el plan.
6. Capturar screenshots finales.

Si algo no coincide con esta spec, no dar por cerrada la ola 1.
