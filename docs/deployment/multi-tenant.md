# Guía de Deployment: Multi-Tenant

> Configuración y despliegue del sistema multi-tenant en producción.

**Fecha:** 2026-06-01  
**Versión:** 1.0

---

## Quick path

1. Configurar variables de entorno
2. Ejecutar migraciones de base de datos
3. Hacer seed inicial (SUPERADMIN + gimnasios)
4. Verificar instalación

---

## 1. Variables de Entorno

### 1.1 Backend (.env)

```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=nutrifit_supervisor

# Aplicación
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=tu-secret-muy-largo-y-aleatorio-min-32-chars

# Opcional: Redis para caching
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 1.2 Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 2. Base de Datos

### 2.1 Migraciones

Las migraciones son el mecanismo de versionado del esquema de BD.

```bash
# Generar nueva migración (desarrollo)
npm run migration:generate -- <nombre>

# Ejecutar migraciones pendientes
npm run db:migrate

# Revertir última migración
npm run migration:revert

# En producción:
npm run migration:run
```

### 2.2 Migraciones Requeridas para Multi-Tenant

| Migración | Descripción |
|-----------|-------------|
| `AddGimnasioIdToAuditoria` | Añade columna `id_gimnasio` a tabla `auditoria` |
| `AddGimnasioIdToPersona` | Añade columna `id_gimnasio` a tablas de persona |
| `AddImpersonatedByToAuditoria` | Añade campo de trazabilidad de impersonación |

### 2.3 Schema de Tablas Clave

```sql
-- Tabla de gimnasios (raíz del tenant)
CREATE TABLE gimnasio (
  id_gimnasio INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  fecha_alta DATETIME NOT NULL,
  fecha_baja DATETIME NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- Auditoría con soporte multi-tenant
CREATE TABLE auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NULL,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(100) NOT NULL,
  entidad_id INT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_origen VARCHAR(45) NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL,
  id_gimnasio INT NULL  -- null solo para SUPERADMIN global
);
```

---

## 3. Seed Inicial

### 3.1 Script de Seed Completo

```bash
# Ejecutar seed multi-tenant
npm run seed:multi-tenant

# O el seed completo (incluye grupos, permisos, etc.)
npm run seed:completo
```

### 3.2 Datos Creados por el Seed

| Tipo | Cantidad | Descripción |
|------|----------|-------------|
| Gimnasios | 3 | Gym Central, Gym Norte, Gym Sur |
| SUPERADMIN | 1 | superadmin@nutrifit.com |
| ADMIN | 3 | Uno por gimnasio |
| NUTRICIONISTA | 3 | Uno por gimnasio |
| SOCIO | 9 | Tres por gimnasio |

### 3.3 Credenciales de Prueba

| Email | Rol | Gimnasio | Password |
|-------|-----|----------|----------|
| superadmin@nutrifit.com | SUPERADMIN | Global (sin gimnasioId) | 123456 |
| admin-central@nutrifit.com | ADMIN | Gym Central | 123456 |
| admin-norte@nutrifit.com | ADMIN | Gym Norte | 123456 |
| admin-sur@nutrifit.com | ADMIN | Gym Sur | 123456 |
| nutri-central@nutrifit.com | NUTRICIONISTA | Gym Central | 123456 |
| socio1-central@nutrifit.com | SOCIO | Gym Central | 123456 |

---

## 4. Setup Inicial de SUPERADMIN

### 4.1 Verificación de SUPERADMIN

Después del seed, verificar que el SUPERADMIN existe:

```bash
# Login como SUPERADMIN
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@nutrifit.com","password":"123456"}'
```

**Respuesta esperada:**
```json
{
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "superadmin@nutrifit.com",
    "rol": "SUPERADMIN"
  }
}
```

### 4.2 Verificación de Token JWT

El token del SUPERADMIN debe tener:
```json
{
  "id": 1,
  "email": "superadmin@nutrifit.com",
  "rol": "SUPERADMIN",
  "gimnasioId": null,
  "impersonatedBy": null
}
```

---

## 5. Backup Multi-Tenant

### 5.1 Estrategia de Backup

| Componente | Frecuencia | Retención |
|------------|------------|-----------|
| Backup full DB | Diario | 30 días |
| Backup incremental | Cada 6 horas | 7 días |
| Backup de auditoría | Diario | 90 días |
| Snapshots de config | Por deployment | 10 versiones |

### 5.2 Consideraciones Multi-Tenant

- **Aislamiento:** Los backups incluyen todos los gimnasios
- **Restore:** Restore de un gimnasio específico requiere filtros por `gimnasioId`
- **Auditoría:** Mantener logs de auditoría separados por gimnasio para compliance

### 5.3 Script de Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_$DATE.sql
```

---

## 6. Troubleshooting

### 6.1 Error: "Token sin contexto de tenant"

**Causa:** Usuario no-SUPERADMIN intentando operar sin `gimnasioId` en el token.

**Solución:**
1. Verificar que el usuario tiene `persona.gimnasioId` asignado
2. Verificar que el login está devolviendo el `gimnasioId` correcto
3. Revisar logs del LoginUseCase

### 6.2 Error: "Tenant context not initialized"

**Causa:** `TenantContextService` no fue inicializado (JwtAuthGuard no aplicado).

**Solución:**
1. Verificar que el endpoint tiene el guard de autenticación
2. Revisar que el interceptor está registrado globalmente

### 6.3 Impersonación no funciona

**Causa:** Endpoint de impersonación requiere rol SUPERADMIN.

**Solución:**
1. Verificar token del SUPERADMIN tiene `rol: "SUPERADMIN"` y `gimnasioId: null`
2. Verificar que el endpoint `/gimnasios/:id/impersonar` existe y requiere auth

### 6.4 Aislamiento no funciona

**Causa:** Repositorio no filtra por `gimnasioId`.

**Solución:**
1. Verificar que el repositorio usa `TenantContextService`
2. Revisar que las queries incluyen `WHERE gimnasioId = ?`

---

## 7. Checklist de Deployment

- [ ] Variables de entorno configuradas en producción
- [ ] Migraciones ejecutadas (`npm run db:migrate`)
- [ ] Seed completado (`npm run seed:multi-tenant`)
- [ ] SUPERADMIN verificado y accesible
- [ ] Backup programado configurado
- [ ] Logs de auditoría activos
- [ ] Health check endpoint responde correctamente

---

## 8. Próximos Pasos

Después del deployment:

1. **Configurar AuthContext en frontend** (Plan 6)
2. **Implementar TenantSwitcher** (Plan 6)
3. **Crear páginas de gestión de gimnasios** (Plan 7)

---

**Doc version:** 1.0  
**Última actualización:** 2026-06-01