# Paginación Unificada — Design Doc

**Fecha:** 2026-06-22
**Autor:** AI (Agustín)
**Estado:** Aprobado para implementación

---

## 1. Contexto

El sistema NutriFit tiene ~53 listas y tablas que renderizan colecciones de datos en el frontend. De ellas:
- Solo **6** tienen paginación (2 server-side, 4 client-side con slice en memoria)
- **2** tienen paginación server-side pero sin controles UI (notificaciones)
- **~45** **no tienen paginación** (incluyendo catálogos críticos como auditoría, alimentos y pacientes)

Además, la paginación existente es **inconsistente**:
- `permisos.service.ts` usa `{ page, limit, total, totalPages, hasNextPage, hasPreviousPage }` (camelCase)
- `list-profesionales-publicos.use-case.ts` usa `{ total, page, per_page, total_pages }` (snake_case)
- El frontend tiene hooks manuales y estados de paginación duplicados en 4 páginas

**Objetivo:** Implementar paginación server-side consistente en TODAS las listas/tablas, con código DRY (un helper backend, un hook frontend, un componente UI), contrato compartido en `packages/shared`, y migrar las 4 client-side existentes a server-side.

---

## 2. Contrato Compartido — `packages/shared`

Se crea `packages/shared/src/types/paginacion.ts`:

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

Se re-exporta desde `packages/shared/src/types/index.ts`:
```typescript
export * from './paginacion.js';
```

El frontend importa desde `@nutrifit/shared`. El backend importa desde `@nutrifit/shared` o replica localmente (NestJS monorepo).

Los endpoints paginados devuelven `ApiResponse<PaginatedData<T>>` envuelto en el `ApiResponse` existente:
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
```

Las respuestas paginadas serán:
```json
{
  "success": true,
  "message": "Ok",
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-06-22T..."
}
```

---

## 3. Backend — Helper Reutilizable

Archivo: `apps/backend/src/common/helpers/paginacion.helper.ts`

```typescript
import { PaginationParams, PaginationMeta, PaginatedData } from '@nutrifit/shared';
import { SelectQueryBuilder } from 'typeorm';
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
```

**Uso típico en un service/use-case:**

```typescript
// Antes (sin paginación):
async listarAlimentos(): Promise<Alimento[]> {
  return this.repo.find();
}

// Después (con paginación):
async listarAlimentos(query: Record<string, string>): Promise<PaginatedData<Alimento>> {
  const params = crearParametrosPaginacion(query);
  const qb = this.repo.createQueryBuilder('a')
    .leftJoinAndSelect('a.grupoAlimenticio', 'g');
  // filtros adicionales si existen...
  return paginarQuery(qb, params);
}
```

**Para repositorios que usan `findAndCount` en vez de QueryBuilder, se agrega una sobrecarga:**

```typescript
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

---

## 4. Frontend — Hook Reutilizable

