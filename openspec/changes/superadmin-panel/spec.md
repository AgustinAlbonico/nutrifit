# SDD Spec — SUPERADMIN Panel (Full Impersonation Mode)

**Change name**: `superadmin-panel`
**Artifact store**: `hybrid` (Engram + openspec)
**Topic key**: `sdd/superadmin-panel/spec`

## SPEC 1: AuthContext — rolEfectivo y rolOriginal

**Descripción**: El `AuthContext` debe trackear no solo el `rol` real del JWT (SUPERADMIN), sino también el `rolEfectivo` que determina la UI. Cuando NO se está impersonando: `rolEfectivo = rol` (SUPERADMIN). Cuando SÍ se está impersonando: `rolEfectivo = rol` del usuario impersonado (ADMIN). El `rolOriginal` del usuario impersonado se captura desde la respuesta del use-case de impersonación (`usuario.rol`).

**Requisitos**:
- Agregar campo `rolOriginal: string | null` al `AuthState`
- Agregar campo `rolEfectivo: string` calculado: `estaImpersonando ? rolOriginal : rol`
- El `rolEfectivo` se usa en `hasPermission`, `hasAllPermissions`, y se expone en el contexto para que Sidebar y Dashboard lo consuman
- Actualizar `impersonarGimnasio` para capturar `resultado.usuario.rol` y guardarlo en `rolOriginal`
- Actualizar `salirDeImpersonacion` para limpiar `rolOriginal` a `null`

**Criterios de aceptación**:
- [ ] `rolEfectivo === 'ADMIN'` cuando `estaImpersonando && rolOriginal === 'ADMIN'`
- [ ] `rolEfectivo === 'SUPERADMIN'` cuando `!estaImpersonando`
- [ ] `rolOriginal` se pasa de `resultado.usuario.rol` en la respuesta de impersonación
- [ ] `salirDeImpersonacion` limpia `rolOriginal` y restaura `rolEfectivo = rol`
- [ ] TypeScript compila sin errores

**Test scenarios**:
1. SUPERADMIN sin impersonar → `rolEfectivo = 'SUPERADMIN'`, `rolOriginal = null`
2. SUPERADMIN impersona admin de gimnasio → `rolEfectivo = 'ADMIN'`, `rolOriginal = 'ADMIN'`
3. SUPERADMIN impersona nutricionista → `rolEfectivo = 'NUTRICIONISTA'`, `rolOriginal = 'NUTRICIONISTA'`
4. Sale de impersonación → `rolEfectivo = 'SUPERADMIN'`, `rolOriginal = null`
5. Refresh del browser durante impersonación → `rolOriginal` se rehidrata correctamente

---

## SPEC 2: TenantSwitcher — mueven a sidebar header

**Descripción**: El `TenantSwitcher` actualmente está escondido en `/configuracion` dentro de una card "Contexto de Trabajo". Debe moverse a una posición prominente en el sidebar header (o top bar global) para que el SUPERADMIN lo vea siempre que está logueado sin tener que navegar a ningún lado. Debe mostrar: (a) si NO está impersonando — un dropdown con la lista de gimnasios para seleccionar, (b) si SÍ está impersonando — el nombre del gimnasio actual con badge "Impersonando" y opción de salir.

**Requisitos**:
- El `TenantSwitcher` se monta en `MainLayout` como un componente de header (antes del `<Sidebar>` o integrado en el header del sidebar)
- Cuando `!estaImpersonando`: renderiza un dropdown de gimnasios con búsqueda por nombre, mostrando "(Inactivo)" como badge si `!gimnasio.activo`
- Cuando `estaImpersonando`: renderiza un badge con el nombre del gimnasio impersonado + botón "Salir de impersonación"
- Incluir ícono de `Building2` para contexto visual
- Mantener la funcionalidad existente: `manejarImpersonacion`, `manejarSalidaImpersonacion`, `cargarGimnasios`
- El dropdown debe permitir buscar/filtrar gimnasios por nombre mientras se escribe

**Criterios de aceptación**:
- [ ] `TenantSwitcher` visible en el header de SUPERADMIN sin necesidad de navegar a Configuración
- [ ] Dropdown muestra todos los gimnasios con nombre y badge de estado (Inactivo/Activo)
- [ ] Búsqueda filtra la lista mientras se escribe
- [ ] Click en gimnasio activa `manejarImpersonacion` 
- [ ] Cuando impersonando, muestra gym actual + botón "Salir"
- [ ] El component es responsive y no rompe el layout del sidebar

