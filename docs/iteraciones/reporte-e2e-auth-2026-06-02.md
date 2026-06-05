# Reporte E2E — Auth, Roles, Permisos y Módulos del Sistema

**Fecha:** 2026-06-02
**Generado por:** agente opencode
**Alcance:** Validación de los 4 roles (SUPERADMIN, ADMIN, NUTRICIONISTA, SOCIO) con Playwright contra el backend vivo + suite supertest in-memory para endpoints de datos.

---

## TL;DR (Resumen para Agustín)

1. **Login 500 fixeado y verificado en server vivo.** Los 4 roles devuelven 201 + token + permisos correctos.
2. **13/13 endpoints 500 fixeados y verificados en server vivo** (12 con 200, 1 con 404 que es comportamiento correcto: socio sin plan activo). Causa raíz única + 1 fix secundario de guard. Detalle en §3.b.
3. **RBAC funciona correctamente en el frontend**: cada rol ve su sidebar, su dashboard y las páginas correctas. Los 4 roles navegan sin problemas.
4. **Iteración 2 (2026-06-02 15:00 UTC)**: arreglados 3 UX bugs + 4 bugs de `estado-actual.md` (1 ya estaba OK). Backend tiene nodemon para hot reload. 377/377 tests verdes. Detalle en §9.
5. **Pendiente para próxima sesión**: implementar entidad `Especialidad` (gap 6), rol `Entrenador` (gap 9), y admin/recepción gestionando agenda ajena (gap 7).

---

## 1. Estado del Login 500

### Root cause
`TenantContextInterceptor` registraba `APP_INTERCEPTOR` con `useClass: TenantContextInterceptor` → Nest creaba la instancia sin inyectar `Reflector` → cualquier endpoint protegido explotaba en `getAllAndOverride()` con `reflector = undefined`.

### Fix aplicado
- `apps/backend/src/infrastructure/auth/tenant-context.module.ts`: `useClass` → `useFactory` con `inject: [Reflector, TenantContextService]`.
- `apps/backend/src/infrastructure/auth/tenant-context.module.spec.ts`: test de regresión que valida la forma del provider.

### Verificación
- **Unit**: 3 suites PASS, 10 tests PASS.
- **In-memory supertest**: los 4 roles devuelven 201 + token + acciones correctas.
- **Server vivo (post-restart)**: `POST /auth/login` con `admin-central@nutrifit.com / 123456` → 201 con token JWT + 32 acciones. Confirmado con curl/PowerShell y vía Playwright.
- **Server vivo (post-restart)**: `POST /auth/login` con password incorrecto → 401 (no 500). Confirmado.

---

## 2. E2E Playwright (server vivo, 4 roles)

### 2.1 SUPERADMIN — `superadmin@nutrifit.com`

| Paso | Resultado |
|------|-----------|
| Login | ✅ Redirige a `/dashboard` |
| localStorage | ✅ rol=SUPERADMIN, 32 permisos, gimnasioId=null |
| Dashboard | ✅ "Bienvenido al panel de control" + lista completa de permisos |
| `/admin/gimnasios` | ✅ "Gimnasios — Todos los gimnasios — ID Nombre…" |
| `/admin/auditoria` | ⚠️ "Acceso denegado — Solo los administradores pueden acceder" (mensaje engañoso: SUPERADMIN también es admin) |
| `/gimnasios` | ❌ Not Found (ruta no existe como página; los gimnasios están en `/admin/gimnasios`) |

### 2.2 ADMIN — `admin-central@nutrifit.com`

| Paso | Resultado |
|------|-----------|
| Login | ✅ Redirige a `/dashboard` |
| localStorage | ✅ rol=ADMIN, 32 permisos, gimnasioId=null |
| Dashboard | ✅ Panel + permisos |
| `/socios` | ✅ "Gestión de Socios" |
| `/nutricionistas` | ✅ "Gestión de Nutricionistas" |
| `/agenda` | ⚠️ "Acceso denegado" (la página es solo para NUTRI, OK) |

**Console errors en `/socios` y `/nutricionistas`**:
- `GET /socio` → **500** (bug confirmado)
- `GET /profesional` → **500** (bug confirmado)

