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

const superAdmin: SuperAdminData = {
  email: 'superadmin@nutrifit.com',
  nombre: 'Super',
  apellido: 'Admin',
};

const admins: AdminData[] = [
  {
    email: 'admin-central@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
  },
  {
    email: 'admin-norte@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
  },
  {
    email: 'admin-sur@nutrifit.com',
    nombre: 'Admin',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
  },
];

const nutricionistas: NutricionistaData[] = [
  {
    email: 'nutri-central@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    matricula: 'MN-2001',
  },
  {
    email: 'nutri-norte@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    matricula: 'MN-2002',
  },
  {
    email: 'nutri-sur@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    matricula: 'MN-2003',
  },
];

const socios: SocioData[] = [
  { email: 'socio1-central@nutrifit.com', nombre: 'Socio1', apellido: 'Central', gimnasioNombre: 'Gym Central', dni: '50001001' },
  { email: 'socio2-central@nutrifit.com', nombre: 'Socio2', apellido: 'Central', gimnasioNombre: 'Gym Central', dni: '50001002' },
  { email: 'socio3-central@nutrifit.com', nombre: 'Socio3', apellido: 'Central', gimnasioNombre: 'Gym Central', dni: '50001003' },
  { email: 'socio1-norte@nutrifit.com', nombre: 'Socio1', apellido: 'Norte', gimnasioNombre: 'Gym Norte', dni: '50002001' },
  { email: 'socio2-norte@nutrifit.com', nombre: 'Socio2', apellido: 'Norte', gimnasioNombre: 'Gym Norte', dni: '50002002' },
  { email: 'socio3-norte@nutrifit.com', nombre: 'Socio3', apellido: 'Norte', gimnasioNombre: 'Gym Norte', dni: '50002003' },
  { email: 'socio1-sur@nutrifit.com', nombre: 'Socio1', apellido: 'Sur', gimnasioNombre: 'Gym Sur', dni: '50003001' },
  { email: 'socio2-sur@nutrifit.com', nombre: 'Socio2', apellido: 'Sur', gimnasioNombre: 'Gym Sur', dni: '50003002' },
  { email: 'socio3-sur@nutrifit.com', nombre: 'Socio3', apellido: 'Sur', gimnasioNombre: 'Gym Sur', dni: '50003003' },
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

    const crearSuperAdmin = async (): Promise<number> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      const resultadoPersona: unknown = await dataSource.query(
        `INSERT INTO persona (nombre, apellido, tipo_persona)
         VALUES (?, ?, 'AsistenteOrmEntity')
         ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
        [superAdmin.nombre, superAdmin.apellido],
      );

      const filaPersona = resultadoPersona as { insertId: number };
      const idPersona = filaPersona.insertId;

      const resultadoUsuario: unknown = await dataSource.query(
        `INSERT INTO usuario (email, contrasenia, rol, id_persona)
         VALUES (?, ?, 'SUPERADMIN', ?)
         ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
        [superAdmin.email, contraseniaHash, idPersona],
      );

      const filaUsuario = resultadoUsuario as { insertId: number };
      const idUsuario = filaUsuario.insertId;

      console.log(`SUPERADMIN creado: ${superAdmin.email} (ID: ${idUsuario})`);
      return idUsuario;
    };

    const idSuperAdmin = await crearSuperAdmin();

    const crearAdmins = async (gimnasioIds: Map<string, number>): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      for (const admin of admins) {
        const idGimnasio = gimnasioIds.get(admin.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${admin.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, gimnasio_id, tipo_persona)
           VALUES (?, ?, ?, 'AsistenteOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [admin.nombre, admin.apellido, idGimnasio],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'ADMIN', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [admin.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(`ADMIN creado: ${admin.email} (Gimnasio: ${admin.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
      }
    };

    await crearAdmins(gimnasioIds);

    const crearNutricionistas = async (gimnasioIds: Map<string, number>): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      for (const nutri of nutricionistas) {
        const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${nutri.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, gimnasio_id, matricula, tipo_persona)
           VALUES (?, ?, ?, ?, 'NutricionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [nutri.nombre, nutri.apellido, idGimnasio, nutri.matricula],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'NUTRICIONISTA', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [nutri.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(`NUTRICIONISTA creado: ${nutri.email} (Gimnasio: ${nutri.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
      }
    };

    await crearNutricionistas(gimnasioIds);

    const crearSocios = async (gimnasioIds: Map<string, number>): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      for (const socio of socios) {
        const idGimnasio = gimnasioIds.get(socio.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${socio.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, gimnasio_id, dni, fecha_alta, tipo_persona)
           VALUES (?, ?, ?, ?, NOW(), 'SocioOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [socio.nombre, socio.apellido, idGimnasio, socio.dni],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'SOCIO', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [socio.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(`SOCIO creado: ${socio.email} (Gimnasio: ${socio.gimnasioNombre}, ID: ${filaUsuario.insertId})`);
      }
    };

    await crearSocios(gimnasioIds);

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
