import { useEffect, useState } from 'react';

/**
 * Hook que retorna el valor `input` reboteado despues de `delay` ms.
 * Util para inputs de busqueda que disparan queries.
 *
 * @param input - Valor a rebotear.
 * @param delay - Milisegundos de espera. Default 300ms.
 */
export function useDebounce<T>(input: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(input);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(input);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [input, delay]);

  return debounced;
}
