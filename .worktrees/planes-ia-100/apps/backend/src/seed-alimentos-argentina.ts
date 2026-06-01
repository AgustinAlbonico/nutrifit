import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

type UnidadMedida =
  | 'gramo'
  | 'kilogramo'
  | 'mililitro'
  | 'litro'
  | 'miligramo'
  | 'taza'
  | 'cucharada'
  | 'cucharadita';

interface AlimentoSemilla {
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: UnidadMedida;
  fuente: 'ARGENFOODS_BASE' | 'OPENFOODFACTS';
}

interface OpenFoodFactsProducto {
  product_name?: string;
  quantity?: string;
  nutriments?: Record<string, unknown>;
}

interface OpenFoodFactsBusqueda {
  products?: OpenFoodFactsProducto[];
  count?: number;
  page?: number;
  page_count?: number;
}

interface FilaNombre {
  nombre: string;
}

function esFilaNombre(valor: unknown): valor is FilaNombre {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const candidato = valor as Record<string, unknown>;
  return typeof candidato.nombre === 'string';
}

function obtenerTotalDesdeQuery(valor: unknown): number {
  if (!Array.isArray(valor) || valor.length === 0) {
    return 0;
  }

  const filas = valor as unknown[];
  const primeraFila = filas[0];
  if (typeof primeraFila !== 'object' || primeraFila === null) {
    return 0;
  }

  const registro = primeraFila as Record<string, unknown>;
  const total = parsearNumero(registro.total);
  return total !== null ? Math.round(total) : 0;
}

const URL_OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org/api/v2/search';
const MAX_PAGINAS = Number(process.env.SEED_OFF_MAX_PAGINAS ?? '8');
const PAGE_SIZE = Number(process.env.SEED_OFF_PAGE_SIZE ?? '100');
const LIMITE_ALIMENTOS_OFF = Number(process.env.SEED_OFF_LIMITE ?? '500');
const TIMEOUT_MS = 20000;

