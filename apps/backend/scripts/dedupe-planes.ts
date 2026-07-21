/**
 * Dedupe de planes de alimentación legacy.
 *
 * Para cada par (id_socio, id_nutricionista) deja como máximo un plan "vivo"
 * (sin eliminadoEn) y marca el resto como soft-deleted. Conserva el de mayor
 * idPlanAlimentacion (el más reciente).
 *
 * Por qué: el seed-multi-tenant.ts no era idempotente para `plan_alimentacion`
 * (no usaba ON DUPLICATE KEY ni check de existencia), así que tras varias
 * corridas del seed quedaban N planes para el mismo (socio, nutri).
 * `CrearPlanManualVacioUseCase` ya validaba la invariante runtime; este
 * script la aplica sobre los datos legacy.
 *
 * Idempotente: re-ejecutable. Si solo hay 1 plan vivo por par, no marca
 * ninguno.
 *
 * Uso:
 *   npm run dedupe:planes       # desde apps/backend o raíz del monorepo.
 *
 * Conexión: lee apps/backend/.env. Si no existe, sale con error claro.
 */

import 'dotenv/config';
import * as path from 'node:path';
import { createConnection, RowDataPacket } from 'mysql2/promise';

interface ConteoPorPar {
  idSocio: number;
  idNutricionista: number;
  totalPlanes: number;
  vivos: number;
}

interface ParDuplicado {
  idSocio: number;
  idNutricionista: number;
  planesABorrar: number[];
  planConservado: number;
}

const RUTA_ENV = path.resolve(__dirname, '..', '.env');
const MOTIVO_ELIMINACION = 'cleanup_dedupe_planes_legacy';

async function cargarEnv(): Promise<void> {
  // dotenv ya carga desde cwd(); forzamos la ruta del backend por si se
  // ejecuta desde la raíz del monorepo.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  dotenv.config({ path: RUTA_ENV });
}

async function obtenerConteoDuplicados(
  conn: Awaited<ReturnType<typeof createConnection>>,
): Promise<ParDuplicado[]> {
  // Agrupa planes "vivos" (sin eliminadoEn) por par; deja solo el de mayor id.
  const [filas] = await conn.query<(RowDataPacket & {
    id_socio: number;
    id_nutricionista: number;
    ids_planes: string;
  })[]>(
    `
    SELECT id_socio,
           id_nutricionista,
           GROUP_CONCAT(id_plan_alimentacion ORDER BY id_plan_alimentacion) AS ids_planes,
           COUNT(*) AS total
    FROM plan_alimentacion
    WHERE eliminado_en IS NULL
    GROUP BY id_socio, id_nutricionista
    HAVING total > 1
    `,
  );

  return filas.map((fila) => {
    const ids = fila.ids_planes.split(',').map((s) => parseInt(s, 10));
    const maxId = Math.max(...ids);
    const aBorrar = ids.filter((id) => id !== maxId);
    return {
      idSocio: fila.id_socio,
      idNutricionista: fila.id_nutricionista,
      planesABorrar: aBorrar,
      planConservado: maxId,
    };
  });
}

async function obtenerConteoTotal(
  conn: Awaited<ReturnType<typeof createConnection>>,
): Promise<ConteoPorPar[]> {
  const [filas] = await conn.query<(RowDataPacket & {
    id_socio: number;
    id_nutricionista: number;
    total: number;
    vivos: number;
  })[]>(
    `
    SELECT id_socio,
           id_nutricionista,
           COUNT(*) AS total,
           SUM(CASE WHEN eliminado_en IS NULL THEN 1 ELSE 0 END) AS vivos
    FROM plan_alimentacion
    GROUP BY id_socio, id_nutricionista
    ORDER BY total DESC
    LIMIT 20
    `,
  );
  return filas.map((f) => ({
    idSocio: f.id_socio,
    idNutricionista: f.id_nutricionista,
    totalPlanes: f.total,
    vivos: f.vivos,
  }));
}

async function marcarComoEliminados(
  conn: Awaited<ReturnType<typeof createConnection>>,
  ids: number[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const [resultado] = await conn.query(
    `
    UPDATE plan_alimentacion
    SET eliminado_en = NOW(),
        motivo_eliminacion = ?
    WHERE id_plan_alimentacion IN (?)
      AND eliminado_en IS NULL
    `,
    [MOTIVO_ELIMINACION, ids],
  );
  return (resultado as { affectedRows: number }).affectedRows;
}

async function main(): Promise<void> {
  await cargarEnv();

  const host = process.env.DATABASE_HOST;
  const port = Number(process.env.DATABASE_PORT);
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;

  if (!host || !port || !user || !password || !database) {
    throw new Error(
      `[dedupe-planes] Variables DATABASE_* faltantes en .env (buscado en: ${RUTA_ENV}).`,
    );
  }

  const conn = await createConnection({
    host,
    port,
    user,
    password,
    database,
    charset: 'utf8mb4',
    timezone: '-03:00',
  });

  try {
    console.log(`[dedupe-planes] Conectado a ${database}@${host}:${port}`);

    console.log('\n[dedupe-planes] Top 20 pares (socio, nutri) por total de planes:');
    const top = await obtenerConteoTotal(conn);
    for (const c of top) {
      console.log(
        `  socio=${c.idSocio} nutri=${c.idNutricionista} total=${c.totalPlanes} vivos=${c.vivos}`,
      );
    }

    const duplicados = await obtenerConteoDuplicados(conn);
    if (duplicados.length === 0) {
      console.log('\n[dedupe-planes] No hay duplicados vivos. Nada que hacer.');
      return;
    }

    console.log(
      `\n[dedupe-planes] Pares con duplicados: ${duplicados.length}. Detalle:`,
    );
    for (const d of duplicados) {
      console.log(
        `  socio=${d.idSocio} nutri=${d.idNutricionista} conservo=${d.planConservado} borro=${JSON.stringify(d.planesABorrar)}`,
      );
    }

    console.log('\n[dedupe-planes] Aplicando soft delete (motivo = cleanup)…');
    let total = 0;
    for (const d of duplicados) {
      const afectados = await marcarComoEliminados(conn, d.planesABorrar);
      total += afectados;
      console.log(
        `  socio=${d.idSocio} nutri=${d.idNutricionista} -> ${afectados}/${d.planesABorrar.length} actualizados`,
      );
    }

    console.log(`\n[dedupe-planes] Listo. ${total} planes marcados como eliminado.`);
    console.log(
      '[dedupe-planes] Re-ejecutable: si lo corrés de nuevo, no hará nada porque ya no hay vivos duplicados.',
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('[dedupe-planes] Error fatal:', err);
  process.exit(1);
});
