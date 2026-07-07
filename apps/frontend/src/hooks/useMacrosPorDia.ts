import { useMemo } from 'react';

import type { DiaSemana, EstructuraDiaFE } from '@/types/ia';

export interface MacrosAcumuladas {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export const MACROS_VACIOS: MacrosAcumuladas = {
  calorias: 0,
  proteinas: 0,
  carbohidratos: 0,
  grasas: 0,
};

export const ORDEN_DIAS: readonly DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

/**
 * Calcula los macros (calorias/proteinas/carbohidratos/grasas) por cada día
 * de la estructura del plan. Devuelve un `Record` indexado por `DiaSemana`
 * con los 7 días siempre presentes (incluso si la estructura no los incluye).
 */
export function useMacrosPorDia(
  estructura: EstructuraDiaFE[],
): Record<DiaSemana, MacrosAcumuladas> {
  return useMemo(() => {
    const base = ORDEN_DIAS.reduce(
      (acc, dia) => {
        acc[dia] = { ...MACROS_VACIOS };
        return acc;
      },
      {} as Record<DiaSemana, MacrosAcumuladas>,
    );

    for (const diaData of estructura) {
      if (!diaData?.dia) continue;
      const acc = { ...MACROS_VACIOS };
      for (const comida of diaData.comidas ?? []) {
        const alternativas = comida.alternativas ?? [];
        if (alternativas.length === 0) continue;
        // Cada comida aporta el PROMEDIO de sus alternativas: el socio elige
        // UNA, no todas. Sumar todas triplicaba los totales.
        const suma = alternativas.reduce(
          (parcial, alt) => ({
            calorias: parcial.calorias + (alt.calorias ?? 0),
            proteinas: parcial.proteinas + (alt.proteinas ?? 0),
            carbohidratos: parcial.carbohidratos + (alt.carbohidratos ?? 0),
            grasas: parcial.grasas + (alt.grasas ?? 0),
          }),
          { ...MACROS_VACIOS },
        );
        const n = alternativas.length;
        acc.calorias += suma.calorias / n;
        acc.proteinas += suma.proteinas / n;
        acc.carbohidratos += suma.carbohidratos / n;
        acc.grasas += suma.grasas / n;
      }
      base[diaData.dia] = acc;
    }

    return base;
  }, [estructura]);
}