**Test scenarios**:
1. SUPERADMIN logueado, no impersonando → dropdown visible con lista de gimnasios
2. Escribe "fit" → dropdown filtra gimnasios con "fit" en el nombre
3. Click en gimnasio "Fit Center" → llama a `manejarImpersonacion`, muestra loading, actualiza UI
4. Durante impersonación → muestra badge "Fit Center (Impersonando)" + botón Salir
5. Click en "Salir" → llama `manejarSalidaImpersonacion`, restaura SUPERADMIN view

---

## SPEC 3: Sidebar — branching por rolEfectivo

**Descripción**: El sidebar actualmente filtra los links de navegación por `rol` del JWT (`link.roles.includes(rol)`). Debe cambiar a filtrar por `rolEfectivo`, de modo que cuando SÍ está impersonando, muestre la navegación de ADMIN (o del rol que corresponda) y cuando NO está impersonando, muestre la navegación de SUPERADMIN.

**Requisitos**:
- Cambiar la lógica de filtrado de `link.roles.includes(rol)` a `link.roles.includes(rolEfectivo)`
- Cuando `rolEfectivo === 'ADMIN'`: mostrar links de ADMIN: Socios, Nutricionistas, Turnos del día, Recepción, Configuración
- Cuando `rolEfectivo === 'SUPERADMIN'`: mostrar links de SUPERADMIN: Gimnasios, Auditoría, Permisos & Roles, Configuración
- Cuando `rolEfectivo === 'NUTRICIONISTA'`, etc.: mantener el comportamiento actual
- Mantener el bloque "Impersonando [gimnasio]" en el footer cuando `estaImpersonando`

**Criterios de aceptación**:
- [ ] `rolEfectivo === 'ADMIN'` → sidebar muestra "Socios", "Nutricionistas", "Turnos del día", "Recepción"
- [ ] `rolEfectivo === 'SUPERADMIN'` → sidebar muestra "Gimnasios", "Auditoría", "Permisos & Roles"
- [ ] Cada link tiene `roles: ['ADMIN']` correctos en la definición de `SidebarLink`
- [ ] El bloque "Impersonando" del footer sigue apareciendo cuando `estaImpersonando`
- [ ] El sidebar filtra correctamente sin impersonating

**Test scenarios**:
1. Sin impersonar — sidebar muestra items de SUPERADMIN
2. Impersonando admin — sidebar muestra items de ADMIN (no SUPERADMIN)
3. Impersonando nutricionista — nutricionista nav items
4. Todos los links visibles respetan la configuración de `roles` correcta del link

---

## SPEC 4: Dashboard — branching por estaImpersonando y rolEfectivo

**Descripción**: El Dashboard actualmente tiene branches para NUTRICIONISTA, SOCIO y RECEPCIONISTA pero no para ADMIN ni para SUPERADMIN. Cuando `estaImpersonando && rolEfectivo === 'ADMIN'`, debe mostrar el dashboard de ADMIN (datos del gimnasio impersonado). Cuando `!estaImpersonando && rol === 'SUPERADMIN'`, puede mostrar un dashboard landing simple o el placeholder genérico existente.

**Requisitos**:
- Cuando `estaImpersonando && rolEfectivo === 'ADMIN'`: mostrar un dashboard equivalente al de ADMIN real (reusar `DashboardAdmin` si existe, o construirlo)
- Cuando `!estaImpersonando && rol === 'SUPERADMIN'`: mostrar el dashboard genérico actual (badge de rol + grid de permisos)
- El branch `rol === 'ADMIN'` (sin impersonar) también debe renderizar `DashboardAdmin`
- Usar la misma estructura de `DashboardNutricionista` / `DashboardSocio` — no reinventar el patrón

**Criterios de aceptación**:
- [ ] `estaImpersonando && rolEfectivo === 'ADMIN'` → renders Dashboard de admin (datos scoped al gimnasio impersonado)
- [ ] `rol === 'ADMIN' && !estaImpersonando` → renders Dashboard de admin
- [ ] `rol === 'SUPERADMIN' && !estaImpersonando` → renders fallback genérico actual
- [ ] El dashboard se muestra dentro del layout principal (no full-page redirect)

**Test scenarios**:
1. ADMIN logueado (sin impersonar) → ve dashboard de admin
2. SUPERADMIN sin impersonar → ve fallback genérico
3. SUPERADMIN impersonando admin → ve dashboard de admin con datos del gimnasio impersonado
4. Cuando impersonando, el dashboard muestra datos del gimnasio impersonado (tenant-scoped)

