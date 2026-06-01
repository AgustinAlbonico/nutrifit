# Guía de Administración: Multi-Tenant

> Guía para administradores del sistema NutriFit Supervisor en entorno multi-tenant.

**Fecha:** 2026-06-01  
**Versión:** 1.0  
**Dirigido a:** Administradores del sistema, SUPERADMIN

---

## Quick path

1. Crear gimnasio → Asignar ADMIN → Asignar profesionales → Verificar aislamiento
2. Impersonar gimnasio → Operar como ADMIN temporal → Revisar auditoría
3. Gestionar permisos → Asignar acciones por rol → Monitorear acceso

---

## 1. Gestión de Gimnasios

### 1.1 Crear un Nuevo Gimnasio

**Requisito:** Ser SUPERADMIN

**Pasos:**

1. Iniciar sesión como SUPERADMIN
2. Ir a `/admin/gimnasios/nuevo`
3. Completar wizard:
   - Datos básicos (nombre, dirección, contacto)
   - Credenciales del ADMIN inicial
4. Confirmar creación

**API equivalente:**
```bash
POST /gimnasios
Authorization: Bearer <superadmin-token>
Content-Type: application/json

{
  "nombre": "Gym Nuevo",
  "direccion": "Av. Principal 123",
  "telefono": "1234567890",
  "email": "gym-nuevo@email.com"
}
```

### 1.2 Editar un Gimnasio

```bash
PATCH /gimnasios/:id
Authorization: Bearer <superadmin-token>

{
  "nombre": "Gym Nuevo Nombre",
  "telefono": "0987654321"
}
```

### 1.3 Listar Gimnasios

```bash
GET /gimnasios
Authorization: Bearer <superadmin-token>
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Gym Central",
    "direccion": "Av. Centro 123",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Gym Norte",
    "direccion": "Av. Norte 456",
    "activo": true
  }
]
```

---

## 2. Impersonación

### 2.1 ¿Qué es la Impersonación?

La impersonación permite a un SUPERADMIN operar dentro del contexto de un gimnasio específico, como si fuera el ADMIN de ese gimnasio.

**Casos de uso:**
- Resolver problemas técnicos en un gimnasio
- Realizar acciones de emergencia
- Auditar configuraciones de un gimnasio
- Soporte técnico sin necesidad de credenciales del ADMIN

### 2.2 Cómo Impersonar un Gimnasio

1. Iniciar sesión como SUPERADMIN
2. Seleccionar gimnasio en el TenantSwitcher
3. Confirmar impersonación

**API:**
```bash
POST /gimnasios/:id/impersonar
Authorization: Bearer <superadmin-token>
```

**Respuesta:**
```json
{
  "token": "<nuevo-jwt-con-gimnasioId-y-impersonatedBy>",
  "gimnasio": {
    "id": 1,
    "nombre": "Gym Central"
  },
  "expiraEn": "2h"
}
```

### 2.3 Token de Impersonación

El token generado tiene:

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `rol` | `SUPERADMIN` | Mantiene rol de SUPERADMIN |
| `gimnasioId` | `1` | ID del gimnasio impersonado |
| `impersonatedBy` | `<superadmin-id>` | ID del SUPERADMIN que impersona |

### 2.4 Saliendo de Impersonación

Para volver al contexto global del SUPERADMIN:

1. Click en "Salir de impersonación" (TenantSwitcher)
2. O cerrar sesión

### 2.5 Auditoría de Impersonación

**Todos los registros de auditoría incluyen:**

| Campo | Descripción |
|-------|-------------|
| `usuarioId` | ID del SUPERADMIN |
| `gimnasioId` | ID del gimnasio impersonado |
| `metadata.impersonatedBy` | ID del SUPERADMIN que impersonó |

**Consultar logs de impersonación:**
```bash
GET /admin/auditoria?accion=IMPERSONACION_GIMNASIO
Authorization: Bearer <superadmin-token>
```

---

## 3. Gestión de Administradores

### 3.1 Crear ADMIN para un Gimnasio

**Opción 1: Wizard de creación de gimnasio (Paso 2)**

Al crear un gimnasio, el wizard permite crear el ADMIN inicial.

**Opción 2: Asignar ADMIN existente**

```bash
# Crear usuario sin persona (para ADMIN global)
POST /usuarios
Authorization: Bearer <superadmin-token>

{
  "email": "admin-gym2@nutrifit.com",
  "password": "temporal123",
  "rol": "ADMIN"
}

# Asociar con el gimnasio a través de Persona
POST /personas
Authorization: Bearer <superadmin-token>

{
  "usuarioId": <usuario-id>,
  "tipo": "ADMIN",
  "gimnasioId": <gimnasio-id>,
  "nombre": "Admin",
  "apellido": "Gym 2"
}
```

### 3.2 Cambiar ADMIN de un Gimnasio

1. Impersonar el gimnasio objetivo
2. Ir a configuración de usuarios
3. Asignar rol ADMIN al nuevo usuario

### 3.3 Recuperar Acceso a ADMIN

Si un ADMIN pierde acceso:

1. SUPERADMIN se loguea
2. Impersona el gimnasio
3. Resetea password del ADMIN o crea nuevo ADMIN

---

## 4. Permisos y Acciones

### 4.1 Roles del Sistema

