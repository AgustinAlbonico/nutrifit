import { Injectable, Logger } from '@nestjs/common';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import {
  OpenFoodFactsBusqueda,
  mapearProductoOpenFoodFacts,
} from './alimentos-argentina-catalogo.util';

export interface MacrosEstimadas {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  cantidad: number;
  unidadMedida: UnidadMedida;
  fuente: 'openfoodfacts';
}

const URL_OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org/api/v2/search';
const TIMEOUT_MS = 4000;
const USER_AGENT = 'NutriFitSupervisor/1.0 (buscador-macros)';

@Injectable()
export class BuscadorMacrosOpenFoodFacts {
  private readonly logger = new Logger(BuscadorMacrosOpenFoodFacts.name);

  async buscarMacrosPorNombre(nombre: string): Promise<MacrosEstimadas | null> {
    const termino = nombre.trim();
    if (termino.length < 2) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url =
        `${URL_OPEN_FOOD_FACTS}?search_term=${encodeURIComponent(termino)}` +
        `&page_size=1&fields=product_name,quantity,nutriments`;

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        this.logger.warn(
          `Open Food Facts respondió ${response.status} al buscar macros de "${termino}".`,
        );
        return null;
      }

      const body = (await response.json()) as OpenFoodFactsBusqueda;
      const primerProducto = body.products?.[0];
      if (!primerProducto) {
        return null;
      }

      const mapeado = mapearProductoOpenFoodFacts(primerProducto);
      if (!mapeado) {
        return null;
      }

      const estimadas: MacrosEstimadas = {
        calorias: mapeado.calorias ?? 0,
        proteinas: mapeado.proteinas ?? 0,
        carbohidratos: mapeado.carbohidratos ?? 0,
        grasas: mapeado.grasas ?? 0,
        cantidad: mapeado.cantidad,
        unidadMedida: mapeado.unidadMedida,
        fuente: 'openfoodfacts',
      };

      if (
        mapeado.calorias === null ||
        mapeado.proteinas === null ||
        mapeado.carbohidratos === null ||
        mapeado.grasas === null
      ) {
        this.logger.warn(
          `Open Food Facts devolvió macros incompletas para "${termino}": se completaron los faltantes con 0.`,
        );
      }

      return estimadas;
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Error consultando Open Food Facts para macros de "${termino}": ${detalle}.`,
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
