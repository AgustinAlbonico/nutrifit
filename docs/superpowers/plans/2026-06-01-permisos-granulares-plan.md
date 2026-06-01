# Plan 9: Permisos Granulares — Plan de Implementación

**Spec:** [`docs/superpowers/specs/2026-06-01-permisos-granulares-design.md`](../specs/2026-06-01-permisos-granulares-design.md)
**Fecha:** 2026-06-01
**Branch:** `feature/multi-tenant-admin`
**Worktree:** `.worktrees/multi-tenant-admin/`

---

## Contexto Previo

Planes 1-8 implementaron multi-tenant, SUPERADMIN, CRUD gimnasios, impersonación, y aislamiento de ~50 use-cases. El sistema tiene roles definidos (SUPERADMIN, ADMIN, RECEPCIONISTA, NUTRICIONISTA, SOCIO) y `ActionsGuard` que bypassea solo SUPERADMIN.

**Problema:** ADMIN, RECEPCIONISTA, NUTRICIONISTA y SOCIO no tienen permisos granulares funcionando. No hay forma de asignar permisos individuales ni de controlar la UI según permisos.

**Solución:** Sistema de acciones hardcoded + grupos de permisos por usuario + UI dinámica con componente `<Can>`.

---

## Tasks

### Task 1: Enum de Acciones en Shared (30 min)

**Objetivo:** Crear enum compartido de acciones para backend y frontend.

**Archivos:**
- `packages/shared/src/types/acciones.ts` (NUEVO)
- `packages/shared/src/types/index.ts` (MODIFICAR — exportar)

**Contenido:**
```typescript
export const ACCIONES = {
  // Socios
  SOCIOS_CREAR: 'socios.crear',
  SOCIOS_EDITAR: 'socios.editar',
  SOCIOS_ELIMINAR: 'socios.eliminar',
  SOCIOS_VER: 'socios.ver',
  
  // Nutricionistas
  NUTRICIONISTAS_CREAR: 'nutricionistas.crear',
  NUTRICIONISTAS_EDITAR: 'nutricionistas.editar',
  NUTRICIONISTAS_ELIMINAR: 'nutricionistas.eliminar',
  NUTRICIONISTAS_VER: 'nutricionistas.ver',
  
  // Recepcionistas
  RECEPCIONISTAS_CREAR: 'recepcionistas.crear',
  RECEPCIONISTAS_EDITAR: 'recepcionistas.editar',
  RECEPCIONISTAS_ELIMINAR: 'recepcionistas.eliminar',
  RECEPCIONISTAS_VER: 'recepcionistas.ver',
  
  // Turnos
  TURNOS_CREAR: 'turnos.crear',
  TURNOS_EDITAR: 'turnos.editar',
  TURNOS_CANCELAR: 'turnos.cancelar',
  TURNOS_VER: 'turnos.ver',
  TURNOS_RESERVAR: 'turnos.reservar',
  
  // Fichas
  FICHAS_VER: 'fichas.ver',
  FICHAS_EDITAR: 'fichas.editar',
  MI_FICHA_VER: 'mi-ficha.ver',
  
  // Planes
  PLANES_CREAR: 'planes.crear',
  PLANES_EDITAR: 'planes.editar',
  PLANES_VER: 'planes.ver',
  MIS_PLANES_VER: 'mis-planes.ver',
  
  // Pacientes
  PACIENTES_VER: 'pacientes.ver',
  
  // Reportes
  REPORTES_GENERAR: 'reportes.generar',
  REPORTES_VER: 'reportes.ver',
  
  // Gimnasios (solo SUPERADMIN)
  GIMNASIOS_CREAR: 'gimnasios.crear',
  GIMNASIOS_EDITAR: 'gimnasios.editar',
  GIMNASIOS_ELIMINAR: 'gimnasios.eliminar',
  GIMNASIOS_VER: 'gimnasios.ver',
  GIMNASIOS_IMPERSONAR: 'gimnasios.impersonar',
} as const;

export type Accion = typeof ACCIONES[keyof typeof ACCIONES];
```

