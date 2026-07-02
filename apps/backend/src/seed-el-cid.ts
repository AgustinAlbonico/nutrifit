// apps/backend/src/seed-el-cid.ts
//
// Seed para crear el gimnasio "El Cid" con:
//   - 3 nutricionistas (c/u con agenda)
//   - 3 socios por nutricionista (9 total)
//   - Historial de turnos (3-4 por socio, algunos REALIZADO y 1 CONFIRMADO)
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
  agenda: { dia: string; horaInicio: string; horaFin: string; duracionTurno: number }[];
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
      { dia: 'Lunes', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
      { dia: 'Martes', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
      { dia: 'Miércoles', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
      { dia: 'Jueves', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
      { dia: 'Viernes', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 60 },
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
      { dia: 'Lunes', horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
      { dia: 'Miércoles', horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
      { dia: 'Viernes', horaInicio: '14:00:00', horaFin: '19:00:00', duracionTurno: 45 },
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
      { dia: 'Martes', horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
      { dia: 'Jueves', horaInicio: '08:00:00', horaFin: '12:00:00', duracionTurno: 30 },
      { dia: 'Sábado', horaInicio: '09:00:00', horaFin: '13:00:00', duracionTurno: 30 },
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
    { email: 'socio-cid-a@nutrifit.com', nombre: 'Lucas', apellido: 'Mendoza', dni: '60001001', genero: 'MASCULINO', telefono: '341-555-7101', direccion: 'San Juan 850' },
    { email: 'socio-cid-b@nutrifit.com', nombre: 'Florencia', apellido: 'Rivas', dni: '60001002', genero: 'FEMENINO', telefono: '341-555-7102', direccion: 'Córdoba 1234' },
    { email: 'socio-cid-c@nutrifit.com', nombre: 'Tomás', apellido: 'Sosa', dni: '60001003', genero: 'MASCULINO', telefono: '341-555-7103', direccion: 'Mitre 567' },
  ],
  // Socios de Carolina Vega (nutri-cid2)
  [
    { email: 'socio-cid-d@nutrifit.com', nombre: 'Sofía', apellido: 'Peralta', dni: '60002001', genero: 'FEMENINO', telefono: '341-555-7201', direccion: 'Santa Fe 980' },
    { email: 'socio-cid-e@nutrifit.com', nombre: 'Gabriel', apellido: 'Álvarez', dni: '60002002', genero: 'MASCULINO', telefono: '341-555-7202', direccion: 'Rioja 345' },
    { email: 'socio-cid-f@nutrifit.com', nombre: 'Valentina', apellido: 'Castillo', dni: '60002003', genero: 'FEMENINO', telefono: '341-555-7203', direccion: 'Entre Ríos 210' },
  ],
  // Socios de Federico Linares (nutri-cid3)
  [
    { email: 'socio-cid-g@nutrifit.com', nombre: 'Mateo', apellido: 'Delgado', dni: '60003001', genero: 'MASCULINO', telefono: '341-555-7301', direccion: 'Buenos Aires 1500' },
    { email: 'socio-cid-h@nutrifit.com', nombre: 'Camila', apellido: 'Navarro', dni: '60003002', genero: 'FEMENINO', telefono: '341-555-7302', direccion: 'San Martín 780' },
    { email: 'socio-cid-i@nutrifit.com', nombre: 'Sebastián', apellido: 'Moreno', dni: '60003003', genero: 'MASCULINO', telefono: '341-555-7303', direccion: 'Belgrano 420' },
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
        [GIMNASIO.direccion, GIMNASIO.telefono, GIMNASIO.ciudad, GIMNASIO.email, idGimnasio],
      );
      console.log(`Gimnasio "${GIMNASIO.nombre}" ya existía (ID: ${idGimnasio}). Actualizado.`);
    } else {
      const resultado: unknown = await dataSource.query(
        `INSERT INTO gimnasio (nombre, direccion, telefono, ciudad, email_notificaciones, email_habilitado) VALUES (?, ?, ?, ?, ?, TRUE)`,
        [GIMNASIO.nombre, GIMNASIO.direccion, GIMNASIO.telefono, GIMNASIO.ciudad, GIMNASIO.email],
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
        console.log(`Nutricionista ${nutri.email} ya existía (ID persona: ${idPersona}).`);
      } else {
        const rp: unknown = await dataSource.query(
          `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, matricula, anios_experiencia, tarifa_sesion, presentacion, tipo_persona)
           VALUES (?, ?, '1987-04-10', 'OTRO', '341-555-6000', 'Sin direccion', 'Rosario', 'Santa Fe', ?, NULL, ?, 8, 7000, ?, 'NutricionistaOrmEntity')
           ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
          [nutri.nombre, nutri.apellido, idGimnasio, nutri.matricula, nutri.presentacion],
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
              [usuarioRow[0].id_usuario, grupoRow[0].id_grupo_permiso, idGimnasio],
            );
          }
        }

        // Certificaciones
        const certs = nutri.certificaciones.split(',').map(c => c.trim()).filter(Boolean);
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

        console.log(`Nutricionista ${nutri.email} creado (ID persona: ${idPersona}).`);
      }

      idsNutricionistas.push(idPersona);

      // Crear agenda (si no existe)
      for (const bloque of nutri.agenda) {
        await dataSource.query(
          `INSERT IGNORE INTO agenda (dia, hora_inicio, hora_fin, duracion_turno, id_nutricionista)
           VALUES (?, ?, ?, ?, ?)`,
          [bloque.dia, bloque.horaInicio, bloque.horaFin, bloque.duracionTurno, idPersona],
        );
      }
      const agendaCount = await dataSource.query(
        `SELECT COUNT(*) as count FROM agenda WHERE id_nutricionista = ?`,
        [idPersona],
      );
      console.log(`  Agenda: ${(agendaCount as { count: number }[])[0].count} bloques.`);
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
          console.log(`Socio ${socio.email} ya existía (ID persona: ${idPersona}).`);
        } else {
          const rp: unknown = await dataSource.query(
            `INSERT INTO persona (nombre, apellido, fecha_nacimiento, genero, telefono, direccion, ciudad, provincia, id_gimnasio, dni, fecha_alta, tipo_persona)
             VALUES (?, ?, '1995-07-20', ?, ?, ?, 'Rosario', 'Santa Fe', ?, ?, NOW(), 'SocioOrmEntity')
             ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
            [socio.nombre, socio.apellido, socio.genero, socio.telefono, socio.direccion, idGimnasio, socio.dni],
          );
          idPersona = (rp as { insertId: number }).insertId;

          await dataSource.query(
            `INSERT INTO usuario (email, contrasenia, rol, id_persona)
             VALUES (?, ?, 'SOCIO', ?)
             ON DUPLICATE KEY UPDATE id_usuario = LAST_INSERT_ID(id_usuario)`,
            [socio.email, contraseniaHash, idPersona],
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
                [usuarioRow[0].id_usuario, grupoRow[0].id_grupo_permiso, idGimnasio],
              );
            }
          }

          console.log(`Socio ${socio.email} creado (ID persona: ${idPersona}).`);
        }

        idsSocios.push(idPersona);
        socioNutriMap.push({ idSocio: idPersona, idNutri: nutriId });
      }
    }

    // ── 4. Crear turnos (historial) ──
    // A cada socio le asignamos 3-4 turnos con su nutricionista
    // - 2-3 turnos pasados (REALIZADO) con diferentes fechas
    // - 1 turno futuro (CONFIRMADO) para probar agenda
    const hoy = new Date(2026, 5, 8); // 8 Junio 2026
    let totalTurnos = 0;

    for (const rel of socioNutriMap) {
      const diasPasados = [ -60, -40, -20 ]; // ~2 meses atras, ~40 dias, ~20 dias
      const horasDia: [string, string][] = [
        ['10:00', '11:00'],
        ['11:00', '12:00'],
        ['15:00', '16:00'],
        ['09:00', '10:00'],
      ];

      // 3 turnos REALIZADO en el pasado
      for (let t = 0; t < 3; t++) {
        const fechaTurno = addDays(hoy, diasPasados[t] + Math.floor(Math.random() * 5));
        const horaIdx = (t + rel.idSocio) % horasDia.length;
        const hora = horasDia[horaIdx][0];

        await dataSource.query(
          `INSERT INTO turno (fecha, hora_turno, estado, creado_por, id_socio, id_nutricionista, id_gimnasio)
           VALUES (?, ?, 'REALIZADO', 'SOCIO', ?, ?, ?)`,
          [formatDate(fechaTurno), hora, rel.idSocio, rel.idNutri, idGimnasio],
        );
        totalTurnos++;
      }

      // 1 turno CONFIRMADO en el futuro cercano
      const fechaFutura = addDays(hoy, 7 + Math.floor(Math.random() * 14));
      const horaFutura = horasDia[3][0];
      await dataSource.query(
        `INSERT INTO turno (fecha, hora_turno, estado, creado_por, id_socio, id_nutricionista, id_gimnasio)
         VALUES (?, ?, 'CONFIRMADO', 'SOCIO', ?, ?, ?)`,
        [formatDate(fechaFutura), horaFutura, rel.idSocio, rel.idNutri, idGimnasio],
      );
      totalTurnos++;
    }
    console.log(`Turnos creados: ${totalTurnos} (3 REALIZADO + 1 CONFIRMADO por socio).`);

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
      const planExistenteRows = planExistente as { id_plan_alimentacion: number }[];

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
      const diasSemana = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
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
            [comida, `Opción para ${comida.toLowerCase()} del plan generado automáticamente.`, idDia],
          );
        }
      }

      console.log(`Plan de alimentación para socio ID ${socioId} con nutricionista ID ${nutriId}: ${diasSemana.length} días, 4 comidas cada uno.`);
      totalPlanes++;
    }
    console.log(`\nPlanes de alimentación creados: ${totalPlanes}.`);

    // ── Resumen ──
    console.log('\n=== Resumen El Cid ===');
    console.log(`Gimnasio:      ${GIMNASIO.nombre} (ID: ${idGimnasio})`);
    console.log(`Nutricionistas: ${idsNutricionistas.length}`);
    for (let i = 0; i < NUTRICIONISTAS.length; i++) {
      console.log(`  ${NUTRICIONISTAS[i].email} → ${NUTRICIONISTAS[i].nombre} ${NUTRICIONISTAS[i].apellido} (Mat: ${NUTRICIONISTAS[i].matricula})`);
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
