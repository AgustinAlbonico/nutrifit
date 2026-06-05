# NutriFit Supervisor

Sistema de gestión de servicios de salud para gimnasios. Permite a **socios**
reservar turnos con profesionales de salud (nutricionistas), completar fichas
clínicas, consultar planes alimentarios y seguir su progreso. Los
**profesionales** gestionan agendas y atienden pacientes. Los
**administradores** supervisan el sistema, y un **superadministrador** opera
cross-tenant con capacidad de impersonación.

---

## Stack

- **Backend**: NestJS 10 + TypeScript 5, Clean Architecture (domain /
  application / infrastructure / presentation), TypeORM 0.3, MySQL 8, MinIO
  (object storage), Passport (JWT), Helmet, Swagger (en dev).
- **Frontend**: React 19 + Vite 7 + TypeScript 5, TanStack Router y Query,
  Tailwind CSS 4 + shadcn/ui (radix-ui), React Hook Form + Zod, MSW (tests),
  vitest + Testing Library.
- **Shared**: paquete `@nutrifit/shared` para tipos y constantes que cruzan
  backend y frontend.
- **Gestión de cambios**: OpenSpec (`openspec/`).
- **Tests E2E**: Playwright (`e2e/`).
- **Monorepo**: npm workspaces.

---

## Estructura del monorepo

```
nutrifit/
├── apps/
│   ├── backend/             # @nutrifit/backend — NestJS + TypeORM + MySQL
│   └── frontend/            # @nutrifit/frontend — React + Vite + TypeScript
├── packages/
│   └── shared/              # @nutrifit/shared — tipos y constantes compartidas
├── openspec/                # specs y changes de features (OpenSpec)
├── docs/                    # documentación, iteraciones, planes y specs Superpowers
├── e2e/                     # tests E2E Playwright
└── package.json             # scripts raíz del monorepo
```

### Capas del backend

```
apps/backend/src/
├── domain/                  # entidades, contratos de repositorios, servicios, errores
├── application/             # casos de uso + DTOs (orquestación de negocio)
├── infrastructure/          # TypeORM, auth, schedulers, servicios externos
└── presentation/            # controllers HTTP, controllers.module.ts
```

### AGENTS.md por scope

Cada subproyecto tiene su propio `AGENTS.md` con convenciones específicas:

- `AGENTS.md` (raíz) — convenciones del monorepo, skill routing, comandos.
- `apps/backend/AGENTS.md` — convenciones NestJS, DI, errores, env.
- `apps/frontend/AGENTS.md` — convenciones React, hooks, formularios, testing.

---

## Setup local

### 1. Prerrequisitos

- **Node.js 20+** y **npm 10+** (`.nvmrc` recomendado).
- **Docker Desktop** (o Docker Engine en Linux) corriendo.
- **Windows**: WSL 2 habilitado (recomendado) o PowerShell 5.1+.
- **MySQL Workbench** o Adminer (opcional, para inspeccionar la DB).

### 2. Instalar dependencias

Desde la raíz del monorepo:

```bash
npm install
```

> Esto instala todo en los workspaces (`apps/*` y `packages/*`) y los
> ejecuta los `postinstall` que cada paquete declare (NestJS no suele
> tener, pero Vite sí descarga `@tailwindcss/vite`).

### 3. Levantar la base de datos (Docker)

El backend necesita MySQL 8 y MinIO. Ambos están definidos en
`apps/backend/docker-compose.db.yml`:

```bash
cd apps/backend
docker compose -f docker-compose.db.yml up -d
```

Esto expone:

- **MySQL 8** en `localhost:3306` (usuario `root`, password `root`, base
  `nutrifit_supervisor`).
- **Adminer** (UI web) en `http://localhost:8080`.
- **MinIO** (object storage) en `http://localhost:9000` (API) y
  `http://localhost:9001` (consola). Credenciales: `minioadmin` /
  `minioadmin123`. Bucket por defecto: `nutrifit-fotos-perfil`.

### 4. Variables de entorno

