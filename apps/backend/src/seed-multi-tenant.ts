// apps/backend/src/seed-multi-tenant.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: '.env' });

interface GimnasioData {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface SuperAdminData {
  email: string;
  nombre: string;
  apellido: string;
}

interface AdminData {
  email: string;
  nombre: string;
  apellido: string;
  gimnasioNombre: string;
}

interface NutricionistaData extends AdminData {
  matricula: string;
}

interface SocioData extends AdminData {
  dni: string;
}

const gimnasios: GimnasioData[] = [
  {
    nombre: 'Gym Central',
    direccion: 'Av. Central 1234',
    telefono: '341-555-0001',
    email: 'central@gym.com',
  },
  {
    nombre: 'Gym Norte',
    direccion: 'Av. Norte 5678',
    telefono: '341-555-0002',
    email: 'norte@gym.com',
  },
  {
    nombre: 'Gym Sur',
    direccion: 'Av. Sur 9012',
    telefono: '341-555-0003',
    email: 'sur@gym.com',
  },
];

async function runSeedMultiTenant() {
  console.log('Iniciando seed multi-tenant...');

  const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: false,
    logging: false,
  };

  const dataSource = new DataSource(options);

  try {
    await dataSource.initialize();
    console.log('Conexión a base de datos establecida');

    const crearGimnasios = async (): Promise<Map<string, number>> => {
      const gimnasioIds = new Map<string, number>();

      for (const gimnasio of gimnasios) {
        const resultado: unknown = await dataSource.query(
          `INSERT INTO gimnasio (nombre, direccion, telefono, email, activo, fecha_creacion)
           VALUES (?, ?, ?, ?, TRUE, NOW())
           ON DUPLICATE KEY UPDATE id_gimnasio = LAST_INSERT_ID(id_gimnasio)`,
          [gimnasio.nombre, gimnasio.direccion, gimnasio.telefono, gimnasio.email],
        );

        const fila = resultado as { insertId: number };
        const idGimnasio = fila.insertId;
        gimnasioIds.set(gimnasio.nombre, idGimnasio);
        console.log(`Gimnasio creado: ${gimnasio.nombre} (ID: ${idGimnasio})`);
      }

      return gimnasioIds;
    };

    const gimnasioIds = await crearGimnasios();

    // TODO: Implementar creación de SUPERADMIN
    // TODO: Implementar creación de ADMIN por gimnasio
    // TODO: Implementar creación de NUTRICIONISTA por gimnasio
    // TODO: Implementar creación de SOCIO por gimnasio

    console.log('Seed multi-tenant completado');
  } catch (error) {
    console.error('Error al ejecutar seed multi-tenant:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeedMultiTenant();
