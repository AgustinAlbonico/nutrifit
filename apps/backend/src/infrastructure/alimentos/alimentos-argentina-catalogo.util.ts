import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export interface AlimentoCatalogoArgentina {
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: UnidadMedida;
}

export interface OpenFoodFactsProducto {
  product_name?: string;
  quantity?: string;
  nutriments?: Record<string, unknown>;
}

export interface OpenFoodFactsBusqueda {
  products?: OpenFoodFactsProducto[];
  count?: number;
  page?: number;
}

export const ALIMENTOS_BASE_ARGENTINA: AlimentoCatalogoArgentina[] = [
  {
    nombre: 'Leche entera',
    cantidad: 100,
    calorias: 61,
    proteinas: 3,
    carbohidratos: 5,
    grasas: 3,
    unidadMedida: UnidadMedida.MILILITRO,
  },
  {
    nombre: 'Yogur natural',
    cantidad: 100,
    calorias: 63,
    proteinas: 4,
    carbohidratos: 5,
    grasas: 3,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Huevo',
    cantidad: 100,
    calorias: 143,
    proteinas: 13,
    carbohidratos: 1,
    grasas: 10,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Pechuga de pollo',
    cantidad: 100,
    calorias: 165,
    proteinas: 31,
    carbohidratos: 0,
    grasas: 4,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Carne vacuna magra',
    cantidad: 100,
    calorias: 187,
    proteinas: 27,
    carbohidratos: 0,
    grasas: 8,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Merluza',
    cantidad: 100,
    calorias: 90,
    proteinas: 19,
    carbohidratos: 0,
    grasas: 1,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Arroz blanco cocido',
    cantidad: 100,
    calorias: 130,
    proteinas: 3,
    carbohidratos: 28,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Pan frances',
    cantidad: 100,
    calorias: 272,
    proteinas: 8,
    carbohidratos: 57,
    grasas: 1,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Avena',
    cantidad: 100,
    calorias: 389,
    proteinas: 17,
    carbohidratos: 66,
    grasas: 7,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Lentejas cocidas',
    cantidad: 100,
    calorias: 116,
    proteinas: 9,
    carbohidratos: 20,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Garbanzos cocidos',
    cantidad: 100,
    calorias: 164,
    proteinas: 9,
    carbohidratos: 27,
    grasas: 3,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Papa',
    cantidad: 100,
    calorias: 77,
    proteinas: 2,
    carbohidratos: 17,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Batata',
    cantidad: 100,
    calorias: 86,
    proteinas: 2,
    carbohidratos: 20,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Tomate',
    cantidad: 100,
    calorias: 18,
    proteinas: 1,
    carbohidratos: 4,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Lechuga',
    cantidad: 100,
    calorias: 15,
    proteinas: 1,
    carbohidratos: 3,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Zanahoria',
    cantidad: 100,
    calorias: 41,
    proteinas: 1,
    carbohidratos: 10,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Manzana',
    cantidad: 100,
    calorias: 52,
    proteinas: 0,
    carbohidratos: 14,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Banana',
    cantidad: 100,
    calorias: 89,
    proteinas: 1,
    carbohidratos: 23,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Naranja',
    cantidad: 100,
    calorias: 47,
    proteinas: 1,
    carbohidratos: 12,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Yerba mate',
    cantidad: 100,
    calorias: 45,
    proteinas: 1,
    carbohidratos: 10,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
  {
    nombre: 'Aceite de oliva',
    cantidad: 100,
    calorias: 884,
    proteinas: 0,
    carbohidratos: 0,
    grasas: 100,
    unidadMedida: UnidadMedida.MILILITRO,
  },
  {
    nombre: 'Azucar',
    cantidad: 100,
    calorias: 387,
    proteinas: 0,
    carbohidratos: 100,
    grasas: 0,
    unidadMedida: UnidadMedida.GRAMO,
  },
];

export function normalizarNombreAlimento(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function limpiarNombreAlimento(nombre: string): string {
  const sinCantidad = nombre
    .replace(/\b\d+(?:[.,]\d+)?\s?(kg|g|gr|ml|l|lt)\b/gi, ' ')
    .replace(/\bpack\b/gi, ' ')
    .replace(/\bunidad(?:es)?\b/gi, ' ')
    .replace(/\bbolsa\b/gi, ' ')
    .replace(/\bfrasco\b/gi, ' ')
    .replace(/\bcorregido\b/gi, ' ')
    .replace(/[()[\]{}]/g, ' ');

  return sinCantidad
    .replace(/\s+/g, ' ')
    .replace(/^[-\s]+|[-\s]+$/g, '')
    .trim()
    .slice(0, 255);
}

export function esNombreRuidoso(nombre: string): boolean {
  const nombreNormalizado = normalizarNombreAlimento(nombre);

  if (nombreNormalizado.length < 3) {
    return true;
  }

  if (/^(\d+|n a|null|undefined)$/i.test(nombreNormalizado)) {
    return true;
  }

  const patronesRuido = [
    /http/i,
    /www\./i,
    /codigo de barras/i,
    /barcode/i,
    /ean/i,
    /gtin/i,
    /sin nombre/i,
  ];

  return patronesRuido.some((patron) => patron.test(nombreNormalizado));
}

function parsearNumero(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor === 'string' && valor.trim() !== '') {
    const normalizado = Number(valor.replace(',', '.'));
    if (Number.isFinite(normalizado)) {
      return normalizado;
    }
  }

  return null;
}

function obtenerNutriente(
  nutriments: Record<string, unknown> | undefined,
  claves: string[],
): number | null {
  if (!nutriments) {
    return null;
  }

  for (const clave of claves) {
    const valor = parsearNumero(nutriments[clave]);
    if (valor !== null) {
      return valor;
    }
  }

  return null;
}

function resolverCantidadYUnidad(cantidadCruda: string | undefined): {
  cantidad: number;
  unidadMedida: UnidadMedida;
} {
  if (!cantidadCruda) {
    return { cantidad: 100, unidadMedida: UnidadMedida.GRAMO };
  }

  const match = cantidadCruda
    .toLowerCase()
    .match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|ml|l|lt|litros?)/i);

  if (!match) {
    return { cantidad: 100, unidadMedida: UnidadMedida.GRAMO };
  }

  const valorRaw = Number(match[1].replace(',', '.'));
  const unidadRaw = match[2].toLowerCase();

  if (!Number.isFinite(valorRaw) || valorRaw <= 0) {
    return { cantidad: 100, unidadMedida: UnidadMedida.GRAMO };
  }

  if (unidadRaw === 'kg') {
    if (valorRaw < 1) {
      return {
        cantidad: Math.round(valorRaw * 1000),
        unidadMedida: UnidadMedida.GRAMO,
      };
    }
    return {
      cantidad: Math.round(valorRaw),
      unidadMedida: UnidadMedida.KILOGRAMO,
    };
  }

  if (
    unidadRaw === 'l' ||
    unidadRaw === 'lt' ||
    unidadRaw.startsWith('litro')
  ) {
    if (valorRaw < 1) {
      return {
        cantidad: Math.round(valorRaw * 1000),
        unidadMedida: UnidadMedida.MILILITRO,
      };
    }
    return { cantidad: Math.round(valorRaw), unidadMedida: UnidadMedida.LITRO };
  }

  if (unidadRaw === 'ml') {
    return {
      cantidad: Math.round(valorRaw),
      unidadMedida: UnidadMedida.MILILITRO,
    };
  }

  return { cantidad: Math.round(valorRaw), unidadMedida: UnidadMedida.GRAMO };
}

