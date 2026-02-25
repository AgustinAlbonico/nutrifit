import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Mapeo de keywords a nombres de grupo
const MAPEO_KEYWORDS_GRUPO: Record<string, string[]> = {
  Lácteos: [
    'leche',
    'yogur',
    'yogurt',
    'queso',
    'crema',
    'lácteo',
    'dulce de leche',
    'manteca',
  ],
  Carnes: [
    'carne',
    'pollo',
    'res',
    'cerdo',
    'vaca',
    'ternera',
    'vacuna',
    'pechuga',
    'milanesa',
    'asado',
    'bife',
    'chorizo',
    'salchicha',
    'jamón',
    'panceta',
    'pescado',
    'merluza',
    'salmón',
    'atún',
    'bacalao',
  ],
  Vegetales: [
    'tomate',
    'lechuga',
    'zanahoria',
    'cebolla',
    'pimiento',
    'zapallo',
    'calabaza',
    'berenjena',
    'acelga',
    'espinaca',
    'brócoli',
    'coliflor',
    'repollo',
    'zapallito',
    'chaucha',
    'apio',
    'pepino',
  ],
  Frutas: [
    'manzana',
    'banana',
    'naranja',
    'mandarina',
    'pera',
    'durazno',
    'pelón',
    'uva',
    'frutilla',
    'sandía',
    'melón',
    'limón',
    'pomelo',
    'kiwi',
    'mango',
    'anana',
    'piña',
    'ciruela',
    'cereza',
    'frambuesa',
    'arandano',
  ],
  'Cereales y derivados': [
    'arroz',
    'fideo',
    'pan',
    'harina',
    'avena',
    'cereal',
    'trigo',
    'maíz',
    'maiz',
    'galletita',
    'tostada',
    'cereal',
    'muesli',
    'granola',
    'cebada',
    'centeno',
  ],
  Legumbres: ['lenteja', 'garbanzo', 'poroto', 'arveja', 'haba', 'soja', 'soy'],
  'Aceites y grasas': [
    'aceite',
    'oliva',
    'girasol',
    'maíz',
    'mantequilla',
    'margarina',
    'grasa',
  ],
  'Azúcares y dulces': [
    'azúcar',
    'azucar',
    'miel',
    'dulce',
    'chocolate',
    'caramelo',
    'golosina',
    'alfajor',
    'postre',
    'helado',
    'torta',
    'pastel',
    'budín',
    'mermelada',
  ],
  Bebidas: [
    'agua',
    'jugo',
    'gaseosa',
    'refresco',
    'café',
    'cafe',
    'té',
    'mate',
    'cerveza',
    'vino',
    'alcohol',
  ],
};

async function runSeedAsignarGrupos() {
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
    console.log('🔗 Asignando alimentos a grupos alimenticios...');
    await dataSource.initialize();

    // Obtener grupos
    const grupos = await dataSource.query(
      'SELECT id_grupo_alimenticio, descripcion FROM grupo_alimenticio',
    );

    const gruposMap = new Map<string, number>();
    for (const g of grupos) {
      gruposMap.set(g.descripcion.toLowerCase(), g.id_grupo_alimenticio);
    }
    console.log(`📋 Encontrados ${grupos.length} grupos alimenticios.`);

    // Obtener alimentos sin grupo asignado
    const alimentos = await dataSource.query(
      `SELECT a.id_alimento, a.nombre 
       FROM alimento a 
       LEFT JOIN alimento_grupo_alimenticio aga ON a.id_alimento = aga.id_alimento 
       WHERE aga.id_alimento IS NULL`,
    );

    console.log(
      `🍽️ Encontrados ${alimentos.length} alimentos sin grupo asignado.`,
    );

    let asignados = 0;

    for (const alimento of alimentos) {
      const nombreLower = alimento.nombre.toLowerCase();
      let grupoAsignado: string | null = null;

      // Buscar grupo por keywords
      for (const [grupo, keywords] of Object.entries(MAPEO_KEYWORDS_GRUPO)) {
        if (keywords.some((kw) => nombreLower.includes(kw))) {
          grupoAsignado = grupo;
          break;
        }
      }

      if (grupoAsignado) {
        const grupoId = gruposMap.get(grupoAsignado.toLowerCase());
        if (grupoId) {
          await dataSource.query(
            'INSERT IGNORE INTO alimento_grupo_alimenticio (id_alimento, id_grupo_alimenticio) VALUES (?, ?)',
            [alimento.id_alimento, grupoId],
          );
          asignados++;
        }
      }
    }

    console.log(
      `✅ Se asignaron ${asignados} alimentos a sus grupos correspondientes.`,
    );

    // Verificar resultado
    const conGrupo = await dataSource.query(
      'SELECT COUNT(DISTINCT id_alimento) as total FROM alimento_grupo_alimenticio',
    );

    console.log(
      `📊 Total de alimentos con grupo asignado: ${conGrupo[0]?.total || 0}.`,
    );
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('❌ Error en seed de asignación de grupos:', mensaje);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeedAsignarGrupos();
