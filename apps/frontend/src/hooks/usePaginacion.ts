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
