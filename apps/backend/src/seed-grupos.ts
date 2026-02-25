import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const GRUPOS_ALIMENTICIOS = [
  'Lácteos',
  'Carnes',
  'Vegetales',
  'Frutas',
  'Cereales y derivados',
  'Legumbres',
  'Aceites y grasas',
  'Azúcares y dulces',
  'Bebidas',
  'Otros',
];

async function main() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'nutrifit_supervisor',
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Conexión a la base de datos establecida');

  for (const descripcion of GRUPOS_ALIMENTICIOS) {
    await dataSource.query(
      `INSERT IGNORE INTO grupo_alimenticio (descripcion) VALUES (?)`,
      [descripcion],
    );
    console.log(`Grupo insertado: ${descripcion}`);
  }

  const grupos = await dataSource.query(
    'SELECT * FROM grupo_alimenticio ORDER BY descripcion',
  );
  console.log(`\nTotal grupos en la base de datos: ${grupos.length}`);
  console.log(grupos);

  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
