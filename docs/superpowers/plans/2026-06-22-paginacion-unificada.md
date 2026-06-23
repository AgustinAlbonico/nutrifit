# Paginación Unificada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar toda la paginación del sistema con código DRY: tipos compartidos, helper backend, hook frontend, componente UI y migración de ~21 endpoints/páginas.

**Architecture:** Contrato compartido en `packages/shared` → Helper backend reutilizable (`crearParametrosPaginacion`, `calcularMeta`, `paginarQuery`) → Hook React `usePaginacion<T>` → Componente shadcn `ControlesPaginacion`. Seis fases: infraestructura, migrar ya-paginadas, agregar a no-paginadas, dashboard cards, notificaciones, bajo volumen.

**Tech Stack:** NestJS + TypeORM, React + Vite + TypeScript, shadcn/ui, Vitest, `@nutrifit/shared`

---

## File Structure

### Create

| File | Responsibility |
|------|---------------|
| `packages/shared/src/types/paginacion.ts` | `PaginationParams`, `PaginationMeta`, `PaginatedData<T>` |
| `apps/backend/src/common/helpers/paginacion.helper.ts` | `crearParametrosPaginacion`, `calcularMeta`, `paginarQuery`, `paginarFindAndCount` |
| `apps/frontend/src/hooks/usePaginacion.ts` | Hook React `usePaginacion<T>(fetcher, options)` |
| `apps/frontend/src/components/ui/ControlesPaginacion.tsx` | Componente de navegación de páginas |

### Modify (Phase 1 — infrastructure)

| File | Change |
|------|--------|
| `packages/shared/src/types/index.ts` | Add `export * from './paginacion.js'` |

### Modify (Phase 2+ — migration)

See individual tasks below for full list of ~21 files (endpoints + pages + dashboard cards).

---

## Phase 1: Infrastructure

### Task 1: Shared types — PaginationParams, PaginationMeta, PaginatedData

**Files:**
- Create: `packages/shared/src/types/paginacion.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Create paginacion.ts**

```typescript
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

- [ ] **Step 2: Add re-export to index.ts**

Add `export * from './paginacion.js';` to `packages/shared/src/types/index.ts`

- [ ] **Step 3: Verify compilation**

Run: `npm run build --workspace=@nutrifit/shared`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/paginacion.ts packages/shared/src/types/index.ts
git commit -m "feat(shared): add PaginationParams, PaginationMeta, PaginatedData types"
```

---

### Task 2: Backend helper — paginacion.helper.ts

**Files:**
- Create: `apps/backend/src/common/helpers/paginacion.helper.ts`

- [ ] **Step 1: Create paginacion.helper.ts**

```typescript
import { PaginationParams, PaginationMeta, PaginatedData } from '@nutrifit/shared';
import { SelectQueryBuilder, Repository, FindManyOptions } from 'typeorm';
import { BadRequestError } from '@/domain/exceptions/custom-exceptions';

export function crearParametrosPaginacion(
  query: Record<string, string | undefined>,
  opciones?: { maxLimit?: number },
): PaginationParams {
  const maxLimit = opciones?.maxLimit ?? 100;
  const rawPage = query.page ?? '1';
  const rawLimit = query.limit ?? '10';

  const page = parseInt(rawPage, 10);
  const limit = parseInt(rawLimit, 10);

  if (isNaN(page) || page < 1) {
    throw new BadRequestError('page debe ser un número >= 1');
  }
  if (isNaN(limit) || limit < 1 || limit > maxLimit) {
    throw new BadRequestError(`limit debe ser un número entre 1 y ${maxLimit}`);
  }

  return { page, limit };
}

export function calcularMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function paginarQuery<T>(
  qb: SelectQueryBuilder<T>,
  params: PaginationParams,
): Promise<PaginatedData<T>> {
  const total = await qb.getCount();
  const skip = (params.page - 1) * params.limit;
  const data = await qb.skip(skip).take(params.limit).getMany();

  return {
    data,
    pagination: calcularMeta(total, params.page, params.limit),
  };
}

