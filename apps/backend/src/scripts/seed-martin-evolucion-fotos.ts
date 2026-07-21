import 'reflect-metadata';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as Minio from 'minio';

dotenv.config({ path: '.env' });

type TipoFoto = 'frente' | 'perfil' | 'espalda' | 'otro';
type EtapaVisual = 'inicial' | 'media' | 'final';

type FuenteLibre = {
  url: string;
  credito: string;
};

type TurnoMartin = {
  turnoId: number;
  fechaTurno: Date | string;
  horaTurno: string;
};

const FUENTES_LIBRES: Record<TipoFoto, Record<EtapaVisual, FuenteLibre>> = {
  frente: {
    inicial: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Hitman_hart_on_front_double_biceps_pose..jpg',
      credito: 'Wikimedia Commons - Hitman hart on front double biceps pose',
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Anthony_the_bodybuilder.jpg',
      credito: 'Wikimedia Commons - Anthony the bodybuilder',
    },
    final: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/David_Henry%2C_bodybuilder_%2815_October_2005%29.jpg',
      credito: 'Wikimedia Commons - David Henry, bodybuilder',
    },
  },
  perfil: {
    inicial: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Hitman_on_side_chest_pose..jpg',
      credito: 'Wikimedia Commons - Hitman on side chest pose',
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Colker_gym.jpg',
      credito: 'Wikimedia Commons - Colker gym',
    },
    final: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Andy_Howarth%2C_Mr_Universe_Junior_Finalist_16_58_40_975000.jpeg',
      credito: 'Wikimedia Commons - Andy Howarth, Mr Universe Junior Finalist',
    },
  },
  espalda: {
    inicial: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Bodybuilder_Eugene_Rapin_from_behind_flexing_biceps_Wellcome_L0038400.jpg',
      credito:
        'Wikimedia Commons - Bodybuilder Eugene Rapin from behind flexing biceps',
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Fisicoculturismo_argentino_AFCA_1%C2%AA_lugar_Torneo_Mr_Valentin_Alsina_1970_categoria_Novicios.jpg_altura_1%2C85_mts_peso_89_kilos%2Cpose_de_espalda.jpg',
      credito: 'Wikimedia Commons - Fisicoculturismo argentino pose de espalda',
    },
    final: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Male_bodybuilder%2C_a_product_of_physical_culture%2C_c._1906_Wellcome_L0039140.jpg',
      credito:
        'Wikimedia Commons - Male bodybuilder, a product of physical culture',
    },
  },
  otro: {
    inicial: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/A_male_bodybuilder_wearing_bathing_trunks_Wellcome_L0034521.jpg',
      credito: 'Wikimedia Commons - A male bodybuilder wearing bathing trunks',
    },
    media: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/African_american_bodybuilder_tony_pearson_posing.jpg',
      credito:
        'Wikimedia Commons - African american bodybuilder Tony Pearson posing',
    },
    final: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Bodybuilder_Emile_Royer_in_bicep-curling_pose_Wellcome_L0038399.jpg',
      credito:
        'Wikimedia Commons - Bodybuilder Emile Royer in bicep-curling pose',
    },
  },
};

function resolverEtapaVisual(indice: number, totalTurnos: number): EtapaVisual {
  if (indice < Math.ceil(totalTurnos / 3)) return 'inicial';
  if (indice < Math.ceil((totalTurnos * 2) / 3)) return 'media';
  return 'final';
}

function formatearFechaISO(fecha: Date | string): string {
  const fechaReal = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return fechaReal.toISOString().slice(0, 10);
}

async function asegurarBucketExiste(
  client: Minio.Client,
  bucketName: string,
): Promise<void> {
  const existe = await client.bucketExists(bucketName);
  if (existe) return;

  await client.makeBucket(bucketName, 'us-east-1');
  await client.setBucketPolicy(
    bucketName,
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    }),
  );
}

