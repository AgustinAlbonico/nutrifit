# Rol SUPERADMIN — Capacidades, gaps y plan de acción

> **TL;DR**: el súper admin no tiene experiencia propia cross-tenant. Su modelo mental es **impersonar a un gimnasio y operar como admin de ese gimnasio**. El flujo de impersonación está implementado y funciona, pero tiene tres problemas de UX/alcance altos: (1) el `TenantSwitcher` solo se ve dentro de `/configuracion`, no es discoverable; (2) cuando impersonás, el `rol` del JWT sigue siendo `SUPERADMIN`, así que el sidebar y el dashboard **no se adaptan** al contexto de admin; (3) el `expiraEn` que devuelve el backend miente. El fix empieza por el frontend.

## Quick path (qué hacer primero)

1. Montar el `TenantSwitcher` en un **header global** (visible siempre, no escondido en Configuración).
2. Hacer que el **sidebar y el dashboard se adapten cuando `estaImpersonando`**, mostrando los items de ADMIN.
3. Después de impersonar, **navegar al dashboard y forzar `refetchQueries`** (no dejar al usuario en una pantalla con datos stale).
4. Corregir el `expiraEn` del backend para que devuelva el TTL real (o leer `iat + exp` del JWT en el frontend).
5. Auditoría: registrar `IMPERSONAR_INICIO` y `IMPERSONAR_FIN` en la tabla `auditoria`.
6. Validar que el gimnasio impersonado no esté soft-deleted.

---

## Resumen ejecutivo

| Tema | Estado | Severidad | Acción |
|------|--------|-----------|--------|
| Use-case de impersonación | Funcional, bien validado | OK | nada |
| Persistencia y refresh | Funciona (localStorage) | OK | nada |
| Triple punto de salida (banner, sidebar, dropdown) | Implementado | OK | nada |
| `TenantSwitcher` discoverable | Solo en `/configuracion` | Alta | mover a header global |
| Sidebar/dashboard se adaptan al impersonar | No, `rol` sigue siendo SUPERADMIN | Alta | branching por `estaImpersonando` |
| Post-impersonar: navegación + invalidación | No hay | Alta | navegar a `/dashboard` + `refetchQueries` |
| `expiraEn` real del backend | Miente (hardcode `'2h'`) | Alta | calcular de `JWT_EXPIRES_IN` o del claim `exp` |
| Auditoría de inicio/fin de impersonación | No existe | Media | agregar eventos en `auditoria` |
| Validación de gimnasio activo | No se chequea `fechaBaja` | Media | bloquear gyms soft-deleted |
| `ImpersonationIndicator` muy sutil | Estilo gris, no "warning" | Media | estilo amarillo/naranja fixed-top |
| `RolesGuard` no bypassa SUPERADMIN | Bug aparte, sigue aplicando cuando no impersona | Media | fix 3 líneas |
| Header `X-Gimnasio-Id` | Se manda pero no se usa | Baja | remover o usar como segunda capa |
| `gimnasioActual` persistencia | Por accidente, no por diseño | Baja | incluirlo en el useEffect |
| `(payload as any).impersonatedBy` | Casteo feo | Baja | tipar el claim |

---

## Cómo funciona el flujo de impersonación HOY

### Diagrama narrativo (end-to-end)

