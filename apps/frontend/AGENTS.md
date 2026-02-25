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
