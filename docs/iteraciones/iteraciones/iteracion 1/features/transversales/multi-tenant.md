# Multi-tenant

> **Source of truth**: `01-iteracion-base-nutricional.md` §1.3, §4.2, RB25, RB26
> **Estado**: Por implementar
> **Prioridad**: Crítica
> **Dependencias**: `01-registrar-nutricionista.md`, `06-crear-socio.md`, todos los use-cases, `auth.md`

## Descripción
Sistema multi-tenant donde cada gimnasio es un tenant. Aislamiento estricto de datos por gimnasio. Un nutricionista puede atender en N gimnasios con agendas independientes. Un socio pertenece a un único gimnasio en iter 1.

## Conceptos clave
- **Gimnasio = Tenant**. Cada gimnasio tiene sus datos aislados.
- **Admin de varios gimnasios**: un admin puede estar asociado a N gimnasios. El JWT contiene un `gimnasioId` activo (el que está usando en la sesión). Puede cambiar entre gimnasios.
- **Nutricionista en N gimnasios**: vía tabla intermedia `NutricionistaGimnasio`. Cada asociación tiene su propia disponibilidad.
- **Socio en 1 gimnasio**: `socio.gimnasio_id` (RB26, restricción de iter 1).

## Actores
- SISTEMA (aplicación de filtros)
- NUTRICIONISTA, ADMIN, RECEPCIONISTA, SOCIO

## Modelo de datos

### Entidad `Gimnasio`
- `id, nombre, zona_horaria (default 'America/Argentina/Buenos_Aires'), datos_contacto (JSON), smtp_configurado (boolean), logo_path, deleted_at, created_at, updated_at`

### Entidad `ConfiguracionGimnasio` (1:1 con Gimnasio)
- `id, gimnasio_id (UNIQUE), zona_horaria, datos_contacto (JSON), smtp_host, smtp_port, smtp_user, smtp_password_encrypted, smtp_from, opciones_adicionales (JSON), updated_at`
- **Decisión**: se modela como entidad separada (1:1 con Gimnasio) para extensibilidad. Los campos del gimnasio se separan en dos entidades: `Gimnasio` (datos básicos) y `ConfiguracionGimnasio` (configuración operativa).

### Entidad `NutricionistaGimnasio` (N:M)
- `id, nutricionista_id, gimnasio_id, estado ('ACTIVO'|'INACTIVO'), created_at, updated_at`
- `UNIQUE(nutricionista_id, gimnasio_id)`.

### Entidad `Socio`
- `socio.gimnasio_id` NOT NULL (RB26, restricción de iter 1).

### Entidad `UsuarioGimnasio` (N:M, para admin/recepción multi-gimnasio)
- `id, usuario_id, gimnasio_id, es_principal (boolean), created_at`
- `UNIQUE(usuario_id, gimnasio_id)`.
- El campo `es_principal` indica el gimnasio por default al login.

### Entidades con `gimnasio_id` (directo o transitivo)
- `NutricionistaGimnasio.gimnasio_id`
- `Socio.gimnasio_id`
- `UsuarioGimnasio.gimnasio_id`
- `Turno.nutricionista_gimnasio_id → gimnasio_id`
- `Consulta.nutricionista_gimnasio_id → gimnasio_id`
- `PlanAlimentario.nutricionista_gimnasio_id → gimnasio_id`
- `Medicion.nutricionista_gimnasio_id → gimnasio_id`
- `FichaSalud.socio.gimnasio_id → gimnasio_id`
- `DisponibilidadSemanal.nutricionista_gimnasio_id → gimnasio_id`
- `ExcepcionDisponibilidad.nutricionista_gimnasio_id → gimnasio_id`
- `Auditoria.gimnasio_id` (directo)
- `Archivo.gimnasio_id` (directo)

## Reglas de aislamiento

- **TODA query debe filtrar por `gimnasio_id`** (directo o transitivo). Esto se enforce con:
  - Guards a nivel de controller (`GimnasioGuard`) que validan que el `gimnasioId` del JWT coincide con la entidad accedida.
  - Repositorios parametrizados con `gimnasioId` por defecto (encontrar N+1, etc.).
  - Tests de aislamiento: ejecutar queries con JWT de un gimnasio y verificar que NO se retornan datos de otros.

### Decorator `@CurrentGimnasio()`

```typescript
@UseGuards(JwtAuthGuard, GimnasioGuard)
@Get(':id')
async findOne(@Param('id') id: string, @CurrentGimnasio() gimnasioId: string) {
  return this.useCase.execute({ id, gimnasioId });
}
```

### `GimnasioGuard`

