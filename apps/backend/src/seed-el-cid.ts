// apps/backend/src/seed-el-cid.ts
//
// Seed para crear el gimnasio "El Cid" con:
//   - 3 nutricionistas (c/u con agenda)
//   - 3 socios por nutricionista (9 total)
//   - Historial de turnos (4 por socio, todos REALIZADO)
//   - 1 plan de alimentación por nutricionista (3 total, para 1 socio cada uno)
//
// Uso: npx ts-node -r tsconfig-paths/register src/seed-el-cid.ts
// O:   npm run seed:el-cid  (cuando esté en package.json)

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: '.env' });

// ──────────────────────────────────────────────
// Datos del gimnasio
// ──────────────────────────────────────────────

const GIMNASIO = {
  nombre: 'El Cid',
  direccion: 'Av. Pellegrini 1800',
  telefono: '341-555-7000',
  email: 'contacto@elcidgym.com',
  ciudad: 'Rosario',
};

// ──────────────────────────────────────────────
// Nutricionistas
// ──────────────────────────────────────────────

interface NutriSeed {
  email: string;
  nombre: string;
  apellido: string;
  matricula: string;
  presentacion: string;
  certificaciones: string;
  agenda: {
    dia: string;
    horaInicio: string;
    horaFin: string;
    duracionTurno: number;
  }[];
}

const NUTRICIONISTAS: NutriSeed[] = [
  {
    email: 'nutri-cid1@nutrifit.com',
    nombre: 'Martín',
    apellido: 'Giménez',
    matricula: 'MN-6001',
    presentacion:
      'Nutricionista deportivo especializado en rendimiento y recomposición corporal. 8 años de experiencia trabajando con atletas y público general.',
    certificaciones:
      'Licenciatura en Nutrición (UNR), Maestría en Nutrición Deportiva (Universidad Favaloro), ISAK Nivel 2.',
    agenda: [
      {
        dia: 'Lunes',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 60,
      },
      {
        dia: 'Martes',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 60,
      },
      {
        dia: 'Miércoles',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 60,
      },
      {
        dia: 'Jueves',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 60,
      },
      {
        dia: 'Viernes',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 60,
      },
    ],
  },
  {
    email: 'nutri-cid2@nutrifit.com',
    nombre: 'Carolina',
    apellido: 'Vega',
    matricula: 'MN-6002',
    presentacion:
      'Nutricionista clínica con enfoque en patologías crónicas, control de peso y alimentación consciente. 10 años de experiencia.',
    certificaciones:
      'Licenciatura en Nutrición (UBA), Diplomatura en Nutrición Clínica (Hospital Italiano), Posgrado en Obesidad y TCA (SAOTA).',
    agenda: [
      {
        dia: 'Lunes',
        horaInicio: '14:00:00',
        horaFin: '19:00:00',
        duracionTurno: 45,
      },
      {
        dia: 'Miércoles',
        horaInicio: '14:00:00',
        horaFin: '19:00:00',
        duracionTurno: 45,
      },
      {
        dia: 'Viernes',
        horaInicio: '14:00:00',
        horaFin: '19:00:00',
        duracionTurno: 45,
      },
    ],
  },
  {
    email: 'nutri-cid3@nutrifit.com',
    nombre: 'Federico',
    apellido: 'Linares',
    matricula: 'MN-6003',
    presentacion:
      'Nutricionista especializado en salud digestiva, deporte y planes personalizados para adultos jóvenes. 6 años de experiencia.',
    certificaciones:
      'Licenciatura en Nutrición (UNLP), Cert. en Nutrición Vegetariana y Vegana, Diplomatura en Alimentación Deportiva.',
    agenda: [
      {
        dia: 'Martes',
        horaInicio: '08:00:00',
        horaFin: '12:00:00',
        duracionTurno: 30,
      },
      {
        dia: 'Jueves',
        horaInicio: '08:00:00',
        horaFin: '12:00:00',
        duracionTurno: 30,
      },
      {
        dia: 'Sábado',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 30,
      },
    ],
  },
];

// ──────────────────────────────────────────────
// Socios (3 por nutricionista)
// ──────────────────────────────────────────────

interface SocioSeed {
  email: string;
  nombre: string;
  apellido: string;
  dni: string;
  genero: string;
  telefono: string;
  direccion: string;
}

