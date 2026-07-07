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
      const acc = base[diaData.dia] ?? { ...MACROS_VACIOS };
      for (const comida of diaData.comidas ?? []) {
        for (const alt of comida.alternativas ?? []) {
          acc.calorias += alt.calorias ?? 0;
          acc.proteinas += alt.proteinas ?? 0;
          acc.carbohidratos += alt.carbohidratos ?? 0;
          acc.grasas += alt.grasas ?? 0;
        }
      }
      base[diaData.dia] = acc;
    }

    return base;
  }, [estructura]);
}
