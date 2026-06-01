# Spec: Multi-Tenant, Admin Global y Permisos Granulares

**Fecha:** 2026-06-01  
**Estado:** En implementación (Plan 1 completado)  
**Branch:** `feature/multi-tenant-admin`  
**Worktree:** `.worktrees/multi-tenant-admin/`

---

## 1. Contexto y Problema

NutriFit Supervisor actualmente opera como single-tenant: todos los usuarios pertenecen al mismo gimnasio. Esto limita el crecimiento del sistema a múltiples gimnasios independientes.

**Problemas identificados:**
- No hay aislamiento de datos entre gimnasios
- No existe el rol de administrador global (SUPERADMIN) que pueda operar cross-tenant
- No hay mecanismo para que un SUPERADMIN pueda impersonar a un gimnasio específico
- El modelo de permisos no distingue entre acciones globales y acciones por tenant

---

## 2. Objetivos

1. **Multi-tenancy:** Aislar datos por gimnasio (`gimnasioId`) en todas las entidades relevantes
2. **SUPERADMIN:** Crear rol global que pueda operar sin `gimnasioId` (cross-tenant)
3. **Impersonación:** Permitir a SUPERADMIN impersonar un gimnasio específico para operaciones contextuales
4. **Permisos granulares:** Refinar `ActionsGuard` para que ADMIN requiera permisos explícitos
5. **Frontend:** Implementar selector de tenant para SUPERADMIN

---

## 3. Arquitectura Multi-Tenant

### 3.1 Modelo de Datos

**Entidades con `gimnasioId`:**
- `PersonaEntity` (Socio, Nutricionista, Asistente) — `gimnasioId: number` (no-null)
- `Agenda`, `Turno`, `PlanAlimentacion`, `FichaSalud`, `ObservacionClinica`, `SugerenciaIA`
- `Auditoria` — `gimnasioId: number | null` (null para SUPERADMIN)

**Entidades globales (sin `gimnasioId`):**
- `Gimnasio` — entidad raíz del tenant
- `Usuario` — puede tener `persona.gimnasioId` o ser SUPERADMIN sin persona

### 3.2 Aislamiento en Repositorios

**Repositorios con filtro `where: { gimnasioId }`:**
- ✅ `SocioRepository`, `NutricionistaRepository`, `AgendaRepository`
- ✅ `ObjetivoRepository`, `FotoProgresoRepository`, `UsuarioRepository`
- ⏳ `TurnoRepository`, `PlanAlimentacionRepository`, `FichaSaludRepository` (Plan 4)
- ⏳ `ObservacionClinicaRepository`, `SugerenciaIARepository` (Plan 4)

**Mecanismo:**
```typescript
// Todos los métodos de búsqueda filtran por gimnasioId del TenantContext
async buscarPorId(id: number): Promise<Socio | null> {
  const gimnasioId = this.tenantContext.gimnasioId;
  if (!gimnasioId) throw new ForbiddenError('Tenant context requerido');
  
  return this.repo.findOne({ where: { id, persona: { gimnasioId } } });
}
```

---

## 4. Seguridad

### 4.1 JWT Payload

```typescript
interface JwtPayload {
  id: number | null;
  email: string;
  rol: Rol;
  acciones?: string[];
  personaId: number | null;
  gimnasioId: number | null;  // null solo para SUPERADMIN sin impersonar
  jti: string;
  exp?: number;
  impersonatedBy?: number | null;  // ID del SUPERADMIN que impersonó
}
```

### 4.2 Auth Guard (§6.1)

**Archivo:** `apps/backend/src/infrastructure/auth/guards/auth.guard.ts`

**Lógica:**
```typescript
// SUPERADMIN puede no tener gimnasioId (operar cross-tenant)
if (
  payload.rol !== Rol.SUPERADMIN &&
  (payload.gimnasioId === undefined || payload.gimnasioId === null)
) {
  throw new UnauthorizedException('Token sin contexto de tenant');
}
```

**Implementado:** ✅ Plan 1, Task 5

