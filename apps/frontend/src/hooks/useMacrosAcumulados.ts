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
    // Cada comida aporta el PROMEDIO de sus alternativas: el socio elige UNA,
    // no todas. Sumar todas triplicaba los totales cuando hay varias alternativas.
    const acumulador = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
    for (const dia of estructura) {
      for (const comida of dia.comidas ?? []) {
        const alternativas = comida.alternativas ?? [];
        if (alternativas.length === 0) continue;
        const suma = alternativas.reduce(
          (parcial, alt) => ({
            calorias: parcial.calorias + (alt.calorias ?? 0),
            proteinas: parcial.proteinas + (alt.proteinas ?? 0),
            carbohidratos: parcial.carbohidratos + (alt.carbohidratos ?? 0),
            grasas: parcial.grasas + (alt.grasas ?? 0),
          }),
          { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
        );
        const n = alternativas.length;
        acumulador.calorias += suma.calorias / n;
        acumulador.proteinas += suma.proteinas / n;
        acumulador.carbohidratos += suma.carbohidratos / n;
        acumulador.grasas += suma.grasas / n;
      }
    }
    return acumulador;
  }, [estructura]);
}
