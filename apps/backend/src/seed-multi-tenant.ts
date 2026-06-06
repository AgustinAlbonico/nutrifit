// apps/backend/src/seed-multi-tenant.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: '.env' });

// Importar grupos de permisos data

const gruposPermisosData = require('./seed/data/grupos-permisos.data') as {
  GRUPOS_PERMISOS: Record<
    string,
    { clave: string; nombre: string; descripcion: string; acciones: string[] }
  >;
  getGrupoBasePorRol: (
    rol: string,
  ) =>
    | { clave: string; nombre: string; descripcion: string; acciones: string[] }
    | undefined;
};

const shared = require('@nutrifit/shared') as { TODAS_LAS_ACCIONES: string[] };

const GRUPOS_PERMISOS = gruposPermisosData.GRUPOS_PERMISOS;
const getGrupoBasePorRol = gruposPermisosData.getGrupoBasePorRol;
const TODAS_LAS_ACCIONES = shared.TODAS_LAS_ACCIONES;

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
  presentacion: string;
  certificaciones: string;
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
    presentacion:
      'Nutricionista clinica con 10 anos de experiencia en planes personalizados, control de peso y educacion alimentaria.',
    certificaciones:
      'ISAK Nivel 2, Cert. en Nutricion Vegetariana, Posgrado en Obesidad y Trastornos Alimentarios (SAOTA).',
  },
  {
    email: 'nutri-norte@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    matricula: 'MN-2002',
    presentacion:
      'Nutricionista deportivo orientado a rendimiento, recomposicion corporal y atletas de fuerza y resistencia.',
    certificaciones:
      'Maestria en Nutricion Deportiva (Universidad Favaloro), Cert. International Society of Sports Nutrition (CISSN).',
  },
  {
    email: 'nutri-sur@nutrifit.com',
    nombre: 'Nutri',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    matricula: 'MN-2003',
    presentacion:
      'Nutricionista focalizada en alimentacion familiar, patologias cronicas no transmisibles y habitos sostenibles.',
    certificaciones:
      'Diplomatura en Nutricion Clinica (Hospital Italiano), Cert. en Diabetes Education (International Diabetes Federation).',
  },
];