### 4.3 Login Use Case (§6.3)

**Archivo:** `apps/backend/src/application/auth/login.use-case.ts`

**Lógica:**
```typescript
// SUPERADMIN sin persona: gimnasioId null (cross-tenant)
// Otros roles: requerido, sino error (estado inconsistente)
if (user.rol === Rol.SUPERADMIN) {
  gimnasioId = persona?.gimnasioId ?? null;
} else {
  if (persona?.gimnasioId === undefined || persona?.gimnasioId === null) {
    throw new UnauthorizedError('La cuenta no tiene gimnasio asignado');
  }
  gimnasioId = persona.gimnasioId;
}
```

**Implementado:** ✅ Plan 1, Task 8

### 4.4 Actions Guard (§6.6)

**Archivo:** `apps/backend/src/infrastructure/auth/guards/actions.guard.ts`

**Lógica:**
```typescript
// SUPERADMIN bypassea todo (es el "dueño del sistema")
// ADMIN, NUTRICIONISTA, RECEPCIONISTA, SOCIO deben tener permisos explícitos
if (request.user.rol === Rol.SUPERADMIN) {
  return true;
}

const hasPermission = await this.permisosService.hasAllActions(userId, requiredActions);
```

**Implementado:** ✅ Plan 1, Task 10

### 4.5 Tenant Context Service (§6.2)

**Archivo:** `apps/backend/src/infrastructure/auth/tenant-context.service.ts`

**Campos:**
```typescript
interface TenantContext {
  gimnasioId: number | null;
  personaId: number | null;
  usuarioId: number;
  jti: string;
  rol: string;
  impersonatedBy: number | null;  // ID del SUPERADMIN que impersonó
}
```

**Implementado:** ✅ Plan 1, Task 6 (type only, flujo completo en Plan 5)

---

## 5. CRUD de Gimnasios

### 5.1 Endpoints

**Solo SUPERADMIN:**
- `POST /gimnasios` — Crear gimnasio
- `GET /gimnasios` — Listar todos los gimnasios
- `GET /gimnasios/:id` — Obtener gimnasio específico
- `PATCH /gimnasios/:id` — Actualizar gimnasio
- `DELETE /gimnasios/:id` — Eliminar gimnasio (soft delete)

**Modelo:**
```typescript
interface Gimnasio {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  fechaCreacion: Date;
}
```

**Plan:** Plan 5

---

## 6. Impersonación

### 6.1 Endpoint

**Solo SUPERADMIN:**
- `POST /gimnasios/:id/impersonar` — Genera JWT con `gimnasioId` del gimnasio + `impersonatedBy` del SUPERADMIN

**Request:**
```typescript
POST /gimnasios/5/impersonar
Authorization: Bearer <superadmin-jwt>
```

**Response:**
```typescript
{
  token: "jwt-con-gimnasioId-5-e-impersonatedBy-1",
  gimnasio: { id: 5, nombre: "Gym Central" },
  expiraEn: "2h"
}
```

### 6.2 Flujo

1. SUPERADMIN hace login → JWT con `gimnasioId: null`, `impersonatedBy: null`
2. SUPERADMIN llama `POST /gimnasios/:id/impersonar`
3. Backend genera nuevo JWT con:
   - `gimnasioId: <id del gimnasio>`
   - `impersonatedBy: <id del SUPERADMIN>`
   - Mismo `rol: SUPERADMIN`
4. Frontend usa este JWT para operar como si fuera ADMIN del gimnasio
5. Auditoría registra `impersonatedBy` para trazabilidad

**Plan:** Plan 5

---

## 7. Frontend

### 7.1 AuthContext

**Archivo:** `apps/frontend/src/contexts/AuthContext.tsx`

**Estado:**
```typescript
interface AuthState {
  user: Usuario | null;
  token: string | null;
  gimnasioId: number | null;  // null para SUPERADMIN sin impersonar
  impersonatedBy: number | null;
}
```