**Test:** No requiere (es solo tipos).

**Commit:** `feat(shared): add ACCIONES enum with all system actions`

---

### Task 2: Entidad UsuarioGrupoPermiso (1 hora)

**Objetivo:** Crear tabla intermedia para relación muchos-a-muchos Usuario ↔ GrupoPermiso.

**Archivos:**
- `apps/backend/src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity.ts` (NUEVO)
- `apps/backend/src/infrastructure/persistence/typeorm/entities/usuario.entity.ts` (MODIFICAR — agregar relación)
- `apps/backend/src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity.ts` (MODIFICAR — agregar relación)
- `apps/backend/src/infrastructure/persistence/typeorm/entities/index.ts` (MODIFICAR — exportar)

**Contenido:**
```typescript
// usuario-grupo-permiso.entity.ts
@Entity('usuario_grupo_permiso')
export class UsuarioGrupoPermisoOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UsuarioOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: UsuarioOrmEntity;

  @ManyToOne(() => GrupoPermisoOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_permiso_id' })
  grupoPermiso: GrupoPermisoOrmEntity;

  @CreateDateColumn()
  fechaAsignacion: Date;
}
```

**Migración:** `1735689601000-AddUsuarioGrupoPermiso` (NUEVO)

**Tests:** Verificar relación con mocks.

**Commit:** `feat(entities): add UsuarioGrupoPermiso many-to-many table`

---

### Task 3: PermisosService (1.5 horas)

**Objetivo:** Servicio que consulta permisos de un usuario.

**Archivos:**
- `apps/backend/src/application/permisos/permisos.service.ts` (NUEVO)
- `apps/backend/src/application/permisos/permisos.service.spec.ts` (NUEVO)

**Interfaz:**
```typescript
interface PermisosService {
  getUserActions(usuarioId: number): Promise<string[]>;
  hasAllActions(usuarioId: number, requiredActions: string[]): Promise<boolean>;
  hasAnyAction(usuarioId: number, actions: string[]): Promise<boolean>;
  getUserGroups(usuarioId: number): Promise<GrupoPermisoOrmEntity[]>;
}
```

**Implementación:**
```typescript
@Injectable()
export class PermisosServiceImpl implements PermisosService {
  constructor(
    @InjectRepository(UsuarioGrupoPermisoOrmEntity)
    private readonly usuarioGrupoRepo: Repository<UsuarioGrupoPermisoOrmEntity>,
  ) {}

  async getUserActions(usuarioId: number): Promise<string[]> {
    const grupos = await this.getUserGroups(usuarioId);
    const acciones = new Set<string>();
    for (const grupo of grupos) {
      for (const accion of grupo.acciones) {
        acciones.add(accion.codigo);
      }
    }
    return Array.from(acciones);
  }

  async hasAllActions(usuarioId: number, requiredActions: string[]): Promise<boolean> {
    const userActions = await this.getUserActions(usuarioId);
    return requiredActions.every(a => userActions.includes(a));
  }

  async hasAnyAction(usuarioId: number, actions: string[]): Promise<boolean> {
    const userActions = await this.getUserActions(usuarioId);
    return actions.some(a => userActions.includes(a));
  }

  async getUserGroups(usuarioId: number): Promise<GrupoPermisoOrmEntity[]> {
    const asignaciones = await this.usuarioGrupoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ['grupoPermiso', 'grupoPermiso.acciones'],
    });
    return asignaciones.map(a => a.grupoPermiso);
  }
}
```

**Tests:**
- Usuario sin grupos → array vacío
- Usuario con 1 grupo → acciones del grupo
- Usuario con múltiples grupos → unión de acciones
- `hasAllActions` con todas las acciones → true
- `hasAllActions` con alguna faltante → false
- `hasAnyAction` con una coincidencia → true

**Commit:** `feat(permisos): add PermisosService to query user actions`

---

### Task 4: Use-Cases de Permisos (2 horas)

**Objetivo:** Use-cases para asignar, quitar y consultar permisos.

