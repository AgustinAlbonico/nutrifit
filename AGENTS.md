# AGENTS.md - Nutrifit Supervisor Monorepo

This file defines default instructions for coding agents working in this repository.

## Monorepo Structure

Este proyecto usa **npm workspaces** para gestionar múltiples paquetes:

```
nutrifit-supervisor/
├── apps/
│   ├── backend/      # @nutrifit/backend - NestJS + TypeScript + TypeORM + Jest
│   └── frontend/     # @nutrifit/frontend - React + Vite + TypeScript + Vitest
├── packages/
│   └── shared/       # @nutrifit/shared - Tipos y constantes compartidas
├── package.json      # Configuración raíz del monorepo
└── AGENTS.md         # Este archivo
```

### Workspaces

| Workspace | Package Name | Descripción |
|-----------|-------------|-------------|
| `apps/backend` | `@nutrifit/backend` | API REST con NestJS |
| `apps/frontend` | `@nutrifit/frontend` | SPA con React + Vite |
| `packages/shared` | `@nutrifit/shared` | Tipos, constantes y utilidades compartidas |

## Rule Files Discovery

- `.cursorrules`: not found
- `.cursor/rules/`: not found
- `.github/copilot-instructions.md`: not found
- Only AGENTS guidance exists (root + frontend + local skill docs).

## Development Commands

### Comandos desde la raíz (Monorepo)

```bash
# Instalar todas las dependencias
npm install

# Desarrollo - ambos servicios
npm run dev

# Desarrollo individual
npm run dev:frontend    # Solo frontend
npm run dev:backend     # Solo backend

# Build
npm run build           # Build de todos los workspaces
npm run build:frontend  # Solo frontend
npm run build:backend   # Solo backend
npm run build:shared    # Solo shared

# Testing
npm run test            # Tests de todos los workspaces
npm run test:frontend   # Solo frontend
npm run test:backend    # Solo backend

# Linting
npm run lint            # Lint de todos los workspaces
npm run lint:frontend   # Solo frontend
npm run lint:backend    # Solo backend

# Type checking
npm run typecheck       # Typecheck de todos los workspaces

# Base de datos
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Ejecutar seeds

# Limpieza
npm run clean           # Limpiar node_modules y dist
```

### Comandos específicos por workspace

Para ejecutar comandos en un workspace específico desde la raíz:

```bash
# Usando --workspace
npm run <script> --workspace=@nutrifit/backend
npm run <script> --workspace=@nutrifit/frontend

# O navegando al directorio
cd apps/backend && npm run <script>
cd apps/frontend && npm run <script>
```

### Backend (Jest)

```bash
# Desde la raíz
npm run test:backend

# Desde apps/backend
npm test
npm run test:watch
npm run test:cov
npm run test:e2e

# Single test file (recommended)
npx jest src/application/turnos/use-cases/reservar-turno-socio.use-case.spec.ts --runInBand

# Single test by name pattern
npx jest --runInBand -t "debe reservar"
```

Notes:
- Backend Jest `rootDir` is `src` (see `apps/backend/package.json`).
- Prefer `--runInBand` for deterministic local debugging.

### Frontend (Vitest)

```bash
# Desde la raíz
npm run test:frontend

# Desde apps/frontend
npm test
npm run test:watch
npm run test:coverage

# Single test file (run once)
npx vitest run src/components/ui/button.test.tsx

# Single test file (watch)
npx vitest src/components/ui/button.test.tsx

# Single test by name pattern
npx vitest run -t "renderiza"
```

## Build, Typecheck, and Lint Expectations

- For backend changes: run `npm run lint:backend` and `npm run build:backend`.
- For frontend changes: run `npm run typecheck`, `npm run lint:frontend`, and `npm run build:frontend`.
- For cross-cutting changes: run `npm run build` and `npm run lint`.
- Do not finish work with failing checks unless explicitly requested.

## Shared Package (@nutrifit/shared)

El paquete `@nutrifit/shared` contiene tipos, constantes y utilidades compartidas entre backend y frontend.

### Uso en Backend