const ALIMENTOS_BASE_ARGENTINA: AlimentoSemilla[] = [
  {
    nombre: 'Leche entera',
    cantidad: 100,
    calorias: 61,
    proteinas: 3,
    carbohidratos: 5,
    grasas: 3,
    unidadMedida: 'mililitro',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Yogur natural',
    cantidad: 100,
    calorias: 63,
    proteinas: 4,
    carbohidratos: 5,
    grasas: 3,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Queso port salut',
    cantidad: 100,
    calorias: 309,
    proteinas: 22,
    carbohidratos: 2,
    grasas: 24,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Huevo de gallina',
    cantidad: 100,
    calorias: 143,
    proteinas: 13,
    carbohidratos: 1,
    grasas: 10,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Pechuga de pollo',
    cantidad: 100,
    calorias: 165,
    proteinas: 31,
    carbohidratos: 0,
    grasas: 4,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Carne vacuna magra',
    cantidad: 100,
    calorias: 187,
    proteinas: 27,
    carbohidratos: 0,
    grasas: 8,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Merluza',
    cantidad: 100,
    calorias: 90,
    proteinas: 19,
    carbohidratos: 0,
    grasas: 1,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Arroz blanco cocido',
    cantidad: 100,
    calorias: 130,
    proteinas: 3,
    carbohidratos: 28,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Fideos secos',
    cantidad: 100,
    calorias: 353,
    proteinas: 12,
    carbohidratos: 71,
    grasas: 2,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Pan francés',
    cantidad: 100,
    calorias: 272,
    proteinas: 8,
    carbohidratos: 57,
    grasas: 1,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Avena',
    cantidad: 100,
    calorias: 389,
    proteinas: 17,
    carbohidratos: 66,
    grasas: 7,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Lentejas cocidas',
    cantidad: 100,
    calorias: 116,
    proteinas: 9,
    carbohidratos: 20,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Garbanzos cocidos',
    cantidad: 100,
    calorias: 164,
    proteinas: 9,
    carbohidratos: 27,
    grasas: 3,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Papa',
    cantidad: 100,
    calorias: 77,
    proteinas: 2,
    carbohidratos: 17,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Batata',
    cantidad: 100,
    calorias: 86,
    proteinas: 2,
    carbohidratos: 20,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Tomate',
    cantidad: 100,
    calorias: 18,
    proteinas: 1,
    carbohidratos: 4,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Lechuga',
    cantidad: 100,
    calorias: 15,
    proteinas: 1,
    carbohidratos: 3,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Zanahoria',
    cantidad: 100,
    calorias: 41,
    proteinas: 1,
    carbohidratos: 10,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Zapallo',
    cantidad: 100,
    calorias: 26,
    proteinas: 1,
    carbohidratos: 7,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Manzana',
    cantidad: 100,
    calorias: 52,
    proteinas: 0,
    carbohidratos: 14,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Banana',
    cantidad: 100,
    calorias: 89,
    proteinas: 1,
    carbohidratos: 23,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Naranja',
    cantidad: 100,
    calorias: 47,
    proteinas: 1,
    carbohidratos: 12,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Yerba mate',
    cantidad: 100,
    calorias: 45,
    proteinas: 1,
    carbohidratos: 10,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Aceite de oliva',
    cantidad: 100,
    calorias: 884,
    proteinas: 0,
    carbohidratos: 0,
    grasas: 100,
    unidadMedida: 'mililitro',
    fuente: 'ARGENFOODS_BASE',
  },
  {
    nombre: 'Azucar',
    cantidad: 100,
    calorias: 387,
    proteinas: 0,
    carbohidratos: 100,
    grasas: 0,
    unidadMedida: 'gramo',
    fuente: 'ARGENFOODS_BASE',
  },
];

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function limpiarNombre(nombre: string): string {
  return nombre
    .replace(/\s+/g, ' ')
    .replace(/\s+[-_/]\s+$/, '')
    .trim();
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
    return { cantidad: 100, unidadMedida: 'gramo' };
  }

  const match = cantidadCruda
    .toLowerCase()
    .match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramos?|ml|l|lt|litros?)/i);

  if (!match) {
    return { cantidad: 100, unidadMedida: 'gramo' };
  }

  const valorRaw = Number(match[1].replace(',', '.'));
  const unidadRaw = match[2].toLowerCase();

  if (!Number.isFinite(valorRaw) || valorRaw <= 0) {
    return { cantidad: 100, unidadMedida: 'gramo' };
  }

  if (unidadRaw === 'kg') {
    if (valorRaw < 1) {
      return { cantidad: Math.round(valorRaw * 1000), unidadMedida: 'gramo' };
    }
    return { cantidad: Math.round(valorRaw), unidadMedida: 'kilogramo' };
  }

  if (
    unidadRaw === 'l' ||
    unidadRaw === 'lt' ||
    unidadRaw.startsWith('litro')
  ) {
    if (valorRaw < 1) {
      return {
        cantidad: Math.round(valorRaw * 1000),
        unidadMedida: 'mililitro',
      };
    }
    return { cantidad: Math.round(valorRaw), unidadMedida: 'litro' };
  }

  if (unidadRaw === 'ml') {
    return { cantidad: Math.round(valorRaw), unidadMedida: 'mililitro' };
  }

  return { cantidad: Math.round(valorRaw), unidadMedida: 'gramo' };
}

function mapearProductoOpenFoodFacts(
  producto: OpenFoodFactsProducto,
): AlimentoSemilla | null {
  const nombreOriginal = producto.product_name ?? '';
  const nombreLimpio = limpiarNombre(nombreOriginal);

  if (!nombreLimpio) {
    return null;
  }

  const nombre = nombreLimpio.slice(0, 255);

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
    fuente: 'OPENFOODFACTS',
  };
}