**Archivos:**
- `apps/backend/src/application/permisos/use-cases/asignar-grupo-usuario.use-case.ts` (+ spec)
- `apps/backend/src/application/permisos/use-cases/quitar-grupo-usuario.use-case.ts` (+ spec)
- `apps/backend/src/application/permisos/use-cases/obtener-permisos-usuario.use-case.ts` (+ spec)
- `apps/backend/src/application/permisos/use-cases/listar-grupos-permisos.use-case.ts` (+ spec)
- `apps/backend/src/application/permisos/use-cases/listar-acciones.use-case.ts` (+ spec)

**AsignarGrupoUsuarioUseCase:**
- Input: `{ usuarioId, grupoPermisoId, gimnasioId }`
- Validaciones:
  - Usuario existe y pertenece al gimnasio
  - Grupo existe
  - Usuario no tiene ya ese grupo
- Acción: Crear `UsuarioGrupoPermiso`
- Tests: 3-4 casos

**QuitarGrupoUsuarioUseCase:**
- Input: `{ usuarioId, grupoPermisoId }`
- Validaciones: Asignación existe
- Acción: Eliminar `UsuarioGrupoPermiso`
- Tests: 3 casos

**ObtenerPermisosUsuarioUseCase:**
- Input: `{ usuarioId }`
- Output: `{ usuario, grupos, acciones }`
- Tests: 2 casos

**ListarGruposPermisosUseCase:**
- Input: ninguno
- Output: Array de grupos
- Tests: 2 casos

**ListarAccionesUseCase:**
- Input: ninguno
- Output: Array de acciones (para UI)
- Tests: 2 casos

**Commit:** `feat(permisos): add use-cases for assign/remove/query permissions`

---

### Task 5: Refactor ActionsGuard (1 hora)

**Objetivo:** ActionsGuard consulta permisos reales del usuario.

**Archivos:**
- `apps/backend/src/infrastructure/auth/guards/actions.guard.ts` (MODIFICAR)
- `apps/backend/src/infrastructure/auth/guards/actions.guard.spec.ts` (MODIFICAR)

**Lógica nueva:**
```typescript
@Injectable()
export class ActionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permisosService: PermisosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // SUPERADMIN bypass
    if (user.rol === Rol.SUPERADMIN) return true;

    // Si no hay acciones requeridas, permitir
    const requiredActions = this.reflector.get<string[]>('acciones', context.getHandler());
    if (!requiredActions || requiredActions.length === 0) return true;

    // Validar permisos
    return this.permisosService.hasAllActions(user.id, requiredActions);
  }
}
```

**Tests:**
- SUPERADMIN → bypass ✅
- Usuario con todas las acciones requeridas → true
- Usuario con alguna acción faltante → false
- Sin acciones requeridas → true
- Sin usuario autenticado → false

**Commit:** `refactor(actions-guard): query real user permissions instead of denying`

---

### Task 6: Validación de Creación por Rol (1.5 horas)

**Objetivo:** Use-case de crear usuario valida quién puede crear a quién.

**Archivos:**
- Buscar `CrearUsuarioUseCase` o equivalente (puede ser `RegistrarSocioUseCase`, `CrearNutricionistaUseCase`, etc.)
- Modificar o crear wrapper que valide:
  - ADMIN puede crear: RECEPCIONISTA, NUTRICIONISTA, SOCIO
  - RECEPCIONISTA puede crear: NUTRICIONISTA, SOCIO
  - NUTRICIONISTA, SOCIO: no pueden crear
  - SUPERADMIN: puede crear cualquiera

**Estrategia:** Crear un `PuedeCrearUsuarioValidator` que se inyecta en los use-cases de creación.

**Opciones de diseño:**
1. **Opción A:** Validator compartido inyectado en cada use-case de creación
2. **Opción B:** Controller valida antes de llamar al use-case
3. **Opción C:** Middleware/Interceptor que valida según endpoint

**Recomendación:** Opción A (validator compartido en use-cases) — más limpio, testeable.

