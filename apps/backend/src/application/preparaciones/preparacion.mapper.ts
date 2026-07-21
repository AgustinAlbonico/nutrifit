import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { PreparacionItemResponseDto, PreparacionResponseDto } from './dtos';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';

/**
 * Calcula los macros de un alimento escalados proporcionalmente
 * a la cantidad solicitada vs la cantidad base del alimento.
 */
export function calcularMacrosProporcionales(
  alimento: AlimentoOrmEntity,
  cantidad: number,
): {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
} {
  const base = alimento.cantidad || 100;
  const factor = cantidad / base;
  return {
    calorias: Math.round((alimento.calorias ?? 0) * factor * 100) / 100,
    proteinas: Math.round((alimento.proteinas ?? 0) * factor * 100) / 100,
    carbohidratos:
      Math.round((alimento.carbohidratos ?? 0) * factor * 100) / 100,
    grasas: Math.round((alimento.grasas ?? 0) * factor * 100) / 100,
  };
}

/**
 * Mapea una PreparacionOrmEntity (con items y alimentos cargados)
 * a PreparacionResponseDto con macros calculados.
 */
export function mapPreparacionToResponse(
  preparacion: PreparacionOrmEntity,
): PreparacionResponseDto {
  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarbohidratos = 0;
  let totalGrasas = 0;

  const items: PreparacionItemResponseDto[] = (preparacion.items ?? []).map(
    (item) => {
      const macros = calcularMacrosProporcionales(
        item.alimento,
        item.cantidadDefault,
      );
      totalCalorias += macros.calorias;
      totalProteinas += macros.proteinas;
      totalCarbohidratos += macros.carbohidratos;
      totalGrasas += macros.grasas;

      return {
        idPreparacionItem: item.idPreparacionItem,
        alimentoId: item.alimentoId,
        alimentoNombre: item.alimento?.nombre ?? '',
        cantidadDefault: item.cantidadDefault,
        unidadDefault: item.unidadDefault,
        calorias: macros.calorias,
        proteinas: macros.proteinas,
        carbohidratos: macros.carbohidratos,
        grasas: macros.grasas,
      };
    },
  );

  return {
    idPreparacion: preparacion.idPreparacion,
    nombre: preparacion.nombre,
    gimnasioId: preparacion.gimnasioId,
    creadoPorId: preparacion.creadoPorId,
    items,
    totalCalorias: Math.round(totalCalorias * 100) / 100,
    totalProteinas: Math.round(totalProteinas * 100) / 100,
    totalCarbohidratos: Math.round(totalCarbohidratos * 100) / 100,
    totalGrasas: Math.round(totalGrasas * 100) / 100,
  };
}
