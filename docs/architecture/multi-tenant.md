# Arquitectura Multi-Tenant

> Sistema de aislamiento de datos por gimnasio con soporte para SUPERADMIN global e impersonación.

**Fecha:** 2026-06-01  
**Estado:** Implementado (Plans 1-4 completados)

---

## Quick path

1. Todo dato relevante tiene `gimnasioId` como clave de aislamiento
2. SUPERADMIN opera sin `gimnasioId` (cross-tenant)
3. ADMIN y otros roles requieren `gimnasioId` válido
4. Impersonación añade `impersonatedBy` al token para trazabilidad

---

## 1. Modelo de Datos

### 1.1 Entidades con `gimnasioId`

| Entidad | Descripción |
|---------|-------------|
| `SocioOrmEntity` |会员 - pertenece a un gimnasio |
| `NutricionistaOrmEntity` | 营养师 - pertenece a un gimnasio |
| `AgendaOrmEntity` | Agenda de profesionales |
| `TurnoOrmEntity` | Turnos reservados |
| `PlanAlimentacionOrmEntity` | Planes alimentarios |
| `FichaSaludOrmEntity` | Fichas clínicas |
| `ObservacionClinicaOrmEntity` | Observaciones de consultas |
| `SugerenciaIAOrmEntity` | Sugerencias del motor IA |
| `AuditoriaOrmEntity` | Log de auditoría (nullable para SUPERADMIN) |

### 1.2 Entidades Globales (sin `gimnasioId`)

| Entidad | Descripción |
|---------|-------------|
| `GimnasioOrmEntity` | Raíz del tenant - existe independientemente |
| `UsuarioOrmEntity` | Usuarios del sistema (SUPERADMIN global, ADMIN por gimnasio) |

### 1.3 Relación Persona-Gimnasio

```
Usuario (1) ──┬── (0..1) Persona (Socio|Nutricionista|Asistente)
              │
              └── belongs to ──► Gimnasio
```

- **SUPERADMIN:** Usuario sin `persona` (sin `gimnasioId` en JWT)
- **ADMIN/NUTRICIONISTA/RECEPCIONISTA:** Usuario con `persona.gimnasioId`
- **SOCIO:** Persona con `gimnasioId` asignado

---

## 2. Flujo de `gimnasioId`

### 2.1 Login

```
POST /auth/login
├── Credenciales válidas
├── Usuario existe → Buscar persona asociada
└── Si SUPERADMIN:
    ├── persona?.gimnasioId ?? null
    └── JWT: { gimnasioId: null, impersonatedBy: null }
    Si OTRO rol:
    ├── Required: persona.gimnasioId
    └── JWT: { gimnasioId: <persona.gimnasioId> }
```

### 2.2 Solicitud HTTP

```
Request → JwtAuthGuard → TenantContextInterceptor → TenantContextService
                                                    │
                                                    └── request.user = JwtPayload
                                                        ├── gimnasioId
                                                        ├── impersonatedBy
                                                        └── rol
```

### 2.3 Aislamiento en Repositorios

```typescript
// Repository pattern con filtro automático
async buscarPorId(id: number): Promise<Socio | null> {
  const gimnasioId = this.tenantContext.gimnasioId;

  if (gimnasioId === null) {
    throw new ForbiddenError('Tenant context requerido para esta operación');
  }

  return this.repo.findOne({
    where: { id, persona: { gimnasioId } },
  });
}
```

**Patrón aplicado en:**
- `SocioRepository`
- `NutricionistaRepository`
- `AgendaRepository`
- `ObjetivoRepository`
- `FotoProgresoRepository`
- `UsuarioRepository`
- `TurnoRepository` (Plan 3)
- `PlanAlimentacionRepository` (Plan 4)
- `FichaSaludRepository` (Plan 4)
- `ObservacionClinicaRepository` (Plan 4)
- `SugerenciaIARepository` (Plan 4)

---

## 3. TenantContextService

### 3.1 Interfaz

```typescript
export interface TenantContext {
  gimnasioId: number | null;    // null para SUPERADMIN sin impersonar
  personaId: number | null;
  usuarioId: number;
  jti: string;
  rol: string;
  impersonatedBy: number | null; // ID del SUPERADMIN que impersonó
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  get gimnasioId(): number { ... }      // Lanza si no está inicializado
  get personaId(): number | null { ... }
  get usuarioId(): number { ... }
  get impersonatedBy(): number | null { ... }
  get isInitialized(): boolean { ... }
  setFromPayload(payload: JwtPayload): void { ... }
}
```

### 3.2 inicialización