**Archivos:**
- `apps/backend/src/application/usuarios/validators/crear-usuario.validator.ts` (NUEVO)
- `apps/backend/src/application/usuarios/validators/crear-usuario.validator.spec.ts` (NUEVO)
- Modificar use-cases existentes de creación para usar el validator

**Validator:**
```typescript
const REGLAS_CREACION = {
  [Rol.SUPERADMIN]: [Rol.ADMIN, Rol.RECEPCIONISTA, Rol.NUTRICIONISTA, Rol.SOCIO],
  [Rol.ADMIN]: [Rol.RECEPCIONISTA, Rol.NUTRICIONISTA, Rol.SOCIO],
  [Rol.RECEPCIONISTA]: [Rol.NUTRICIONISTA, Rol.SOCIO],
  [Rol.NUTRICIONISTA]: [],
  [Rol.SOCIO]: [],
};

@Injectable()
export class CrearUsuarioValidator {
  validate(rolCreador: Rol, rolACrear: Rol): void {
    const permitidos = REGLAS_CREACION[rolCreador] || [];
    if (!permitidos.includes(rolACrear)) {
      throw new ForbiddenError(
        `Un usuario con rol ${rolCreador} no puede crear usuarios con rol ${rolACrear}`
      );
    }
  }
}
```

**Tests:**
- SUPERADMIN puede crear cualquiera ✅
- ADMIN puede crear RECEPCIONISTA, NUTRICIONISTA, SOCIO ✅
- ADMIN NO puede crear otro ADMIN ❌
- RECEPCIONISTA puede crear NUTRICIONISTA, SOCIO ✅
- RECEPCIONISTA NO puede crear ADMIN ni RECEPCIONISTA ❌
- NUTRICIONISTA NO puede crear a nadie ❌
- SOCIO NO puede crear a nadie ❌

**Commit:** `feat(usuarios): add role-based creation validation`

---

### Task 7: Controller /permisos (1.5 horas)

**Objetivo:** Endpoints para gestionar permisos.

**Archivos:**
- `apps/backend/src/presentation/http/controllers/permisos.controller.ts` (NUEVO)
- `apps/backend/src/presentation/http/controllers/permisos.controller.spec.ts` (NUEVO)
- Verificar si ya existe `apps/backend/src/presentation/http/controllers/permisos.controller.ts` (sí existe según PROGRESS)

**Endpoints:**
- `GET /permisos/acciones` — Listar todas las acciones
- `GET /permisos/grupos` — Listar grupos de permisos
- `GET /permisos/usuarios/:id` — Ver permisos de un usuario
- `POST /permisos/usuarios/:id/grupos` — Asignar grupo
- `DELETE /permisos/usuarios/:id/grupos/:grupoId` — Quitar grupo

**Guards:**
- Todos requieren rol ADMIN o SUPERADMIN
- Usar `@Roles(Rol.ADMIN, Rol.SUPERADMIN)`

**Tests:**
- ADMIN puede listar acciones
- ADMIN puede asignar grupo a usuario de su tenant
- ADMIN NO puede asignar grupo a usuario de otro tenant
- RECEPCIONISTA NO puede acceder a estos endpoints
- Validación de inputs

**Commit:** `feat(permisos): add REST controller for permission management`

---

### Task 8: Actualizar Seed Multi-Tenant (2 horas)

**Objetivo:** Seed inserta acciones, crea grupos, asigna grupo base al crear usuario.

**Archivos:**
- `apps/backend/src/seed/data/grupos-permisos.data.ts` (NUEVO)
- `apps/backend/src/seed-multi-tenant.ts` (MODIFICAR — agregar paso de permisos)
- `apps/backend/src/seed-multi-tenant.spec.ts` (MODIFICAR — agregar tests)

**Pasos del seed:**
1. Crear gimnasios (ya existe)
2. Crear SUPERADMIN + asignar grupo ADMIN (wildcard)
3. Crear ADMIN por gimnasio + asignar grupo ADMIN
4. Crear RECEPCIONISTA por gimnasio + asignar grupo RECEPCIONISTA
5. Crear NUTRICIONISTA por gimnasio + asignar grupo NUTRICIONISTA
6. Crear SOCIO por gimnasio + asignar grupo SOCIO
7. **NUEVO:** Insertar todas las acciones del enum ACCIONES
8. **NUEVO:** Crear grupos de permisos (Admin, Recepcionista, Nutricionista, Socio)