Archivo: `apps/frontend/src/hooks/usePaginacion.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { PaginationParams, PaginationMeta } from '@nutrifit/shared';

interface UsePaginacionOptions {
  defaultLimit?: number;
  enabled?: boolean;
}

interface UsePaginacionResult<T> {
  data: T[];
  pagination: PaginationMeta & { isLoading: boolean };
  setPagina: (page: number) => void;
  setLimite: (limit: number) => void;
  recargar: () => void;
  error: string | null;
}

export function usePaginacion<T>(
  fetcher: (params: PaginationParams) => Promise<{ data: T[]; pagination: PaginationMeta }>,
  options?: UsePaginacionOptions,
): UsePaginacionResult<T> {
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

---

## 5. Frontend — Componente UI `ControlesPaginacion`

Archivo: `apps/frontend/src/components/ui/ControlesPaginacion.tsx`

```typescript
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
```

**Renderizado:**
- Texto: "Mostrando X-Y de Z resultados"
- Select de límite por página: [10, 25, 50, 100] (configurable via prop)
- Botones de navegación: Anterior + páginas numeradas ([1], ..., [n], ..., [N]) + Siguiente
- Se muestran siempre primera y última página, más ~2 alrededor de la actual
- Elementos deshabilitados en bordes o durante carga

**Comportamiento:**
- Al cambiar límite → `onCambiarLimite(nuevo)` → resetea a página 1
- Al cambiar página → `onCambiarPagina(nueva)`
- Total de 0 → no renderiza nada (lista vacía, sin paginación)
- TotalPages de 1 → controles ocultos (no tiene sentido paginar 1 página)

---

## 6. Dashboard Cards (Top N)

Los dashboard cards que hoy usan `slice(0, N)` como preview intencional se **mantienen** con su límite, pero se les **agrega botón "Ver todos"** que navega a la ruta paginada completa.

| Card | Límite actual | Acción "Ver todos" |
|------|--------------|-------------------|
| `TurnosTablaCard` | slice(0, 8) | Navega a `/recepcion/turnos` |
| `TurnosDelDiaCard` | slice(0, 5) | Navega a `/profesional/turnos` |
| `UltimosRegistradosCard` | slice(0, 5) | Navega a `/admin/socios` |
| `PacientesRecientesCard` | limite=5 URL | Navega a `/profesional/pacientes` |
| `AgendaProfesionalesCard` | slice(0, 6) | Navega a `/admin/profesionales` |
| `ObjetivosCard` | slice(0, 4) | Navega a `/progreso/objetivos` |

Los cards NO usan `usePaginacion` — no necesitan paginación interna.

---

## 7. Migración de Endpoints Backend

### Convención de query params

Todos los endpoints paginados aceptan:
- `?page=1&limit=10`

Los valores default son `page=1`, `limit=10`. El límite máximo global es 100 (configurable por endpoint si necesita menos, ej. catálogos públicos con 24).

### Endpoints a modificar (nuevos o migración a server-side)

| Endpoint | Estrategia | Cambio respecto a hoy |
|----------|-----------|-----------------------|
| `GET /admin/auditoria` | Agregar `page`, `limit` + `take`/`skip` en query | Nuevo: hoy devuelve todo sin límite |
| `GET /alimentos` | Agregar `page`, `limit` + paginar query | Nuevo: hoy devuelve todo |
| `GET /turnos/profesional/:id/pacientes` | Agregar `page`, `limit` | Nuevo: hoy devuelve todos |
| `GET /profesional/publico/disponibles` | Migrar response a `PaginatedData` | Cambio: hoy usa snake_case |
| `GET /profesional` | Migrar a server-side con `page`/`limit` | Cambio: hoy devuelve todo y frontend pagina en cliente |
| `GET /socio` | Migrar a server-side | Cambio: hoy devuelve todo |
| `GET /recepcionistas` | Migrar a server-side | Cambio: hoy devuelve todo |
| `GET /turnos/socio/mis-turnos` | Migrar a server-side | Cambio: hoy devuelve todo |
| `GET /usuarios` (permisos) | Alinear response a `PaginatedData` | Cambio: ya es server-side, ajustar formato |
| `GET /notificaciones/mias` | Ya es server-side, solo agregar controles UI en front | Sin cambio backend |
| `GET /turnos/profesional/:id/pacientes/:id/historial-turnos` | Agregar `page`, `limit` | Nuevo: hoy devuelve todo |
| `GET /progreso/:id/mediciones` | Agregar `page`, `limit` | Nuevo |
| `GET /progreso/:id/fotos` | Agregar `page`, `limit` | Nuevo |
| `GET /turnos/socio/ficha-salud/historial` | Agregar `page`, `limit` | Nuevo |

### Endpoints EXCLUIDOS de paginación (volumen naturalmente bajo)

- `GET /gimnasios` (superadmin, decenas)
- `GET /gimnasios/:id/admins` (1-3 por gimnasio)
- `GET /permisos/grupos` (decenas de grupos)
- Agregar admin, editar perfil, etc. (operaciones CRUD individuales)
- Endpoints de dashboard con `?limite=5` (ya acotados, preview intencional)

---

## 8. Migración de Páginas Frontend

### Proceso estándar para cada página:

1. Reemplazar `useState` de datos + `useEffect` manual por `usePaginacion`
2. Reemplazar controles de paginación manuales por `ControlesPaginacion`
3. Si tenía paginación client-side, el endpoint cambia a server-side → ajustar fetcher
4. Si no tenía paginación, agregar `page`/`limit` al endpoint y usar hook

### Páginas a modificar (por orden de implementación):

**Fase 1 — Infraestructura (sin migración de páginas)**
- Crear tipos en `packages/shared`
- Crear helper backend
- Crear hook frontend
- Crear componente UI

**Fase 2 — Migrar las 6 ya paginadas al nuevo estándar**
- `Permisos.tsx` (usa server-side, ajustar a nuevo hook/componente)
- `NutricionistasCatalogo.tsx` (migrar backend a nuevo formato + frontend)
- `GestionNutricionistas.tsx` (migrar a server-side + hook)
- `Socios.tsx` (migrar a server-side + hook)
- `Recepcionistas.tsx` (migrar a server-side + hook)
- `Turnos.tsx` (migrar a server-side + hook)

**Fase 3 — Agregar paginación a listas no paginadas (alto volumen)**
- `AdminAuditoriaPage.tsx`
- `GestionAlimentosPage.tsx`
- `PacientesPage.tsx`
- `AgendarTurno.tsx` (lista de profesionales)
- Notificaciones (agregar controles UI)

**Fase 4 — Agregar paginación a listas no paginadas (medio-alto volumen)**
- `HistorialTurnosPaciente.tsx`
- `TablaEvolucionPaciente.tsx`
- `GaleriaFotos.tsx`
- `FichaSaludHistorialModal.tsx`
- `FoodSearchDialog.tsx` (backend búsqueda)
- `GestionPlanesPage.tsx`

**Fase 5 — Dashboard cards (agregar link "Ver todos")**
- `TurnosTablaCard.tsx`
- `TurnosDelDiaCard.tsx`
- `UltimosRegistradosCard.tsx`
- `PacientesRecientesCard.tsx`
- `AgendaProfesionalesCard.tsx`
- `ObjetivosCard.tsx`

**Fase 6 — Bajo volumen (opcional, bajo demanda)**
- `Agenda.tsx`, `ConsultaProfesionalPage.tsx`, `UsuarioPermisosPage.tsx`, etc.

---

## 9. Notificaciones (caso especial)

El backend ya pagina (`GET /notificaciones/mias?page=1&limit=20`). El hook `useNotificaciones` necesita exponer `setPagina` y `setLimite`. Luego:

- `NotificacionesPage.tsx`: agrega `ControlesPaginacion`
- `NotificationCenter.tsx` (dropdown): mantiene solo primeras 20, agrega link "Ver todas" → navega a `/notificaciones`

---

## 10. Testing

- **Backend helper:** test unitario de `crearParametrosPaginacion` (casos borde: page=0, limit=0, NaN, valores límite) y `calcularMeta` (total=0, page=1, page=totalPages, etc.)
- **Frontend hook:** test con vitest + MSW mockeando fetcher
- **Frontend componente:** test de renderizado con diferentes props (página actual, deshabilitado, 1 sola página, muchas páginas)
- **E2E:** smoke test de navegación de páginas en 2-3 listas clave (auditoría, alimentos, socios)

---

## 11. Retrocompatibilidad

Durante la migración, los endpoints que cambian de formato o agregan paginación por primera vez rompen a clientes antiguos (frontend). Como es monorepo y front+back se deployan juntos, NO hay problema de compatibilidad siempre que el frontend se actualice al mismo tiempo que el backend. Los cambios se hacen por commit que toca front+back del mismo endpoint simultáneamente.

Los endpoints que hoy devuelven `T[]` y pasan a `PaginatedData<T>` rompen el contrato. Por eso se migran de a un endpoint por commit, con frontend actualizado en el mismo commit.

---

## 12. Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `packages/shared/src/types/paginacion.ts` | Tipos compartidos: `PaginationParams`, `PaginationMeta`, `PaginatedData` |
| `apps/backend/src/common/helpers/paginacion.helper.ts` | Helper backend: `crearParametrosPaginacion`, `calcularMeta`, `paginarQuery`, `paginarFindAndCount` |
| `apps/frontend/src/hooks/usePaginacion.ts` | Hook React genérico `usePaginacion<T>` |
| `apps/frontend/src/components/ui/ControlesPaginacion.tsx` | Componente UI de navegación |
| `apps/frontend/src/components/ui/__tests__/ControlesPaginacion.test.tsx` | Tests unitarios del componente |

Archivos a modificar: ~21 (endpoints backend + páginas frontend + dashboard cards).