```
[1] SUPERADMIN entra a /admin/gimnasios/$id
    GimnasioDetailPage.tsx:130-138

[2] Click en botón "Impersonar"
    mutation llama a AuthContext.impersonarGimnasio(gimnasioId)
    AuthContext.tsx:240-270

[3] Frontend hace POST /gimnasios/:id/impersonar
    con su token ORIGINAL (no el impersonado)
    gimnasio.service.ts:67-78

[4] Backend ejecuta ImpersonarUsuarioUseCase
    impersonar-usuario.use-case.ts:60-100
    Valida: gimnasio existe, usuario no-SUPERADMIN, gym coincide,
            persona activa, devuelve NotFoundError o BadRequestError

[5] Backend genera JWT nuevo con:
    rol: SUPERADMIN  (mantiene super)
    gimnasioId: <id target>  (cambia tenant)
    acciones: [...TODAS_LAS_ACCIONES]
    impersonatedBy: <id superadmin>
    jti: randomUUID
    impersonar-usuario.use-case.ts:106-118

[6] Frontend guarda en localStorage:
    - token: <nuevo>
    - tokenOriginal: <anterior>  (preservado)
    - gimnasioId: <target>
    - impersonatedBy: <superadmin>
    - gimnasioActual: <entidad completa>
    AuthContext.tsx:240-270

[7] A partir de acá, TODAS las requests salen con el token impersonado
    api.ts: agrega Authorization: Bearer <token impersonado>

[8] Backend (auth.guard.ts:48-71):
    - Verifica JWT firmado
    - Valida que tenga gimnasioId (excepto si rol === SUPERADMIN)
    - setFromPayload(payload) en TenantContextService
    - Downstream: tenantContext.gimnasioId devuelve el del target

[9] Para salir: salirDeImpersonacion()  (100% cliente)
    - Restaura token: auth.tokenOriginal
    - Limpia gimnasioId, impersonatedBy, gimnasioActual
    - AuthContext.tsx:272-285
    - Sin endpoint, sin request
```

### Lo que está BIEN y NO hay que tocar

- El use-case valida: gimnasio existe, no-SUPERADMIN, gym coincide, persona activa. (`impersonar-usuario.use-case.ts:60-100`)
- Triple punto de salida: `ImpersonationIndicator` (banner), sidebar footer (botón X), `TenantSwitcher` dropdown. Todos llaman al mismo `salirDeImpersonacion`.
- Persistencia: el `useEffect` línea 130-137 de `AuthContext` sincroniza a localStorage ante cualquier cambio. El refresh del browser preserva la impersonación.
- El `tokenOriginal` no se sobreescribe con el impersonado, así que podés re-impersonar N veces y siempre volver al original.
- `findFirstAdminByGimnasioId` filtra `rol: 'ADMIN'` en el `where`, así que un SUPERADMIN nunca puede ser objetivo.
- `TenantContextService.setFromPayload(payload)` se llama explícitamente desde el guard para evitar el bug de instanciación temprana de NestJS.

### Lo que está MAL o medio colgado (ordenado por severidad)

#### Alta

1. **`TenantSwitcher` no discoverable** (`TenantSwitcher.tsx`)
   - Solo se monta en `Configuracion.tsx:270`, dentro de la card "Contexto de Trabajo".
   - Para entrar a impersonar, el SUPERADMIN tiene que ir a `/configuracion`.
   - El sidebar y el `MainLayout` no lo muestran.
   - **Fix**: mover a un header global (sticky-top, junto al `ImpersonationIndicator` o reemplazándolo según el estado).

2. **Sidebar y Dashboard no se adaptan al impersonar** (`Sidebar.tsx`, `Dashboard.tsx`)
   - El `rol` del JWT impersonado sigue siendo `SUPERADMIN`.
   - El sidebar filtra por `rol` (línea 168): siguen apareciendo "Gimnasios", "Auditoría", pero **NO** aparecen "Socios", "Nutricionistas", "Turnos del día".
   - El `Dashboard` ramifica por `rol` (líneas 9-22): SUPERADMIN cae al placeholder genérico con badge de rol y grid de permisos.
   - El usuario impersona, ve el sidebar "global", y se confunde.
   - **Fix**: agregar branch por `estaImpersonando` en el sidebar y el dashboard. Si está impersonando, mostrar items de ADMIN (`['ADMIN']` que ya están) + `ImpersonationIndicator` prominente.