**Métodos:**
- `login(email, password)` — Login normal
- `impersonarGimnasio(gimnasioId)` — SUPERADMIN impersona gimnasio
- `salirDeImpersonacion()` — Vuelve al JWT original de SUPERADMIN
- `logout()` — Cierra sesión

**Plan:** Plan 6

### 7.2 TenantSwitcher

**Componente:** `<TenantSwitcher />`

**Visibilidad:** Solo visible para SUPERADMIN

**Funcionalidad:**
- Dropdown con lista de gimnasios
- Al seleccionar, llama `impersonarGimnasio(gimnasioId)`
- Muestra indicador visual cuando está impersonando
- Botón "Salir de impersonación" para volver al contexto global

**Plan:** Plan 6

### 7.3 Gestión de Gimnasios

**Páginas:**
- `/admin/gimnasios` — Lista de gimnasios (solo SUPERADMIN)
- `/admin/gimnasios/nuevo` — Wizard de creación
- `/admin/gimnasios/:id` — Detalle y edición

**Plan:** Plan 7

---

## 8. Planes de Implementación

### Plan 1: Auth + Login + SUPERADMIN Relaxation ✅

**Objetivo:** Permitir SUPERADMIN sin `gimnasioId` en JWT

**Tasks:**
1. ✅ Update `JwtPayload` type
2. ✅ Update `RolesGuard` user type
3. ✅ Update `ActionsGuard` user type
4. ✅ Test SUPERADMIN null gymId en `auth.guard`
5. ✅ Implement SUPERADMIN relaxation en `auth.guard`
6. ✅ Add `impersonatedBy` a `TenantContextService`
7. ✅ Test `LoginUseCase` SUPERADMIN
8. ✅ Implement SUPERADMIN handling en `LoginUseCase`
9. ✅ Test `ActionsGuard` bypass restriction
10. ✅ Implement `ActionsGuard` bypass restriction
11. ✅ Final verification

**Commits:** `982e0d2`..`79aad51`

**Spec coverage:** §6.1, §6.2, §6.3, §6.6

---

### Plan 2: Seed Multi-Tenant ⏳

**Objetivo:** Crear datos de prueba con 3 gimnasios y usuarios por tenant

**Datos:**
- 3 gimnasios: "Gym Central", "Gym Norte", "Gym Sur"
- 1 SUPERADMIN global: `superadmin@nutrifit.com`
- 3 ADMIN (uno por gimnasio): `admin-central@nutrifit.com`, `admin-norte@nutrifit.com`, `admin-sur@nutrifit.com`
- 3 NUTRICIONISTA (uno por gimnasio)
- 9 SOCIO (3 por gimnasio)

**Verificación:**
- Login como SUPERADMIN → `gimnasioId: null`
- Login como ADMIN de Gym Central → `gimnasioId: 1`
- Query de socios como ADMIN Central → solo ve socios de Gym Central

---

### Plan 3: Aislamiento Repos Core ⏳

**Objetivo:** Verificar y completar aislamiento en repos core

**Repos:**
- `SocioRepository` — verificar con tests
- `NutricionistaRepository` — verificar con tests
- `AgendaRepository` — verificar con tests

**Tests:**
- ADMIN de Gym 1 no puede ver socios de Gym 2
- Query con `TenantContext.gimnasioId` filtra correctamente

---

### Plan 4: Aislamiento Repos Resto ⏳

**Objetivo:** Implementar aislamiento en repos pendientes

**Repos:**
- `TurnoRepository`
- `PlanAlimentacionRepository`
- `FichaSaludRepository`
- `ObservacionClinicaRepository`
- `SugerenciaIARepository`

**Mecanismo:** Mismo patrón que Plan 3 (filtro `where: { gimnasioId }`)

---

### Plan 5: CRUD Gimnasios + Impersonación ⏳

**Objetivo:** Implementar gestión de gimnasios y endpoint de impersonación

**Endpoints:**
- `POST /gimnasios`
- `GET /gimnasios`
- `GET /gimnasios/:id`
- `PATCH /gimnasios/:id`
- `DELETE /gimnasios/:id`
- `POST /gimnasios/:id/impersonar`