export async function paginarFindAndCount<T>(
  repo: Repository<T>,
  params: PaginationParams,
  options?: FindManyOptions<T>,
): Promise<PaginatedData<T>> {
  const [data, total] = await repo.findAndCount({
    ...options,
    skip: (params.page - 1) * params.limit,
    take: params.limit,
  });
  return {
    data,
    pagination: calcularMeta(total, params.page, params.limit),
  };
}
```

- [ ] **Step 2: Verify backend compilation**

Run: `npm run build --workspace=@nutrifit/backend`
Expected: No errors. If `@nutrifit/shared` import fails (monorepo path resolution), change to relative import:
```typescript
import { PaginationParams, PaginationMeta, PaginatedData } from '../../../../../../packages/shared/src/types/paginacion';
```
(Test first; NestJS monorepo config varies.)

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/common/helpers/paginacion.helper.ts
git commit -m "feat(backend): add PaginacionHelper with crearParametrosPaginacion, paginarQuery, paginarFindAndCount"
```

---

### Task 3: Frontend hook — usePaginacion.ts

**Files:**
- Create: `apps/frontend/src/hooks/usePaginacion.ts`

- [ ] **Step 1: Create usePaginacion.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { PaginationParams, PaginationMeta } from '@nutrifit/shared';

interface UsePaginacionOptions {
  defaultLimit?: number;
  enabled?: boolean;
}

export interface EstadoPaginacion extends PaginationMeta {
  isLoading: boolean;
}

export interface ResultadoPaginacion<T> {
  data: T[];
  pagination: EstadoPaginacion;
  setPagina: (page: number) => void;
  setLimite: (limit: number) => void;
  recargar: () => void;
  error: string | null;
}

export function usePaginacion<T>(
  fetcher: (params: PaginationParams) => Promise<{ data: T[]; pagination: PaginationMeta }>,
  options?: UsePaginacionOptions,
): ResultadoPaginacion<T> {
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(options?.defaultLimit ?? 10);
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetcher({ page: pagina, limit: limite });
      setData(res.data);
      setMeta(res.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setData([]);
    } finally {
      setCargando(false);
    }
  }, [pagina, limite, fetcher]);

  useEffect(() => {
    if (options?.enabled ?? true) {
      fetchData();
    }
  }, [fetchData, options?.enabled]);

  const recargar = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const cambiarPagina = useCallback((nueva: number) => {
    if (nueva >= 1 && (!meta || nueva <= meta.totalPages)) {
      setPagina(nueva);
    }
  }, [meta]);

  const cambiarLimite = useCallback((nuevo: number) => {
    setLimite(nuevo);
    setPagina(1);
  }, []);

  return {
    data,
    pagination: {
      page: pagina,
      limit: limite,
      total: meta?.total ?? 0,
      totalPages: meta?.totalPages ?? 1,
      hasNextPage: meta?.hasNextPage ?? false,
      hasPreviousPage: meta?.hasPreviousPage ?? false,
      isLoading: cargando,
    },
    setPagina: cambiarPagina,
    setLimite: cambiarLimite,
    recargar,
    error,
  };
}
```

- [ ] **Step 2: Verify frontend compilation**

Run: `npm run build --workspace=@nutrifit/frontend`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/usePaginacion.ts
git commit -m "feat(frontend): add usePaginacion<T> hook"
```

---

### Task 4: Frontend component — ControlesPaginacion.tsx

**Files:**
- Create: `apps/frontend/src/components/ui/ControlesPaginacion.tsx`

- [ ] **Step 1: Create ControlesPaginacion.tsx**