async function obtenerAlimentosOpenFoodFacts(): Promise<AlimentoSemilla[]> {
  const alimentosMap = new Map<string, AlimentoSemilla>();

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina += 1) {
    if (alimentosMap.size >= LIMITE_ALIMENTOS_OFF) {
      break;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = `${URL_OPEN_FOOD_FACTS}?countries_tags=argentina&page=${pagina}&page_size=${PAGE_SIZE}&fields=product_name,quantity,nutriments`;

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'NutriFitSupervisor/1.0 (alimentos-argentina-seed)',
        },
      });

      if (!response.ok) {
        console.warn(
          `⚠ Open Food Facts devolvió ${response.status} en página ${pagina}.`,
        );
        continue;
      }

      const body = (await response.json()) as OpenFoodFactsBusqueda;
      const productos = body.products ?? [];

      if (productos.length === 0) {
        break;
      }

      for (const producto of productos) {
        if (alimentosMap.size >= LIMITE_ALIMENTOS_OFF) {
          break;
        }

        const alimento = mapearProductoOpenFoodFacts(producto);
        if (!alimento) {
          continue;
        }

        const clave = normalizarNombre(alimento.nombre);
        if (!clave) {
          continue;
        }

        if (!alimentosMap.has(clave)) {
          alimentosMap.set(clave, alimento);
        }
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      console.warn(`⚠ Error en Open Food Facts (página ${pagina}): ${mensaje}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return Array.from(alimentosMap.values());
}

async function insertarLote(
  dataSource: DataSource,
  lote: AlimentoSemilla[],
): Promise<void> {
  if (lote.length === 0) {
    return;
  }

  const placeholders = lote.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const params: Array<string | number | null> = [];

  for (const alimento of lote) {
    params.push(
      alimento.nombre,
      alimento.cantidad,
      alimento.calorias,
      alimento.proteinas,
      alimento.carbohidratos,
      alimento.grasas,
      alimento.carbohidratos,
      alimento.unidadMedida,
    );
  }

  await dataSource.query(
    `INSERT INTO alimento
      (nombre, cantidad, calorias, proteinas, carbohidratos, grasas, hidratos_de_carbono, unidad_medida)
     VALUES ${placeholders}`,
    params,
  );
}

async function runSeedAlimentosArgentina() {
  const host = process.env.DATABASE_HOST;
  const port = Number(process.env.DATABASE_PORT);
  const username = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  if (!host || !Number.isFinite(port) || !username || !database) {
    throw new Error(
      'Faltan variables de base de datos (DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_NAME).',
    );
  }

  const dataSource = new DataSource({
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    synchronize: false,
    logging: false,
  });

  try {
    console.log('🌱 Iniciando seed de alimentos para Argentina...');
    await dataSource.initialize();

    const alimentosOpenFoodFacts = await obtenerAlimentosOpenFoodFacts();
    console.log(
      `📦 Open Food Facts: ${alimentosOpenFoodFacts.length} alimentos candidatos.`,
    );

    const candidatosMap = new Map<string, AlimentoSemilla>();

    for (const alimento of ALIMENTOS_BASE_ARGENTINA) {
      candidatosMap.set(normalizarNombre(alimento.nombre), alimento);
    }

    for (const alimento of alimentosOpenFoodFacts) {
      const clave = normalizarNombre(alimento.nombre);
      if (!candidatosMap.has(clave)) {
        candidatosMap.set(clave, alimento);
      }
    }

    const candidatos = Array.from(candidatosMap.values());
    console.log(`🧩 Total candidatos combinados: ${candidatos.length}.`);

    const filasExistentesRaw = (await dataSource.query(
      'SELECT nombre FROM alimento',
    )) as unknown;
    const filasExistentes = Array.isArray(filasExistentesRaw)
      ? filasExistentesRaw.filter(esFilaNombre)
      : [];
    const nombresExistentes = new Set(
      filasExistentes
        .map((fila) => normalizarNombre(fila.nombre))
        .filter((nombre) => nombre.length > 0),
    );

    const nuevos = candidatos.filter(
      (alimento) => !nombresExistentes.has(normalizarNombre(alimento.nombre)),
    );

    console.log(`🆕 Alimentos nuevos a insertar: ${nuevos.length}.`);

    const tamLote = 100;
    for (let i = 0; i < nuevos.length; i += tamLote) {
      const lote = nuevos.slice(i, i + tamLote);
      await insertarLote(dataSource, lote);
      console.log(`   - Insertado lote ${Math.floor(i / tamLote) + 1}`);
    }

    const totalRaw = (await dataSource.query(
      'SELECT COUNT(*) AS total FROM alimento',
    )) as unknown;
    const total = obtenerTotalDesdeQuery(totalRaw);

    console.log('✅ Seed de alimentos (Argentina) completado.');
    console.log(`📊 Total actual en tabla alimento: ${total}.`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('❌ Error en seed de alimentos argentinos:', mensaje);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeedAlimentosArgentina();