// Primer socio de cada grupo tendrá plan de alimentación
const SOCIOS_POR_NUTRI: SocioSeed[][] = [
  // Socios de Martín Giménez (nutri-cid1)
  [
    {
      email: 'socio-cid-a@nutrifit.com',
      nombre: 'Lucas',
      apellido: 'Mendoza',
      dni: '60001001',
      genero: 'MASCULINO',
      telefono: '341-555-7101',
      direccion: 'San Juan 850',
    },
    {
      email: 'socio-cid-b@nutrifit.com',
      nombre: 'Florencia',
      apellido: 'Rivas',
      dni: '60001002',
      genero: 'FEMENINO',
      telefono: '341-555-7102',
      direccion: 'Córdoba 1234',
    },
    {
      email: 'socio-cid-c@nutrifit.com',
      nombre: 'Tomás',
      apellido: 'Sosa',
      dni: '60001003',
      genero: 'MASCULINO',
      telefono: '341-555-7103',
      direccion: 'Mitre 567',
    },
  ],
  // Socios de Carolina Vega (nutri-cid2)
  [
    {
      email: 'socio-cid-d@nutrifit.com',
      nombre: 'Sofía',
      apellido: 'Peralta',
      dni: '60002001',
      genero: 'FEMENINO',
      telefono: '341-555-7201',
      direccion: 'Santa Fe 980',
    },
    {
      email: 'socio-cid-e@nutrifit.com',
      nombre: 'Gabriel',
      apellido: 'Álvarez',
      dni: '60002002',
      genero: 'MASCULINO',
      telefono: '341-555-7202',
      direccion: 'Rioja 345',
    },
    {
      email: 'socio-cid-f@nutrifit.com',
      nombre: 'Valentina',
      apellido: 'Castillo',
      dni: '60002003',
      genero: 'FEMENINO',
      telefono: '341-555-7203',
      direccion: 'Entre Ríos 210',
    },
  ],
  // Socios de Federico Linares (nutri-cid3)
  [
    {
      email: 'socio-cid-g@nutrifit.com',
      nombre: 'Mateo',
      apellido: 'Delgado',
      dni: '60003001',
      genero: 'MASCULINO',
      telefono: '341-555-7301',
      direccion: 'Buenos Aires 1500',
    },
    {
      email: 'socio-cid-h@nutrifit.com',
      nombre: 'Camila',
      apellido: 'Navarro',
      dni: '60003002',
      genero: 'FEMENINO',
      telefono: '341-555-7302',
      direccion: 'San Martín 780',
    },
    {
      email: 'socio-cid-i@nutrifit.com',
      nombre: 'Sebastián',
      apellido: 'Moreno',
      dni: '60003003',
      genero: 'MASCULINO',
      telefono: '341-555-7303',
      direccion: 'Belgrano 420',
    },
  ],
];

// ──────────────────────────────────────────────
// Objetivos de planes de alimentación
// ──────────────────────────────────────────────

const OBJETIVOS_PLANES = [
  'Reducir peso corporal y disminuir porcentaje de grasa manteniendo masa muscular',
  'Plan de recomposición corporal con aumento de proteínas y control de hidratos',
  'Plan de mantenimiento con enfoque en alimentación intuitiva y hábitos sostenibles',
];

// ──────────────────────────────────────────────
// Configuración de Socios (para evolución y ficha de salud)
// ──────────────────────────────────────────────

const SOCIOS_CONFIG: Record<
  string,
  { altura: number; peso: number; actividad: string; objetivo: string }
> = {
  'socio-cid-a@nutrifit.com': {
    altura: 180,
    peso: 90.0,
    actividad: 'MODERADO',
    objetivo:
      'Reducir peso corporal y disminuir porcentaje de grasa manteniendo masa muscular',
  },
  'socio-cid-b@nutrifit.com': {
    altura: 165,
    peso: 68.0,
    actividad: 'LIGERO',
    objetivo: 'Mejorar hábitos alimentarios y aumentar energía',
  },
  'socio-cid-c@nutrifit.com': {
    altura: 175,
    peso: 82.0,
    actividad: 'SEDENTARIO',
    objetivo: 'Controlar colesterol y mejorar alimentación',
  },
  'socio-cid-d@nutrifit.com': {
    altura: 160,
    peso: 64.0,
    actividad: 'MODERADO',
    objetivo:
      'Plan de recomposición corporal con aumento de proteínas y control de hidratos',
  },
  'socio-cid-e@nutrifit.com': {
    altura: 185,
    peso: 95.0,
    actividad: 'INTENSO',
    objetivo: 'Ganar masa muscular y fuerza general',
  },
  'socio-cid-f@nutrifit.com': {
    altura: 170,
    peso: 72.0,
    actividad: 'INTENSO',
    objetivo: 'Mejorar rendimiento en running y resistencia',
  },
  'socio-cid-g@nutrifit.com': {
    altura: 178,
    peso: 78.0,
    actividad: 'LIGERO',
    objetivo:
      'Plan de mantenimiento con enfoque en alimentación intuitiva y hábitos sostenibles',
  },
  'socio-cid-h@nutrifit.com': {
    altura: 162,
    peso: 58.0,
    actividad: 'MODERADO',
    objetivo: 'Aumentar masa magra y tonificar',
  },
  'socio-cid-i@nutrifit.com': {
    altura: 182,
    peso: 88.0,
    actividad: 'LIGERO',
    objetivo: 'Bajar de peso y regular tránsito intestinal',
  },
};

