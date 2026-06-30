import type { EstructuraDiaFE } from '@/types/ia';

export function estructuraTieneContenido(estructura: EstructuraDiaFE[]): boolean {
  return estructura.some((dia) =>
    dia.comidas.some((comida) => comida.alternativas.length > 0),
  );
}
