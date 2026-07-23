import type { FichaClinicaParaValidacion } from '../validators/restricciones-validator-v2';
import type { ObjetivoNutricional } from '../validators/macros-validator';

const CALORIAS_BASE = 2000;

export function calcularObjetivoMacros(
  ficha: FichaClinicaParaValidacion,
): ObjetivoNutricional {
  const calorias = CALORIAS_BASE;
  const proteinas = Math.round((calorias * 0.25) / 4);
  const carbohidratos = Math.round((calorias * 0.5) / 4);
  const grasas = Math.round((calorias * 0.25) / 9);
  return {
    caloriasDiarias: calorias,
    proteinasDiarias: proteinas,
    carbohidratosDiarios: carbohidratos,
    grasasDiarias: grasas,
  };
}
