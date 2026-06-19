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
const {
  generarNutricionistasSemilla,
  generarSociosSemilla,
  generarTurnosSemilla,
  generarPlanesSemilla,
} = require('./seed/data/generadores-semilla') as {
  generarNutricionistasSemilla: (cantidad: number) => any[];
  generarSociosSemilla: (cantidad: number) => any[];
  generarTurnosSemilla: (
    sociosIds: number[],
    nutriIds: number[],
    gymIds: number[],
    agendas: Map<number, any[]>,
  ) => any[];
  generarPlanesSemilla: (nutriIds: number[], socioIds: number[]) => any[];
};

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

interface RecepcionistaData {
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

interface FormacionSemilla {
  titulo: string;
  institucion: string;
  anioInicio: number;
  anioFin: number | null;
  nivel:
    | 'GRADO'
    | 'POSGRADO'
    | 'MAESTRIA'
    | 'DOCTORADO'
    | 'ESPECIALIZACION'
    | 'DIPLOMATURA'
    | 'CURSO';
}

const FORMACIONES_BASE: FormacionSemilla[] = [
  {
    titulo: 'Licenciatura en Nutrición',
    institucion: 'UBA',
    anioInicio: 2006,
    anioFin: 2011,
    nivel: 'GRADO',
  },
  {
    titulo: 'Licenciatura en Nutrición',
    institucion: 'UNLP',
    anioInicio: 2008,
    anioFin: 2013,
    nivel: 'GRADO',
  },
  {
    titulo: 'Licenciatura en Nutrición',
    institucion: 'UNC',
    anioInicio: 2010,
    anioFin: 2015,
    nivel: 'GRADO',
  },
];

const FORMACIONES_COMPLEMENTARIAS: FormacionSemilla[] = [
  {
    titulo: 'Diplomatura en Nutrición Clínica',
    institucion: 'Hospital Italiano',
    anioInicio: 2018,
    anioFin: 2019,
    nivel: 'DIPLOMATURA',
  },
  {
    titulo: 'Maestría en Nutrición Deportiva',
    institucion: 'Universidad Favaloro',
    anioInicio: 2019,
    anioFin: 2021,
    nivel: 'MAESTRIA',
  },
  {
    titulo: 'Posgrado en Obesidad y Trastornos Alimentarios',
    institucion: 'SAOTA',
    anioInicio: 2024,
    anioFin: null,
    nivel: 'POSGRADO',
  },
];

function inferirNivelFormacion(
  texto: string,
): FormacionSemilla['nivel'] | null {
  const normalizado = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (normalizado.includes('DOCTORADO')) return 'DOCTORADO';
  if (normalizado.includes('MAESTRIA')) return 'MAESTRIA';
  if (normalizado.includes('POSGRADO')) return 'POSGRADO';
  if (normalizado.includes('DIPLOMATURA')) return 'DIPLOMATURA';
  if (normalizado.includes('ESPECIALIZACION')) return 'ESPECIALIZACION';
  if (normalizado.includes('CURSO')) return 'CURSO';
  if (normalizado.includes('LICENCIATURA') || normalizado.includes('GRADO')) {
    return 'GRADO';
  }

  return null;
}

function parsearCertificacionesLegacy(texto: string): Array<{
  nombre: string;
  entidad: string;
  anio: number | null;
  cargaHoraria: number | null;
  nivel: FormacionSemilla['nivel'] | null;
}> {
  return texto
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const matchEntidad = parte.match(/\(([^)]+)\)/);
      const entidad = matchEntidad?.[1]?.trim() || 'No especificada';
      const nombre = parte
        .replace(/\(([^)]+)\)/g, '')
        .replace(/\.$/, '')
        .trim();

      return {
        nombre,
        entidad,
        anio: null,
        cargaHoraria: null,
        nivel: inferirNivelFormacion(nombre),
      };
    });
}