---

## SPEC 5: ImpersonationIndicator — estilo prominente

**Descripción**: El `ImpersonationIndicator` actual es sutil (gradiente primary/10 azul/verde). Debe ser prominente: amarillo/ámbar fixed-top, no dismissable por sí solo, con el nombre del gimnasio impersonado y un botón "Salir" claro. Se integra en el `MainLayout` y es visible SOLO cuando `estaImpersonando`.

**Requisitos**:
- Estilo: fondo `bg-yellow-100` / borde `border-yellow-500` / texto `text-yellow-900` (o similar tono warning)
- Fixed top, sobre todo el contenido
- Muestra ícono de `Building2` + texto "Modo Impersonación" + nombre del gimnasio + botón "Salir"
- El botón "Salir" llama a `salirDeImpersonacion`
- NO hay botón de cerrar/ocultar — solo el "Salir"
- Si hay confirmación de salida pendiente (SPEC 6), este indicador sigue visible

**Criterios de aceptación**:
- [ ] Indicador visible y prominente cuando impersonando (no sutil)
- [ ] Muestra nombre del gimnasio impersonado
- [ ] Botón "Salir" funcional
- [ ] No se puede dismissar sin salir de la impersonación
- [ ] Estilo consistente con el resto de la UI (usa variables de tema existentes si es posible)

---

## SPEC 6: Confirmación de salida

**Descripción**: Antes de salir de la impersonación, mostrar un modal de confirmación para evitar salidas accidentales: "Estás por salir de la administración de [gimnasio]. ¿Continuar?"

**Requisitos**:
- Cuándo se muestra: antes de ejecutar `salirDeImpersonacion` (en el handler del botón "Salir", tanto en `ImpersonationIndicator` como en `TenantSwitcher` y en el bloque del sidebar)
- Modal: título "Salir de impersonación", cuerpo "[nombre del gimnasio]", botones "Cancelar" y "Salir"
- "Salir" del modal ejecuta `salirDeImpersonacion` y cierra el modal
- "Cancelar" cierra el modal sin ejecutar nada

**Criterios de aceptación**:
- [ ] Click en "Salir" del banner abre modal de confirmación
- [ ] Modal muestra el nombre del gimnasio actual
- [ ] "Cancelar" cierra el modal, no sale de impersonación
- [ ] "Salir" ejecuta `salirDeImpersonacion`, cierra modal, restore SUPERADMIN UI
- [ ] Si se cierra el modal con ESC o click fuera, se comporta como "Cancelar"

---

## SPEC 7: Post-impersonate navegación e invalidación

**Descripción**: Después de una impersonación exitosa, el usuario queda en `/admin/gimnasios/$id` con el token nuevo pero sin navegación ni invalidación de queries. Esto deja datos stale en caches de React Query.

**Requisitos**:
- En `GimnasioDetailPage`, después de que `mutationImpersonar` succeeds: hacer `queryClient.invalidateQueries()` y navegar a `/dashboard`
- Usar `navigate({ to: '/dashboard' })` de TanStack Router
- El toast de éxito ya existe (`toast.success`), mantenerlo

**Criterios de aceptación**:
- [ ] Después de impersonar, la navegación lleva a `/dashboard`
- [ ] Las queries de React Query se invalidan (no datos stale)
- [ ] El dashboard muestra los datos del gimnasio impersonado (gracias al nuevo token)

---

## SPEC 8: Backend — Audit events IMPERSONAR_INICIO e IMPERSONAR_FIN

**Descripción**: Agregar los eventos de auditoría para registrar el inicio y fin de cada sesión de impersonación. Esto permite trazabilidad completa de cuándo un SUPERADMIN entró a impersonar y cuándo salió.

**Requisitos**:
- Agregar al enum `AccionAuditoria` en `auditoria.entity.ts`: `IMPERSONAR_INICIO` y `IMPERSONAR_FIN`
- En `impersonar-usuario.use-case.ts`: después de generar el JWT, llamar al servicio de auditoría para registrar `IMPERSONAR_INICIO` con: `superadminId`, `gimnasioId`, `usuarioObjetivoId`, `jti`, `timestamp`
- Los datos del evento se extraen del `JwtPayload` generado (fields `id`, `gimnasioId`, `jti`)