### 2.3 NUTRICIONISTA — `nutri-central@nutrifit.com`

| Paso | Resultado |
|------|-----------|
| Login | ✅ Redirige a `/dashboard` |
| localStorage | ✅ rol=NUTRICIONISTA, 7 permisos, gimnasioId=null |
| Dashboard | ✅ "Dashboard Nutricionista — Turnos de Hoy Cargando... Pacientes Recientes Cargando…" (los "Cargando…" cuelgan por 500s del backend) |
| `/turnos-profesional` | ✅ "Gestión de Turnos" (header OK) |
| `/pacientes` | ✅ "Mis Pacientes" (header OK) |
| `/planes` | ✅ "Planes de Alimentación" (header OK) |

**Console errors**:
- `GET /turnos/profesional/5/hoy` → **500** (bug nuevo)
- `GET /turnos/profesional/5/pacientes?limite=5` → **500** (bug nuevo)
- `GET /turnos/profesional/5/disponibilidad?fecha=2026-06-02` → **500** (bug nuevo)
- `GET /planes-alimentacion/nutricionista/5` → **500** (bug nuevo)

### 2.4 SOCIO — `socio1-central@nutrifit.com`

| Paso | Resultado |
|------|-----------|
| Login | ✅ Redirige a `/dashboard` |
| localStorage | ✅ rol=SOCIO, 4 permisos, gimnasioId=null |
| Dashboard | ⚠️ "Mi Dashboard — Mi Plan Alimenticio Cargando... Mi Progreso Cargando... Mis Objetivos Cargando…" (todo cuelga en 500) |
| `/turnos` | ⚠️ "Mis Turnos — Historial y proximos turnos — Ir a agendar turno — Ocurrió un [error]…" |
| `/mi-plan` | ✅ "Mi Plan de Alimentación" (header OK, contenido Cargando) |
| `/mi-progreso` | ✅ "Mi Progreso — Sin datos para exportar…" |

**Console errors**:
- `GET /turnos/socio/mis-turnos` → **500** (3 veces) — bug P0
- `GET /turnos/socio/ficha-salud` → **500** — bug P0
- `GET /planes-alimentacion/socio/8/activo` → **500** (3 veces) — bug P0
- `GET /progreso/8/fotos` → **500** (2 veces) — bug P1
- `GET /progreso/8/objetivos` → **500** (3 veces) — bug P1
- `GET /turnos/socio/mi-progreso` → **500** (2 veces) — bug nuevo
- `GET /turnos/socio/mi-historial-mediciones` → **500** (3 veces) — bug nuevo

---

## 3. Bugs Críticos Confirmados en el Server Vivo

### 3.a Lista de los 13 endpoints 500 (estado: TODOS FIXEADOS)

| # | Endpoint | Rol | Severidad | Estado |
|---|----------|-----|-----------|--------|
| 1 | `GET /turnos/socio/mis-turnos` | SOCIO | P0 | ✅ 200 |
| 2 | `GET /turnos/socio/ficha-salud` | SOCIO | P0 | ✅ 200 (sin ficha) |
| 3 | `GET /turnos/socio/mi-progreso` | SOCIO | P0 | ✅ 200 |
| 4 | `GET /turnos/socio/mi-historial-mediciones` | SOCIO | P0 | ✅ 200 |
| 5 | `GET /planes-alimentacion/socio/:socioId/activo` | SOCIO | P0 | ✅ 404 (sin plan) |
| 6 | `GET /progreso/:socioId/fotos` | SOCIO | P1 | ✅ 200 |
| 7 | `GET /progreso/:socioId/objetivos` | SOCIO | P1 | ✅ 200 |
| 8 | `GET /turnos/profesional/:nutricionistaId/hoy` | NUTRI | P1 | ✅ 200 |
| 9 | `GET /turnos/profesional/:nutricionistaId/pacientes` | NUTRI | P1 | ✅ 200 |
| 10 | `GET /turnos/profesional/:nutricionistaId/disponibilidad` | NUTRI | P1 | ✅ 200 |
| 11 | `GET /planes-alimentacion/nutricionista/:nutricionistaId` | NUTRI | P1 | ✅ 200 |
| 12 | `GET /socio` (lista) | ADMIN | P1 | ✅ 200 |
| 13 | `GET /profesional` (lista) | ADMIN | P1 | ✅ 200 |

