import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePaginacion } from './usePaginacion';

describe('usePaginacion', () => {
  const mockFetcher = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('recargar vuelve a ejecutar el fetcher', async () => {
    const { result } = renderHook(() => usePaginacion(mockFetcher));

    await waitFor(() => expect(result.current.data).toHaveLength(2));

    mockFetcher.mockClear();

    act(() => result.current.recargar());

    await waitFor(() => {
      expect(mockFetcher).toHaveBeenCalled();
    });
  });
});