export function mapearProductoOpenFoodFacts(
  producto: OpenFoodFactsProducto,
): AlimentoCatalogoArgentina | null {
  const nombreOriginal = producto.product_name ?? '';
  const nombre = limpiarNombreAlimento(nombreOriginal);

  if (!nombre || esNombreRuidoso(nombre)) {
    return null;
  }

  const caloriasDirectas = obtenerNutriente(producto.nutriments, [
    'energy-kcal_100g',
    'energy-kcal',
  ]);
  const energiaKj = obtenerNutriente(producto.nutriments, [
    'energy-kj_100g',
    'energy-kj',
  ]);
  const calorias =
    caloriasDirectas !== null
      ? Math.round(caloriasDirectas)
      : energiaKj !== null
        ? Math.round(energiaKj * 0.239006)
        : null;

  const proteinasRaw = obtenerNutriente(producto.nutriments, [
    'proteins_100g',
    'proteins',
  ]);
  const carbohidratosRaw = obtenerNutriente(producto.nutriments, [
    'carbohydrates_100g',
    'carbohydrates',
  ]);
  const grasasRaw = obtenerNutriente(producto.nutriments, ['fat_100g', 'fat']);

  if (
    calorias === null &&
    proteinasRaw === null &&
    carbohidratosRaw === null &&
    grasasRaw === null
  ) {
    return null;
  }

  const { cantidad, unidadMedida } = resolverCantidadYUnidad(producto.quantity);

  return {
    nombre,
    cantidad,
    calorias,
    proteinas: proteinasRaw !== null ? Math.round(proteinasRaw) : null,
    carbohidratos:
      carbohidratosRaw !== null ? Math.round(carbohidratosRaw) : null,
    grasas: grasasRaw !== null ? Math.round(grasasRaw) : null,
    unidadMedida,
  };
}
