# AGENTS.md - NutriFit Supervisor

## Descripción del Sistema

**NutriFit Supervisor** es un sistema de gestión de servicios de salud en gimnasios. Permite a **socios** reservar turnos con profesionales de salud (nutricionistas), completar fichas clínicas, consultar planes alimentarios y seguir su progreso. Los **profesionales** gestionan agendas y atienden pacientes. Los **administradores** supervisan el sistema.

Stack: NestJS (backend) + React + Vite (frontend) + MySQL + TypeORM, en monorepo npm workspaces.

---

## Skill Routing

Invoke the appropriate skill before starting any task. Match by **file context** (file extension/folder) and **task context** (what you're doing).

### Backend (NestJS)

| Task | Skill | Path |
|------|-------|------|
| New module/controller/service | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| API endpoints, HTTP layer | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| Auth/JWT, guards, security | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| Database/TypeORM, migrations | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| Error handling, exception filters | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| Performance, caching | `nestjs-best-practices` | `.agents/skills/nestjs-best-practices/SKILL.md` |
| Testing (unit/e2e) | `javascript-testing-patterns` | `.agents/skills/javascript-testing-patterns/SKILL.md` |
| Architecture decisions | `architecture-patterns` | `C:\Users\agust\.config\opencode\skills\architecture-patterns/SKILL.md` |

### Frontend (React + Vite)

| Task | Skill | Path |
|------|-------|------|
| New pages, components, UI | `frontend-design` | `.agents/skills/frontend-design/SKILL.md` |
| Tailwind CSS + shadcn/ui | `tailwind-v4-shadcn` | `.agents/skills/tailwind-v4-shadcn/SKILL.md` |
| shadcn/ui components | `shadcn` | `.agents/skills/shadcn/SKILL.md` |
| Vite config, build, plugins | `vite` | `.agents/skills/vite/SKILL.md` |
| Vitest tests | `vitest` | `.agents/skills/vitest/SKILL.md` |
| Accessibility (ARIA, a11y) | `accessibility` | `.agents/skills/accessibility/SKILL.md` |
| React performance, hooks | `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| Advanced TypeScript types | `typescript-advanced-types` | `.agents/skills/typescript-advanced-types/SKILL.md` |
| Tailwind patterns/layouts | `tailwind-css-patterns` | `.agents/skills/tailwind-css-patterns/SKILL.md` |
| SEO optimization | `seo` | `.agents/skills/seo/SKILL.md` |

### Cross-cutting

| Task | Skill | Path |
|------|-------|------|
| Creative feature design | `brainstorming` | `C:\Users\agust\.agents\skills\brainstorming/SKILL.md` |
| PRD/planning | Clavix commands | See `CLAUDE.md` |
| Code review | `requesting-code-review` | `.agents/skills/requesting-code-review/SKILL.md` |
| Bug diagnosis | `interactive-bug` | `C:\Users\agust\.agents\skills\interactive-bug/SKILL.md` |
| E2E testing | `e2e-qa-tester` or `playwright-e2e-testing` | `.agents/skills/e2e-qa-tester/SKILL.md` |
| Spec verificación visual (Playwright) | `playwright-spec-verifier` | `.agents/skills/playwright-spec-verifier/SKILL.md` |

---

## Project Name

`nutrifit-supervisor` (manifest), actual folder is `nutrifit/`.

## Monorepo Structure

```
nutrifit/
├── apps/
│   ├── backend/               # @nutrifit/backend — NestJS + TypeORM + MySQL
│   └── frontend/             # @nutrifit/frontend — React + Vite + TypeScript
├── packages/
│   └── shared/               # @nutrifit/shared — shared types/constants
└── package.json
```

Contents: `types/rol.ts`, `types/auth.ts`, `types/turno.ts`, `constants/error-codes.ts`.

## Import Conventions

**Backend**: Prefer absolute imports rooted at `src/...`. Import groups:
1. framework/external
2. application/domain/common
3. infrastructure/local

**Frontend**: Use `@/` alias for all app code (`@/components`, `@/lib`, `@/types`). Never use relative chains like `../../../lib/api`. Use `import type` for type-only imports.

## Naming and Code Language

- **ALL code in Spanish**: variables, functions, hooks, components, types, and user-facing UI copy. This is enforced.
- Follow existing naming in each file; do not force renames unrelated to your task.

## TypeScript Rules

- Prefer explicit interfaces/types for API payloads and UI state.
- Reuse shared types from `@nutrifit/shared` when practical.
- Frontend is `strict: true` — resolve all unused vars, params, and nullability issues.
- Backend: same strictness via inherited config. Avoid `any`; narrow immediately if unavoidable.

## Error Handling

**Backend**: Use domain exceptions from `src/domain/exceptions/custom-exceptions` (`BadRequestError`, `ConflictError`, `ForbiddenError`, `NotFoundError`, `UnauthorizedError`). Throw meaningful Spanish messages.

**Frontend**: Wrap API calls in try/catch. Normalize: `err instanceof Error ? err.message : '...'`. Store user-facing errors in component state.

## Architectural Boundaries

**Backend (Clean Architecture)**:
- `domain/` — entities, repository interfaces, core rules
- `application/` — use-cases + DTOs
- `infrastructure/` — ORM, auth, external integrations
- `presentation/` — HTTP controllers
- **Business rules live in use-cases, not controllers**

**Frontend**: Hook-first component pattern. Keep server communication in `apiRequest` utility / page logic. Keep UI components presentational.

## Credenciales de prueba (seed)

- Las credenciales de usuarios seed (admin, nutricionista, socio por gimnasio) viven en `CREDENCIALES_SEED.md` en la raíz del repo.
- **No hardcodear** emails ni passwords en tests, fixtures ni código de automation: leer siempre de `CREDENCIALES_SEED.md` o de un helper que lo parsee.
- Contraseña universal de los usuarios seed: `123456`. Aplica a `apps/backend/src/seed-multi-tenant.ts`.
- El seed **no crea recepcionistas**.

## Backend Environment (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=nutrifit_supervisor
PORT=3000
NODE_ENV=dev
```


## Local Skills

Project-local skills exist in `.agents/skills/` — these override generic skills when matched by file context:
- `frontend-design/`, `nestjs-best-practices/`, `tailwind-v4-shadcn/`, `shadcn/`, `vite/`, `vitest/`, `accessibility/`, `playwright-spec-verifier/`

## Rule Files

- `.cursorrules`, `.cursor/rules/`, `.github/copilot-instructions.md`: none
- `.agents/skills/` and `C:\Users\agust\.config\opencode\skills\` contain project and user skill definitions
- `ARCHITECTURE_PATTERNS.md` at root covers frontend patterns (sidebar, modals, error handling, state management, design tokens)


### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Adding a new skill | `skill-sync` |
| Configurar skills del proyecto | `project-onboarding` |
| Configuring Docker Compose | `docker-expert` |
| Container optimization | `docker-expert` |
| Instalar skills recomendadas | `project-onboarding` |
| Onboarding de proyecto existente | `project-onboarding` |
| Regenerating AGENTS.md skill routing tables | `skill-sync` |
| requesting-code-review | `requesting-code-review` |
| Spec verificación visual (Playwright) | `playwright-spec-verifier` |
| Setup inicial de skills | `project-onboarding` |
| Updating skill metadata | `skill-sync` |
| Writing Dockerfiles | `docker-expert` |
