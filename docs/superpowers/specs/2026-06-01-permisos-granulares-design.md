# Plan 9: Permisos Granulares — Diseño y Alcance

**Fecha:** 2026-06-01  
**Estado:** Diseño aprobado, pendiente implementación  
**Branch:** `feature/multi-tenant-admin`

---

## 1. Problema

El sistema actual tiene `ActionsGuard` que bypassea solo SUPERADMIN. ADMIN, RECEPCIONISTA, NUTRICIONISTA y SOCIO NO tienen permisos granulares funcionando:
- ADMIN no puede hacer nada más allá de lo básico
- No hay forma de asignar permisos individuales a usuarios
- No hay forma de que un recepcionista tenga permisos extra que otro no
- El frontend no oculta botones según permisos

---

## 2. Objetivos

1. **Acciones hardcoded + seed:** No se crean desde UI, se definen en código
2. **Permisos por usuario:** Cada usuario tiene uno o más grupos de permisos
3. **Grupos base por rol:** Al crear usuario, se asigna grupo base del rol
4. **Personalización:** ADMIN puede agregar/quitar grupos a usuarios
5. **UI dinámica:** Frontend oculta botones según permisos
6. **Validación backend:** Backend valida independientemente
7. **Documentación:** AGENTS.md actualizado para futuras features

---

## 3. Roles y Restricciones de Creación

| Rol | Puede crear | No puede crear |
|-----|-------------|----------------|
| SUPERADMIN | Cualquiera | — |
| ADMIN | RECEPCIONISTA, NUTRICIONISTA, SOCIO | — |
| RECEPCIONISTA | NUTRICIONISTA, SOCIO | ADMIN, RECEPCIONISTA |
| NUTRICIONISTA | Nadie | Todos |
| SOCIO | Nadie | Todos |

---

## 4. Modelo de Datos

```
Usuario (1) → (N) UsuarioGrupoPermiso (N) → (1) GrupoPermiso
GrupoPermiso (N) → (N) AccionPermiso (N) → (1) Accion
```

**Entidades:**
- `Accion` — id, codigo (ej: `socios.crear`), descripcion
- `GrupoPermiso` — id, nombre, descripcion
- `AccionPermiso` — tabla intermedia GrupoPermiso ↔ Accion
- `UsuarioGrupoPermiso` — tabla intermedia Usuario ↔ GrupoPermiso (NUEVA)

---

## 5. Acciones Hardcoded

**Ubicación:** `packages/shared/src/types/acciones.ts`

```typescript
export const ACCIONES = {
  SOCIOS_CREAR: 'socios.crear',
  SOCIOS_EDITAR: 'socios.editar',
  SOCIOS_ELIMINAR: 'socios.eliminar',
  SOCIOS_VER: 'socios.ver',
  NUTRICIONISTAS_CREAR: 'nutricionistas.crear',
  NUTRICIONISTAS_EDITAR: 'nutricionistas.editar',
  NUTRICIONISTAS_ELIMINAR: 'nutricionistas.eliminar',
  NUTRICIONISTAS_VER: 'nutricionistas.ver',
  RECEPCIONISTAS_CREAR: 'recepcionistas.crear',
  RECEPCIONISTAS_EDITAR: 'recepcionistas.editar',
  RECEPCIONISTAS_ELIMINAR: 'recepcionistas.eliminar',
  RECEPCIONISTAS_VER: 'recepcionistas.ver',
  TURNOS_CREAR: 'turnos.crear',
  TURNOS_EDITAR: 'turnos.editar',
  TURNOS_CANCELAR: 'turnos.cancelar',
  TURNOS_VER: 'turnos.ver',
  REPORTES_GENERAR: 'reportes.generar',
  REPORTES_VER: 'reportes.ver',
  // ... se agregan más cuando se agreguen features
} as const;
```

---

## 6. Grupos de Permisos Base

**Ubicación:** `apps/backend/src/seed/data/grupos-permisos.data.ts`

```typescript
export const GRUPOS_PERMISOS = {
  ADMIN: {
    nombre: 'Administrador',
    descripcion: 'Acceso total dentro del tenant',
    acciones: ['*'] // wildcard
  },
  RECEPCIONISTA: {
    nombre: 'Recepcionista',
    descripcion: 'Gestión de socios, nutricionistas y turnos',
    acciones: [
      ACCIONES.SOCIOS_CREAR,
      ACCIONES.SOCIOS_EDITAR,
      ACCIONES.SOCIOS_ELIMINAR,
      ACCIONES.SOCIOS_VER,
      ACCIONES.NUTRICIONISTAS_CREAR,
      ACCIONES.NUTRICIONISTAS_EDITAR,
      ACCIONES.NUTRICIONISTAS_VER,
      ACCIONES.TURNOS_CREAR,
      ACCIONES.TURNOS_EDITAR,
      ACCIONES.TURNOS_CANCELAR,
      ACCIONES.TURNOS_VER,
    ]
  },
  NUTRICIONISTA: {
    nombre: 'Nutricionista',
    descripcion: 'Gestión de pacientes y planes',
    acciones: [
      ACCIONES.PACIENTES_VER,
      ACCIONES.FICHAS_VER,
      ACCIONES.FICHAS_EDITAR,
      ACCIONES.PLANES_CREAR,
      ACCIONES.PLANES_EDITAR,
      ACCIONES.PLANES_VER,
      ACCIONES.TURNOS_VER,
    ]
  },
  SOCIO: {
    nombre: 'Socio',
    descripcion: 'Acceso a funcionalidades propias',
    acciones: [
      ACCIONES.TURNOS_RESERVAR,
      ACCIONES.MI_FICHA_VER,
      ACCIONES.MIS_PLANES_VER,
    ]
  }
};
```