```typescript
// En apps/backend/src/...
import { Rol, EstadoTurno, CODIGOS_ERROR } from '@nutrifit/shared';
import type { TokenPayload, RespuestaAutenticacion } from '@nutrifit/shared';
```

### Uso en Frontend

```typescript
// En apps/frontend/src/...
import { Rol, ESTADOS_TURNO } from '@nutrifit/shared';
import type { SesionUsuario, EstadoTurno } from '@nutrifit/shared';
```

### Contenido del paquete

- `types/rol.ts` - Tipos de roles del sistema
- `types/auth.ts` - Tipos de autenticación
- `types/turno.ts` - Tipos y constantes de estados de turno
- `constants/error-codes.ts` - Códigos de error del sistema

## Import and Module Conventions

### Backend

- Prefer absolute imports rooted at `src/...`.
- Keep import groups consistent:
  1) framework/external,
  2) application/domain/common,
  3) infrastructure/local.
- Existing code mixes alias and relative imports; prefer matching the file's local style.
- For shared types: `import { ... } from '@nutrifit/shared'`.

### Frontend

- Use `@/` alias for app code (`@/components`, `@/lib`, `@/types`, etc.).
- Avoid long relative chains like `../../../lib/api`.
- Use `import type` for type-only imports.
- For shared types: `import { ... } from '@nutrifit/shared'`.

## Naming and Language

- Domain language is Spanish in most business code and UI copy.
- Frontend convention explicitly requires Spanish names for variables, functions, hooks, components, and types.
- Follow existing naming in each file; do not force renames unrelated to the task.

## TypeScript and Typing Rules

- Prefer explicit interfaces/types for API payloads and UI state.
- Reuse shared types from `@nutrifit/shared` when practical.
- Reuse local types from `src/types` in frontend for UI-specific types.
- Avoid `any`; if unavoidable, isolate and narrow immediately.
- Frontend TS is strict (`strict: true`), so resolve unused vars/params and nullability correctly.

## Error Handling Patterns

### Backend

- Use domain exceptions from `src/domain/exceptions/custom-exceptions`:
  - `BadRequestError`, `ConflictError`, `ForbiddenError`, `NotFoundError`, `UnauthorizedError`.
- Throw meaningful, user-facing Spanish messages where the module already does so.
- Validate early in use-cases and return fast on invalid state.

### Frontend

- Use `try/catch` around API calls.
- Normalize unknown errors with `error instanceof Error ? error.message : '...'`.
- Store user-facing errors in component state and render clear feedback.

## Architectural Guidance

### Backend

- Respect Clean Architecture boundaries:
  - `domain`: entities, repository interfaces, core rules.
  - `application`: use-cases + DTOs.
  - `infrastructure`: ORM/auth/external integrations.
  - `presentation`: controllers and HTTP wiring.
- Put business rules in use-cases, not controllers.

### Frontend

- Prefer hook-first component structure.
- Keep server communication in API utility usage (`apiRequest`) and page/container logic.
- Keep UI components presentational and reusable.

## Formatting and Lint

- Backend uses ESLint + Prettier plugin integration.
- Frontend uses flat ESLint config with React Hooks, TanStack Query/Router, and JSX A11y plugins.
- Do not introduce a separate formatting style that conflicts with existing lint rules.

## Clavix Commands

<!-- CLAVIX:START -->
# Clavix - Prompt Improvement Assistant

Clavix is installed in this project. Use the following slash commands:

- `/clavix:improve [prompt]` - Optimize prompts with smart depth auto-selection
- `/clavix:prd` - Generate a PRD through guided questions
- `/clavix:start` - Start conversational mode for iterative refinement
- `/clavix:summarize` - Extract optimized prompt from conversation

When to use:
- Standard depth: quick cleanup for simple, clear prompts
- Comprehensive depth: thorough analysis for complex requirements
- PRD mode: strategic planning with architecture and business impact

Clavix automatically selects the appropriate depth based on prompt quality.
For more information, run `clavix --help` in your terminal.
<!-- CLAVIX:END -->