**Lógica idempotente:**
- Si la acción ya existe, no la duplica
- Si el grupo ya existe, actualiza sus acciones
- Si la asignación usuario-grupo ya existe, no la duplica

**Tests:**
- Seed inserta todas las acciones
- Seed crea los 4 grupos base
- Seed asigna grupo base a cada usuario según su rol
- Seed es idempotente (corre 2 veces sin duplicar)

**Commit:** `feat(seed): add actions, groups, and base permissions to multi-tenant seed`

---

### Task 9: Frontend - Hook usePermissions (1 hora)

**Objetivo:** Hook que devuelve permisos del usuario actual.

**Archivos:**
- `apps/frontend/src/hooks/usePermissions.ts` (NUEVO)
- `apps/frontend/src/hooks/usePermissions.test.ts` (NUEVO)

**Implementación:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  return {
    tieneAccion: (accion: string): boolean => {
      return user?.acciones?.includes(accion) ?? false;
    },
    tieneAlgunaAccion: (acciones: string[]): boolean => {
      return acciones.some(a => user?.acciones?.includes(a));
    },
    tieneTodasLasAcciones: (acciones: string[]): boolean => {
      return acciones.every(a => user?.acciones?.includes(a));
    },
    esSuperadmin: user?.rol === 'SUPERADMIN',
    esAdmin: user?.rol === 'ADMIN',
  };
}
```

**Prerrequisito:** Agregar `acciones: string[]` a la respuesta de autenticación (ya debería estar en shared types).

**Tests:**
- Usuario sin acciones → false
- Usuario con acción → true
- `tieneAlgunaAccion` con una coincidencia → true
- `tieneTodasLasAcciones` con todas → true
- `tieneTodasLasAcciones` con alguna faltante → false

**Commit:** `feat(frontend): add usePermissions hook`

---

### Task 10: Frontend - Componente <Can> (1 hora)

**Objetivo:** Componente que renderiza children solo si el usuario tiene permiso.

**Archivos:**
- `apps/frontend/src/components/auth/Can.tsx` (NUEVO)
- `apps/frontend/src/components/auth/Can.test.tsx` (NUEVO)

**Implementación:**
```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { ReactNode } from 'react';

interface CanProps {
  accion?: string;
  acciones?: string[];
  algunaDe?: boolean; // true = alguna, false = todas (default)
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ accion, acciones, algunaDe = false, children, fallback = null }: CanProps) {
  const { tieneAccion, tieneAlgunaAccion, tieneTodasLasAcciones } = usePermissions();

  let tienePermiso = false;
  if (accion) {
    tienePermiso = tieneAccion(accion);
  } else if (acciones) {
    tienePermiso = algunaDe
      ? tieneAlgunaAccion(acciones)
      : tieneTodasLasAcciones(acciones);
  }

  return <>{tienePermiso ? children : fallback}</>;
}
```

**Tests:**
- Con acción que usuario tiene → renderiza children
- Con acción que usuario NO tiene → renderiza fallback (o null)
- Con array de acciones (algunaDe=true) y una coincidencia → renderiza
- Con array de acciones (algunaDe=false) y todas → renderiza
- Con array de acciones (algunaDe=false) y alguna faltante → no renderiza

**Commit:** `feat(frontend): add Can component for permission-based rendering`

---

### Task 11: Frontend - Página de Gestión de Permisos (2 horas)

**Objetivo:** Página para que ADMIN asigne permisos a usuarios.

**Archivos:**
- `apps/frontend/src/pages/admin/UsuarioPermisosPage.tsx` (NUEVO)
- `apps/frontend/src/pages/admin/UsuarioPermisosPage.test.tsx` (NUEVO)
- `apps/frontend/src/router.tsx` (MODIFICAR — agregar ruta)
- `apps/frontend/src/services/permisos.service.ts` (NUEVO)

**Funcionalidad:**
- Lista de grupos de permisos disponibles
- Checkboxes por cada grupo
- Botón "Guardar" que asigna/quita grupos
- Vista previa de acciones que tendrá el usuario
- Solo accesible para ADMIN/SUPERADMIN

**UI:**
- Card por cada grupo
- Switch on/off
- Vista de acciones resultantes
- Confirmación antes de guardar

**Tests:**
- Renderiza lista de grupos
- Marcar grupo → llama API para asignar
- Desmarcar grupo → llama API para quitar
- Muestra acciones resultantes

**Commit:** `feat(frontend): add user permissions management page`

---

### Task 12: Frontend - Aplicar <Can> en UI Existente (2 horas)

**Objetivo:** Envolver botones y menús existentes con `<Can>`.

**Archivos a modificar (buscar en el código):**
- Páginas de socios (botones crear/editar/eliminar)
- Páginas de nutricionistas (botones crear/editar/eliminar)
- Páginas de recepcionistas (botones crear/editar/eliminar)
- Páginas de turnos (botones según rol)
- Sidebar/menús (ocultar items según permisos)

**Patrón:**
```typescript
// ANTES:
<Button onClick={handleDelete}>Eliminar</Button>