---

## 7. Flujo de Asignación

**Al crear usuario:**
1. Se crea el usuario
2. Se asigna automáticamente el grupo base del rol
3. Ejemplo: crear RECEPCIONISTA → asigna grupo "Recepcionista"

**Personalización posterior:**
1. ADMIN accede a `/admin/usuarios/:id/permisos`
2. Ve permisos actuales del usuario
3. Puede agregar/quitar grupos
4. Ejemplo: Recepcionista 1 + Grupo Reportes → puede generar reportes

---

## 8. Validación en Backend

**`ActionsGuard` refactorizado:**

```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  
  // SUPERADMIN bypass
  if (user.rol === Rol.SUPERADMIN) return true;
  
  const requiredActions = this.reflector.get<string[]>('acciones', context.getHandler());
  if (!requiredActions || requiredActions.length === 0) return true;
  
  // Consultar permisos del usuario
  const userActions = await this.permisosService.getUserActions(user.id);
  
  // Verificar que tenga TODAS las acciones requeridas
  return requiredActions.every(accion => userActions.includes(accion));
}
```

---

## 9. UI Dinámica en Frontend

**Hook:**
```typescript
// apps/frontend/src/hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  return {
    tieneAccion: (accion: string) => user?.acciones?.includes(accion) ?? false,
    tieneAlgunaAccion: (acciones: string[]) => acciones.some(a => user?.acciones?.includes(a)),
  };
}
```

**Componente:**
```typescript
// apps/frontend/src/components/auth/Can.tsx
<Can accion={ACCIONES.SOCIOS_EDITAR}>
  <Button onClick={editar}>Editar</Button>
</Can>
```

**Aplicación en UI existente:**
- Botones de editar/eliminar envueltos en `<Can>`
- Menús filtrados según permisos
- Páginas completas protegidas con `<Can>`

---

## 10. Endpoints de Gestión de Permisos

```
GET    /permisos/acciones                    — Listar todas las acciones (para UI)
GET    /permisos/grupos                     — Listar grupos de permisos
GET    /permisos/usuarios/:id               — Ver permisos de un usuario
POST   /permisos/usuarios/:id/grupos        — Asignar grupo a usuario
DELETE /permisos/usuarios/:id/grupos/:gId   — Quitar grupo de usuario
```

Todos requieren rol ADMIN o SUPERADMIN.

---

## 11. Plan de Implementación

1. ✅ Verificar entidades existentes (Accion, GrupoPermiso, AccionPermiso)
2. ⏳ Crear enum de acciones en `packages/shared`
3. ⏳ Crear `UsuarioGrupoPermiso` entity (tabla intermedia)
4. ⏳ Crear `PermisosService` (consulta permisos de usuario)
5. ⏳ Crear use-cases: Verificar, Asignar, Quitar, Obtener
6. ⏳ Refactor `ActionsGuard` para usar permisos reales
7. ⏳ Modificar `CrearUsuarioUseCase` con validaciones de rol
8. ⏳ Crear controller `/permisos` con endpoints
9. ⏳ Actualizar seed para insertar acciones + grupos + asignar base
10. ⏳ Frontend: hook `usePermissions` + componente `<Can>`
11. ⏳ Frontend: página `/admin/usuarios/:id/permisos`
12. ⏳ Frontend: aplicar `<Can>` en UI existente
13. ⏳ Tests E2E de permisos granulares
14. ⏳ Actualizar `AGENTS.md` con guía para futuras features

---

## 12. Documentación para Futuras IAs (AGENTS.md)

Sección a agregar: **"Cómo agregar una nueva feature con acciones"**

```markdown
## Cómo agregar una nueva feature con acciones

1. **Agregar la acción al enum:**
   - Editar `packages/shared/src/types/acciones.ts`
   - Agregar constante siguiendo el patrón `MODULO_ACCION: 'modulo.accion'`
   - Ejemplo: `PAGOS_PROCESAR: 'pagos.procesar'`

2. **Asignar a grupos existentes (si aplica):**
   - Editar `apps/backend/src/seed/data/grupos-permisos.data.ts`
   - Agregar la acción al array del grupo correspondiente

3. **Decorar el endpoint con la acción:**
   - En el controller: `@Acciones(ACCIONES.PAGOS_PROCESAR)`
   - Si son múltiples: `@Acciones(ACCIONES.PAGOS_VER, ACCIONES.PAGOS_EDITAR)`

4. **Proteger la UI con `<Can>`:**
   - Envolver botones: `<Can accion={ACCIONES.PAGOS_PROCESAR}>...</Can>`

5. **Correr el seed:**
   - `npm run seed:multi-tenant` desde `apps/backend/`
   - Esto inserta/actualiza la acción en DB y asigna a los grupos

6. **Verificar:**
   - Usuario con la acción → puede usar la feature
   - Usuario sin la acción → no ve botones, backend rechaza requests
```

---

## 13. Criterios de Aceptación

- ✅ Acciones no se pueden crear/editar/eliminar desde UI
- ✅ Acciones se insertan vía seed desde enum hardcoded
- ✅ Al crear usuario, se asigna grupo base del rol
- ✅ ADMIN puede asignar/quitar grupos a usuarios
- ✅ Un recepcionista puede tener permisos extra que otro no
- ✅ Frontend oculta botones según permisos
- ✅ Backend valida permisos independientemente
- ✅ SUPERADMIN sigue con bypass total
- ✅ NUTRICIONISTA y SOCIO no pueden crear usuarios
- ✅ RECEPCIONISTA no puede crear ADMIN ni otros RECEPCIONISTAS
- ✅ AGENTS.md documentado para futuras features

---

**Próximo paso:** Implementar siguiendo el orden del Plan de Implementación (sección 11).
