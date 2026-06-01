# NutriFit Supervisor

Sistema de gestión de servicios de salud en gimnasios. Permite a **socios** reservar turnos con profesionales de salud (nutricionistas), completar fichas clínicas, consultar planes alimentarios y seguir su progreso. Los **profesionales** gestionan agendas y atienden pacientes. Los **administradores** supervisan el sistema.

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | NestJS + TypeORM + MySQL |
| Frontend | React + Vite + TypeScript |
| Shared | TypeScript types/constants |
| Monorepo | npm workspaces |

---

## Multi-Tenant Architecture

NutriFit Supervisor soporta múltiples gimnasios independientes (tenants) con aislamiento completo de datos.

### Modelo de Datos

- **Entidades con `gimnasioId`:** Socios, Nutricionistas, Turnos, Planes, Fichas de Salud, etc.
- **Entidades globales:** Gimnasios, Usuarios (SUPERADMIN)
- **SUPERADMIN:** Rol global sin `gimnasioId`, opera cross-tenant

### Roles del Sistema

| Rol | Ámbito | Descripción |
|-----|--------|-------------|
| `SUPERADMIN` | Global | Administrador del sistema completo |
| `ADMIN` | Por gimnasio | Administrador de un gimnasio |
| `NUTRICIONISTA` | Por gimnasio | Profesional de salud |
| `RECEPCIONISTA` | Por gimnasio | Recepcionista |
| `SOCIO` | Por gimnasio | Miembro del gimnasio |

### Impersonación

SUPERADMIN puede impersonar un gimnasio específico para operar con contexto de tenant, manteniendo trazabilidad completa en auditoría.

**Documentación:**
- [Arquitectura Multi-Tenant](docs/architecture/multi-tenant.md)
- [Guía de Deployment](docs/deployment/multi-tenant.md)
- [Guía de Administración](docs/admin/multi-tenant.md)

---

## Scripts de Desarrollo

### Root (monorepo)

```bash
npm run dev              # Frontend + Backend concurrently
npm run dev:frontend    # Frontend only (Vite)
npm run dev:backend     # Backend only (NestJS watch)

npm run build           # All workspaces
npm run build:shared    # Shared package
npm run build:frontend  # Frontend build
npm run build:backend   # Backend build

npm run test            # All workspaces
npm run test:frontend   # Frontend tests (Vitest)
npm run test:backend    # Backend tests (Jest)

npm run lint            # Lint all
npm run lint:frontend   # Lint frontend
npm run lint:backend    # Lint backend

npm run typecheck       # TypeScript check all
```

### Backend

```bash
# From apps/backend/
npm run test            # Unit tests
npm run test:e2e        # E2E tests (supertest)
npm run test:watch       # Watch mode

npm run seed:completo    # Full seed with test data
npm run seed:multi-tenant # Multi-tenant seed

npm run migration:run    # Run migrations
npm run migration:generate <name> # Generate migration
```

### Frontend

```bash
# From apps/frontend/
npm run build            # TypeScript + Vite build
npm run test             # Vitest
npm run test:coverage    # With coverage
npm run typecheck        # tsc -b
```

---

## Credenciales de Prueba

Todas las contraseñas: `123456`

| Email | Rol | Gimnasio |
|-------|-----|----------|
| superadmin@nutrifit.com | SUPERADMIN | Global |
| admin-central@nutrifit.com | ADMIN | Gym Central |
| admin-norte@nutrifit.com | ADMIN | Gym Norte |
| admin-sur@nutrifit.com | ADMIN | Gym Sur |
| nutri-central@nutrifit.com | NUTRICIONISTA | Gym Central |
| socio1-central@nutrifit.com | SOCIO | Gym Central |

---

## Variables de Entorno

### Backend (apps/backend/.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=nutrifit_supervisor
PORT=3000
NODE_ENV=dev
```

### Frontend (apps/frontend/.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## Estructura del Proyecto

```
nutrifit/
├── apps/
│   ├── backend/               # @nutrifit/backend — NestJS
│   │   ├── src/
│   │   │   ├── application/   # Use cases + DTOs
│   │   │   ├── domain/       # Entities + interfaces
│   │   │   ├── infrastructure/ # ORM, auth, external
│   │   │   └── presentation/ # HTTP controllers
│   │   └── test/             # E2E tests
│   └── frontend/             # @nutrifit/frontend — React + Vite
├── packages/
│   └── shared/               # @nutrifit/shared — types
├── docs/                     # Documentación
│   ├── architecture/         # Arquitectura
│   ├── deployment/           # Deployment
│   └── admin/                # Guías de administración
└── package.json              # Workspace root
```

---

## Documentación Adicional

- [Spec: Multi-Tenant, Admin Global y Permisos](docs/superpowers/specs/2026-06-01-multi-tenant-admin-permisos-design.md)
- [Progress](PROGRESS.md)
- [Architecture Patterns](ARCHITECTURE_PATTERNS.md)