| Rol | Descripción | Ámbito |
|-----|-------------|--------|
| `SUPERADMIN` | Administrador global del sistema | Global (todos los gimnasios) |
| `ADMIN` | Administrador de gimnasio | Un gimnasio específico |
| `NUTRICIONISTA` | Profesional de salud | Un gimnasio específico |
| `RECEPCIONISTA` | Recepcionista | Un gimnasio específico |
| `SOCIO` | Miembro/Gestor | Un gimnasio específico |

### 4.2 Permisos de ActionsGuard

El sistema usa permisos granulares para acciones específicas.

**SUPERADMIN:** Bypasea todos los controles de permisos.

**ADMIN/NUTRICIONISTA/RECEPCIONISTA:** Requieren permisos explícitos por acción.

### 4.3 Acciones Comunes

| Acción | Descripción | Roles típicos |
|--------|-------------|---------------|
| `gimnasios.*` | Gestión de gimnasios | SUPERADMIN |
| `socios.create` | Crear socio | ADMIN, NUTRICIONISTA |
| `turnos.*` | Gestión de turnos | ADMIN, NUTRICIONISTA, RECEPCIONISTA |
| `planes.*` | Gestión de planes | NUTRICIONISTA |
| `ficha.*` | Acceso a fichas de salud | NUTRICIONISTA |

---

## 5. Seguridad

### 5.1 Mejores Prácticas

1. **SUPERADMIN: Usar para impersonación, no para operaciones rutinarias**
   - El SUPERADMIN debe impersonar solo cuando sea necesario
   - Para operaciones rutinarias, usar credenciales de ADMIN

2. **Contraseñas de ADMIN:**
   - Mínimo 8 caracteres
   - Combinar mayúsculas, minúsculas, números
   - Cambiar cada 90 días

3. **Impersonación:**
   - Revisar logs de auditoría después de impersonar
   - Tiempo máximo de impersonación: 2 horas
   - Notificar al ADMIN del gimnasio cuando se impersona

4. **Acceso a datos:**
   - Nunca compartir credenciales entre gimnasios
   - Cada usuario debe tener su propia cuenta

### 5.2 Auditoría

**Consultar actividad por gimnasio:**
```bash
GET /admin/auditoria?gimnasioId=1
Authorization: Bearer <superadmin-token>
```

**Consultar actividad por usuario:**
```bash
GET /admin/auditoria?usuarioId=5
Authorization: Bearer <superadmin-token>
```

**Consultar impersonaciones:**
```bash
GET /admin/auditoria?accion=IMPERSONACION_GIMNASIO
Authorization: Bearer <superadmin-token>
```

---

## 6. Troubleshooting

### 6.1 ADMIN no puede acceder a datos de su gimnasio

**Síntoma:** ADMIN logueado pero recibe 403 Forbidden.

**Causas posibles:**
1. El usuario no tiene `persona.gimnasioId` asignado
2. El token fue generado antes de asignar el gimnasio

**Solución:**
1. Verificar en BD que `persona.id_gimnasio` está asignado
2. Re-generar token (logout + login)

### 6.2 SUPERADMIN no puede impersonar

**Síntoma:** Error 403 al llamar `/gimnasios/:id/impersonar`.

**Causa:** El token no tiene rol SUPERADMIN.

**Solución:**
1. Verificar que el login devolvió `rol: "SUPERADMIN"`
2. Verificar que el token no está expirado

### 6.3 Datos de un gimnasio visibles en otro

**Síntoma:** ADMIN de Gym 1 ve datos de Gym 2.

**Causa:** Repository sin filtro de `gimnasioId`.

**Solución:**
1. Reportar bug (no debería pasar si el aislamiento está bien implementado)
2. Mientras tanto, no usar ese endpoint

### 6.4 No aparece opción de TenantSwitcher

**Síntoma:** Soy SUPERADMIN pero no veo el selector de gimnasio.

**Causa:** AuthContext no está actualizado con el componente TenantSwitcher.

**Solución:**
1. Esperar a Plan 6 (Frontend: AuthContext + TenantSwitcher)
2. Usar API directamente para impersonar

---

## 7. Checklist de Verificación

Después de crear un gimnasio:

- [ ] Gimnasio aparece en `GET /gimnasios`
- [ ] ADMIN puede login con credenciales
- [ ] ADMIN tiene `gimnasioId` correcto en token
- [ ] ADMIN no ve datos de otros gimnasios
- [ ] SUPERADMIN puede impersonar el gimnasio
- [ ] Auditoría registra la creación del gimnasio
- [ ] Profesional puede ser asignado al gimnasio
- [ ] Socios pueden ser creados en el gimnasio

---

## 8. Referencia Rápida

### API Endpoints

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/auth/login` | Login de usuario | Público |
| POST | `/gimnasios` | Crear gimnasio | SUPERADMIN |
| GET | `/gimnasios` | Listar gimnasios | SUPERADMIN |
| GET | `/gimnasios/:id` | Ver gimnasio | SUPERADMIN |
| PATCH | `/gimnasios/:id` | Editar gimnasio | SUPERADMIN |
| POST | `/gimnasios/:id/impersonar` | Impersonar gimnasio | SUPERADMIN |
| GET | `/admin/auditoria` | Ver auditoría | SUPERADMIN |

### Credenciales de Test

| Email | Password | Rol |
|-------|----------|-----|
| superadmin@nutrifit.com | 123456 | SUPERADMIN |
| admin-central@nutrifit.com | 123456 | ADMIN |
| admin-norte@nutrifit.com | 123456 | ADMIN |
| admin-sur@nutrifit.com | 123456 | ADMIN |

---

**Doc version:** 1.0  
**Última actualización:** 2026-06-01