async function recrearCertificacionesNutricionista(
  dataSource: DataSource,
  idPersona: number,
  certificacionesLegacy: string,
): Promise<void> {
  await dataSource.query(
    'DELETE FROM certificacion WHERE id_nutricionista = ?',
    [idPersona],
  );

  const certificaciones = parsearCertificacionesLegacy(certificacionesLegacy);
  for (const certificacion of certificaciones) {
    await dataSource.query(
      `INSERT INTO certificacion (id_nutricionista, nombre, entidad, anio, carga_horaria, nivel)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idPersona,
        certificacion.nombre,
        certificacion.entidad,
        certificacion.anio,
        certificacion.cargaHoraria,
        certificacion.nivel,
      ],
    );
  }
}

async function recrearFormacionNutricionista(
  dataSource: DataSource,
  idPersona: number,
  indice: number,
): Promise<void> {
  await dataSource.query(
    'DELETE FROM formacion_academica WHERE id_nutricionista = ?',
    [idPersona],
  );

  const formaciones = [
    FORMACIONES_BASE[indice % FORMACIONES_BASE.length],
    FORMACIONES_COMPLEMENTARIAS[indice % FORMACIONES_COMPLEMENTARIAS.length],
  ];

  for (const formacion of formaciones) {
    await dataSource.query(
      `INSERT INTO formacion_academica (titulo, institucion, anio_inicio, anio_fin, nivel, id_nutricionista)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        formacion.titulo,
        formacion.institucion,
        formacion.anioInicio,
        formacion.anioFin,
        formacion.nivel,
        idPersona,
      ],
    );
  }
}

