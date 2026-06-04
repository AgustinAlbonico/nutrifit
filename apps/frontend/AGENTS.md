# AGENTS.md - Nutrifit Frontend

## Development Commands

**Build & Type Checking**
```bash
npm run build          # Full build: typecheck + Vite build
npm run typecheck      # TypeScript type check only (tsc -b)
```

**Linting**
```bash
npm run lint          # Run ESLint
```

**Testing**
```bash
npm test              # Run all tests once (vitest run --passWithNoTests)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Run single test file
vitest run src/components/ui/button.test.tsx
vitest src/components/ui/button.test.tsx  # Watch mode
```

**Development**
```bash
npm run dev           # Start Vite dev server
npm run preview       # Preview production build
```

---

## Code Style Guidelines

### Imports

**Order**: External libraries → Type imports → Local modules

```tsx
// 1. External libraries
import { useState, useEffect, type NodoReact } from 'react';
import { z } from 'zod';

// 2. Local modules (use @/ alias)
import { Boton } from '@/components/ui/boton';
import { solicitudApi } from '@/lib/api';
import type { RespuestaInicioSesion } from '@/types/auth';
```

- Use `import type { ... }` for type-only imports
- Never use relative paths like `../../../lib/api` - always use `@/`
- Group related imports together

### TypeScript Types

**Define types in `src/types/`** for reusable domain types (en español):

```tsx
// src/types/auth.ts
export type Rol = 'ADMIN' | 'NUTRICIONISTA' | 'SOCIO';
export interface RespuestaInicioSesion {
  token: string;
  rol: Rol;
  acciones: string[];
}
```

**Generic functions** for type safety:

```tsx
export async function solicitudApi<T>(ruta: string, opciones?: OpcionesSolicitud): Promise<T>
```

**Inline types** for simple cases:

```tsx
type Metodo = 'GET' | 'POST' | 'PUT';
```

### Naming Conventions

**TODO en ESPAÑOL** para variables, funciones, componentes, hooks y tipos.

| Category | Convention | Example |
|-----------|-------------|----------|
| Files (components) | PascalCase | `Boton.tsx`, `TarjetaPaciente.tsx` |
| Files (utils/hooks) | camelCase | `api.ts`, `usarAutenticacion.tsx` |
| Components | PascalCase | `Boton`, `TarjetaPaciente` |
| Hooks | camelCase, `usar` prefix | `usarAutenticacion`, `usarDatosPaciente` |
| Functions | camelCase | `iniciarSesion`, `actualizarPermisos` |
| Variables | camelCase | `correoElectronico`, `cargando` |
| Constants | UPPER_SNAKE_CASE | `CLAVE_ALMACENAMIENTO_AUTENTICACION`, `URL_BASE_API` |
| Types/Interfaces | PascalCase | `RespuestaInicioSesion`, `DtoAccion` |

### Component Structure

**Hook-first pattern** (en español):

```tsx
export function TarjetaPaciente({ id, nombre }: PropiedadesTarjetaPaciente) {
  // 1. Hooks first
  const { datos, cargando } = usarPaciente(id);
  const [estaAbierto, establecerEstaAbierto] = useState(false);

  // 2. Memoized values
  const iniciales = useMemo(() => obtenerIniciales(nombre), [nombre]);

  // 3. Handlers
  const manejarClic = () => establecerEstaAbierto(true);

  // 4. JSX return
  return <Tarjeta>{/* ... */}</Tarjeta>;
}
```

- Define interfaces before component
- Use `cn()` from `@/lib/utils` for conditional classes
- Inline Tailwind CSS classes (no CSS modules or styled-components)

### Error Handling

**Try/catch with type guard** (en español):

```tsx
try {
  await iniciarSesion(correoElectronico, contrasena);
} catch (err) {
  const mensajeError = err instanceof Error ? err.message : 'Error desconocido';
  establecerError(mensajeError);
}
```

**State-based error display**:

```tsx
const [error, establecerError] = useState<string | null>(null);

{error && <p className="text-destructive">{error}</p>}
```

- Never use `any` or `unknown` without type checking
- Always check `err instanceof Error` before accessing `.message`

### State Management

**React Context** for global state (see `src/contexts/AuthContext.tsx`):

```tsx
// Provider pattern with custom hook
const AuthContext = createContext<ValorContextoAutenticacion | undefined>(undefined);
export const ProveedorAutenticacion = ({ children }) => { /* ... */ };
export const usarAutenticacion = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion');
  return contexto;
};
```

**React Query** for server state (configured in `src/lib/query-client.ts`):

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