// DESPUÉS:
<Can accion={ACCIONES.SOCIOS_ELIMINAR}>
  <Button onClick={handleDelete}>Eliminar</Button>
</Can>
```

**Commit:** `refactor(frontend): apply Can component to hide buttons based on permissions`

---

### Task 13: Tests E2E de Permisos (2 horas)

**Objetivo:** Tests end-to-end del flujo completo de permisos.

**Archivos:**
- `apps/backend/test/permisos-granulares.e2e-spec.ts` (NUEVO)

**Tests:**
1. RECEPCIONISTA con `socios.eliminar` puede eliminar socio
2. RECEPCIONISTA sin `socios.eliminar` recibe 403 al intentar API call
3. NUTRICIONISTA no puede crear SOCIO (403)
4. ADMIN puede asignar grupo Reportes a Recepcionista 1
5. Recepcionista 1 con grupo Reportes puede generar reporte
6. Recepcionista 2 sin grupo Reportes NO puede generar reporte
7. Frontend no muestra botón eliminar a RECEPCIONISTA sin permiso
8. SUPERADMIN puede hacer todo sin restricciones

**Commit:** `test(permisos): add E2E tests for granular permissions`

---

### Task 14: Documentación en AGENTS.md (30 min)

**Objetivo:** Documentar cómo agregar features con acciones para futuras IAs.

**Archivos:**
- `AGENTS.md` (MODIFICAR — agregar sección)

**Sección a agregar:** "Cómo agregar una nueva feature con acciones"

Ver spec sección 12 para contenido completo.

**Commit:** `docs(agents): add guide for adding features with permissions`

---

## Resumen

- **14 tasks** en total
- **~16-18 horas** de trabajo estimadas
- **~50+ tests** nuevos
- **~30 archivos** nuevos/modificados
- **Commits:** 14 (uno por task)

## Orden de Ejecución

1. Task 1 (enum)
2. Task 2 (entidad)
3. Task 3 (service)
4. Task 4 (use-cases)
5. Task 5 (refactor guard)
6. Task 6 (validación creación)
7. Task 7 (controller)
8. Task 8 (seed)
9. Task 9 (hook frontend)
10. Task 10 (componente Can)
11. Task 11 (página gestión)
12. Task 12 (aplicar Can)
13. Task 13 (E2E tests)
14. Task 14 (docs)

**Dependencias:**
- Task 2 depende de Task 1
- Task 3 depende de Task 2
- Task 4 depende de Task 3
- Task 5 depende de Task 3
- Task 6 independiente
- Task 7 depende de Task 4
- Task 8 depende de Task 1 y Task 2
- Task 9-12 (frontend) pueden ir en paralelo con backend
- Task 13 depende de todo
- Task 14 al final
