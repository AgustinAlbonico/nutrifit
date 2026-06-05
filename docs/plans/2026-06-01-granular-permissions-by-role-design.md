# Design: Permisos granulares por rol (SUPERADMIN vs ADMIN)

**Fecha:** 2026-06-01
**Estado:** Aprobado
**Scope:** Backend + Frontend (gestión de permisos)

## Resumen

Hoy existe un único nivel de acceso: cualquiera con `rol = ADMIN` puede hacer todo en la gestión de permisos (crear/editar grupos, asignar a usuarios, asignar acciones directas). El problema: no hay forma de proteger los grupos base (`RECEPCIONISTA`, `NUTRICIONISTA`, `SOCIO`, `ADMIN`) para que un admin "de gimnasio" no los toque por accidente, y al mismo tiempo permitirle crear/editar grupos custom.

La solución es agregar un flag `es_grupo_sistema` al modelo `grupo_permiso` y un chequeo fino en cada use-case de gestión: si el grupo es del sistema, solo `SUPERADMIN` puede mutarlo; si no, tanto `ADMIN` como `SUPERADMIN` pueden.

## Matriz de autorización

| Operación | SUPERADMIN | ADMIN | Otros |
|---|---|---|---|
| Crear grupo | ✅ | ✅ (no-sistema) | ❌ |
| Editar grupo | ✅ (cualquiera) | ✅ solo si no es de sistema | ❌ |
| Eliminar grupo | ✅ (cualquiera) | ✅ solo si no es de sistema | ❌ |
| Reemplazar acciones de grupo | ✅ (cualquiera) | ✅ solo si no es de sistema | ❌ |
| Asignar grupo a usuario | ✅ (cualquiera) | ✅ solo si no es de sistema | ❌ |
| Asignar acciones directas a usuario | ✅ | ✅ | ❌ |
| Quitar acciones directas a usuario | ✅ | ✅ | ❌ |
| Ver `/permissions/*` (gestión) | ✅ | ✅ | ❌ (403) |
| Ver `/auth/permissions` (propias acciones) | ✅ | ✅ | ✅ |

## Grupos de sistema

| `clave` | `es_grupo_sistema` | Quién lo edita |
|---|---|---|
| `ADMIN` | TRUE | Solo SUPERADMIN |
| `RECEPCIONISTA` | TRUE | Solo SUPERADMIN |
| `NUTRICIONISTA` | TRUE | Solo SUPERADMIN |
| `SOCIO` | TRUE | Solo SUPERADMIN |
| Otros (futuros) | FALSE (default) | ADMIN y SUPERADMIN |

El flag es una propiedad del grupo, no del usuario ni del uso. Hardcodear la lista en el código se descartó por:
- Single source of truth (DB).
- Auditabilidad (un `SELECT` lo muestra).
- Flexibilidad futura sin deploy.
- Alineado con DDD: "grupo del sistema" es atributo del grupo.

## Cambios

### Backend

1. **Migración nueva** `apps/backend/src/infrastructure/persistence/typeorm/migrations/<timestamp>-AddEsGrupoSistema.ts`:
   ```sql
   ALTER TABLE grupo_permiso ADD COLUMN es_grupo_sistema BOOLEAN NOT NULL DEFAULT FALSE;
   ```
   Después: `UPDATE grupo_permiso SET es_grupo_sistema = TRUE WHERE clave IN ('ADMIN', 'RECEPCIONISTA', 'NUTRICIONISTA', 'SOCIO');`

2. **Entities:**
   - `apps/backend/src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity.ts` → agregar `esGrupoSistema: boolean` con `@Column({ default: false })`.
   - `apps/backend/src/domain/entities/Usuario/grupo-permiso.entity.ts` → agregar mismo campo.

3. **Seed actualizado** (`apps/backend/src/seed/data/grupos-permisos.data.ts`):
   - Marcar los 4 grupos base con `es_grupo_sistema: true`.

4. **Use-cases actualizados en `apps/backend/src/application/permisos/use-cases/`:**
   - `crear-grupo.use-case.ts` → forzar `es_grupo_sistema = false` en el payload (ignorar el campo si lo mandan). Validar que el actor es ADMIN o SUPERADMIN.
   - `editar-grupo.use-case.ts` → si `grupo.es_grupo_sistema && actor.rol !== SUPERADMIN` → `ForbiddenException`.
   - `eliminar-grupo.use-case.ts` → mismo chequeo.
   - `asignar-grupo-usuario.use-case.ts` → si `grupo.es_grupo_sistema && actor.rol !== SUPERADMIN` → `ForbiddenException`.
   - `asignar-acciones-grupo.use-case.ts` (el que reemplaza las acciones de un grupo) → mismo chequeo.
   - `quitar-grupo-usuario.use-case.ts` → mismo chequeo (no podés sacar a alguien del grupo RECEPCIONISTA si sos ADMIN).

