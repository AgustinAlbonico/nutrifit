import type { DiaSemana, EstructuraDiaFE, TipoComidaPlan } from '@/types/ia';

export function estructuraTieneContenido(estructura: EstructuraDiaFE[]): boolean {
  return estructura.some((dia) =>
    dia.comidas.some((comida) => comida.alternativas.length > 0),
  );
}

export function crearClaveSlot(
  dia: DiaSemana,
  tipoComida: TipoComidaPlan,
): string {
  return `${dia}:${tipoComida}`;
}

export function obtenerClavesGeneradas(
  estructura: EstructuraDiaFE[],
): Set<string> {
  const clavesGeneradas = new Set<string>();

  for (const dia of estructura) {
    for (const comida of dia.comidas) {
      if (comida.alternativas.length > 0) {
        clavesGeneradas.add(crearClaveSlot(dia.dia, comida.tipo));
      }
    }
  }

  return clavesGeneradas;
}