```typescript
@Injectable()
export class GimnasioGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const gimnasioIdFromJwt = req.user.gimnasioId;
    const gimnasioIdFromParams = req.params.gimnasioId || req.body.gimnasioId;
    if (gimnasioIdFromParams && gimnasioIdFromJwt !== gimnasioIdFromParams) {
      throw new ForbiddenError('Gimnasio no accesible');
    }
    // Verificar que el usuario tiene acceso al gimnasio
    const hasAccess = await this.usuarioGimnasioRepo.exists({
      usuarioId: req.user.id,
      gimnasioId: gimnasioIdFromJwt,
    });
    if (!hasAccess) throw new ForbiddenError('Sin acceso a este gimnasio');
    return true;
  }
}
```

## Reglas de negocio aplicadas
- **RB25**: Nutricionista en N gimnasios.
- **RB26**: Socio en 1 gimnasio (iter 1).
- **RB33**: Auditoría con `gimnasio_id`.

## Endpoints API

### Gestión de gimnasio

#### `GET /api/gimnasios/me`
- **Auth**: cualquier usuario autenticado
- **Response 200**: `{ id, nombre, zonaHoraria, logoUrl, esPrincipal }` del gimnasio activo
- **Errors**: 401, 500

#### `GET /api/gimnasios/me/todos`
- **Auth**: cualquier usuario autenticado
- **Response 200**: `[{ id, nombre, esPrincipal }]` de todos los gimnasios del usuario
- **Use**: switcher de gimnasio
- **Errors**: 401, 500

#### `POST /api/gimnasios/me/cambiar`
- **Auth**: cualquier usuario autenticado con acceso a N gimnasios
- **Body**: `{ gimnasioId }`
- **Response 200**: `{ ok: true, gimnasioActivo: {...} }`
- **Side effect**: emite nuevo JWT con `gimnasioId` actualizado (refresh token rotation)
- **Errors**: 400 (sin acceso al gimnasio), 401, 500

#### `PATCH /api/gimnasios/:id`
- **Auth**: ADMIN (del gimnasio)
- **Body**: `{ nombre?, datosContacto?, logoPath? }`
- **Response 200**: gimnasio actualizado
- **Errors**: 403, 404, 500

#### `PATCH /api/gimnasios/:id/configuracion`
- **Auth**: ADMIN
- **Body**: `{ zonaHoraria?, smtpHost?, smtpPort?, smtpUser?, smtpPassword?, smtpFrom? }`
- **Response 200**: configuración actualizada
- **Errors**: 400, 403, 404, 500

### Nutricionista-Gimnasio

#### `POST /api/nutricionistas/:id/gimnasios`
- **Auth**: ADMIN, RECEPCIONISTA
- **Body**: `{ gimnasioId }`
- **Side effect**: crea `NutricionistaGimnasio` (estado ACTIVO)
- **Response 201**: asociación creada
- **Errors**: 400, 403, 404, 409 (ya asociado)

#### `DELETE /api/nutricionistas/:id/gimnasios/:gimnasioId`
- **Auth**: ADMIN
- **Side effect**:
  1. Marca `NutricionistaGimnasio.estado='INACTIVO'`.
  2. **Cancela turnos futuros** del nutricionista en ese gimnasio con motivo "Nutricionista desasociado del gimnasio".
  3. Notifica a socios afectados.
  4. Auditoría.
- **Response 200**: `{ ok: true, turnosCancelados: number }`
- **Errors**: 403, 404, 500

#### `GET /api/nutricionistas/:id/gimnasios`
- **Auth**: ADMIN, RECEPCIONISTA, NUTRICIONISTA (la propia)
- **Response 200**: `[{ gimnasioId, nombre, estado }]`
- **Errors**: 403, 404, 500

### Listados por gimnasio

#### `GET /api/gimnasios/me/nutricionistas`
- **Auth**: ADMIN, RECEPCIONISTA
- **Query**: `?estado=ACTIVO&nombre=...&page=1&limit=20`
- **Response 200**: `[{ id, nombre, apellido, email, matricula, estado, duracionTurnoMin, setupOperativo }]`
- **Use**: vista de recepción/admin del gimnasio
- **Errors**: 401, 500

#### `GET /api/gimnasios/me/socios`
- **Auth**: ADMIN, RECEPCIONISTA
- **Query**: `?estado=ACTIVO&nombre=...&dni=...&page=1&limit=20`
- **Response 200**: `[{ id, nombre, apellido, email, dni, estado, fechaAlta, fichaCompleta }]`
- **Use**: vista de recepción
- **Errors**: 401, 500

## Endpoints críticos de gimnasio

#### `GET /api/gimnasios/me/turnos-hoy`
- **Auth**: ADMIN, RECEPCIONISTA
- **Response 200**: `[{ id, socio, nutricionista, fechaHora, estado, tipoConsulta }]`
- **Use**: dashboard de recepción del día
- **Errors**: 401, 500

#### `GET /api/gimnasios/me/stats`
- **Auth**: ADMIN
- **Response 200**:
  ```json
  {
    "nutricionistasActivos": 5,
    "sociosActivos": 234,
    "turnosHoy": 12,
    "fichasCompletas": 180,
    "planesActivos": 95
  }
  ```
- **Errors**: 401, 500

## Decisión: "desactivar nutricionista" vs "desasociar de gimnasio"