5. **Controller `PermisosController`:**
   - Cambiar `@Rol(Rol.ADMIN)` por `@Rol(Rol.ADMIN, Rol.SUPERADMIN)` en el class-level para que ambos puedan entrar al controller.
   - Los chequeos finos se hacen en cada use-case.
   - `GET /permissions/actions`, `GET /permissions/groups`, `GET /permissions/users`, `GET /permissions/users/:id/actions`, `GET /permissions/users/:id/groups` → lectura, ambos roles.
   - `GET /auth/permissions` y `GET /permissions/me/actions` → siguen abiertos a cualquier usuario autenticado (para que el frontend renderice sus propios botones).

6. **PermisosService.getUserActions:** NO requiere cambios. La lógica de "usuario tiene acción X" sigue siendo: acciones de sus grupos + acciones directas. Lo único que cambia es **quién puede modificar** los grupos y las asignaciones.

7. **Tests:**
   - Specs para cada use-case con matriz `(rol, es_grupo_sistema) → resultado esperado`.
   - Test que verifica que `crear-grupo` ignora `es_grupo_sistema` en el payload.
   - E2E con supertest:
     - ADMIN crea grupo custom → 201
     - ADMIN edita grupo custom → 200
     - ADMIN intenta editar `RECEPCIONISTA` → 403
     - SUPERADMIN edita `RECEPCIONISTA` → 200
     - NUTRICIONISTA intenta `GET /permissions/groups` → 403
     - ADMIN agrega acción directa a un usuario → 200
     - ADMIN quita acción directa a un usuario → 200

### Frontend

1. **Routing:** la ruta `/admin/permisos` (o como se llame) se oculta del sidebar si el usuario no es ADMIN ni SUPERADMIN. Si igualmente escribe la URL, mostrar 403.

2. **Lista de grupos:** agregar badge visual "Grupo del sistema" en los 4 grupos base.

3. **Edición/eliminación de grupo:** si el grupo es del sistema y el user es ADMIN (no SUPERADMIN):
   - Botones "Editar" / "Eliminar" deshabilitados.
   - Tooltip: "Solo SUPERADMIN puede modificar grupos del sistema".
   - El form de edición no se abre.

4. **Asignación de grupo a usuario:** si el grupo es del sistema y el user es ADMIN:
   - El grupo no aparece en el dropdown de "Grupos disponibles" para asignar.
   - O si aparece, está disabled con tooltip.

5. **Asignación de acciones directas a usuario:** sin cambios. ADMIN puede hacerlo como antes.

## No-objetivos (fuera de scope)

- Auditoría de cambios de permisos (quién editó qué grupo cuándo). Se puede agregar después.
- Revocación de tokens cuando cambian los permisos de un usuario. Hoy se hace por expiración natural del JWT.
- Refactor del sistema de "hijos" de grupos (la herencia recursiva) que tiene un gap latente. No se toca en este PR.
- UI para SUPERADMIN-only de "ver todos los gimnasios / impersonar". Ya existe, no se modifica.

## Riesgos

- **Migración en producción:** agregar una columna NOT NULL con DEFAULT FALSE es seguro en MySQL (instantáneo, no requiere lock de tabla).
- **Cambio en `@Rol(Rol.ADMIN)` a `@Rol(Rol.ADMIN, Rol.SUPERADMIN)`:** el `PermisosController` ya tiene `ActionsGuard` que valida `auth.permissions.assign` o `auth.permissions.read` en cada endpoint. Verificar que SUPERADMIN ya tiene esas acciones en su grupo (sí, según el seed, el grupo `ADMIN` las tiene y `SUPERADMIN` mapea al mismo grupo).
- **Caché de JWT:** si un ADMIN tiene un JWT con acciones que ya no debería tener (porque se cambió un grupo), el token sigue válido hasta expirar. Mitigación: forzar re-login después de cambios críticos. Out of scope para este PR.

## Rollback

Si algo sale mal, la migración es aditiva (agrega una columna con default FALSE). El rollback es:
```sql
ALTER TABLE grupo_permiso DROP COLUMN es_grupo_sistema;
```
Y revertir los use-cases. La app sigue funcionando porque los grupos existentes quedan con `es_grupo_sistema = false` por el DEFAULT, que es el comportamiento permisivo (cualquiera edita).

## Orden de implementación

1. Migración + entity + dominio + seed
2. Use-cases (con sus tests)
3. Controller (cambio del `@Rol`)
4. Tests E2E
5. Frontend (UI de gestión)
6. Smoke test verifica que `NestFactory.create(AppModule)` sigue booteando
7. Verificar login + flujo de permisos