3. **Post-impersonar: no hay navegación ni invalidación** (`GimnasioDetailPage.tsx:130-138`)
   ```tsx
   const mutationImpersonar = useMutation({
     mutationFn: () => impersonarGimnasioFromAuth(gimnasioId),
     onSuccess: () => {
       toast.success(`Ahora operás como ADMIN de este gimnasio`);
     },
   });
   ```
   - Solo muestra toast, no navega, no invalida queries.
   - El usuario queda en `/admin/gimnasios/$id` con datos potencialmente stale.
   - El `useQuery` del gimnasio tiene `queryKey: ['gimnasios', gimnasioId, token]`, así que **la siguiente navegación puede ver datos del gimnasio viejo**.
   - **Fix**: en `onSuccess` hacer `navigate({ to: '/dashboard' })` + `queryClient.invalidateQueries()` o `refetchQueries()`.

4. **`expiraEn: '2h'` miente** (`impersonar-usuario.use-case.ts:134`)
   ```ts
   return {
     // ...
     expiraEn: '2h',  // hardcodeado, no se calcula
   };
   ```
   - El `sign()` del `JwtServiceImpl` (`apps/backend/src/infrastructure/services/jwt/jwt.service.ts:12-14`) NO acepta options.
   - El TTL real viene de `JWT_EXPIRES_IN` env (`environment-config.service.ts:67-69`).
   - El frontend no puede calcular cuándo expira la sesión de impersonación.
   - Cuando vence, el `apiRequest` recibe 401 → `api.ts:169-173` hace `localStorage.removeItem` y hard redirect a `/login`. El usuario pierde también el `tokenOriginal`.
   - **Fix A** (backend): calcular el `expiraEn` real haciendo `jwtService.sign()` y leyendo el claim `exp` decodificado, o devolviendo `iat + expiresIn`.
   - **Fix B** (frontend): ignorar `expiraEn` y leer `exp` del JWT decodificado directamente (más robusto).

#### Media