**Criterios de aceptación**:
- [ ] Enum `AccionAuditoria` incluye `IMPERSONAR_INICIO` y `IMPERSONAR_FIN`
- [ ] Cada llamada a `POST /gimnasios/:id/impersonar` registra un evento `IMPERSONAR_INICIO` en la tabla `auditoria`
- [ ] El evento incluye los campos: `usuarioId`, `gimnasioId`, `jti`, `fecha`

---

## SPEC 9: Backend — Exit endpoint POST /auth/exit-impersonation

**Descripción**: Crear un endpoint `POST /auth/exit-impersonation` que el frontend llame en vez de ejecutar `salirDeImpersonacion` puramente en cliente. El endpoint valida que el usuario está realmente impersonando (tiene `impersonatedBy` en el JWT) antes de registrar `IMPERSONAR_FIN`.

**Requisitos**:
- Endpoint: `POST /auth/exit-impersonation`
- Auth: `JwtAuthGuard` (el usuario debe estar autenticado)
- El guard valida que `req.user.impersonatedBy != null` — si no está impersonando, devuelve `400 BadRequestError('No hay sesión de impersonación activa')`
- Registrar evento `IMPERSONAR_FIN` con: `superadminId` (de `req.user.id`), `gimnasioId` (de `req.user.gimnasioId`), `jti` (del JWT impersonado)
- El endpoint NO revoca el JWT original — la sesión se considera terminada del lado del servidor
- En el frontend: `salirDeImpersonacion` hace el request al endpoint y si falla por 4xx/5xx muestra error en vez de romper silenciosamente

**Criterios de aceptación**:
- [ ] `POST /auth/exit-impersonation` devuelve 200 cuando se está impersonando
- [ ] Devuelve 400 si no hay sesión de impersonación activa
- [ ] Registra `IMPERSONAR_FIN` en la tabla `auditoria`
- [ ] Frontend muestra error si el endpoint falla (en vez de silent localStorage clear)

---

## SPEC 10: Backend — Fix expiraEn real

**Descripción**: El `impersonar-usuario.use-case.ts` actualmente devuelve `expiraEn: '2h'` hardcodeado. Esto es mentira porque el TTL real viene del `JWT_EXPIRES_IN` de env. El frontend no puede calcular el expiry real.

**Requisitos**:
- Después de llamar a `jwtService.sign(payload)`, decodificar el JWT resultante (sin verificar la firma — ya fue probado que es válido) para extraer el claim `exp`
- Calcular `expiraEn` como la diferencia `exp - iat` en segundos
- Devolver ese valor en `ImpersonarResultado.expiraEn` (o como `expiresInSeconds`)
- Alternativa: que el use-case calcule el expiry a partir de la configuración y lo devuelva

**Criterios de aceptación**:
- [ ] `expiraEn` devuelto por el endpoint refleja el valor real del JWT (basado en `JWT_EXPIRES_IN`)
- [ ] El frontend puede mostrar "expira en X horas Y minutos" correctamente
- [ ] El `ImpersonarResultado.type` o documento refleja el cambio

---

## SPEC 11: Backend — RolesGuard bloquea SUPERADMIN routes durante impersonación

**Descripción**: Cuando un SUPERADMIN está impersonando, su JWT tiene `impersonatedBy != null`. El `RolesGuard` actualmente permite acceso a cualquier ruta que tenga `@RolesDecorator(Rol.SUPERADMIN)` (porque hace `requiredRoles.includes(user?.rol)` y el rol es `SUPERADMIN`). Debe bloquearse este acceso para evitar que reingrese a rutas globally-only mientras impersona.

**Requisitos**:
- En `RolesGuard.canActivate()`, después de verificar `requiredRoles.includes(user?.rol)`, agregar checks:
  - Si `user.impersonatedBy != null` Y `requiredRoles` incluye `Rol.SUPERADMIN`, devolver `false` con `403 Forbidden`
- Alternativamente: verificar que si `user.impersonatedBy != null`, no se permiten routes con `@RolesDecorator(Rol.SUPERADMIN)`

**Criterios de aceptación**:
- [ ] SUPERADMIN impersonando recibe 403 al intentar acceder a cualquier ruta con `@RolesDecorator(Rol.SUPERADMIN)`
- [ ] SUPERADMIN sin impersonar sigue pudiendo acceder a rutas SUPERADMIN
- [ ] OTHER roles (ADMIN, NUTRICIONISTA, etc.) no se ven afectados