El `TenantContextInterceptor` extrae el payload del JWT y llama `setFromPayload()`:

```typescript
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    this.tenantContext.setFromPayload(user);
    return next.handle();
  }
}
```

---

## 4. Aislamiento en Repositorios

### 4.1 Patrón de Filtro

```typescript
// Pattern: always filter by gimnasioId
private async withTenantFilter<T>(
  repo: Repository<T>,
  findOptions: FindOptions<T>,
): Promise<T | null> {
  const gimnasioId = this.tenantContext.gimnasioId;
  // For SUPERADMIN without gym (global queries), skip filter
  if (gimnasioId === null && this.tenantContext.rol !== Rol.SUPERADMIN) {
    throw new ForbiddenError('Tenant context requerido');
  }
  return repo.findOne({
    ...findOptions,
    where: {
      ...findOptions.where,
      ...(gimnasioId !== null && { gimnasioId }),
    },
  });
}
```

### 4.2 SUPERADMIN Global vs Impersonado

| Contexto | `gimnasioId` | Comportamiento |
|----------|--------------|---------------|
| SUPERADMIN sin impersonar | `null` | Query sin filtro (`WHERE 1=1`) |
| SUPERADMIN impersonando gym 1 | `1` | Filtra por `gimnasioId = 1` |
| ADMIN/NUTRICIONISTA/RECEPCIONISTA | `n` (requerido) | Filtra por `gimnasioId = n` |
| SOCIO | `n` (requerido) | Filtra por `gimnasioId = n` |

---

## 5. Seguridad

### 5.1 JwtAuthGuard

```typescript
canActivate(context: ExecutionContext): boolean {
  // ... token validation ...

  // SUPERADMIN puede no tener gimnasioId
  if (
    payload.rol !== Rol.SUPERADMIN &&
    (payload.gimnasioId === undefined || payload.gimnasioId === null)
  ) {
    throw new UnauthorizedException('Token sin contexto de tenant');
  }

  (req as any).user = payload;
  return true;
}
```

### 5.2 ActionsGuard

```typescript
canActivate(context: ExecutionContext): boolean {
  // SUPERADMIN bypassea todo
  if (request.user.rol === Rol.SUPERADMIN) {
    return true;
  }

  // Otros roles requieren permisos explícitos
  return this.permisosService.hasAllActions(userId, requiredActions);
}
```

### 5.3 Impersonación

Endpoint: `POST /gimnasios/:id/impersonar`

```typescript
// Genera token con:
// - gimnasioId: id del gimnasio impersonado
// - impersonatedBy: id del SUPERADMIN que impersona
// - rol: SUPERADMIN (mantiene el rol original)
const token = this.jwtService.sign({
  id: superadmin.id,
  email: superadmin.email,
  rol: Rol.SUPERADMIN,
  gimnasioId: gimnasio.id,
  impersonatedBy: superadmin.id,
});
```

---

## 6. Auditoría

### 6.1 Entidad

```typescript
@Column({ name: 'id_gimnasio', type: 'int', nullable: true })
gimnasioId: number | null;

@Column({ name: 'metadata', type: 'jsonb', nullable: true })
metadata: Record<string, unknown> | null;
```

### 6.2 Registro de Impersonación

Cuando SUPERADMIN impersona:

```typescript
await this.auditoriaService.registrar({
  usuarioId: superadminId,
  accion: AccionAuditoria.IMPERSONACION_GIMNASIO,
  entidad: 'Gimnasio',
  entidadId: gimnasioId,
  gimnasioId, // El gimnasio impersonado
  metadata: {
    impersonatedBy: superadminId,
    gimnasioId: gimnasioId,
  },
});
```

---

## 7. Checklist

- [ ] Todos los repos filtran por `gimnasioId` del `TenantContext`
- [ ] ADMIN de Gym 1 no puede ver datos de Gym 2
- [ ] SUPERADMIN puede operar cross-tenant (sin `gimnasioId`)
- [ ] `auth.guard` permite SUPERADMIN con `gimnasioId: null`
- [ ] `LoginUseCase` emite JWT correcto según rol
- [ ] `ActionsGuard` bypassea solo SUPERADMIN
- [ ] Auditoría registra `impersonatedBy` cuando corresponde

---

## 8. Próximos pasos

| Plan | Descripción | Estado |
|------|-------------|--------|
| 5 | CRUD Gimnasios + Impersonación | Pendiente |
| 6 | Frontend: AuthContext + TenantSwitcher | Pendiente |
| 7 | Frontend: Gestión + Wizard | Pendiente |

---

**Doc version:** 1.0  
**Última actualización:** 2026-06-01