function generarDniSemilla(index: number): string {
  return String(51001000 + index);
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

const recepcionistas: RecepcionistaData[] = [
  {
    email: 'recepcion-central@nutrifit.com',
    nombre: 'Recepcion',
    apellido: 'Central',
    gimnasioNombre: 'Gym Central',
  },
  {
    email: 'recepcion-norte@nutrifit.com',
    nombre: 'Recepcion',
    apellido: 'Norte',
    gimnasioNombre: 'Gym Norte',
  },
  {
    email: 'recepcion-sur@nutrifit.com',
    nombre: 'Recepcion',
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
        const existentes = await dataSource.query(
          `SELECT id_gimnasio FROM gimnasio WHERE nombre = ? LIMIT 1`,
          [gimnasio.nombre],
        );

        let idGimnasio = existentes[0]?.id_gimnasio;

        if (idGimnasio) {
          await dataSource.query(
            `UPDATE gimnasio
             SET direccion = ?, telefono = ?, ciudad = ?, email_notificaciones = ?, email_habilitado = TRUE
             WHERE id_gimnasio = ?`,
            [
              gimnasio.direccion,
              gimnasio.telefono,
              'Rosario',
              gimnasio.email,
              idGimnasio,
            ],
          );
        } else {
          const resultado: unknown = await dataSource.query(
            `INSERT INTO gimnasio (nombre, direccion, telefono, ciudad, email_notificaciones, email_habilitado)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [
              gimnasio.nombre,
              gimnasio.direccion,
              gimnasio.telefono,
              'Rosario',
              gimnasio.email,
            ],
          );

          const fila = resultado as { insertId: number };
          idGimnasio = fila.insertId;
        }

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
        `INSERT INTO usuario_grupo_permiso (usuarioIdUsuario, grupoPermisoId, id_gimnasio, fecha_asignacion)
         VALUES (?, ?, NULL, NOW())
         ON DUPLICATE KEY UPDATE usuarioIdUsuario = usuarioIdUsuario`,
        [idUsuario, idGrupo],
      );

      console.log(`Grupo ${grupoBase.clave} asignado a ${email}`);
    };

    const crearSuperAdmin = async (): Promise<number> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      const resultadoPersona: unknown = await dataSource.query(
        `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, tipo_persona)
         VALUES (?, ?, '1990-01-01', 'OTRO', '341-000-0000', 'Sin direccion', 'Rosario', 'Santa Fe', NULL, 'RecepcionistaOrmEntity')
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
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, tipo_persona)
           VALUES (?, ?, '1990-01-01', 'OTRO', '341-000-0000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, 'RecepcionistaOrmEntity')
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

    const crearRecepcionistas = async (): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);

      for (const recepcionista of recepcionistas) {
        const idGimnasio = gimnasioIds.get(recepcionista.gimnasioNombre);
        if (!idGimnasio) {
          console.error(
            `Gimnasio no encontrado: ${recepcionista.gimnasioNombre}`,
          );
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, tipo_persona)
           VALUES (?, ?, '1990-01-01', 'OTRO', '341-000-0000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, 'RecepcionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [recepcionista.nombre, recepcionista.apellido, idGimnasio],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'RECEPCIONISTA', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [recepcionista.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(
          `RECEPCIONISTA creado: ${recepcionista.email} (Gimnasio: ${recepcionista.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        await asignarGruposAUsuario(recepcionista.email, 'RECEPCIONISTA');
      }
    };

    await crearRecepcionistas();

    const crearNutricionistas = async (): Promise<{
      ids: number[];
      agendas: Map<number, any[]>;
    }> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);
      const ids: number[] = [];
      const agendas = new Map<number, any[]>();

      for (const [indice, nutri] of nutricionistas.entries()) {
        const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${nutri.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, matricula, anios_experiencia, tarifa_sesion, presentacion, certificaciones, tipo_persona)
           VALUES (?, ?, '1990-01-01', 'OTRO', '341-000-0000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, ?, 5, 0, ?, ?, 'NutricionistaOrmEntity')
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
        ids.push(idPersona);

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

        await asignarGruposAUsuario(nutri.email, 'NUTRICIONISTA');
        await recrearCertificacionesNutricionista(
          dataSource,
          idPersona,
          nutri.certificaciones,
        );
        await recrearFormacionNutricionista(dataSource, idPersona, indice);

        // Crear agenda básica para el nutricionista fijo
        const diasSemana = [
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
        ];
        for (const dia of diasSemana) {
          await dataSource.query(
            `INSERT IGNORE INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
             VALUES (?, '09:00:00', '13:00:00', 60, ?)`,
            [dia, idPersona],
          );
        }
        console.log(
          `Agenda creada para nutricionista fijo ID ${idPersona}: 5 bloques`,
        );
      }

      // Crear nutricionistas demo (10 por gimnasio)
      const nutriDemo = generarNutricionistasSemilla(10);
      for (const [indice, nutri] of nutriDemo.entries()) {
        const idGimnasio = gimnasioIds.get(nutri.gimnasioNombre);
        if (!idGimnasio) continue;

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, matricula, anios_experiencia, tarifa_sesion, presentacion, certificaciones, tipo_persona)
           VALUES (?, ?, '1990-06-15', ?, '341-555-5000', 'Av. Demo 1000', 'Rosario', 'Santa Fe', ?, ?, ?, ?, ?, ?, ?, 'NutricionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [
            nutri.nombre,
            nutri.apellido,
            nutri.genero,
            idGimnasio,
            generarDniSemilla(5000 + ids.length),
            nutri.matricula,
            nutri.aniosExperiencia,
            nutri.tarifaSesion,
            nutri.presentacion,
            nutri.certificaciones,
          ],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;
        ids.push(idPersona);
        agendas.set(idPersona, nutri.agenda);

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'NUTRICIONISTA', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [nutri.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(
          `NUTRICIONISTA demo: ${nutri.email} (Gym: ${nutri.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        await asignarGruposAUsuario(nutri.email, 'NUTRICIONISTA');
        await recrearCertificacionesNutricionista(
          dataSource,
          idPersona,
          nutri.certificaciones,
        );
        await recrearFormacionNutricionista(dataSource, idPersona, indice + 10);
      }

      // Crear agendas para todos los nutricionistas demo
      const entradasAgenda = Array.from(agendas.entries());
      for (const [idNutri, bloques] of entradasAgenda) {
        for (const bloque of bloques) {
          await dataSource.query(
            `INSERT IGNORE INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
             VALUES (?, ?, ?, ?, ?)`,
            [
              bloque.dia,
              bloque.horaInicio,
              bloque.horaFin,
              bloque.duracionTurno,
              idNutri,
            ],
          );
        }
        console.log(
          `Agenda creada para nutricionista ID ${idNutri}: ${bloques.length} bloques`,
        );
      }

      console.log(`Total nutricionistas: ${ids.length}`);
      return { ids, agendas };
    };

    const { ids: idsNutricionistas, agendas: agendasNutris } =
      await crearNutricionistas();

    const crearSocios = async (): Promise<{
      ids: number[];
      gymIds: number[];
    }> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);
      const ids: number[] = [];
      const gymIds: number[] = [];

      for (const socio of socios) {
        const idGimnasio = gimnasioIds.get(socio.gimnasioNombre);
        if (!idGimnasio) {
          console.error(`Gimnasio no encontrado: ${socio.gimnasioNombre}`);
          continue;
        }

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, fecha_alta, tipo_persona)
           VALUES (?, ?, '1990-01-01', 'OTRO', '341-000-0000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, ?, NOW(), 'SocioOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [socio.nombre, socio.apellido, idGimnasio, socio.dni],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;
        ids.push(idPersona);
        gymIds.push(idGimnasio);

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

        await asignarGruposAUsuario(socio.email, 'SOCIO');
      }

      // Crear socios demo (10 por gimnasio)
      const sociosDemoData = generarSociosSemilla(10);
      for (const socio of sociosDemoData) {
        const idGimnasio = gimnasioIds.get(socio.gimnasioNombre);
        if (!idGimnasio) continue;

        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, fecha_alta, tipo_persona)
           VALUES (?, ?, '1995-03-10', ?, ?, ?, ?, 'Santa Fe', ?, ?, NOW(), 'SocioOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [
            socio.nombre,
            socio.apellido,
            socio.genero,
            socio.telefono,
            socio.direccion,
            socio.ciudad,
            idGimnasio,
            socio.dni,
          ],
        );

        const filaPersona = resultadoPersona as { insertId: number };
        const idPersona = filaPersona.insertId;
        ids.push(idPersona);
        gymIds.push(idGimnasio);

        const resultadoUsuario: unknown = await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'SOCIO', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [socio.email, contraseniaHash, idPersona],
        );

        const filaUsuario = resultadoUsuario as { insertId: number };
        console.log(
          `SOCIO demo: ${socio.email} (Gym: ${socio.gimnasioNombre}, ID: ${filaUsuario.insertId})`,
        );

        await asignarGruposAUsuario(socio.email, 'SOCIO');
      }

      console.log(`Total socios: ${ids.length}`);
      return { ids, gymIds };
    };

    const { ids: idsSocios, gymIds: gymIdsSocios } = await crearSocios();

    // Crear turnos demo
    const crearTurnosDemo = async (): Promise<void> => {
      const turnosData = generarTurnosSemilla(
        idsSocios,
        idsNutricionistas,
        gymIdsSocios,
        agendasNutris,
      );

      for (const turno of turnosData) {
        await dataSource.query(
          `INSERT INTO turno (fecha, hora_turno, estado, id_socio, id_nutricionista, id_gimnasio)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            turno.fecha,
            turno.hora,
            turno.estado,
            turno.idSocio,
            turno.idNutricionista,
            turno.idGimnasio,
          ],
        );
      }
      console.log(`Turnos creados: ${turnosData.length}`);
    };

    await crearTurnosDemo();

    // Crear socio + nutricionista con historial evolutivo (turnos + observaciones + mediciones)
    const crearSocioConHistorialEvolutivo = async (): Promise<void> => {
      const contraseniaHash = await bcrypt.hash('123456', 10);
      const idGymCentral = gimnasioIds.get('Gym Central')!;
      const alturaCm = 175;

      const addMinutes = (hora: string, mins: number): string => {
        const [h, m] = hora.split(':').map(Number);
        const total = h * 60 + m + mins;
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      };

      // --- CREAR NUTRICIONISTA DE EVOLUCIÓN ---
      const emailNutri = 'nutri-evolucion@nutrifit.com';

      const resultNutriPersona: unknown = await dataSource.query(
        `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, matricula, anios_experiencia, tarifa_sesion, presentacion, tipo_persona)
         VALUES (?, ?, '1985-03-15', 'FEMENINO', '341-555-8000', 'Av. Salud 456', 'Rosario', 'Santa Fe', ?, 'MN-3001', 12, 8000, 'Nutricionista clinica con amplia experiencia en perdida de peso, reeducacion alimentaria y mantenimiento de resultados a largo plazo.', 'NutricionistaOrmEntity')
         ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
        ['Lic. Evolución', 'Nutrición', idGymCentral],
      );

      const filaNutriPersona = resultNutriPersona as { insertId: number };
      const idNutriPersona = filaNutriPersona.insertId;

      await dataSource.query(
        `INSERT INTO usuario (email, contrasenia, rol, id_persona)
         VALUES (?, ?, 'NUTRICIONISTA', ?)
         ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
        [emailNutri, contraseniaHash, idNutriPersona],
      );

      await asignarGruposAUsuario(emailNutri, 'NUTRICIONISTA');

      const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      for (const dia of diasSemana) {
        await dataSource.query(
          `INSERT IGNORE INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
           VALUES (?, '09:00:00', '17:00:00', 60, ?)`,
          [dia, idNutriPersona],
        );
      }

      console.log(`NUTRICIONISTA evolucion: ${emailNutri} (ID persona: ${idNutriPersona})`);

      // --- CREAR SOCIO DE EVOLUCIÓN ---
      const emailSocio = 'martin-evolucion@nutrifit.com';

      const resultFicha: unknown = await dataSource.query(
        `INSERT INTO ficha_salud (altura, peso, objetivo_personal, nivel_actividad_fisica, medicacion_actual, frecuencia_comidas, consumo_agua_diario, consumo_alcohol, fuma_tabaco, horas_sueno, contacto_emergencia_nombre, contacto_emergencia_telefono, completada, consent_at, completada_at, actualizada_at)
         VALUES (?, ?, 'Reducir peso corporal del 31% al 25% de grasa y mejorar composicion corporal general', 'SEDENTARIO', 'Ninguna', '3 comidas', 1.5, 'Ocasional', FALSE, 6, 'Laura Evolucion', '341-555-9000', TRUE, NOW(), NOW(), NOW())`,
        [alturaCm, 95.0],
      );

      const filaFicha = resultFicha as { insertId: number };
      const idFichaSalud = filaFicha.insertId;

      const resultSocioPersona: unknown = await dataSource.query(
        `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, fecha_alta, id_ficha_salud, tipo_persona)
         VALUES (?, ?, '1994-05-20', 'MASCULINO', '341-555-7000', 'Av. Progreso 789', 'Rosario', 'Santa Fe', ?, '50004001', '2026-01-05', ?, 'SocioOrmEntity')
         ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
        ['Martín', 'Evolución', idGymCentral, idFichaSalud],
      );

      const filaSocioPersona = resultSocioPersona as { insertId: number };
      const idSocioPersona = filaSocioPersona.insertId;

      await dataSource.query(
        `INSERT INTO usuario (email, contrasenia, rol, id_persona)
         VALUES (?, ?, 'SOCIO', ?)
         ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
        [emailSocio, contraseniaHash, idSocioPersona],
      );

      await asignarGruposAUsuario(emailSocio, 'SOCIO');

      const snapshotInicial = JSON.stringify({
        altura: alturaCm,
        peso: 95.0,
        objetivo_personal:
          'Reducir peso corporal del 31% al 25% de grasa y mejorar composicion corporal general',
        nivel_actividad_fisica: 'SEDENTARIO',
        medicacion_actual: 'Ninguna',
        frecuencia_comidas: '3 comidas',
        consumo_agua_diario: 1.5,
        consumo_alcohol: 'Ocasional',
        fuma_tabaco: false,
        horas_sueno: 6,
        contacto_emergencia_nombre: 'Laura Evolucion',
        contacto_emergencia_telefono: '341-555-9000',
        alergias: [],
        patologias: [],
      });

      const resultVersion: unknown = await dataSource.query(
        `INSERT INTO ficha_salud_version (id_ficha_salud, id_socio, version, datos_json, created_at, created_by)
         VALUES (?, ?, 1, ?, NOW(), NULL)`,
        [idFichaSalud, idSocioPersona, snapshotInicial],
      );

      const filaVersion = resultVersion as { insertId: number };
      const idVersion = filaVersion.insertId;

      await dataSource.query(
        `UPDATE ficha_salud SET version_actual_id = ? WHERE id_ficha_salud = ?`,
        [idVersion, idFichaSalud],
      );

      console.log(`SOCIO evolucion: ${emailSocio} (ID persona: ${idSocioPersona})`);

      // --- CREAR TURNOS CON OBSERVACIONES Y MEDICIONES ---
      interface DatosTurno {
        fecha: string;
        peso: number;
        imc: number;
        cintura: number;
        cadera: number;
        brazo: number;
        muslo: number;
        pecho: number;
        porcentajeGrasa: number;
        masaMagra: number;
        pliegueTriceps: number;
        pliegueAbdominal: number;
        comentario: string;
        sugerencias: string;
        habitos: string;
      }

      const evolucion: DatosTurno[] = [
        { fecha: '2026-01-12', peso: 95.0, imc: 31.0, cintura: 102.0, cadera: 108.0, brazo: 38.0, muslo: 62.0, pecho: 108.0, porcentajeGrasa: 32.5, masaMagra: 64.1, pliegueTriceps: 22.0, pliegueAbdominal: 35.0, comentario: 'Primera consulta. Evaluacion antropometrica inicial completa. Se realiza anamnesis alimentaria y se detectan habitos desordenados: saltea desayuno, cenas abundantes nocturnas, consumo frecuente de ultraprocesados.', sugerencias: 'Iniciar plan hipocalorico de 2100 kcal. Estructurar 4 comidas diarias. Incorporar mas verduras y proteinas magras. Reducir alcohol a 1 vez por semana.', habitos: 'Sedentario, trabaja 10h frente a PC. Cena despues de las 22hs. Consume 1.5L agua/dia.' },
        { fecha: '2026-01-26', peso: 92.8, imc: 30.3, cintura: 100.0, cadera: 107.0, brazo: 37.5, muslo: 61.0, pecho: 107.0, porcentajeGrasa: 31.8, masaMagra: 63.2, pliegueTriceps: 21.0, pliegueAbdominal: 33.0, comentario: 'Paciente refiere buena adherencia al plan. Logro estructurar 4 comidas diarias. Disminuyo consumo de ultraprocesados. Reporta mas energia durante el dia.', sugerencias: 'Mantener plan actual. Agregar caminata de 30 min diarios. Aumentar consumo de agua a 2L/dia.', habitos: 'Incorporo desayuno. Cenas se adelantaron a 20hs. Reporta mejor descanso.' },
        { fecha: '2026-02-09', peso: 90.5, imc: 29.6, cintura: 98.0, cadera: 106.0, brazo: 37.0, muslo: 60.0, pecho: 106.0, porcentajeGrasa: 31.0, masaMagra: 62.4, pliegueTriceps: 20.0, pliegueAbdominal: 31.5, comentario: 'Progreso consistente. Paciente motivado. Comenzo a caminar 30 min diarios. Mejoro calidad del sueno. Refiere menos ansiedad por alimentos.', sugerencias: 'Ajustar plan a 2000 kcal. Introducir 2 dias de ejercicio de fuerza en casa.', habitos: 'Camina 30 min/dia. Duerme 7h. Bebe 2L agua.' },
        { fecha: '2026-02-23', peso: 88.2, imc: 28.8, cintura: 96.0, cadera: 105.0, brazo: 36.5, muslo: 59.0, pecho: 105.0, porcentajeGrasa: 30.2, masaMagra: 61.6, pliegueTriceps: 19.0, pliegueAbdominal: 30.0, comentario: 'Excelente evolucion. Paciente incorporo ejercicios de fuerza 2x/sem. Nota mejora en la composicion corporal y ropa le queda mas holgada.', sugerencias: 'Mantener plan de 2000 kcal con ajuste en distribucion de proteinas post-entreno (30g proteina post-ejercicio).', habitos: 'Ejercicio fuerza 2x/sem + caminata diaria. Comidas regulares cada 3-4h.' },
        { fecha: '2026-03-09', peso: 86.0, imc: 28.1, cintura: 94.0, cadera: 104.0, brazo: 36.0, muslo: 58.0, pecho: 104.0, porcentajeGrasa: 29.4, masaMagra: 60.7, pliegueTriceps: 18.0, pliegueAbdominal: 28.5, comentario: 'Paciente muy conforme. Incremento intensidad de ejercicios. Se siente con mas vitalidad. Mediciones muestran perdida de grasa sostenida.', sugerencias: 'Ajustar plan a 1900 kcal. Aumentar proteina a 1.8g/kg. Incorporar colacion pre-entreno.', habitos: 'Ejercicio 4x/sem (2 fuerza + 2 cardio). Duerme 7-8h. Bebe 2.5L agua.' },
        { fecha: '2026-03-23', peso: 84.1, imc: 27.5, cintura: 92.0, cadera: 103.0, brazo: 35.5, muslo: 57.0, pecho: 103.0, porcentajeGrasa: 28.6, masaMagra: 60.0, pliegueTriceps: 17.0, pliegueAbdominal: 27.0, comentario: 'Paciente supero meseta inicial. Mantuvo adherencia incluso en fines de semana. Reporta que sus companeros notan el cambio.', sugerencias: 'Mantener plan. Introducir un dia de recarga controlada los domingos para sostener adherencia.', habitos: 'Ejercicio regular. Fines de semana mas estructurados. No saltea comidas.' },
        { fecha: '2026-04-06', peso: 82.5, imc: 27.0, cintura: 90.5, cadera: 102.0, brazo: 35.0, muslo: 56.0, pecho: 102.0, porcentajeGrasa: 27.8, masaMagra: 59.6, pliegueTriceps: 16.0, pliegueAbdominal: 25.5, comentario: 'Muy buen momento del tratamiento. Paciente completamente adaptado al estilo de vida saludable. Cambios visibles en fotos de progreso.', sugerencias: 'Ajustar plan a 1850 kcal. Evaluar incorporar entrenamiento de alta intensidad (HIIT) 1x/sem.', habitos: 'Estilo de vida activo. Cocina sus comidas. Planifica menu semanal.' },
        { fecha: '2026-04-20', peso: 81.0, imc: 26.5, cintura: 89.0, cadera: 101.0, brazo: 34.5, muslo: 55.0, pecho: 101.0, porcentajeGrasa: 27.0, masaMagra: 59.1, pliegueTriceps: 15.0, pliegueAbdominal: 24.0, comentario: 'Perimetro de cintura sigue disminuyendo. Paciente reporta mejora en rendimiento deportivo. Se siente mas agil y fuerte.', sugerencias: 'Mantener plan. Continuar con HIIT 1x/sem. Evaluar metas de recomposicion corporal.', habitos: 'HIIT 1x/sem + fuerza 2x/sem + caminata diaria.' },
        { fecha: '2026-05-04', peso: 79.8, imc: 26.1, cintura: 88.0, cadera: 100.0, brazo: 34.0, muslo: 54.5, pecho: 100.0, porcentajeGrasa: 26.3, masaMagra: 58.8, pliegueTriceps: 14.0, pliegueAbdominal: 22.5, comentario: 'Acercandose a la meta. Perdida total: 15.2 kg. Paciente emocionado con los resultados. Refiere que su entorno lo felicita constantemente.', sugerencias: 'Plan de transicion: aumentar calorias gradualmente hacia mantenimiento (2200 kcal). Evaluar meta final.', habitos: 'Rutina de ejercicio consolidada. Alimentacion intuitiva mejorada.' },
        { fecha: '2026-05-18', peso: 78.5, imc: 25.7, cintura: 87.0, cadera: 99.5, brazo: 33.5, muslo: 54.0, pecho: 99.0, porcentajeGrasa: 25.5, masaMagra: 58.5, pliegueTriceps: 13.0, pliegueAbdominal: 21.0, comentario: 'Manteniendo bien los cambios. Paciente en fase de mantenimiento. Refiere sentirse como una persona nueva. Autoestima notablemente mejorada.', sugerencias: 'Plan de mantenimiento a 2200-2300 kcal. Continuar monitoreo mensual por 2 meses mas.', habitos: 'Estilo de vida saludable consolidado. Disfruta cocinar y hacer ejercicio.' },
        { fecha: '2026-06-01', peso: 77.5, imc: 25.3, cintura: 86.0, cadera: 99.0, brazo: 33.0, muslo: 53.5, pecho: 98.5, porcentajeGrasa: 25.0, masaMagra: 58.1, pliegueTriceps: 12.5, pliegueAbdominal: 20.0, comentario: 'Control final del proceso. Perdida total: 17.5 kg en 5 meses. Reduccion del 32.5% al 25% de grasa corporal. Paciente dado de alta con plan de mantenimiento autonomo. Muy satisfecho.', sugerencias: 'Alta del programa intensivo. Seguimiento trimestral. Plan de mantenimiento vitalicio con ajustes estacionales.', habitos: 'Estilo de vida completamente transformado. Es referencia para amigos y familiares.' },
      ];

      const horas = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '09:30', '10:30', '14:30', '15:30', '09:00'];

      for (let i = 0; i < evolucion.length; i++) {
        const d = evolucion[i];
        const hora = horas[i];
        const checkInStr = `${d.fecha} ${hora}:00`;
        const inicioStr = `${d.fecha} ${addMinutes(hora, 5)}:00`;
        const finStr = `${d.fecha} ${addMinutes(hora, 55)}:00`;

        const resultTurno: unknown = await dataSource.query(
          `INSERT INTO turno (fecha, hora_turno, estado, creado_por, id_socio, id_nutricionista, id_gimnasio, check_in_at, consulta_iniciada_at, consulta_finalizada_at)
           VALUES (?, ?, 'REALIZADO', 'SOCIO', ?, ?, ?, ?, ?, ?)`,
          [d.fecha, hora, idSocioPersona, idNutriPersona, idGymCentral, checkInStr, inicioStr, finStr],
        );

        const filaTurno = resultTurno as { insertId: number };
        const idTurno = filaTurno.insertId;

        const resultObs: unknown = await dataSource.query(
          `INSERT INTO observacion_clinica (comentario, peso, altura, imc, sugerencias, habitos_socio, objetivos_socio, version, es_publica)
           VALUES (?, ?, ?, ?, ?, ?, 'Reducir grasa corporal y mejorar composicion', 1, 1)`,
          [d.comentario, d.peso, alturaCm, d.imc, d.sugerencias, d.habitos],
        );

        const filaObs = resultObs as { insertId: number };
        const idObs = filaObs.insertId;

        await dataSource.query(
          `UPDATE turno SET id_observacion = ? WHERE id_turno = ?`,
          [idObs, idTurno],
        );

        await dataSource.query(
          `INSERT INTO medicion (peso, altura, imc, perimetro_cintura, perimetro_cadera, perimetro_brazo, perimetro_muslo, perimetro_pecho, pliegue_triceps, pliegue_abdominal, porcentaje_grasa, masa_magra, frecuencia_cardiaca, tension_sistolica, tension_diastolica, notas_medicion, id_turno, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [d.peso, alturaCm, d.imc, d.cintura, d.cadera, d.brazo, d.muslo, d.pecho, d.pliegueTriceps, d.pliegueAbdominal, d.porcentajeGrasa, d.masaMagra, 75, 125, 80, `Medicion del ${d.fecha}`, idTurno, checkInStr],
        );
      }

      console.log(`Turnos evolutivos creados: ${evolucion.length} para ${emailSocio}`);
    };

    await crearSocioConHistorialEvolutivo();

    // Crear planes de alimentacion demo
    const crearPlanesDemo = async (): Promise<void> => {
      const planesData = generarPlanesSemilla(idsNutricionistas, idsSocios);

      for (const plan of planesData) {
        const resultadoPlan: unknown = await dataSource.query(
          `INSERT INTO plan_alimentacion (fechaCreacion, objetivo_nutricional, activo, id_socio, id_nutricionista)
           VALUES (?, ?, TRUE, ?, ?)`,
          [
            '2026-05-15',
            plan.objetivoNutricional,
            plan.idSocio,
            plan.idNutricionista,
          ],
        );

        const filaPlan = resultadoPlan as { insertId: number };
        const idPlan = filaPlan.insertId;

        // Crear 1 dia + 1 opcion de comida (minimo requerido)
        const resultadoDia: unknown = await dataSource.query(
          `INSERT INTO dia_plan (dia, orden, id_plan_alimentacion)
           VALUES ('LUNES', 1, ?)`,
          [idPlan],
        );

        const filaDia = resultadoDia as { insertId: number };
        const idDia = filaDia.insertId;

        await dataSource.query(
          `INSERT INTO opcion_comida (tipo_comida, comentarios, id_dia_plan)
           VALUES ('DESAYUNO', 'Plan de prueba generado automaticamente', ?)`,
          [idDia],
        );
      }
      console.log(`Planes de alimentacion creados: ${planesData.length}`);
    };

    await crearPlanesDemo();

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