5. **Sin audit log de inicio/fin de impersonación** (`apps/backend/src/application/gimnasios/use-cases/`)
   - El enum `AccionAuditoria` (`apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts:13-25`) tiene `LOGIN_EXITO`, `LOGIN_FALLO`, `FICHA_ACCESO`, `PLAN_*`, `CONSULTA_*`, `ADJUNTO_*`, `TURNO_ESTADO_CAMBIO` — **no hay `IMPERSONAR_INICIO` ni `IMPERSONAR_FIN`**.
   - El use-case no llama a `auditoriaService.registrar`.
   - Solo el claim `impersonatedBy` del JWT permite reconstruir la cadena desde la tabla `auditoria` mirando `usuarioId` + `gimnasioId`.
   - **Fix**: agregar dos acciones al enum y registrar en `impersonar` y en un nuevo endpoint / hook de "salir" (que hoy no existe, ver #5b).

6. **No hay endpoint de "salir de impersonación"** (`AuthContext.tsx:272-285`)
   - El exit es 100% cliente.
   - No hay forma de registrar el evento `IMPERSONAR_FIN` en el backend.
   - **Fix opcional**: agregar `POST /auth/exit-impersonation` que reciba el `jti` del token impersonado y registre la auditoría, devolviendo el `tokenOriginal` (que el backend podría cachear firmado).

7. **Gimnasio soft-deleted se puede impersonar** (`impersonar-usuario.use-case.ts:60-72`)
   - El `findById` del `GimnasioRepositoryImpl` (`gimnasio.repository.impl.ts:48-54`) NO filtra `fechaBaja: IsNull()`.
   - El check de "persona activa" (línea 96) sí valida `persona.fechaBaja`, pero NO el gimnasio.
   - Un gimnasio dado de baja puede ser impersonado y los datos se filtran por `gimnasioId` (que tampoco chequea activo en los `where` de los repos).
   - **Fix**: después del `findById`, agregar:
     ```ts
     if (gimnasio.fechaBaja !== null) {
       throw new BadRequestError('No se puede impersonar un gimnasio dado de baja');
     }
     ```

8. **`ImpersonationIndicator` muy sutil** (`ImpersonationIndicator.tsx`)
   - Estilo actual: gradiente `primary/10` (azul/verde suave), texto gris.
   - En un sistema con impersonación de SUPERADMIN, debería ser intrusivo: amarillo/naranja, fixed-top, no dismissable.
   - Hoy es fácil olvidarse de que estás impersonando y operar datos del gimnasio equivocado.
   - **Fix**: cambiar estilo a `bg-yellow-100 border-yellow-500 text-yellow-900`, agregar icono de advertencia, fixed-top.

9. **`RolesGuard` no bypassa SUPERADMIN** (`apps/backend/src/infrastructure/auth/guards/roles.guard.ts:22-35`)
   - Cuando el SUPERADMIN NO está impersonando y quiere entrar a un controller con `@Rol(ADMIN)` (ej: `/admin/estadisticas`), falla 403.
   - El `ActionsGuard` sí lo bypassa (línea 51-55), pero el `RolesGuard` no.
   - Afecta 13+ controllers (`planes-alimentacion`, `progreso`, `socios`, `profesional`, `recepcionistas`, `turnos`, `alimentos`, `ai`, `admin/admin-estadisticas`, `admin/admin-reportes`, `admin/configuracion`, `agenda`, `notificaciones`).
   - **Fix**: 3 líneas en el guard, agregar bypass de `Rol.SUPERADMIN` antes del `return requiredRoles.includes(...)`.

#### Baja

10. **Header `X-Gimnasio-Id` se manda pero no se lee** (`api.ts:143-145` vs. backend grep = 0 matches).
    - Decorativo. El backend confía en el JWT, no en headers.
    - **Fix**: remover del frontend, o hacerlo opcional como segunda capa.

11. **`gimnasioActual` se persiste por accidente** (`AuthContext.tsx:43-54, 130-137`).
    - El state inicial se hidrata desde `parsed.gimnasioActual` del JSON, pero el `useEffect` que sincroniza a localStorage solo persiste `auth`, no `gimnasioActual`.
    - Funciona porque el JSON se reescribe entero y `gimnasioActual` queda embebido por casualidad, pero no es robusto.
    - **Fix**: incluir `gimnasioActual` explícitamente en el useEffect, o moverlo dentro de `auth`.

12. **`(payload as any).impersonatedBy`** (`impersonar-usuario.use-case.ts:118`).
    - La interface `JwtPayload` ya declara `impersonatedBy?: number` (en `apps/backend/src/domain/services/jwt.service.ts:24-25`).
    - **Fix**: remover el casteo a `any`, asignar directo al `payload.impersonatedBy`.

---

## Lo que el súper admin DEBERÍA poder hacer (modelo impersonación)

### 1. Entrar a impersonar (discoverability)

- ✅ Impersonar al admin de un gimnasio desde la lista de gimnasios. **(funciona)**
- ✅ Impersonar a un admin específico por email desde el detalle. **(funciona)**
- ❌ **Descubrir el flujo sin tener que ir a Configuración** — hoy el `TenantSwitcher` está escondido.
- ❌ **Ver un indicador claro de "no estás impersonando a nadie"** (estado neutro).
- ❌ **Buscar gimnasios por nombre** en el dropdown (la lista puede ser larga).

### 2. Operar como admin de un gimnasio (UX)

- ❌ **Ver el sidebar de admin** (Socios, Nutricionistas, Turnos del día, Recepción) cuando impersona.
- ❌ **Ver el dashboard con datos del gimnasio impersonado** (no el genérico de SUPERADMIN).
- ❌ **Navegar fluidamente** a todas las secciones que un admin real puede tocar.
- ❌ **Mantener el `ImpersonationIndicator` siempre visible** mientras esté impersonando.
- ❌ **Ver claramente qué gimnasio está operando** (no solo en el banner, también en el header).

### 3. Salir de impersonar (UX clara)

- ✅ Tres puntos de salida ya implementados (banner, sidebar, dropdown).
- ❌ **Confirmación al salir** — "Estás por salir del gimnasio X. ¿Continuar?" (porque la acción es destructiva del contexto de trabajo).
- ❌ **Toast al salir** confirmando "Volviste a modo SUPERADMIN".
- ❌ **Navegación al dashboard de SUPERADMIN** al salir (hoy queda en la página actual).

### 4. Supervisar sin impersonar (opcional)

- ❌ **Ver KPIs cross-tenant** desde un panel global: cantidad de gimnasios activos, usuarios totales, turnos del mes, planes generados.
- ❌ **Ver actividad reciente** de todos los gimnasios (últimas impersonaciones, logins, altas).
- ❌ **Filtrar auditoría por gimnasio** (el endpoint lo permite, la UI no expone el filtro `gimnasioId`).

> **Nota**: este panel global es **opcional** y no es la pantalla principal. Si se implementa, debería ser un link en el sidebar de SUPERADMIN, NO el dashboard por defecto. El dashboard por defecto de SUPERADMIN puede ser "listado de gimnasios para impersonar".

### 5. Auditoría de impersonaciones

- ❌ **Registrar `IMPERSONAR_INICIO`** en la tabla `auditoria` con: superadminId, gimnasioId, usuarioObjetivoId, jti, timestamp.
- ❌ **Registrar `IMPERSONAR_FIN`** con: superadminId, gimnasioId, jti, duracion.
- ❌ **Endpoint `GET /admin/auditoria?accion=IMPERSONAR_INICIO`** para listar el historial.

### 6. Seguridad

- ❌ **Bloquear gimnasios soft-deleted** (fix #7).
- ❌ **TTL más corto para sesiones impersonadas** (ej: 1h vs 8h para login normal).
- ❌ **Rate limiting** de impersonaciones (un SUPERADMIN no debería poder impersonar 50 veces por minuto).

---

## Decisión de diseño: ¿mantener `rol: SUPERADMIN` en el JWT impersonado?

**El backend deliberadamente mantiene el `rol: SUPERADMIN`** (comentario en `impersonar-usuario.use-case.ts:102-105`):
> *"Generate JWT keeping SUPERADMIN rol + all actions so the impersonation session retains access to system-wide endpoints (e.g. /gimnasios listing) while the gimnasioId scopes data to the target gym."*

### Opción A — Mantener `rol: SUPERADMIN` en backend, adaptar frontend (RECOMENDADA)

- El JWT sigue con `rol: SUPERADMIN` y todas las acciones.
- El frontend detecta `estaImpersonando` y cambia el sidebar/dashboard como si fuera ADMIN.
- Pros: cero cambios en backend, no se rompe el acceso a endpoints system-wide.
- Contras: hay que mantener dos sets de items en el sidebar, lógica de "rol efectivo" en el frontend.

### Opción B — Cambiar `rol: ADMIN` + acciones reales del admin impersonado

- El JWT dice `rol: ADMIN` y solo las acciones del usuario impersonado.
- El sidebar/dashboard se adapta solo con la lógica existente de filtrado por `rol`.
- Pros: cero lógica especial en frontend.
- Contras: ¿qué pasa si el SUPERADMIN necesita un endpoint system-wide **mientras impersona** (ej: listar todos los gimnasios)? Habría que agregar esos endpoints a las acciones de ADMIN o hacer un bypass.

**Recomendación**: **A** para arrancar. Es 1-2 hs de trabajo, no toca backend, y el modelo mental del usuario (sidebar = acciones disponibles) se mantiene. La Opción B es una refactorización más grande que puede esperar.

---

## Plan priorizado

### P0 — bloqueante (UX de impersonación, 4-6 horas)

| # | Acción | Archivo | Esfuerzo |
|---|---|---|---|
| 1 | Montar `TenantSwitcher` en header global (visible para SUPERADMIN, fixed-top) | `apps/frontend/src/components/layout/MainLayout.tsx` + nuevo `TopBar.tsx` | 30 min |
| 2 | `GimnasioDetailPage`: al impersonar, navegar a `/dashboard` + `queryClient.invalidateQueries()` | `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx:130-138` | 15 min |
| 3 | Sidebar: cuando `estaImpersonando`, mostrar items de ADMIN en vez de SUPERADMIN | `apps/frontend/src/components/layout/Sidebar.tsx:59-156, 168` | 30 min |
| 4 | Dashboard: cuando `estaImpersonando`, mostrar dashboard de admin (reusar lógica existente) | `apps/frontend/src/pages/Dashboard.tsx:9-22` | 15 min |
| 5 | `ImpersonationIndicator`: estilo amarillo/naranja fixed-top, no dismissable | `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` | 15 min |
| 6 | `expiraEn` real: calcularlo en backend leyendo `iat + expiresIn` del JWT firmado | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts:106-118, 134` | 30 min |

### P1 — importante (seguridad + supervisión, 3-4 horas)

| # | Acción | Archivo | Esfuerzo |
|---|---|---|---|
| 7 | Bloquear gimnasios soft-deleted en `impersonar` | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts:60-72` | 5 min |
| 8 | Fix `RolesGuard` con bypass de SUPERADMIN (3 líneas) | `apps/backend/src/infrastructure/auth/guards/roles.guard.ts:22-35` | 5 min |
| 9 | Agregar `IMPERSONAR_INICIO` y `IMPERSONAR_FIN` al enum `AccionAuditoria` | `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts:13-25` | 10 min |
| 10 | Registrar `IMPERSONAR_INICIO` en el use-case | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` | 20 min |
| 11 | Endpoint `POST /auth/exit-impersonation` (registra `IMPERSONAR_FIN` + devuelve `tokenOriginal`) | `apps/backend/src/presentation/http/controllers/auth.controller.ts` + use-case | 1-2 hs |
| 12 | Conectar `salirDeImpersonacion` del frontend al nuevo endpoint | `apps/frontend/src/contexts/AuthContext.tsx:272-285` | 15 min |
| 13 | TTL más corto para impersonación (ej: 1h vs 8h default) | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` + config | 30 min |
| 14 | Test E2E del flujo de impersonación completo (Playwright) | nuevo | 1-2 hs |

### P2 — nice-to-have (supervisión, 4-6 horas)

| # | Acción | Archivo | Esfuerzo |
|---|---|---|---|
| 15 | Panel global opcional para SUPERADMIN (KPIs cross-tenant) en `/admin/global` | nueva página + endpoint | 4-6 hs |
| 16 | Búsqueda de gimnasios en el `TenantSwitcher` | `apps/frontend/src/components/admin/TenantSwitcher.tsx` | 30 min |
| 17 | Filtro `gimnasioId` en `AdminAuditoriaPage` | `apps/frontend/src/pages/AdminAuditoriaPage.tsx:42-47, 79-84` | 30 min |
| 18 | Confirmación al salir de impersonación (modal) | `apps/frontend/src/contexts/AuthContext.tsx:272-285` + UI | 30 min |
| 19 | Toast al entrar/salir de impersonación | ya hay toast al entrar, falta al salir | 5 min |

### P3 — limpieza (1 hora)

| # | Acción | Archivo | Esfuerzo |
|---|---|---|---|
| 20 | Remover header `X-Gimnasio-Id` o usarlo como segunda capa | `apps/frontend/src/lib/api.ts:143-145` | 5 min |
| 21 | Persistir `gimnasioActual` explícitamente en el useEffect | `apps/frontend/src/contexts/AuthContext.tsx:130-137` | 5 min |
| 22 | Tipar `impersonatedBy` sin casteo a `any` | `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts:118` | 5 min |
| 23 | Rate limiting de impersonaciones (ej: 10 por minuto) | nuevo guard o interceptor | 30 min |
| 24 | Documentar regla "SUPERADMIN hereda todo, en impersonación conserva `rol: SUPERADMIN`" en AGENTS.md | `AGENTS.md` | 10 min |

---

## Archivos clave (para abrir sí o sí)

### Backend

- `apps/backend/src/application/gimnasios/use-cases/impersonar-usuario.use-case.ts` (137 líneas) — el corazón del flujo
- `apps/backend/src/presentation/http/controllers/gimnasios.controller.ts:122-141` — endpoint `POST /gimnasios/:id/impersonar`
- `apps/backend/src/infrastructure/auth/guards/auth.guard.ts:48-71` — verificación del JWT + `setFromPayload`
- `apps/backend/src/infrastructure/auth/tenant-context.service.ts:26-36, 74-81` — service request-scoped
- `apps/backend/src/infrastructure/auth/guards/roles.guard.ts:22-35` — **bug del bypass**
- `apps/backend/src/infrastructure/auth/guards/actions.guard.ts:51-55` — bypass correcto, de referencia
- `apps/backend/src/infrastructure/persistence/typeorm/entities/auditoria.entity.ts:13-25` — enum `AccionAuditoria`
- `apps/backend/src/infrastructure/services/jwt/jwt.service.ts:12-14` — `sign()` sin options
- `apps/backend/src/infrastructure/persistence/typeorm/repositories/gimnasio.repository.impl.ts:48-54` — `findById` sin filtro soft-delete

### Frontend

- `apps/frontend/src/contexts/AuthContext.tsx` (344 líneas) — state, persistencia, `impersonarGimnasio`, `salirDeImpersonacion`
- `apps/frontend/src/components/admin/TenantSwitcher.tsx` (172 líneas) — el switcher huérfano
- `apps/frontend/src/components/admin/ImpersonationIndicator.tsx` (48 líneas) — banner
- `apps/frontend/src/pages/admin/GimnasioDetailPage.tsx:130-138, 218-229` — botón Impersonar
- `apps/frontend/src/components/layout/MainLayout.tsx:5-18` — donde falta montar el switcher
- `apps/frontend/src/components/layout/Sidebar.tsx:59-156, 168, 286-343` — filtrado por rol + bloque "Impersonando"
- `apps/frontend/src/pages/Dashboard.tsx:9-22` — donde falta el branch por `estaImpersonando`
- `apps/frontend/src/pages/Configuracion.tsx:253-275` — donde está escondido el switcher
- `apps/frontend/src/services/gimnasio.service.ts:67-78` — `impersonarGimnasio`
- `apps/frontend/src/lib/api.ts:143-145, 169-173` — header `X-Gimnasio-Id` + manejo de 401

### Shared

- `packages/shared/src/types/rol.ts:2` — enum de roles
- `packages/shared/src/types/acciones.ts` — 34 acciones del sistema

---

## Checklist para reviewers

- [ ] `TenantSwitcher` está en un header global visible para SUPERADMIN.
- [ ] Al impersonar, el sidebar muestra los items de ADMIN (Socios, Nutricionistas, Turnos del día, etc.).
- [ ] Al impersonar, el dashboard muestra el de admin (no el placeholder genérico de SUPERADMIN).
- [ ] Al impersonar, se navega a `/dashboard` y se invalidan las queries.
- [ ] `ImpersonationIndicator` es amarillo/naranja fixed-top, no dismissable.
- [ ] `expiraEn` que devuelve el backend es real (no hardcodeado).
- [ ] `RolesGuard` bypassa a `SUPERADMIN` en cualquier `@Rol(...)`.
- [ ] Gimnasios soft-deleted no se pueden impersonar.
- [ ] Existe audit log de `IMPERSONAR_INICIO` y `IMPERSONAR_FIN`.
- [ ] El endpoint `POST /auth/exit-impersonation` registra auditoría y devuelve `tokenOriginal`.
- [ ] Test E2E cubre: entrar a impersonar, operar como admin, salir, refresh durante impersonación.
- [ ] No se puede impersonar a otro `SUPERADMIN` (regresión).
- [ ] Regla de "rol = SUPERADMIN en JWT impersonado" documentada en `AGENTS.md`.

---

## Próximo paso

Arrancar por **P0-1** (montar el `TenantSwitcher` en header global) + **P0-2** (navegar e invalidar al impersonar). Esos dos cambios solos ya mejoran el flujo un 50%. Después seguir con el branching del sidebar/dashboard (#3 y #4) que es lo que cierra el modelo "operar como admin".
