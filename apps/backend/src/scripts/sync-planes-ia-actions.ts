/**
 * Script para sincronizar las acciones de plan-alimentacion-ia-v2 con la BD.
 *
 * **Por qué existe**: cuando se mergeó el feature plan-alimentacion-ia-v2
 * (commits en main), el código del backend (controller + use-cases) empezó a
 * referenciar acciones nuevas como `PLANES_IA_GENERAR`, `PLANES_ACTIVAR`, etc.
 * Pero estas acciones NO se agregaron automáticamente a la tabla `accion` ni se
 * vincularon al grupo NUTRICIONISTA en `grupo_permiso_accion`. Resultado:
 * los NUT existentes en la BD tienen un JWT sin estas acciones → al intentar
 * `POST /ia/plan-semanal` el `ActionsGuard` devuelve 403 "No tenés permisos".
 *
 * **Cuándo correr**:
 *  1. Después de mergear plan-alimentacion-ia-v2 a main.
 *  2. Cuando un NUT reporta 403 al generar planes con IA.
 *  3. Periódicamente en CI/CD como parte del seed.
 *
 * **Uso**:
 *   cd apps/backend
 *   npx ts-node -r tsconfig-paths/register src/scripts/sync-planes-ia-actions.ts
 *
 * **Idempotencia**: usa INSERT ... ON DUPLICATE KEY UPDATE e INSERT IGNORE,
 * así que se puede correr múltiples veces sin errores.
 */

import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { config as cargarVariablesEntorno } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';
import { AppDataSource } from 'src/infrastructure/config/typeorm/typeorm.config';

interface AccionSync {
  clave: string;
  nombre: string;
}

interface ResultadoMysqlInsert {
  affectedRows?: number;
}

async function ejecutarInsert(
  ds: DataSource,
  sql: string,
  params: unknown[],
): Promise<ResultadoMysqlInsert> {
  const result: unknown = await ds.query(sql, params);
  return result as ResultadoMysqlInsert;
}

const ACCIONES_PLANES_IA: AccionSync[] = [
  { clave: 'planes-ia.generar', nombre: 'Generar plan con IA' },
  { clave: 'planes-ia.regenerar', nombre: 'Regenerar plan con IA' },
  { clave: 'planes-ia.feedback', nombre: 'Votar plan con IA' },
  { clave: 'planes-ia.memoria.editar', nombre: 'Editar memoria IA' },
  { clave: 'planes.activar', nombre: 'Activar plan' },
  { clave: 'planes.finalizar', nombre: 'Finalizar plan' },
];

async function main(): Promise<void> {
  cargarVariablesEntorno();
  const configService = new EnvironmentConfigService(new ConfigService());
  const ds = new DataSource(AppDataSource(configService) as DataSourceOptions);
  await ds.initialize();
  console.log('DataSource inicializado. Sincronizando acciones…\n');

  // 1. Insertar cada acción (idempotente)
  for (const a of ACCIONES_PLANES_IA) {
    const result = await ejecutarInsert(
      ds,
      `INSERT INTO accion (clave, nombre)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
      [a.clave, a.nombre],
    );
    console.log(`✓ Acción "${a.clave}" (affected: ${result.affectedRows})`);
  }

  // 2. Vincular al grupo NUTRICIONISTA (idempotente)
  console.log('\nVinculando al grupo NUTRICIONISTA…');
  const grupos: Array<{ id_grupo_permiso: number; clave: string }> =
    await ds.query(
      "SELECT id_grupo_permiso, clave FROM grupo_permiso WHERE clave = 'NUTRICIONISTA'",
    );

  if (grupos.length === 0) {
    console.warn(
      '⚠ No se encontró el grupo NUTRICIONISTA. Skipeando vinculación.',
    );
  } else {
    const grupoId = grupos[0].id_grupo_permiso;
    for (const a of ACCIONES_PLANES_IA) {
      const result = await ejecutarInsert(
        ds,
        `INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
         SELECT ?, id_accion FROM accion WHERE clave = ?`,
        [grupoId, a.clave],
      );
      console.log(
        `  ✓ ${a.clave} → grupo NUTRICIONISTA (affected: ${result.affectedRows})`,
      );
    }
  }

  // 3. Verificación
  console.log('\nAcciones del grupo NUTRICIONISTA:');
  const acciones: Array<{ clave: string }> = await ds.query(
    `SELECT a.clave
     FROM accion a
     JOIN grupo_permiso_accion gpa ON gpa.id_accion = a.id_accion
     JOIN grupo_permiso gp ON gp.id_grupo_permiso = gpa.id_grupo_permiso
     WHERE gp.clave = 'NUTRICIONISTA'
     ORDER BY a.clave`,
  );
  console.table(acciones);

  await ds.destroy();
  console.log(
    '\nListo. Las acciones de plan-alimentacion-ia-v2 están sincronizadas.',
  );
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