**Decisión crítica**: dos operaciones distintas.

### Desactivar nutricionista (CU-03)
- Acción: `POST /api/nutricionistas/:id/desactivar` (en `nutricionistas/03-desactivar-nutricionista.md`).
- Efecto: nutricionista pasa a `INACTIVO` globalmente. TODAS las asociaciones `NutricionistaGimnasio` pasan a `INACTIVO`. No aparece en ningún gimnasio.
- Cuándo: nutricionista se va del sistema completamente (renuncia, baja, etc.).

### Desasociar de un gimnasio
- Acción: `DELETE /api/nutricionistas/:id/gimnasios/:gimnasioId` (este spec).
- Efecto: solo la asociación con ese gimnasio queda `INACTIVO`. El nutricionista sigue activo en otros gimnasios.
- Cuándo: nutricionista deja de atender en un gimnasio específico pero sigue en otros.

**Diferencia crítica**: en el primer caso, el nutricionista no recibe turnos en ningún gimnasio. En el segundo, sigue recibiendo turnos en los gimnasios donde aún está asociado.

## Edge cases

- **B1**: Admin de varios gimnasios → switcher en UI (dropdown con gimnasios disponibles). JWT cambia con `gimnasioId` activo.
- **B2**: Nutricionista en Gimnasio A y B → JWT cambia entre gimnasios. Cada gimnasio ve su agenda, sus socios, sus planes.
- **B3**: Socio intenta reservar con nutricionista de OTRO gimnasio → bloqueado (el `gimnasioId` no coincide).
- **B4**: Auditoría cross-gimnasio → solo admin del gimnasio ve su auditoría, nunca la de otros.
- **B5**: Eliminación de `NutricionistaGimnasio` → cancela turnos futuros del nutricionista en ese gimnasio, notifica socios.
- **B6**: Admin intenta asignar un nutricionista a un gimnasio que no es el suyo → 403.
- **B7**: Socio intenta cambiar de gimnasio → NO permitido en iter 1 (RB26). Admin debe crear un nuevo socio.
- **B8**: Nutricionista intenta acceder a datos de un gimnasio donde no está asociado → 403.
- **B9**: Recepción intenta desasociar a sí misma del gimnasio → 403 (la asociación se gestiona vía admin del gimnasio).
- **B10**: Cambio de gimnasio activo mientras hay una operación en curso (transacción larga) → el commit se hace con el gimnasio que estaba activo al INICIO de la transacción.

## Tests

### Unitarios
- Cada use-case debe tener un test de "aislamiento": intentar acceder a entidad de otro gimnasio → 403/404.
- Tests de query: ejecutar con `gimnasioId` incorrecto → no retorna nada.
- `GimnasioGuard`: tests con combinaciones de gimnasioId en JWT vs params.
- Switcher: tests de cambio de gimnasio + emisión de nuevo JWT.

### E2E (críticos)
- Test 1: crear nutricionista y socio en Gimnasio A, intentar acceder desde Gimnasio B → 403.
- Test 2: nutricionista en 2 gimnasios, desasociar de uno, verificar que el otro sigue activo.
- Test 3: admin de varios gimnasios, switcher, verificar que las queries cambian de scope.

## Índices necesarios (multi-tenant queries)

| Tabla | Índice | Uso |
|---|---|---|
| `usuario_gimnasio` | `(usuario_id, gimnasio_id)` UNIQUE | Lookup de acceso |
| `nutricionista_gimnasio` | `(gimnasio_id, estado)` | Listado de nutri por gimnasio |
| `nutricionista_gimnasio` | `(nutricionista_id)` | Lookup inverso |
| `socio` | `(gimnasio_id, estado)` | Listado de socios por gimnasio |
| `turno` | `(nutricionista_gimnasio_id, fecha_hora, estado)` | Slots disponibles |
| `consulta` | `(nutricionista_gimnasio_id, created_at)` | Historial del nutri |
| `plan_alimentario` | `(nutricionista_gimnasio_id, activo)` | Planes activos |
| `medicion` | `(socio_id, nutricionista_gimnasio_id, fecha)` | Historial del socio |
| `auditoria` | `(gimnasio_id, timestamp)` | Listado de auditoría |
| `archivo` | `(gimnasio_id, tipo)` | Listado de archivos |

## Notas
- El "Multi-tenant" es a nivel de gimnasio, no de cadena de gimnasios (un gimnasio = un tenant).
- En iter 2+ se puede considerar multi-cadena (grupos de gimnasios con admin compartido).
- El mayor riesgo es un bug de "leak" entre tenants. **Tests de aislamiento son obligatorios** en cada use-case.
- **ConfiguracionGimnasio se modela como entidad separada** para extensibilidad. Si en iter 1 alcanza con tener los campos en `Gimnasio`, se puede fusionar.
- El switcher de gimnasio es CRÍTICO para UX: el admin que trabaja en 2+ gimnasios necesita cambiar de contexto.