### 3.b Causa raíz única (encontrada con stack traces via in-memory supertest)

Los 13 bugs parecían 13 problemas distintos pero eran **3 síntomas del mismo bug raíz**:

1. **`TenantContextService` REQUEST-scoped se construía sin `request.user` populado** → `tenantContext.gimnasioId` lanzaba `Error: Tenant context not initialized` en repositorios y use-cases (síntoma #1: 5 endpoints, "obtenerGimnasioIdActual" en `socio.respository.ts:17` y `nutricionista.repository.ts:13`).
2. **Mismo problema leído desde el getter** del servicio (síntoma #2: 4 endpoints, `tenantContext.gimnasioId` en `list-mis-turnos.use-case.ts:63`, `get-ficha-salud-socio.use-case.ts:98`, `get-agenda-diaria.use-case.ts:59`, `listar-planes-nutricionista.use-case.ts:25`).
3. **`SocioResourceAccessGuard.resolveTargetSocioId` lee `body.socioId` sin null-check** (síntoma #3: 5 endpoints GET, `TypeError: Cannot read properties of undefined (reading 'socioId')` en `socio-resource-access.guard.ts:130`).

**Por qué pasaba**: el `JwtAuthGuard` setea `req.user = payload` en el `Request` de Express. Pero el `TenantContextService` REQUEST-scoped se construía cuando un repo/use-case lo necesitaba, y por timing de Nest esa construcción podía ocurrir **antes** de que el `req.user` estuviera populado, dejando `_gimnasioId = null` para el resto del request.

### 3.c Fix aplicado (2 archivos, ~10 líneas)

**Fix raíz** — `apps/backend/src/infrastructure/auth/guards/auth.guard.ts`:
- Inyectar `TenantContextService` en el constructor del guard.
- Después de validar el JWT, llamar `tenantContext.setFromPayload(payload)` explícitamente.
- Esto vuelve al guard REQUEST-scoped por transitividad, lo cual es OK y garantiza el orden: **guard popula contexto → use-case/repo lo lee ya populado**.

**Fix secundario** — `apps/backend/src/infrastructure/auth/guards/socio-resource-access.guard.ts:124`:
- `request.body as Record<string, unknown>` → `(request.body ?? {}) as Record<string, unknown>`.
- Cubre el caso de GET requests donde `body` es `undefined`.

**Test regresión** — `apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts`:
- Mock de `TenantContextService` en `TestingModule`.
- Nuevas assertions: `setFromPayload` se llama con el payload correcto en éxito, no se llama en tokens con tenant inválido.

### 3.d Verificación

- **In-memory supertest**: 12/13 endpoints → 200, 1/13 → 404 (comportamiento correcto).
- **Server vivo (post-restart) con curl**: 12/13 → 200 con datos reales, 1/13 → 404 (sin plan activo).
- **Suite tests existente**: 25 suites PASS, 129 tests PASS, 0 fail, 0 regresión.
- **Sin tocar controllers, use-cases, ni repos** — el fix vive en 2 archivos de infraestructura.

### 3.e Lección aprendida (para futuras guards)

> En NestJS, cuando un `JwtAuthGuard` setea `req.user` y luego use-cases/repos REQUEST-scoped leen del request, **el orden NO está garantizado**. La solución idiomática: hacer que el guard popule explícitamente cualquier REQUEST-scoped service que downstream providers necesiten. De lo contrario, providers REQUEST-scoped pueden leer `request.user === undefined` y crashear silenciosamente en producción con 500s crípticos.

---

## 4. UX / Mensajes Engañosos (no rompen, pero confunden)

| Dónde | Mensaje actual | Sugerencia |
|-------|----------------|------------|
| `/admin/auditoria` para SUPERADMIN | "Solo los administradores pueden acceder" | Cambiar a "Acceso denegado" o permitir SUPERADMIN (es admin global) |
| `/agenda` para ADMIN | "Esta pantalla solo está disponible" | OK, pero completar el mensaje con el rol que corresponde |
| Toast de 500 en cualquier error | "Ocurrió un error del servidor. Intentá nuevamente en unos minutos." | El backend devuelve `code: "SERVER_ERROR"` y `path`; podríamos mostrarlos en el toast en dev |
| Dashboard SOCIO | "Cargando..." infinito para plan/progreso/objetivos | Mostrar el error real con un botón "Reintentar" |
| `/gimnasios` para SUPERADMIN | Not Found | La página de gimnasios vive en `/admin/gimnasios`; el sidebar debería apuntar ahí |

---

## 5. Lo que SÍ funciona (módulos verificados OK)

- ✅ **Login/Logout**: 4 roles
- ✅ **Auth** (`/auth/permissions`, `/auth/perfil`): 4 roles
- ✅ **Gimnasios (CRUD)**: SUPERADMIN, 403 para otros
- ✅ **Permisos (acciones/grupos/users)**: SUPERADMIN, 403 para otros
- ✅ **Mis permisos** (`/permissions/me/actions`): 4 roles
- ✅ **Notificaciones** (`/notificaciones/mias`): 4 roles
- ✅ **Alimentos** (grupos, lista): ADMIN/NUTRI/SOCIO
- ✅ **Sidebars por rol** (cada rol ve su menú correcto)
- ✅ **Redirección a /login** cuando no hay sesión
- ✅ **Rutas protegidas por `beforeLoad`** (SUPERADMIN-only redirigen a /dashboard si entra otro rol)

---

## 6. Cómo reproducir lo que probé

### Login
```powershell
$body = @{ email = "admin-central@nutrifit.com"; contrasena = "123456" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method Post -ContentType "application/json" -Body $body
$r.data.token  # JWT
```

### E2E con Playwright (resumen)
1. Ir a `http://localhost:5173/login`
2. Llenar con credenciales del rol
3. Click "Entrar"
4. Verificar que redirige a `/dashboard`
5. Verificar que el sidebar muestra los items del rol
6. Navegar a páginas clave del rol y verificar que cargan o muestran el error esperado

### Matriz de bugs (verificación con curl)
```bash
# Login y guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"socio1-central@nutrifit.com","contrasena":"123456"}' | jq -r .data.token)

# Testear endpoint bug
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/turnos/socio/mis-turnos
# Esperado: 500 (bug)
```

---

## 7. Archivos tocados / creados en esta sesión

### Backend
- `apps/backend/src/infrastructure/auth/tenant-context.module.ts` — fix (useFactory + inject).
- `apps/backend/src/infrastructure/auth/tenant-context.module.spec.ts` — nuevo, test de regresión.
- `apps/backend/src/infrastructure/auth/guards/auth.guard.ts` — fix raíz: `setFromPayload` post-validación JWT.
- `apps/backend/src/infrastructure/auth/guards/auth.guard.spec.ts` — actualizado con mock de `TenantContextService`.
- `apps/backend/src/infrastructure/auth/guards/socio-resource-access.guard.ts:124` — fix `body ?? {}` para GET requests.

### Documentación
- `docs/iteraciones/iteracion-1.md` — CUD01-CUD22 + RF01-RF26 + RB01-RB17 + estados turno.
- `docs/iteraciones/iteracion-2.md` — CUD23-CUD30 + RF27-RF40 + RB18-RB26 + flujos.
- `docs/iteraciones/estado-actual.md` — mapa módulos + 10 bugs priorizados.
- `docs/iteraciones/reporte-e2e-auth-2026-06-02.md` — **este reporte**.

### Temporales (borrados al finalizar)
- `apps/backend/e2e-matrix.ts` — script in-memory con la matriz completa.
- `apps/backend/e2e-inspect.ts` — script para inspeccionar los 500.
- `apps/backend/debug-bugs.ts` — script in-memory para capturar stack traces de los 13 endpoints.
- `apps/frontend/e2e-playwright.js` — script Playwright para los 4 roles.

---

## 8. Próximos pasos sugeridos (para Agustín)

### Inmediato (antes de la entrega)
1. ✅ ~~Arreglar los 7 P0 de SOCIO~~ — HECHO.
2. ✅ ~~Arreglar los 4 P1 de NUTRI~~ — HECHO.
3. ✅ ~~Arreglar los 2 P1 de ADMIN~~ — HECHO.
4. Cambiar el mensaje engañoso de `/admin/auditoria` para SUPERADMIN.
5. Mostrar el error real en el dashboard de SOCIO en lugar de "Cargando..." infinito.
6. Fix sidebar SUPERADMIN: `/gimnasios` no existe, debería apuntar a `/admin/gimnasios`.

### Corto plazo
7. Evaluar agregar `nodemon` o `ts-node-dev` al `start:dev` del backend (ahora `ts-node` plano, no hay hot reload).
8. El RBAC de `/recepcionistas` (200 para todos) y `/agenda/:id` (403 para todos) están sobre/sub restringidos.
9. Decidir si `AppErrorFilter` debe loguear el stack (al menos en `NODE_ENV=dev`) para futuras debugs.

### Bugs restantes del `estado-actual.md` (no críticos)
10. `@Public()` faltante en `confirmar`/`cancelar` turno (rutas con token en URL deben ser públicas).
11. `findByEmail()` real (no `findByEmailWithPassword`) en flujos de admin.
12. Scheduler de ausencias con `gimnasioId` real (no hardcoded).
13. IA con ficha de salud del socio (no datos mock).
14. `motivo` obligatorio al editar/eliminar plan de alimentación.

---

## 9. Iteración 2 — UX quick wins + bugs de estado-actual.md (2026-06-02 15:00 UTC)

### 9.1 Resumen de cambios

| # | Bug | Archivos tocados | Tests | Estado |
|---|-----|------------------|-------|--------|
| 1a | `/admin/auditoria` permitía solo ADMIN, mensaje engañoso para SUPERADMIN | `Sidebar.tsx`, `AdminAuditoriaPage.tsx`, `admin-auditoria.controller.ts` + spec | +1 test (SUPERADMIN sin gimnasioId) | ✅ Fixeado |
| 1b | Sidebar SUPERADMIN apuntaba a `/gimnasios` | — | — | ✅ Ya estaba OK (apuntaba a `/admin/gimnasios`) |
| 2 | Dashboard SOCIO con "Cargando..." infinito en errores | `EstadoErrorCard.tsx` (nuevo) + 3 cards | Sin tests (frontend) | ✅ Fixeado |
| 3 | Backend sin hot reload (`ts-node` plano) | `apps/backend/package.json` + `nodemon.json` (nuevo) | N/A | ✅ Fixeado (nodemon 3.1.14) |
| 4a | Confirmar/cancelar turno por token sin `@Public()` | `turnos.controller.ts` | Sin cambios | ✅ Fixeado |
| 4b | `NutricionistaRepository.findByEmail()` retornaba null | `nutricionista.repository.ts` | Sin cambios (test pendiente) | ✅ Fixeado |
| 4c | `AusenciaTurnoScheduler` con `gimnasioId ?? 1` hardcoded | `ausencia-turno.scheduler.ts` | Sin cambios | ✅ Fixeado |
| 4d | `GenerarIdeasComidaUseCase` no usaba ficha de salud del paciente | `generar-ideas-comida.use-case.ts` | Sin cambios (test pendiente) | ✅ Fixeado |
| 4e | `motivo` obligatorio en editar/eliminar plan | — | — | ✅ Ya estaba OK (DTO validaba con `@IsNotEmpty()`) |

### 9.2 Detalle de cada fix

**1a. Auditoría SUPERADMIN**: El controller ahora acepta rol `SUPERADMIN` además de `ADMIN`. Para SUPERADMIN ya no es obligatorio pasar `gimnasioId` (es admin global, ve todos los gimnasios). El frontend ahora muestra el link en el sidebar y permite el acceso.

**2. Dashboard SOCIO error states**: Se creó `EstadoErrorCard.tsx` reutilizable (icono + mensaje + botón "Reintentar"). Se aplicó a `PlanAlimenticioCard`, `GraficoProgresoCard` y `ObjetivosCard`. Antes, cuando el endpoint fallaba con 500/timeout, los cards caían en el "empty state" mostrando "No tenes un plan..." (engañoso). Ahora muestran el error real y permiten reintentar con `refetch()` de react-query.

**3. Nodemon**: Se reemplazó `start:dev` de `ts-node` plano a `nodemon` con config en `nodemon.json`. Watch solo en `src/`, ignora specs y dist. `npm run start:dev` ahora reinicia automáticamente ante cualquier cambio en código fuente.

**4a. @Public() confirmar/cancelar turno**: Los endpoints `POST /turnos/:id/confirmar` y `POST /turnos/:id/cancelar` (que reciben `?token=...` desde links de email) estaban bajo el `JwtAuthGuard` global. Se agregó `@Public()` a ambos. Ahora se puede acceder vía link de email sin necesidad de JWT.

**4b. findByEmail real**: Se implementó con un `findOne` que busca por la relación `usuario.email` (lowercase, trim). Antes retornaba `null` siempre, permitiendo emails duplicados silenciosamente.

**4c. Scheduler gimnasioId real**: Se eliminó el fallback `?? 1`. Si un turno no tiene gimnasio asignado, se loguea warning y se omite (no se aplica política de un gimnasio incorrecto).

**4d. IA con ficha de salud**: `GenerarIdeasComidaUseCase` ahora invoca `PrepararContextoPacienteUseCase` para obtener alergias, patologías, medicamentos y objetivo del paciente. Si la ficha no existe, continúa sin contexto (no rompe). El prompt ahora incluye una sección "CONTEXTO CLINICO DEL PACIENTE" y reglas explícitas para que la IA evite ingredientes contraindicados.

**4e. motivo obligatorio**: Verificado que el DTO `editar-plan-alimentacion.dto.ts` y `eliminar-plan-alimentacion.dto.ts` ya validan `motivoEdicion` y `motivoEliminacion` con `@IsString()` + `@IsNotEmpty()` + `@MaxLength(255)`. No requirió cambios.

### 9.3 Verificación

- **Backend tests**: 74 suites, 377 tests, 0 fallidos (subió de 376 → 377 por el test nuevo de SUPERADMIN en auditoría).
- **Frontend typecheck**: 0 errores en los 4 archivos modificados (`EstadoErrorCard`, `PlanAlimenticioCard`, `GraficoProgresoCard`, `ObjetivosCard`). El único error del typecheck general es un test preexistente roto (`Configuracion.test.tsx`) que NO fue tocado en esta sesión.
- **Cambios pendientes de restart del backend** (por la regla "nunca levantar servers"): 1a, 4a, 4b, 4c, 4d. El usuario debe reiniciar el server con `npm run start:dev` (ahora con nodemon, restart automático al guardar).
- **Cambios ya visibles con HMR del frontend**: 1a (link en sidebar), 2 (error states). No requieren reinicio.

### 9.4 Archivos modificados

#### Frontend
- `apps/frontend/src/components/dashboard/EstadoErrorCard.tsx` (NUEVO)
- `apps/frontend/src/components/dashboard/PlanAlimenticioCard.tsx`
- `apps/frontend/src/components/dashboard/GraficoProgresoCard.tsx`
- `apps/frontend/src/components/dashboard/ObjetivosCard.tsx`
- `apps/frontend/src/components/layout/Sidebar.tsx`
- `apps/frontend/src/pages/AdminAuditoriaPage.tsx`

#### Backend
- `apps/backend/src/presentation/http/controllers/turnos.controller.ts` (+imports `@Public`)
- `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.ts` (+test regresión SUPERADMIN)
- `apps/backend/src/presentation/http/controllers/admin-auditoria.controller.spec.ts` (+1 test)
- `apps/backend/src/infrastructure/persistence/typeorm/repositories/nutricionista.repository.ts`
- `apps/backend/src/infrastructure/schedulers/ausencia-turno.scheduler.ts`
- `apps/backend/src/application/ai/use-cases/generar-ideas-comida.use-case.ts`
- `apps/backend/package.json` (+ nodemon 3.1.7, scripts start:dev/start:debug → nodemon)
- `apps/backend/nodemon.json` (NUEVO)

---

*Reporte actualizado el 2026-06-02 a las 15:30 UTC por el agente opencode. Estado: login funciona, los 13 endpoints 500 están fixeados, 377/377 tests verdes, 4 bugs de estado-actual.md fixeados, 3 UX bugs resueltos, backend con nodemon.*