async function dormir(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function resolverUrlDescarga(url: string): string {
  if (!url.includes('upload.wikimedia.org/wikipedia/commons/')) {
    return url;
  }

  if (url.includes('/thumb/')) {
    return url;
  }

  const base = 'https://upload.wikimedia.org/wikipedia/commons/';
  const rutaRelativa = url.slice(base.length);
  const ultimaBarra = rutaRelativa.lastIndexOf('/');
  const directorio = rutaRelativa.slice(0, ultimaBarra);
  const archivo = rutaRelativa.slice(ultimaBarra + 1);
  return `${base}thumb/${directorio}/${archivo}/960px-${archivo}`;
}

function descargarConCurl(urlDescarga: string): Buffer {
  const directorioTemporal = mkdtempSync(
    join(tmpdir(), 'nutrifit-martin-fotos-'),
  );
  const archivoTemporal = join(directorioTemporal, 'imagen.jpg');

  try {
    execFileSync(
      'curl.exe',
      [
        '-L',
        '-A',
        'Mozilla/5.0',
        '-H',
        'Accept: image/*,*/*;q=0.8',
        '-H',
        'Referer: https://commons.wikimedia.org/',
        '--output',
        archivoTemporal,
        urlDescarga,
      ],
      { stdio: 'ignore' },
    );

    return readFileSync(archivoTemporal);
  } finally {
    rmSync(directorioTemporal, { recursive: true, force: true });
  }
}

async function descargarBufferConReintentos(url: string): Promise<Buffer> {
  let ultimoError: Error | null = null;
  const urlDescarga = resolverUrlDescarga(url);

  for (let intento = 1; intento <= 4; intento += 1) {
    try {
      return descargarConCurl(urlDescarga);
    } catch (error) {
      ultimoError =
        error instanceof Error
          ? error
          : new Error(`No se pudo descargar ${urlDescarga}`);
    }

    if (intento === 4) {
      break;
    }

    await dormir(intento * 1500);
  }

  throw ultimoError ?? new Error(`No se pudo descargar ${url}`);
}

async function run(): Promise<void> {
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
  const bucketName = process.env.MINIO_BUCKET_NAME || 'nutrifit-fotos-perfil';
  const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: String(process.env.MINIO_USE_SSL).toLowerCase() === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  });

  const cacheArchivos = new Map<string, Buffer>();

  try {
    await dataSource.initialize();
    await asegurarBucketExiste(minioClient, bucketName);

    const socioRows = await dataSource.query(
      `
        SELECT p.id_persona AS socioId
        FROM usuario u
        INNER JOIN persona p ON p.id_persona = u.id_persona
        WHERE u.email = ?
        LIMIT 1
      `,
      ['martin-evolucion@nutrifit.com'],
    );

    const socioId = socioRows[0]?.socioId;
    if (!socioId) {
      throw new Error('No se encontró a martin-evolucion@nutrifit.com');
    }

    const turnos = await dataSource.query(
      `
        SELECT id_turno AS turnoId, fecha AS fechaTurno, hora_turno AS horaTurno
        FROM turno
        WHERE id_socio = ?
        ORDER BY fecha ASC, hora_turno ASC
      `,
      [socioId],
    );

    if (turnos.length === 0) {
      throw new Error('Martín no tiene turnos para asociar fotos');
    }

    const fotosExistentes = await dataSource.query(
      `SELECT id_foto, object_key AS objectKey FROM foto_progreso WHERE id_socio = ?`,
      [socioId],
    );

    for (const foto of fotosExistentes) {
      try {
        await minioClient.removeObject(bucketName, foto.objectKey);
      } catch {
        // Si no existe en MinIO igual limpiamos la fila.
      }
    }

    await dataSource.query(`DELETE FROM foto_progreso WHERE id_socio = ?`, [
      socioId,
    ]);

    for (let indice = 0; indice < turnos.length; indice += 1) {
      const turno = turnos[indice];
      const etapa = resolverEtapaVisual(indice, turnos.length);
      const fechaISO = formatearFechaISO(turno.fechaTurno);
      const horaLimpia = turno.horaTurno.slice(0, 5).replace(':', '-');
      const fechaFoto = new Date(
        `${fechaISO}T${turno.horaTurno.slice(0, 5)}:00`,
      );

      for (const tipo of Object.keys(FUENTES_LIBRES) as TipoFoto[]) {
        const fuente = FUENTES_LIBRES[tipo][etapa];

        let buffer = cacheArchivos.get(fuente.url);
        if (!buffer) {
          buffer = await descargarBufferConReintentos(fuente.url);
          cacheArchivos.set(fuente.url, buffer);
        }

        const objectKey = `progreso/seed/martin-evolucion/${tipo}/${fechaISO}_${horaLimpia}_${turno.turnoId}_${etapa}.jpg`;

        await minioClient.putObject(
          bucketName,
          objectKey,
          buffer,
          buffer.length,
          {
            'Content-Type': 'image/jpeg',
          },
        );

        await dataSource.query(
          `
            INSERT INTO foto_progreso (id_socio, id_turno, tipo_foto, object_key, mime_type, notas, fecha)
            VALUES (?, ?, ?, ?, 'image/jpeg', ?, ?)
          `,
          [
            socioId,
            turno.turnoId,
            tipo,
            objectKey,
            `Foto seed ${tipo} (${etapa}) - ${fuente.credito}`,
            fechaFoto,
          ],
        );
      }
    }

    console.log(`Fotos seed cargadas para Martín: ${turnos.length * 4}`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void run().catch((error) => {
  console.error('seed-martin-evolucion-fotos falló', error);
  process.exit(1);
});