Backend: `apps/backend/.env` (ya viene con valores de dev). El repositorio
incluye credenciales de dev, **no son secretos de producción**:

```env
PORT=3000
APP_NAME=NutriFit
NODE_ENV=dev
FRONTEND_URL=http://localhost:5173

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=nutrifit_supervisor
DATABASE_USER=root
DATABASE_PASSWORD=root

JWT_SECRET=nutrifit-secret-key-dev
JWT_EXPIRES_IN=7d

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=nutrifit-fotos-perfil
```

> El archivo `.env` está en `.gitignore`. No commitees credenciales reales.

Frontend: opcionalmente `apps/frontend/.env.local` con
`VITE_API_URL=http://localhost:3000` (si no está, usa el default del
proxy de Vite).

### 5. Sembrar la base de datos

```bash
npm run db:seed
```

Esto crea tres gimnasios demo (Gym Central, Gym Norte, Gym Sur), grupos de
permisos, acciones, y usuarios de prueba (ver `CREDENCIALES_SEED.md` para
el detalle). Es re-ejecutable; usa `ON DUPLICATE KEY` para no duplicar.

### 6. Levantar dev servers

Desde la raíz, en dos terminales separadas:

```bash
# Terminal 1 — backend
npm run dev:backend

# Terminal 2 — frontend
npm run dev:frontend
```

O ambos a la vez con concurrently:

```bash
npm run dev
```

- Backend: `http://localhost:3000` (con hot-reload vía `nest start --watch`).
- Frontend: `http://localhost:5173` (Vite, elige otro puerto si está
  ocupado).
- Swagger UI: `http://localhost:3000/openapi` (solo en dev).

### 7. Login de prueba

Credenciales sembradas (todas con contraseña `123456`):

| Rol          | Email                              | Alcance                            |
| ------------ | ---------------------------------- | ---------------------------------- |
| SUPERADMIN   | `superadmin@nutrifit.com`          | global, impersonación, multi-tenant |
| ADMIN        | `admin-central@nutrifit.com`       | Gym Central                         |
| ADMIN        | `admin-norte@nutrifit.com`         | Gym Norte                           |
| ADMIN        | `admin-sur@nutrifit.com`           | Gym Sur                             |
| NUTRICIONISTA| `nutri-central@nutrifit.com`       | agenda, turnos, pacientes, clínica |
| NUTRICIONISTA| `nutri-norte@nutrifit.com`         | (idem)                              |
| NUTRICIONISTA| `nutri-sur@nutrifit.com`           | (idem)                              |
| SOCIO        | `socio1-central@nutrifit.com` (etc) | reservas, progreso, planes propios |

Ver `CREDENCIALES_SEED.md` para la lista completa de socios sembrados.

---

## Comandos útiles

### Desde la raíz

```bash
npm run dev                 # backend + frontend concurrentes
npm run dev:backend         # solo backend
npm run dev:frontend        # solo frontend

npm run build               # build de todos los workspaces
npm run build:shared        # compilar el paquete shared (necesario tras cambios en @nutrifit/shared)
npm run build:backend       # solo backend
npm run build:frontend      # solo frontend

npm test                    # tests de todos los workspaces
npm run test:backend        # jest del backend
npm run test:frontend       # vitest del frontend

npm run typecheck           # tsc -b en todos los workspaces
npm run lint                # eslint en todos los workspaces

npm run db:seed             # seed multi-tenant (re-ejecutable)
npm run db:migrate          # correr migraciones TypeORM
```

### Backend (`apps/backend`)

```bash
npm run start:dev           # nest start --watch
npm run start:prod          # node dist/main
npm run build               # nest build → dist/
npm test                    # jest
npm run migration:run       # typeorm migration:run
npm run seed:multi-tenant   # seed
```

### Frontend (`apps/frontend`)

```bash
npm run dev                 # vite
npm run build               # tsc -b + vite build → dist/
npm test                    # vitest run
npm run test:watch          # vitest
npm run test:coverage       # vitest --coverage
npm run typecheck           # tsc -b
npm run lint                # eslint .
```

---

## Roles y permisos

