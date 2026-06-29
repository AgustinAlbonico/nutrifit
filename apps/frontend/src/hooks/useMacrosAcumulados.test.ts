import { renderHook } from '@testing-library/react';
import { useMacrosAcumulados } from './useMacrosAcumulados';
import type { EstructuraDiaFE } from '@/types/ia';

describe('useMacrosAcumulados', () => {
  it('suma kcal de todas las alternativas del plan', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              { nombre: 'A', alimentos: [], calorias: 300, proteinas: 10, carbohidratos: 50, grasas: 5 },
              { nombre: 'B', alimentos: [], calorias: 200, proteinas: 8, carbohidratos: 30, grasas: 3 },
            ],
          },
        ],
      },
      {
        dia: 'MARTES',
        comidas: [],
      },
    ];

    const { result } = renderHook(() => useMacrosAcumulados(estructura));
    expect(result.current.calorias).toBe(500);
  });

  it('devuelve 0 cuando estructura está vacía', () => {
    const { result } = renderHook(() => useMacrosAcumulados([]));
    expect(result.current.calorias).toBe(0);
  });
});