const socios: SocioData[] = [
  {
    email: 'socio1-central@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001001',
  },
  {
    email: 'socio2-central@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001002',
  },
  {
    email: 'socio3-central@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
    dni: '50001003',
  },
  {
    email: 'socio1-norte@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002001',
  },
  {
    email: 'socio2-norte@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002002',
  },
  {
    email: 'socio3-norte@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
    dni: '50002003',
  },
  {
    email: 'socio1-sur@nutrifit.com',
    nombre: 'Socio1',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003001',
  },
  {
    email: 'socio2-sur@nutrifit.com',
    nombre: 'Socio2',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003002',
  },
  {
    email: 'socio3-sur@nutrifit.com',
    nombre: 'Socio3',
    apellido: 'Sur',
    gimnasioNombre: 'Gym Sur',
    dni: '50003003',
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
    console.log('Conexion a base de datos establecida');

    const crearGimnasios = async (): Promise<Map<string, number>> => {
      const gimnasioIds = new Map<string, number>();

      for (const gimnasio of gimnasios) {
        const resultado: unknown = await dataSource.query(
          `INSERT INTO gimnasio (nombre, direccion, telefono, email, activo, fecha_creacion)
           VALUES (?, ?, ?, ?, TRUE, NOW())
           ON DUPLICATE_KEY UPDATE id_gimnasio = LAST_INSERT_ID(id_gimnasio)`,
          [
            gimnasio.nombre,
            gimnasio.direccion,
            gimnasio.telefono,
            gimnasio.email,
          ],
        );

        const fila = resultado as { insertId: number };
        const idGimnasio = fila.insertId;
        gimnasioIds.set(gimnasio.nombre, idGimnasio);
        console.log(`Gimnasio creado: ${gimnasio.nombre} (ID: ${idGimnasio})`);
      }

      return gimnasioIds;
    };

    const gimnasioIds = await crearGimnasios();

    // Insertar acciones desde el enum ACCIONES
    const insertarAcciones = async (): Promise<Map<string, number>> => {
      const accionIds = new Map<string, number>();

      for (const claveAccion of TODAS_LAS_ACCIONES) {
        const nombreAccion =
          claveAccion.split('.')[1]?.replace(/-/g, ' ') || claveAccion;
        const resultado: unknown = await dataSource.query(
          `INSERT INTO accion (clave, nombre, descripcion)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE id_accion = LAST_INSERT_ID(id_accion)`,
          [
            claveAccion,
            nombreAccion.charAt(0).toUpperCase() + nombreAccion.slice(1),
            `Accion ${claveAccion}`,
          ],
        );

        const fila = resultado as { insertId: number };
        accionIds.set(claveAccion, fila.insertId);
      }

      console.log(`Acciones insertadas: ${accionIds.size}`);
      return accionIds;
    };

    const accionIds = await insertarAcciones();

    // Crear grupos de permisos y asignar acciones
    const crearGruposPermisos = async (): Promise<Map<string, number>> => {
      const grupoIds = new Map<string, number>();

      for (const [clave, grupo] of Object.entries(GRUPOS_PERMISOS)) {
        // Crear grupo
        const resultadoGrupo: unknown = await dataSource.query(
          `INSERT INTO grupo_permiso (clave, nombre, descripcion)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE id_grupo_permiso = LAST_INSERT_ID(id_grupo_permiso)`,
          [grupo.clave, grupo.nombre, grupo.descripcion],
        );

        const filaGrupo = resultadoGrupo as { insertId: number };
        const idGrupo = filaGrupo.insertId;
        grupoIds.set(clave, idGrupo);

        // Asignar acciones al grupo
        for (const claveAccion of grupo.acciones) {
          const idAccion = accionIds.get(claveAccion);
          if (idAccion) {
            await dataSource.query(
              `INSERT INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
               VALUES (?, ?)
               ON DUPLICATE KEY UPDATE id_grupo_permiso = id_grupo_permiso`,
              [idGrupo, idAccion],
            );
          }
        }

        console.log(
          `Grupo creado: ${grupo.nombre} (ID: ${idGrupo}) con ${grupo.acciones.length} acciones`,
        );
      }

      return grupoIds;
    };

    const grupoIds = await crearGruposPermisos();

    // Asignar grupo a usuario por rol
    const asignarGruposAUsuario = async (
      email: string,
      rol: string,
    ): Promise<void> => {
      const grupoBase = getGrupoBasePorRol(rol);
      if (!grupoBase) {
        console.log(`No hay grupo base para rol: ${rol}`);
        return;
      }

      const idGrupo = grupoIds.get(grupoBase.clave);
      if (!idGrupo) {
        console.log(`Grupo no encontrado: ${grupoBase.clave}`);
        return;
      }

      // Obtener ID del usuario
      const usuarios: unknown = await dataSource.query(
        'SELECT id_usuario FROM usuario WHERE email = ?',
        [email],
      );

      const filas = usuarios as { id_usuario: number }[];
      if (filas.length === 0) {
        console.log(`Usuario no encontrado: ${email}`);
        return;
      }

      const idUsuario = filas[0].id_usuario;

      // Asignar grupo
      await dataSource.query(
        `INSERT INTO usuario_grupo_permiso (id_usuario, id_grupo_permiso, fecha_asignacion)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE id_usuario = id_usuario`,
        [idUsuario, idGrupo],
      );

      console.log(`Grupo ${grupoBase.clave} asignado a ${email}`);
    };

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

    // Asignar grupo ADMIN al SUPERADMIN
    await asignarGruposAUsuario(superAdmin.email, 'SUPERADMIN');

    const crearAdmins = async (): Promise<void> => {
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
        console.log(
          `ADMIN creado: ${admin.email} (Gimnasio: ${admin.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        // Asignar grupo ADMIN
        await asignarGruposAUsuario(admin.email, 'ADMIN');
      }
    };

    await crearAdmins();

    const crearNutricionistas = async (): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      for (const nutri of nutricionistas) {
        const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${nutri.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, gimnasio_id, matricula, presentacion, certificaciones, tipo_persona)
           VALUES (?, ?, ?, ?, ?, ?, 'NutricionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [
            nutri.nombre,
            nutri.apellido,
            idGimnasio,
            nutri.matricula,
            nutri.presentacion,
            nutri.certificaciones,
          ],
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
        console.log(
          `NUTRICIONISTA creado: ${nutri.email} (Gimnasio: ${nutri.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        // Asignar grupo NUTRICIONISTA
        await asignarGruposAUsuario(nutri.email, 'NUTRICIONISTA');
      }
    };

    await crearNutricionistas();

    const crearSocios = async (): Promise<void> => {
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
        console.log(
          `SOCIO creado: ${socio.email} (Gimnasio: ${socio.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        // Asignar grupo SOCIO
        await asignarGruposAUsuario(socio.email, 'SOCIO');
      }
    };

    await crearSocios();

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