const { datos, cargando } = useQuery({
  queryKey: ['pacientes'],
  queryFn: () => solicitudApi<Paciente[]>('/pacientes'),
});
```

**localStorage** for persistence (with type guard):

```tsx
function leerAutenticacionAlmacenada(): EstadoAutenticacion | null {
  const crudo = localStorage.getItem('nutrifit.autenticacion');
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as EstadoAutenticacion;
  } catch {
    localStorage.removeItem('nutrifit.autenticacion');
    return null;
  }
}
```

### Formatting & Linting

- **ESLint**: Configured with TypeScript, React Hooks, TanStack Query, and JSX A11y rules
- **Strict TypeScript**: No `any`, no `@ts-ignore`, strict mode enabled
- **Formatting**: No Prettier config - rely on ESLint formatting rules
- Run `npm run lint` before committing

### Testing

**Test file location**: `__tests__/` subdirectory or `*.test.tsx` suffix

**Setup**: `src/test/setup.ts` runs before all tests (MSW server setup)

**Testing patterns** (when tests are added):
- Use `@testing-library/react` for component testing
- Use `vitest` as test runner
- Test behavior, not implementation
- Use `screen` queries (`getByRole`, `getByLabelText`) over `getByText`

### File Organization

```
src/
├── components/
│   └── ui/              # shadcn/ui base components
├── contexts/            # React Context providers
├── lib/                # Utilities (api, utils, query-client)
├── types/              # TypeScript type definitions
├── mocks/              # MSW handlers for testing
├── schemas/            # Zod validation schemas
└── features/           # Domain-specific components (add when needed)
```

---

## Project-Specific Conventions

- **Language**: Spanish for ALL code (variables, functions, components, types, comments) AND user-facing text
- **Authentication**: Use `usarAutenticacion()` hook for auth state and permission checks
- **API**: Use `solicitudApi<T>()` from `@/lib/api` for all HTTP calls
- **Styling**: Tailwind CSS with design tokens (see `DESIGN_SYSTEM.md`)
- **Icons**: Lucide React (`lucide-react` package)
- **Forms**: React Hook Form + Zod for validation
- **Routing**: TanStack Router (configured but not implemented yet)

---

## Feature: Ficha de Salud del Socio

Feature documentado en `openspec/changes/ficha-salud/`. Implementado en 4 PRs (PR 1a, PR 1b, PR 2, PR 3) ya mergeados a `main`.

### RBs cubiertos

- **RB14** — bloqueo de reserva de turno por ficha incompleta (backend).
- **RB15** — banner "Última edición" en modo edición.
- **RB16** — RECEPCIONISTA NO ve datos clínicos de ficha.
- **RB21** — IMC histórico no se recalcula.
- **RB29** — last-write-wins en versionado.
- **RB33** — auditoría antes/después (sin datos clínicos sensibles en CREATE).
- **RB42** — ficha editable.
- **RB44** — consentimiento RGPD una sola vez.
- **RB50** — historial de versiones inmutable.

### Pantalla principal

- Ruta: `/turnos/ficha-salud` → `apps/frontend/src/pages/FichaSaludSocio.tsx`
- Solo accesible para rol `SOCIO`. Otros roles ven "Acceso denegado".

### Endpoints del backend

| Método | Path | Rol | Descripción |
|--------|------|-----|-------------|
| `GET`  | `/turnos/socio/ficha-salud` | `SOCIO` | Ficha actual del socio (o 404 → `null`). |
| `PUT`  | `/turnos/socio/ficha-salud` | `SOCIO` | Crea o edita ficha. En creación requiere `consentimiento: true`. |
| `GET`  | `/turnos/socio/ficha-salud/historial` | `SOCIO` | Array resumido de versiones (`version`, `versionId`, `createdAt`). |
| `GET`  | `/turnos/socio/ficha-salud/version/:n` | `SOCIO` | Datos completos de una versión específica. |
| `GET`  | `/turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud` | `NUTRICIONISTA` | Ficha de un paciente (requiere turno previo). |
| `GET`  | `/turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial` | `NUTRICIONISTA` | Historial de versiones del paciente. |
| `GET`  | `/turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/version/:n` | `NUTRICIONISTA` | Versión específica del paciente. |

`RECEPCIONISTA` recibe **403** en todos los endpoints anteriores.

### Componentes clave (en `apps/frontend/src/components/ficha-salud/`)

- `FichaSaludBannerUltimaEdicion.tsx` — banner ámbar superior con `data-testid="fecha-ultima-edicion"`.
- `SeccionConsentimiento.tsx` — checkbox + link "Ver detalle" (abre modal RGPD).
- `FichaSaludConsentimientoModal.tsx` — modal RGPD con texto legal claro (`data-testid="boton-aceptar-consentimiento"`).
- `FichaSaludHistorialModal.tsx` — modal con lista de versiones (`data-testid="boton-ver-historial"` en la página abre este modal).
- `FichaSaludVersionDetalle.tsx` — vista read-only con `<fieldset disabled>` (`data-testid="detalle-version"`).

### Hooks

- `useObtenerHistorialFicha` — React Query, `enabled: false` (solo fetchea al abrir modal), `staleTime: 60_000`.
- `useObtenerVersionFicha(n)` — React Query, `enabled: n != null`, `staleTime: 5 * 60_000`.

Tras `PUT` exitoso, **invalidar** `['ficha-salud', 'historial']` para que la próxima apertura del modal refleje la nueva versión.

### Validación (Zod)

`apps/frontend/src/schemas/ficha-salud.schema.ts`:

- `altura`: 100..250 cm (entero).
- `peso`: 20..300 kg. **Discrepancia conocida**: backend acepta hasta 500; cliente bloquea >300 por UX.
- `nivelActividadFisica`: enum centralizado en `@nutrifit/shared` (5 valores: SEDENTARIO, LIGERO, MODERADO, INTENSO, MUY_INTENSO).
- `objetivoPersonal`: 1..500 chars.

### Enums compartidos

`packages/shared/src/types/ficha-salud.ts`:

- `NIVELES_ACTIVIDAD_FISICA` (5 valores con `value` + `label` en español).
- `FRECUENCIAS_COMIDAS` (strings libres — refactor pendiente a códigos en iter 2+).

### Tests E2E

`e2e/ficha-salud/`:

- `crear-ficha.spec.ts` — RB14 (socio completa ficha y reserva turno).
- `editar-ficha.spec.ts` — RB42, RB50 (socio edita y ve historial).
- `rbac-roles.spec.ts` — RB16 (RECEPCIONISTA recibe 403).
- `historial-nutricionista.spec.ts` — RB13, RB50 (nutricionista con/sin turno previo).

Para ejecutar: `npx playwright test e2e/ficha-salud/` (requiere dev servers arriba; el config tiene `webServer.reuseExistingServer: true`).

### Out of scope (recordatorio)

- ❌ RB15 badge "Ficha completada hace X" en pantallas de nutricionista.
- ❌ Notificaciones/email al socio por `FICHA_COMPLETADA` / `FICHA_ACTUALIZADA`.
- ❌ Notificaciones a nutricionistas vinculados.
- ❌ Refactor de `FrecuenciaComidas` a códigos.
- ❌ Rate-limiting de versiones.

---

<!-- CLAVIX:START -->
# Clavix - Prompt Improvement Assistant

Clavix is installed in this project. Use following slash commands:

- `/clavix:improve [prompt]` - Optimize prompts with smart depth auto-selection
- `/clavix:prd` - Generate a PRD through guided questions
- `/clavix:start` - Start conversational mode for iterative refinement
- `/clavix:summarize` - Extract optimized prompt from conversation

**When to use:**
- **Standard depth**: Quick cleanup for simple, clear prompts
- **Comprehensive depth**: Thorough analysis for complex requirements
- **PRD mode**: Strategic planning with architecture and business impact

Clavix automatically selects appropriate depth based on your prompt quality.

For more information, run `clavix --help` in your terminal.
<!-- CLAVIX:END -->

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| accessibility | `accessibility` |
| Adding shadcn/ui components | `shadcn` |
| Adding Vite plugins | `vite` |
| Building React components and pages | `frontend-design` |
| Configuring Vite build | `vite` |
| Configuring Vitest | `vitest` |
| Creating new frontend features | `frontend-design` |
| Customizing shadcn components | `shadcn` |
| Designing UI layouts | `frontend-design` |
| javascript-testing-patterns | `javascript-testing-patterns` |
| Mocking in tests | `vitest` |
| seo | `seo` |
| Setting up frontend build | `vite` |
| tailwind-css-patterns | `tailwind-css-patterns` |
| tailwind-v4-shadcn | `tailwind-v4-shadcn` |
| typescript-advanced-types | `typescript-advanced-types` |
| vercel-composition-patterns | `vercel-composition-patterns` |
| vercel-react-best-practices | `vercel-react-best-practices` |
| Writing frontend tests | `vitest` |