El sistema tiene cuatro roles, cada uno con permisos y scopes distintos:

- **SUPERADMIN**: acceso cross-tenant. Puede impersonar usuarios y ver
  estadísticas globales. Se denotan con `R:SUPERADMIN` en los guards.
- **ADMIN**: administra un único gimnasio (sus socios, nutricionistas,
  recepcionistas, configuración de marca, políticas operativas).
- **NUTRICIONISTA**: gestiona su agenda, atiende pacientes (socios) con
  turno previo. No ve datos de pacientes sin vínculo.
- **RECEPCIONISTA**: agenda turnos manualmente, ve listado de turnos del día.
  No ve datos clínicos.
- **SOCIO**: reserva turnos con nutricionistas, ve y edita su propia ficha
  de salud, consulta su progreso, gestiona su plan alimentario.

Los permisos se modelan como acciones (`ACCIONES.*`) agrupadas en grupos
(`GrupoPermiso`), asignables por usuario. Ver `apps/backend/src/domain/entities/Usuario/acciones.ts`
para el catálogo completo.

---

## Arquitectura por capas

El backend sigue **Clean Architecture** estricta:

```
HTTP request
  ↓
Presentation layer (controllers, DTOs)
  ↓
Application layer (use-cases, orquestación)
  ↓
Domain layer (entities, contratos, reglas de negocio) ← puro TS
  ↑
Infrastructure layer (TypeORM, JWT, schedulers, services externos)
```

Las dependencias siempre apuntan hacia `domain`. Nada en `domain` importa de
`@nestjs/*`, `typeorm`, ni nada de infra. Esto facilita testing y
reemplazo de adaptadores.

---

## Testing

### Unit tests

- **Backend**: Jest. Specs junto a cada archivo (`*.spec.ts`). Mocks de
  repositorios via tokens `Symbol`. Correr con `npm run test:backend`.
- **Frontend**: Vitest + Testing Library + MSW (Mock Service Worker).
  Specs en `src/**/*.test.tsx` o `__tests__/`. Correr con
  `npm run test:frontend`.

### E2E

Playwright en `e2e/`. Para correrlos con el dev server arriba:

```bash
npx playwright test e2e/
```

Spec suites notables:
- `e2e/ficha-salud/` — ficha de salud (RB14, RB42, RB50, RB16).
- `e2e/auth/` — autenticación y autorización.

El config tiene `webServer.reuseExistingServer: true`, así que no reinicia
los dev servers si ya están corriendo.

---

## Documentación adicional

- **`openspec/`** — specs formales de features bajo el workflow OpenSpec.
- **`docs/superpowers/specs/`** — design docs del workflow Superpowers.
- **`docs/superpowers/plans/`** — planes de implementación TDD.
- **`docs/iteraciones/`** — iteraciones históricas del proyecto.
- **`docs/plans/`** — planes de diseño anteriores.
- **`CREDENCIALES_SEED.md`** — credenciales de usuarios seed.

---

## Troubleshooting común

- **"Cannot connect to MySQL"**: verificá que `docker compose -f apps/backend/docker-compose.db.yml ps` muestre `nutrifit-mysql` corriendo.
- **"TypeORM metadata not found"**: asegurate de haber corrido `npm run build:shared` tras tocar `@nutrifit/shared` y de tener `synchronize: true` o migraciones aplicadas.
- **"MinIO bucket does not exist"**: el bucket se crea automáticamente al primer `subirArchivo()`. Si falla, andá a `http://localhost:9001` y crealo manualmente.
- **Cambios en `@nutrifit/shared` no se reflejan**: siempre `npm run build:shared` después de editar el paquete shared. El frontend y el backend importan desde `dist/`.
- **Frontend no encuentra el backend**: verificá que Vite esté proxeando a `http://localhost:3000` (en `vite.config.ts`).
- **Tests rotos por imports de `@tanstack/react-router`**: el mock en vitest debe incluir `Link`, `useRouter`, `useNavigate` y `useLinkProps`. Ver tests existentes como referencia.

---

## Licencia

Privado. Todos los derechos reservados.