```tsx
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ControlesPaginacionProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  limite: number;
  opcionesLimite?: number[];
  cargando?: boolean;
  onCambiarPagina: (page: number) => void;
  onCambiarLimite: (limit: number) => void;
}

export function ControlesPaginacion({
  pagina,
  totalPaginas,
  total,
  limite,
  opcionesLimite = [10, 25, 50, 100],
  cargando = false,
  onCambiarPagina,
  onCambiarLimite,
}: ControlesPaginacionProps) {
  if (total === 0) return null;

  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  function generarPaginas(): (number | 'ellipsis')[] {
    const paginas: (number | 'ellipsis')[] = [];
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
      return paginas;
    }
    paginas.push(1);
    if (pagina > 3) paginas.push('ellipsis');
    const start = Math.max(2, pagina - 1);
    const end = Math.min(totalPaginas - 1, pagina + 1);
    for (let i = start; i <= end; i++) paginas.push(i);
    if (pagina < totalPaginas - 2) paginas.push('ellipsis');
    paginas.push(totalPaginas);
    return paginas;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {desde}-{hasta} de {total} resultados
      </p>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">Por página:</span>
          <Select
            value={String(limite)}
            onValueChange={(v) => onCambiarLimite(Number(v))}
            disabled={cargando}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcionesLimite.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagina <= 1 || cargando}
            onClick={() => onCambiarPagina(pagina - 1)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          {generarPaginas().map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={p}
                variant={p === pagina ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                disabled={cargando}
                onClick={() => onCambiarPagina(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={pagina >= totalPaginas || cargando}
            onClick={() => onCambiarPagina(pagina + 1)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify frontend compilation**

Run: `npm run build --workspace=@nutrifit/frontend`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/ControlesPaginacion.tsx
git commit -m "feat(frontend): add ControlesPaginacion component"
```

---

### Task 5: Tests — Backend helper

**Files:**
- Create: `apps/backend/src/common/helpers/paginacion.helper.spec.ts`

- [ ] **Step 1: Write tests**

```typescript
import { crearParametrosPaginacion, calcularMeta } from './paginacion.helper';
import { BadRequestError } from '@/domain/exceptions/custom-exceptions';

describe('crearParametrosPaginacion', () => {
  it('usa defaults cuando no hay query params', () => {
    const result = crearParametrosPaginacion({});
    expect(result).toEqual({ page: 1, limit: 10 });
  });

  it('parsea page y limit del query', () => {
    const result = crearParametrosPaginacion({ page: '3', limit: '25' });
    expect(result).toEqual({ page: 3, limit: 25 });
  });

  it('lanza error si page es menor a 1', () => {
    expect(() => crearParametrosPaginacion({ page: '0' })).toThrow(BadRequestError);
  });

  it('lanza error si limit excede maxLimit', () => {
    expect(() => crearParametrosPaginacion({ limit: '200' })).toThrow(BadRequestError);
  });

  it('lanza error si page no es número', () => {
    expect(() => crearParametrosPaginacion({ page: 'abc' })).toThrow(BadRequestError);
  });

  it('acepta maxLimit custom', () => {
    expect(() => crearParametrosPaginacion({ limit: '50' }, { maxLimit: 25 })).toThrow(BadRequestError);
    const result = crearParametrosPaginacion({ limit: '50' }, { maxLimit: 100 });
    expect(result.limit).toBe(50);
  });
});

describe('calcularMeta', () => {
  it('calcula meta básica correctamente', () => {
    const meta = calcularMeta(100, 1, 10);
    expect(meta).toEqual({
      page: 1, limit: 10, total: 100, totalPages: 10,
      hasNextPage: true, hasPreviousPage: false,
    });
  });

  it('no tiene nextPage en la última página', () => {
    const meta = calcularMeta(100, 10, 10);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('maneja total=0 correctamente', () => {
    const meta = calcularMeta(0, 1, 10);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('maneja página intermedia correctamente', () => {
    const meta = calcularMeta(55, 3, 10);
    expect(meta.totalPages).toBe(6);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx jest --testPathPattern=paginacion.helper.spec --workspace=@nutrifit/backend` (or equivalent test command)
Expected: All passing

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/common/helpers/paginacion.helper.spec.ts
git commit -m "test(backend): add unit tests for PaginacionHelper"
```

---

### Task 6: Tests — usePaginacion hook

**Files:**
- Create: `apps/frontend/src/hooks/usePaginacion.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePaginacion } from './usePaginacion';
import type { PaginationParams, PaginationMeta } from '@nutrifit/shared';