// ──────────────────────────────────────────────
// Seed
// ──────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function runSeedElCid() {
  console.log('=== Seed El Cid ===');
  console.log('Creando gimnasio, nutricionistas, socios, turnos y planes...\n');

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
    console.log('Conexión a base de datos establecida.\n');

    const contraseniaHash = await bcrypt.hash('123456', 10);

    // ── 1. Crear gimnasio El Cid ──
    const gymExistentes: unknown = await dataSource.query(
      `SELECT id_gimnasio FROM gimnasio WHERE nombre = ? LIMIT 1`,
      [GIMNASIO.nombre],
    );

    let idGimnasio: number;
    const filasGym = gymExistentes as { id_gimnasio: number }[];

    if (filasGym.length > 0) {
      idGimnasio = filasGym[0].id_gimnasio;
      await dataSource.query(
        `UPDATE gimnasio SET direccion = ?, telefono = ?, ciudad = ?, email_notificaciones = ?, email_habilitado = TRUE WHERE id_gimnasio = ?`,
        [
          GIMNASIO.direccion,
          GIMNASIO.telefono,
          GIMNASIO.ciudad,
          GIMNASIO.email,
          idGimnasio,
        ],
      );
      console.log(
        `Gimnasio "${GIMNASIO.nombre}" ya existía (ID: ${idGimnasio}). Actualizado.`,
      );
    } else {
      const resultado: unknown = await dataSource.query(
        `INSERT INTO gimnasio (nombre, direccion, telefono, ciudad, email_notificaciones, email_habilitado) VALUES (?, ?, ?, ?, ?, TRUE)`,
        [
          GIMNASIO.nombre,
          GIMNASIO.direccion,
          GIMNASIO.telefono,
          GIMNASIO.ciudad,
          GIMNASIO.email,
        ],
      );
      idGimnasio = (resultado as { insertId: number }).insertId;
      console.log(`Gimnasio "${GIMNASIO.nombre}" creado (ID: ${idGimnasio}).`);
    }

    // ── 2. Crear nutricionistas ──
    const idsNutricionistas: number[] = [];

    for (let nIdx = 0; nIdx < NUTRICIONISTAS.length; nIdx++) {
      const nutri = NUTRICIONISTAS[nIdx];

      // Verificar si ya existe
      const existente: unknown = await dataSource.query(
        `SELECT p.id_persona FROM persona p JOIN usuario u ON u.id_persona = p.id_persona WHERE u.email = ? LIMIT 1`,
        [nutri.email],
      );
      const filaExistente = existente as { id_persona: number }[];

      let idPersona: number;

      if (filaExistente.length > 0) {
        idPersona = filaExistente[0].id_persona;
        console.log(
          `Nutricionista ${nutri.email} ya existía (ID persona: ${idPersona}).`,
        );
      } else {
        const rp: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, matricula, anios_experiencia, tarifa_sesion, presentacion, tipo_persona)
           VALUES (?, ?, '1987-04-10', 'OTRO', '341-555-6000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, NULL, ?, 8, 7000, ?, 'NutricionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [
            nutri.nombre,
            nutri.apellido,
            idGimnasio,
            nutri.matricula,
            nutri.presentacion,
          ],
        );
        idPersona = (rp as { insertId: number }).insertId;

        await dataSource.query(
          `INSERT INTO usuario (email, contrasenia, rol, id_persona)
           VALUES (?, ?, 'NUTRICIONISTA', ?)
           ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
          [nutri.email, contraseniaHash, idPersona],
        );

        // Asignar grupo de permisos (NUTRICIONISTA)
        // Buscar grupo base para NUTRICIONISTA
        const grupoRows: unknown = await dataSource.query(
          `SELECT gp.id_grupo_permiso FROM grupo_permiso gp WHERE gp.clave = 'NUTRICIONISTA' LIMIT 1`,
        );
        const grupoRow = grupoRows as { id_grupo_permiso: number }[];
        if (grupoRow.length > 0) {
          const usuarioRows: unknown = await dataSource.query(
            `SELECT id_usuario FROM usuario WHERE email = ?`,
            [nutri.email],
          );
          const usuarioRow = usuarioRows as { id_usuario: number }[];
          if (usuarioRow.length > 0) {
            await dataSource.query(
              `INSERT IGNORE INTO usuario_grupo_permiso (usuarioIdUsuario, grupoPermisoId, id_gimnasio, fecha_asignacion)
               VALUES (?, ?, ?, NOW())`,
              [
                usuarioRow[0].id_usuario,
                grupoRow[0].id_grupo_permiso,
                idGimnasio,
              ],
            );
          }
        }

        // Certificaciones
        const certs = nutri.certificaciones
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        for (const cert of certs) {
          await dataSource.query(
            `INSERT INTO certificacion (id_nutricionista, nombre, entidad, anio, carga_horaria, nivel)
             VALUES (?, ?, 'No especificada', NULL, NULL, NULL)`,
            [idPersona, cert],
          );
        }

        // Formación académica
        await dataSource.query(
          `INSERT INTO formacion_academica (titulo, institucion, anio_inicio, anio_fin, nivel, id_nutricionista)
           VALUES ('Licenciatura en Nutrición', 'UNR', 2008, 2013, 'GRADO', ?)`,
          [idPersona],
        );

        console.log(
          `Nutricionista ${nutri.email} creado (ID persona: ${idPersona}).`,
        );
      }

      idsNutricionistas.push(idPersona);

      // Crear agenda (si no existe)
      for (const bloque of nutri.agenda) {
        await dataSource.query(
          `INSERT IGNORE INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
           VALUES (?, ?, ?, ?, ?)`,
          [
            bloque.dia,
            bloque.horaInicio,
            bloque.horaFin,
            bloque.duracionTurno,
            idPersona,
          ],
        );
      }
      const agendaCount = await dataSource.query(
        `SELECT COUNT(*) as count FROM agenda WHERE id_nutricionista = ?`,
        [idPersona],
      );
      console.log(
        `  Agenda: ${(agendaCount as { count: number }[])[0].count} bloques.`,
      );
    }

    // ── 3. Crear socios ──
    const idsSocios: number[] = [];
    // Mapear qué socio pertenece a qué nutricionista
    const socioNutriMap: { idSocio: number; idNutri: number }[] = [];

    for (let nIdx = 0; nIdx < SOCIOS_POR_NUTRI.length; nIdx++) {
      const nutriId = idsNutricionistas[nIdx];
      const sociosGrupo = SOCIOS_POR_NUTRI[nIdx];

      for (const socio of sociosGrupo) {
        const existente: unknown = await dataSource.query(
          `SELECT p.id_persona FROM persona p JOIN usuario u ON u.id_persona = p.id_persona WHERE u.email = ? LIMIT 1`,
          [socio.email],
        );
        const filaExistente = existente as { id_persona: number }[];

        let idPersona: number;

        if (filaExistente.length > 0) {
          idPersona = filaExistente[0].id_persona;
          console.log(
            `Socio ${socio.email} ya existía (ID persona: ${idPersona}).`,
          );

          // Robustez: verificar si el socio existente tiene ficha de salud
          const personaFicha: unknown = await dataSource.query(
            `SELECT id_ficha_salud FROM persona WHERE id_persona = ? LIMIT 1`,
            [idPersona],
          );
          const tieneFicha = (
            personaFicha as { id_ficha_salud: number | null }[]
          )[0]?.id_ficha_salud;

          if (!tieneFicha) {
            console.log(
              `  Socio ${socio.email} no tiene ficha de salud. Creando...`,
            );
            const configSocio = SOCIOS_CONFIG[socio.email] || {
              altura: 170,
              peso: 70,
              actividad: 'LIGERO',
              objetivo: 'Bienestar general',
            };

            const resultFicha: unknown = await dataSource.query(
              `INSERT INTO ficha_salud (altura, peso, objetivo_personal, nivel_actividad_fisica, medicacion_actual, frecuencia_comidas, consumo_agua_diario, consumo_alcohol, fuma_tabaco, horas_sueno, contacto_emergencia_nombre, contacto_emergencia_telefono, completada, consent_at, completada_at, actualizada_at)
               VALUES (?, ?, ?, ?, 'Ninguna', '4-5 comidas', 2.0, 'Ocasional', FALSE, 7, 'Contacto de Emergencia', '341-555-0000', TRUE, NOW(), NOW(), NOW())`,
              [
                configSocio.altura,
                configSocio.peso,
                configSocio.objetivo,
                configSocio.actividad,
              ],
            );
            const idFichaSalud = (resultFicha as { insertId: number }).insertId;

            await dataSource.query(
              `UPDATE persona SET id_ficha_salud = ? WHERE id_persona = ?`,
              [idFichaSalud, idPersona],
            );

            const snapshotInicial = JSON.stringify({
              altura: configSocio.altura,
              peso: configSocio.peso,
              objetivo_personal: configSocio.objetivo,
              nivel_actividad_fisica: configSocio.actividad,
              medicacion_actual: 'Ninguna',
              frecuencia_comidas: '4-5 comidas',
              consumo_agua_diario: 2.0,
              consumo_alcohol: 'Ocasional',
              fuma_tabaco: false,
              horas_sueno: 7,
              contacto_emergencia_nombre: 'Contacto de Emergencia',
              contacto_emergencia_telefono: '341-555-0000',
              alergias: [],
              patologias: [],
            });

            const resultVersion: unknown = await dataSource.query(
              `INSERT INTO ficha_salud_version (id_ficha_salud, id_socio, version, datos_json, created_at, created_by)
               VALUES (?, ?, 1, ?, NOW(), NULL)`,
              [idFichaSalud, idPersona, snapshotInicial],
            );
            const idVersion = (resultVersion as { insertId: number }).insertId;

            await dataSource.query(
              `UPDATE ficha_salud SET version_actual_id = ? WHERE id_ficha_salud = ?`,
              [idVersion, idFichaSalud],
            );
            console.log(
              `  Ficha de salud creada y asociada para socio existente ${socio.email}.`,
            );
          }
        } else {
          // Obtener configuración del socio
          const configSocio = SOCIOS_CONFIG[socio.email] || {
            altura: 170,
            peso: 70,
            actividad: 'LIGERO',
            objetivo: 'Bienestar general',
          };

          // Crear ficha de salud
          const resultFicha: unknown = await dataSource.query(
            `INSERT INTO ficha_salud (altura, peso, objetivo_personal, nivel_actividad_fisica, medicacion_actual, frecuencia_comidas, consumo_agua_diario, consumo_alcohol, fuma_tabaco, horas_sueno, contacto_emergencia_nombre, contacto_emergencia_telefono, completada, consent_at, completada_at, actualizada_at)
             VALUES (?, ?, ?, ?, 'Ninguna', '4-5 comidas', 2.0, 'Ocasional', FALSE, 7, 'Contacto de Emergencia', '341-555-0000', TRUE, NOW(), NOW(), NOW())`,
            [
              configSocio.altura,
              configSocio.peso,
              configSocio.objetivo,
              configSocio.actividad,
            ],
          );
          const idFichaSalud = (resultFicha as { insertId: number }).insertId;

          // Crear persona
          const rp: unknown = await dataSource.query(
            `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, fecha_alta, id_ficha_salud, tipo_persona)
             VALUES (?, ?, '1995-07-20', ?, ?, ?, 'Rosario', 'Santa Fe', ?, ?, NOW(), ?, 'SocioOrmEntity')
             ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
            [
              socio.nombre,
              socio.apellido,
              socio.genero,
              socio.telefono,
              socio.direccion,
              idGimnasio,
              socio.dni,
              idFichaSalud,
            ],
          );
          idPersona = (rp as { insertId: number }).insertId;

          // Crear usuario
          await dataSource.query(
            `INSERT INTO usuario (email, contrasenia, rol, id_persona)
             VALUES (?, ?, 'SOCIO', ?)
             ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
            [socio.email, contraseniaHash, idPersona],
          );

          // Crear versión de ficha de salud
          const snapshotInicial = JSON.stringify({
            altura: configSocio.altura,
            peso: configSocio.peso,
            objetivo_personal: configSocio.objetivo,
            nivel_actividad_fisica: configSocio.actividad,
            medicacion_actual: 'Ninguna',
            frecuencia_comidas: '4-5 comidas',
            consumo_agua_diario: 2.0,
            consumo_alcohol: 'Ocasional',
            fuma_tabaco: false,
            horas_sueno: 7,
            contacto_emergencia_nombre: 'Contacto de Emergencia',
            contacto_emergencia_telefono: '341-555-0000',
            alergias: [],
            patologias: [],
          });

          const resultVersion: unknown = await dataSource.query(
            `INSERT INTO ficha_salud_version (id_ficha_salud, id_socio, version, datos_json, created_at, created_by)
             VALUES (?, ?, 1, ?, NOW(), NULL)`,
            [idFichaSalud, idPersona, snapshotInicial],
          );
          const idVersion = (resultVersion as { insertId: number }).insertId;

          // Actualizar versión actual en ficha_salud
          await dataSource.query(
            `UPDATE ficha_salud SET version_actual_id = ? WHERE id_ficha_salud = ?`,
            [idVersion, idFichaSalud],
          );

          // Asignar grupo SOCIO
          const grupoRows: unknown = await dataSource.query(
            `SELECT gp.id_grupo_permiso FROM grupo_permiso gp WHERE gp.clave = 'SOCIO' LIMIT 1`,
          );
          const grupoRow = grupoRows as { id_grupo_permiso: number }[];
          if (grupoRow.length > 0) {
            const usuarioRows: unknown = await dataSource.query(
              `SELECT id_usuario FROM usuario WHERE email = ?`,
              [socio.email],
            );
            const usuarioRow = usuarioRows as { id_usuario: number }[];
            if (usuarioRow.length > 0) {
              await dataSource.query(
                `INSERT IGNORE INTO usuario_grupo_permiso (usuarioIdUsuario, grupoPermisoId, id_gimnasio, fecha_asignacion)
                 VALUES (?, ?, ?, NOW())`,
                [
                  usuarioRow[0].id_usuario,
                  grupoRow[0].id_grupo_permiso,
                  idGimnasio,
                ],
              );
            }
          }

          console.log(
            `Socio ${socio.email} creado (ID persona: ${idPersona}).`,
          );
        }

        idsSocios.push(idPersona);
        socioNutriMap.push({ idSocio: idPersona, idNutri: nutriId });
      }
    }

    // ── 4. Crear turnos (historial) ──
    const hoy = new Date(2026, 5, 8); // 8 Junio 2026
    let totalTurnos = 0;

    const addMinutes = (hora: string, mins: number): string => {
      const [h, m] = hora.split(':').map(Number);
      const total = h * 60 + m + mins;
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    for (const rel of socioNutriMap) {
      const diasPasados = [-60, -40, -20]; // ~2 meses atras, ~40 dias, ~20 dias
      const horasDia: [string, string][] = [
        ['10:00', '11:00'],
        ['11:00', '12:00'],
        ['15:00', '16:00'],
        ['09:00', '10:00'],
      ];

      // Obtener email del socio
      const socioEmailRow: unknown = await dataSource.query(
        `SELECT email FROM usuario WHERE id_persona = ? LIMIT 1`,
        [rel.idSocio],
      );
      const emailSocio = (socioEmailRow as { email: string }[])[0]?.email;
      const configSocio = SOCIOS_CONFIG[emailSocio] || {
        altura: 170,
        peso: 70,
        actividad: 'LIGERO',
        objetivo: 'Bienestar general',
      };

      // 3 turnos REALIZADO en el pasado
      for (let t = 0; t < 3; t++) {
        const fechaTurno = addDays(
          hoy,
          diasPasados[t] + Math.floor(Math.random() * 5),
        );
        const fechaStr = formatDate(fechaTurno);
        const horaIdx = (t + rel.idSocio) % horasDia.length;
        const hora = horasDia[horaIdx][0];

        const checkInStr = `${fechaStr} ${hora}:00`;
        const inicioStr = `${fechaStr} ${addMinutes(hora, 5)}:00`;
        const finStr = `${fechaStr} ${addMinutes(hora, 55)}:00`;

        // El peso evoluciona según el objetivo
        let pesoTurno = configSocio.peso;
        let diffGrasa = 0;
        if (
          configSocio.objetivo.toLowerCase().includes('reducir') ||
          configSocio.objetivo.toLowerCase().includes('bajar')
        ) {
          pesoTurno = configSocio.peso - t * 1.2;
          diffGrasa = -(t * 0.6);
        } else if (
          configSocio.objetivo.toLowerCase().includes('ganar') ||
          configSocio.objetivo.toLowerCase().includes('aumentar')
        ) {
          pesoTurno = configSocio.peso + t * 0.6;
          diffGrasa = -(t * 0.2);
        }

        const imcTurno = Number(
          (pesoTurno / Math.pow(configSocio.altura / 100, 2)).toFixed(2),
        );

        const resultTurno: unknown = await dataSource.query(
          `INSERT INTO turno (fecha, hora_turno, estado, creado_por, id_socio, id_nutricionista, id_gimnasio, check_in_at, consulta_iniciada_at, consulta_finalizada_at)
           VALUES (?, ?, 'REALIZADO', 'SOCIO', ?, ?, ?, ?, ?, ?)`,
          [
            fechaStr,
            hora,
            rel.idSocio,
            rel.idNutri,
            idGimnasio,
            checkInStr,
            inicioStr,
            finStr,
          ],
        );
        const idTurno = (resultTurno as { insertId: number }).insertId;

        // Observaciones y sugerencias evolutivas
        const comentarios = [
          'Primera consulta. Se realiza evaluacion antropometrica inicial. Reporta desorden en las comidas principales y consumo excesivo de ultraprocesados.',
          'Segunda consulta. El paciente muestra buena adherencia al plan. Se observa descenso en pliegues y perímetros. Refiere mayor energía.',
          'Tercera consulta. Progreso constante y adherencia consolidada. Refiere sentirse muy a gusto con las porciones y las opciones sugeridas.',
        ];
        const sugerencias = [
          'Estructurar las 4 comidas principales. Aumentar el consumo de vegetales y agua. Reducir azúcares libres.',
          'Mantener la estructura de comidas. Incorporar entrenamiento de fuerza 2-3 veces por semana.',
          'Ajustar porciones según el nivel de actividad física actual. Continuar con el entrenamiento regular.',
        ];
        const habitos = [
          'Sedentario, consume poca agua.',
          'Agregó caminatas diarias de 20 minutos, mejoró la hidratación.',
          'Realiza actividad física estructurada 3 veces por semana.',
        ];

        const resultObs: unknown = await dataSource.query(
          `INSERT INTO observacion_clinica (comentario, peso, altura, imc, sugerencias, habitos_socio, objetivos_socio, version, es_publica)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)`,
          [
            comentarios[t],
            pesoTurno,
            configSocio.altura,
            imcTurno,
            sugerencias[t],
            habitos[t],
            configSocio.objetivo,
          ],
        );
        const idObs = (resultObs as { insertId: number }).insertId;

        await dataSource.query(
          `UPDATE turno SET id_observacion = ? WHERE id_turno = ?`,
          [idObs, idTurno],
        );

        // Mediciones coherentes
        const cintura = 100 - t * 1.2;
        const cadera = 105 - t * 0.8;
        const brazo = 35 + t * 0.1;
        const muslo = 58 - t * 0.4;
        const pecho = 102 - t * 0.6;
        const porcentajeGrasa = Number((28 + diffGrasa).toFixed(2));
        const masaMagra = Number(
          (pesoTurno * (1 - porcentajeGrasa / 100)).toFixed(2),
        );

        await dataSource.query(
          `INSERT INTO medicion (peso, altura, imc, perimetro_cintura, perimetro_cadera, perimetro_brazo, perimetro_muslo, perimetro_pecho, pliegue_triceps, pliegue_abdominal, porcentaje_grasa, masa_magra, frecuencia_cardiaca, tension_sistolica, tension_diastolica, notas_medicion, id_turno, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 75, 120, 80, ?, ?, ?)`,
          [
            pesoTurno,
            configSocio.altura,
            imcTurno,
            cintura,
            cadera,
            brazo,
            muslo,
            pecho,
            15 - t,
            20 - t * 1.5,
            porcentajeGrasa,
            masaMagra,
            `Medición en turno del ${fechaStr}`,
            idTurno,
            checkInStr,
          ],
        );

        totalTurnos++;
      }

      // 1 turno REALIZADO extra (todos los turnos seed son realizados)
      const fechaFutura = addDays(hoy, 7 + Math.floor(Math.random() * 14));
      const horaFutura = horasDia[3][0];
      await dataSource.query(
        `INSERT INTO turno (fecha, hora_turno, estado, creado_por, id_socio, id_nutricionista, id_gimnasio)
         VALUES (?, ?, 'REALIZADO', 'SOCIO', ?, ?, ?)`,
        [
          formatDate(fechaFutura),
          horaFutura,
          rel.idSocio,
          rel.idNutri,
          idGimnasio,
        ],
      );
      totalTurnos++;
    }
    console.log(`Turnos creados: ${totalTurnos} (4 REALIZADO por socio).`);

    // ── 5. Crear planes de alimentación ──
    // 1 plan por nutricionista, para el primer socio de su grupo
    let totalPlanes = 0;

    for (let nIdx = 0; nIdx < idsNutricionistas.length; nIdx++) {
      const nutriId = idsNutricionistas[nIdx];
      // Primer socio del grupo (índice nIdx * 3)
      const socioIdx = nIdx * 3;
      const socioId = idsSocios[socioIdx];
      const objetivo = OBJETIVOS_PLANES[nIdx];

      if (!socioId) continue;

      // Verificar si ya tiene plan activo
      const planExistente: unknown = await dataSource.query(
        `SELECT id_plan_alimentacion FROM plan_alimentacion WHERE id_socio = ? AND activo = TRUE LIMIT 1`,
        [socioId],
      );
      const planExistenteRows = planExistente as {
        id_plan_alimentacion: number;
      }[];

      if (planExistenteRows.length > 0) {
        console.log(`  Socio ID ${socioId} ya tiene un plan activo.`);
        totalPlanes++;
        continue;
      }

      const rPlan: unknown = await dataSource.query(
        `INSERT INTO plan_alimentacion (fechaCreacion, objetivo_nutricional, activo, id_socio, id_nutricionista)
         VALUES (?, ?, TRUE, ?, ?)`,
        [formatDate(addDays(hoy, -10)), objetivo, socioId, nutriId],
      );
      const idPlan = (rPlan as { insertId: number }).insertId;

      // Crear días del plan (LUNES a DOMINGO)
      const diasSemana = [
        'LUNES',
        'MARTES',
        'MIÉRCOLES',
        'JUEVES',
        'VIERNES',
        'SÁBADO',
        'DOMINGO',
      ];
      for (let d = 0; d < diasSemana.length; d++) {
        const rDia: unknown = await dataSource.query(
          `INSERT INTO dia_plan (dia, orden, id_plan_alimentacion) VALUES (?, ?, ?)`,
          [diasSemana[d], d + 1, idPlan],
        );
        const idDia = (rDia as { insertId: number }).insertId;

        // Crear opciones de comida para cada día
        const comidas = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA'];
        for (const comida of comidas) {
          await dataSource.query(
            `INSERT INTO opcion_comida (tipo_comida, comentarios, id_dia_plan)
             VALUES (?, ?, ?)`,
            [
              comida,
              `Opción para ${comida.toLowerCase()} del plan generado automáticamente.`,
              idDia,
            ],
          );
        }
      }

      console.log(
        `Plan de alimentación para socio ID ${socioId} con nutricionista ID ${nutriId}: ${diasSemana.length} días, 4 comidas cada uno.`,
      );
      totalPlanes++;
    }
    console.log(`\nPlanes de alimentación creados: ${totalPlanes}.`);

    // ── Resumen ──
    console.log('\n=== Resumen El Cid ===');
    console.log(`Gimnasio:      ${GIMNASIO.nombre} (ID: ${idGimnasio})`);
    console.log(`Nutricionistas: ${idsNutricionistas.length}`);
    for (let i = 0; i < NUTRICIONISTAS.length; i++) {
      console.log(
        `  ${NUTRICIONISTAS[i].email} → ${NUTRICIONISTAS[i].nombre} ${NUTRICIONISTAS[i].apellido} (Mat: ${NUTRICIONISTAS[i].matricula})`,
      );
    }
    console.log(`Socios:         ${idsSocios.length}`);
    for (const rel of socioNutriMap) {
      console.log(`  ID ${rel.idSocio} → Nutri ID ${rel.idNutri}`);
    }
    console.log(`Turnos:         ${totalTurnos}`);
    console.log(`Planes:         ${totalPlanes}`);
    console.log('\nSeed El Cid completado.');
  } catch (error) {
    console.error('Error al ejecutar seed El Cid:', error);
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

void runSeedElCid();
