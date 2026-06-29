import { useMemo } from 'react';
import type { EstructuraDiaFE } from '@/types/ia';

interface MacrosAcumuladas {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export function useMacrosAcumulados(estructura: EstructuraDiaFE[]): MacrosAcumuladas {
  return useMemo(() => {
    const totales = estructura.flatMap((d) =>
      d.comidas.flatMap((c) => c.alternativas),
    );
    return totales.reduce(
      (acc, alt) => ({
        calorias: acc.calorias + (alt.calorias ?? 0),
        proteinas: acc.proteinas + (alt.proteinas ?? 0),
        carbohidratos: acc.carbohidratos + (alt.carbohidratos ?? 0),
        grasas: acc.grasas + (alt.grasas ?? 0),
      }),
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
    );
  }, [estructura]);
}