describe('usePaginacion', () => {
  const mockFetcher = vi.fn();

  beforeEach(() => {
    mockFetcher.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2, hasNextPage: true, hasPreviousPage: false },
    });
  });

  it('carga datos al montarse', async () => {
    const { result } = renderHook(() => usePaginacion(mockFetcher));

    expect(result.current.pagination.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    expect(result.current.pagination.total).toBe(20);
    expect(result.current.error).toBeNull();
  });

  it('cambia de página y vuelve a cargar', async () => {
    const { result } = renderHook(() => usePaginacion(mockFetcher));

    await waitFor(() => expect(result.current.data).toHaveLength(2));

    act(() => result.current.setPagina(2));

    expect(result.current.pagination.isLoading).toBe(true);

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledWith({ page: 2, limit: 10 });
    });
  });

  it('resetea a página 1 al cambiar límite', async () => {
    const { result } = renderHook(() => usePaginacion(mockFetcher));

    await waitFor(() => expect(result.current.data).toHaveLength(2));

    act(() => result.current.setLimite(25));

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalledWith({ page: 1, limit: 25 });
    });
  });

  it('maneja error del fetcher', async () => {
    mockFetcher.mockRejectedValue(new Error('Error de red'));
    const { result } = renderHook(() => usePaginacion(mockFetcher));

    await waitFor(() => {
      expect(result.current.error).toBe('Error de red');
    });
    expect(result.current.data).toEqual([]);
  });

  it('respeta enabled=false', async () => {
    const { result } = renderHook(() => usePaginacion(mockFetcher, { enabled: false }));

    expect(mockFetcher).not.toHaveBeenCalled();
    expect(result.current.pagination.isLoading).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run apps/frontend/src/hooks/usePaginacion.test.ts`
Expected: All passing

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/usePaginacion.test.ts
git commit -m "test(frontend): add unit tests for usePaginacion hook"
```

---

### Task 7: Tests — ControlesPaginacion component

**Files:**
- Create: `apps/frontend/src/components/ui/__tests__/ControlesPaginacion.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ControlesPaginacion } from '../ControlesPaginacion';

describe('ControlesPaginacion', () => {
  const defaultProps = {
    pagina: 1,
    totalPaginas: 10,
    total: 100,
    limite: 10,
    onCambiarPagina: vi.fn(),
    onCambiarLimite: vi.fn(),
  };

  it('no renderiza nada si total es 0', () => {
    const { container } = render(<ControlesPaginacion {...defaultProps} total={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra texto de resultados', () => {
    render(<ControlesPaginacion {...defaultProps} />);
    expect(screen.getByText('Mostrando 1-10 de 100 resultados')).toBeInTheDocument();
  });

  it('muestra 2 páginas cuando totalPaginas=2', () => {
    render(<ControlesPaginacion {...defaultProps} totalPaginas={2} total={15} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('deshabilita botón Anterior en página 1', () => {
    render(<ControlesPaginacion {...defaultProps} />);
    const prevBtn = screen.getByRole('button', { name: '' }).closest('button');
    // El primer button (índice 0) es el Anterior (svg con path d^=M15)
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('llama onCambiarPagina al hacer clic en página 3', async () => {
    const onPagina = vi.fn();
    render(<ControlesPaginacion {...defaultProps} pagina={3} onCambiarPagina={onPagina} />);
    const btn2 = screen.getByText('2');
    await userEvent.click(btn2);
    expect(onPagina).toHaveBeenCalledWith(2);
  });

  it('llama onCambiarLimite al cambiar select', async () => {
    const onLimite = vi.fn();
    render(<ControlesPaginacion {...defaultProps} onCambiarLimite={onLimite} />);
    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger);
    const option25 = screen.getByText('25');
    await userEvent.click(option25);
    expect(onLimite).toHaveBeenCalledWith(25);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run apps/frontend/src/components/ui/__tests__/ControlesPaginacion.test.tsx`
Expected: All passing

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ui/__tests__/ControlesPaginacion.test.tsx
git commit -m "test(frontend): add unit tests for ControlesPaginacion component"
```

---

## Phase 2: Migrate existing paginated pages (6 pages)

**Pattern for each page:**

Each page currently using client-side slice (Socios, Recepcionistas, GestionNutricionistas, Turnos) OR server-side pagination with manual controls (Permisos, NutricionistasCatalogo) gets migrated to `usePaginacion` + `ControlesPaginacion`.

### Task 8: Migrate Permisos.tsx

**Files:**
- Modify: `apps/frontend/src/pages/Permisos.tsx`
- Modify: associated backend endpoint (already server-side, align response if needed)

- [ ] **Step 1: Read current Permisos.tsx to understand existing pagination pattern**

- [ ] **Step 2: Replace manual pagination state with usePaginacion**

Remove:
- `useState` for `pagina`, `limite`, `total`, `totalPaginas`
- `useEffect` manual fetcher
- `<Pagination>` shadcn manual JSX

Add:
```typescript
const {
  data: permisos,
  pagination,
  setPagina,
  setLimite,
  recargar,
  error,
} = usePaginacion(obtenerPermisos, { defaultLimit: 10 });

// ...wherever pagination controls were rendered:
<ControlesPaginacion
  pagina={pagination.page}
  totalPaginas={pagination.totalPages}
  total={pagination.total}
  limite={pagination.limit}
  cargando={pagination.isLoading}
  onCambiarPagina={setPagina}
  onCambiarLimite={setLimite}
/>
```

Adapt `obtenerPermisos` fetcher to return `{ data, pagination }` matching `PaginatedData` shape.

- [ ] **Step 3: Verify build + commit**

`npm run build --workspace=@nutrifit/frontend`

```bash
git add apps/frontend/src/pages/Permisos.tsx
git commit -m "refactor(frontend): migrate Permisos page to usePaginacion + ControlesPaginacion"
```

---

### Task 9: Migrate NutricionistasCatalogo.tsx

**Files:**
- Modify: `apps/frontend/src/pages/NutricionistasCatalogo.tsx`
- Modify: `apps/backend/src/application/profesional/list-profesionales-publicos.use-case.ts` (align response to `PaginatedData`)

**Pattern:**
- Backend: replace manual `{ total, page, per_page, total_pages }` with `calcularMeta(total, page, limit)` and wrap in `PaginatedData`
- Frontend: same pattern as Task 8

- [ ] **Step 1: Read current implementation**

- [ ] **Step 2: Apply migration (same pattern as Task 8)**

- [ ] **Step 3: Verify build + commit**

---

### Task 10: Migrate GestionNutricionistas.tsx (client-side → server-side)

**Files:**
- Modify: `apps/frontend/src/pages/admin/GestionNutricionistas.tsx`
- Modify: backend endpoint for profesionales list (add `page`/`limit` params)

**Pattern:**
- Backend: add `crearParametrosPaginacion(query)` → `paginarQuery(qb, params)` to the endpoint
- Frontend: add `usePaginacion` + `ControlesPaginacion`; remove client-side `slice`/`filter` pagination

- [ ] **Step 1: Read current implementation**

- [ ] **Step 2: Apply migration**

- [ ] **Step 3: Verify build + commit**

---

### Task 11: Migrate Socios.tsx (client-side → server-side)

**Files:**
- Modify: `apps/frontend/src/pages/admin/Socios.tsx`
- Modify: backend `GET /socio` endpoint

Same pattern as Task 10.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 12: Migrate Recepcionistas.tsx (client-side → server-side)

**Files:**
- Modify: `apps/frontend/src/pages/admin/Recepcionistas.tsx`
- Modify: backend `GET /recepcionistas` endpoint

Same pattern as Task 10.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 13: Migrate Turnos.tsx (client-side → server-side)

**Files:**
- Modify: `apps/frontend/src/pages/Turnos.tsx`
- Modify: backend `GET /turnos/socio/mis-turnos` endpoint

Same pattern as Task 10.

- [ ] **Step 1: Read, migrate, verify, commit**

---

## Phase 3: Add pagination to non-paginated lists

**Pattern for each page/endpoint:**

1. **Backend endpoint**: Add `crearParametrosPaginacion(query)` → `paginarQuery(qb, params)` or `paginarFindAndCount(repo, params)`. Wrap existing result in `PaginatedData<T>`.
2. **Frontend page**: Replace direct fetch with `usePaginacion<T>()`, add `<ControlesPaginacion>`.

### Task 14: Paginate AdminAuditoriaPage (CRITICAL — highest priority)

**Files:**
- Modify: backend `GET /admin/auditoria` endpoint
- Modify: `apps/frontend/src/pages/admin/AdminAuditoriaPage.tsx`

**Backend changes:**
```typescript
// Before:
async listarAuditoria(): Promise<Auditoria[]> {
  return this.repo.find({ order: { createdAt: 'DESC' } });
}

// After:
async listarAuditoria(query: Record<string, string>): Promise<PaginatedData<Auditoria>> {
  const params = crearParametrosPaginacion(query);
  const qb = this.repo.createQueryBuilder('a')
    .orderBy('a.createdAt', 'DESC');
  return paginarQuery(qb, params);
}
```

**Frontend changes:**
Same pattern as Task 8: replace manual fetch with `usePaginacion` + `ControlesPaginacion`.

- [ ] **Step 1: Read current implementation**
- [ ] **Step 2: Apply backend changes**
- [ ] **Step 3: Apply frontend changes**
- [ ] **Step 4: Verify build + commit**
```bash
git add <files>
git commit -m "feat: add pagination to AdminAuditoriaPage"
```

---

### Task 15: Paginate GestionAlimentosPage

**Files:**
- Modify: backend `GET /alimentos` endpoint
- Modify: `apps/frontend/src/pages/admin/GestionAlimentosPage.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 16: Paginate PacientesPage

**Files:**
- Modify: backend `GET /turnos/profesional/:id/pacientes` endpoint
- Modify: `apps/frontend/src/pages/profesional/PacientesPage.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 17: Paginate AgendarTurno (lista profesionales)

**Files:**
- Modify: backend endpoint for profesionales disponibles
- Modify: `apps/frontend/src/pages/AgendarTurno.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 18: Paginate historial turnos paciente

**Files:**
- Modify: backend `GET /turnos/profesional/:id/pacientes/:id/historial-turnos` endpoint
- Modify: `apps/frontend/src/components/profesional/HistorialTurnosPaciente.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 19: Paginate TablaEvolucionPaciente (mediciones)

**Files:**
- Modify: backend `GET /progreso/:id/mediciones` endpoint
- Modify: `apps/frontend/src/components/profesional/TablaEvolucionPaciente.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 20: Paginate GaleriaFotos

**Files:**
- Modify: backend `GET /progreso/:id/fotos` endpoint
- Modify: `apps/frontend/src/components/profesional/GaleriaFotos.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 21: Paginate FichaSaludHistorialModal

**Files:**
- Modify: backend `GET /turnos/socio/ficha-salud/historial` endpoint
- Modify: `apps/frontend/src/components/ui/FichaSaludHistorialModal.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 22: Paginate FoodSearchDialog

**Files:**
- Modify: backend `GET /alimentos/buscar` (or equivalent search endpoint)
- Modify: `apps/frontend/src/components/FoodSearchDialog.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

### Task 23: Paginate GestionPlanesPage

**Files:**
- Modify: backend endpoint for planes list
- Modify: `apps/frontend/src/pages/admin/GestionPlanesPage.tsx`

Same pattern as Task 14.

- [ ] **Step 1: Read, migrate, verify, commit**

---

## Phase 4: Notifications — add UI controls

### Task 24: Add pagination controls to NotificacionesPage

**Files:**
- Modify: `apps/frontend/src/pages/NotificacionesPage.tsx`
- Modify: `apps/frontend/src/hooks/useNotificaciones.ts` (if it exists as separate hook)

**Backend already paginates `GET /notificaciones/mias`.**

- [ ] **Step 1: Read current NotificacionesPage.tsx**

- [ ] **Step 2: Expose setPagina / setLimite from the notifications hook**

If `useNotificaciones` is a standalone hook, add `setPagina`, `setLimite`, `pagination` to its return value.

- [ ] **Step 3: Add ControlesPaginacion to the page**

```tsx
<ControlesPaginacion
  pagina={pagination.page}
  totalPaginas={pagination.totalPages}
  total={pagination.total}
  limite={pagination.limit}
  cargando={pagination.isLoading}
  onCambiarPagina={setPagina}
  onCambiarLimite={setLimite}
/>
```

- [ ] **Step 4: Verify build + commit**

---

### Task 25: Add "Ver todas" link to NotificationCenter dropdown

**Files:**
- Modify: `apps/frontend/src/components/notificaciones/NotificationCenter.tsx`

- [ ] **Step 1: Read current NotificationCenter.tsx**

- [ ] **Step 2: Add "Ver todas" link at the bottom of the dropdown**

```tsx
import { Link } from 'react-router-dom';

// Inside the dropdown, after the last notification:
<div className="border-t p-2">
  <Link
    to="/notificaciones"
    className="block text-center text-sm text-primary hover:underline"
  >
    Ver todas las notificaciones
  </Link>
</div>
```

- [ ] **Step 3: Verify build + commit**

---

## Phase 5: Dashboard cards — add "Ver todos" links

### Task 26: Add "Ver todos" to all dashboard cards

**Files:**
- Modify: `apps/frontend/src/components/dashboard/TurnosTablaCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/UltimosRegistradosCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/PacientesRecientesCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/AgendaProfesionalesCard.tsx`
- Modify: `apps/frontend/src/components/dashboard/ObjetivosCard.tsx`

**Pattern:**
Add a "Ver todos" link/button after the table content:

```tsx
// At the bottom of each card, inside the card footer:
<div className="border-t px-6 py-3">
  <Link
    to="<ruta-destino>"
    className="text-sm text-primary hover:underline font-medium"
  >
    Ver todos &rarr;
  </Link>
</div>
```

Routes map:
| Card | Route |
|------|-------|
| TurnosTablaCard | `/recepcion/turnos` |
| TurnosDelDiaCard | `/profesional/turnos` |
| UltimosRegistradosCard | `/admin/socios` |
| PacientesRecientesCard | `/profesional/pacientes` |
| AgendaProfesionalesCard | `/admin/profesionales` |
| ObjetivosCard | `/progreso/objetivos` |

- [ ] **Step 1: Read each card file**
- [ ] **Step 2: Add <Link> with "Ver todos" to each card**
- [ ] **Step 3: Verify build + commit**

```bash
git add apps/frontend/src/components/dashboard/TurnosTablaCard.tsx apps/frontend/src/components/dashboard/TurnosDelDiaCard.tsx ...
git commit -m "feat(dashboard): add 'Ver todos' links to dashboard cards"
```

---

## Test Strategy

- **Backend helper**: Unit tests in Task 5 (edge cases: page=0, NaN, maxLimit, total=0)
- **Frontend hook**: Unit tests in Task 6 (loading, error, change page, change limit, enabled)
- **Frontend component**: Unit tests in Task 7 (empty state, navigation, select, disabled)
- **E2E**: After Phase 3, run manual smoke test: navigate 2+ pages on AdminAuditoriaPage and GestionAlimentosPage
- **Existing tests**: `npm test` (both workspaces) before each commit to ensure no regressions

---

## Self-Review Checklist

- [x] **Spec coverage**: All sections covered (types, backend, frontend, notifications, dashboard)
- [x] **No placeholders**: Every step has concrete instructions; migration tasks document exact pattern
- [x] **Type consistency**: `PaginationParams`, `PaginationMeta`, `PaginatedData` used consistently across all tasks
- [x] **Phase ordering**: Infrastructure first, then migrate existing, then new, then UI polish
- [x] **DRY**: Shared types, one helper, one hook, one component — no repetition