**Use Cases:**
- `CrearGimnasioUseCase`
- `ListarGimnasiosUseCase`
- `ImpersonarGimnasioUseCase` — genera JWT con `impersonatedBy`

**Auditoría:**
- Registrar en `Auditoria` cuando SUPERADMIN impersona
- Campo `impersonatedBy` en `AuditoriaEntity`

---

### Plan 6: Frontend AuthContext + TenantSwitcher ⏳

**Objetivo:** Implementar contexto de autenticación y selector de tenant

**Componentes:**
- `AuthContext` — estado global de autenticación
- `TenantSwitcher` — dropdown para SUPERADMIN
- Indicador visual de impersonación

**Integración:**
- Interceptores HTTP para enviar `gimnasioId` en requests
- Manejo de errores de tenant (403 si no tiene acceso)

---

### Plan 7: Frontend Gestión + Wizard ⏳

**Objetivo:** Implementar páginas de gestión de gimnasios

**Páginas:**
- `/admin/gimnasios` — lista
- `/admin/gimnasios/nuevo` — wizard de creación
- `/admin/gimnasios/:id` — detalle y edición

**Wizard:**
1. Datos básicos (nombre, dirección, contacto)
2. Crear ADMIN del gimnasio
3. Confirmación

---

### Plan 8: E2E + Docs ⏳

**Objetivo:** Tests end-to-end y documentación

**Tests E2E:**
- Login como SUPERADMIN
- Crear gimnasio
- Impersonar gimnasio
- Verificar aislamiento de datos

**Docs:**
- README con arquitectura multi-tenant
- Guía de deployment
- Guía de administración

---

## 9. Decisiones Técnicas

### 9.1 PersonaEntity.gimnasioId

**Decisión:** Mantener `number` no-null

**Razón:** SUPERADMIN no tiene persona. Para no romper la abstracción, permitimos null solo a nivel `JwtPayload.gimnasioId`, no en la entidad.

### 9.2 LoginUseCase sin fallback

**Decisión:** Rechazar no-SUPERADMIN sin `gimnasioId`

**Razón:** Es estado inconsistente. Si un usuario no-SUPERADMIN no tiene gimnasio asignado, no puede operar. Mejor fallar explícitamente que usar fallback mágico.

### 9.3 ActionsGuard sin bypass para ADMIN

**Decisión:** ADMIN requiere permisos explícitos

**Razón:** Spec §6.6 dice que ADMIN debe tener set explícito de acciones. Para v1, denegamos ADMIN en todas las acciones `gimnasios.*`. Se puede refinar después con set explícito.

---

## 10. Riesgos y Mitigaciones

| # | Riesgo | Mitigación |
|---|--------|------------|
| R1 | Tests del baseline no pasan | Ejecutar suite antes de cada plan; reportar failures |
| R2 | Spec desactualizado | Actualizar spec al final de cada plan; reflejar realidad |
| R3 | Contexto perdido entre sesiones | Planes self-contained; `mem_session_summary` al cerrar |
| R4 | Deuda técnica (typecheck, lint) | Plan separado de "tech debt cleanup" |

---

## 11. Criterios de Aceptación

### Multi-Tenancy
- ✅ Todos los repos filtran por `gimnasioId` del `TenantContext`
- ✅ ADMIN de Gym 1 no puede ver datos de Gym 2
- ✅ SUPERADMIN puede operar cross-tenant (sin `gimnasioId`)

### Seguridad
- ✅ `auth.guard` permite SUPERADMIN con `gimnasioId: null`
- ✅ `LoginUseCase` emite JWT correcto según rol
- ✅ `ActionsGuard` bypassea solo SUPERADMIN
- ✅ Auditoría registra `impersonatedBy`

### Frontend
- ✅ SUPERADMIN ve `TenantSwitcher`
- ✅ Puede impersonar gimnasios
- ✅ Indicador visual de impersonación activa

---

**Spec reconstruido:** 2026-06-01  
**Basado en:** Plan 1 implementado + decisiones en PROGRESS.md
