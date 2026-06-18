import 'reflect-metadata';
import { readdirSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  extractMigrationEntriesFromModule,
  parseMigrationArtifactName,
  resolveMigrationsToRecord,
} from 'src/infrastructure/config/typeorm/migration-history';

type MigrationRow = { timestamp: number; name: string };

async function tableExists(
  dataSource: DataSource,
  tableName: string,
): Promise<boolean> {
  const rows = await dataSource.query('SHOW TABLES LIKE ?', [tableName]);
  return rows.length > 0;
}

async function columnMetadata(
  dataSource: DataSource,
  tableName: string,
  columnName: string,
): Promise<{ type: string; nullable: boolean } | null> {
  const rows = await dataSource.query(
    `
      SELECT COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    type: row.columnType,
    nullable: row.isNullable === 'YES',
  };
}

async function main(): Promise<void> {
  const migrationsDir = join(
    process.cwd(),
    'dist',
    'infrastructure',
    'persistence',
    'typeorm',
    'migrations',
  );

  const availableMigrations = readdirSync(migrationsDir)
    .filter((fileName) => /^\d+-.+\.js$/i.test(fileName))
    .flatMap((fileName) => {
      const modulePath = join(migrationsDir, fileName);
      const moduleExports = require(modulePath) as Record<string, unknown>;
      const fromModule = extractMigrationEntriesFromModule(moduleExports);

      if (fromModule.length > 0) {
        return fromModule;
      }

      const fallback = parseMigrationArtifactName(fileName);
      return fallback ? [fallback] : [];
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    username: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? 'root',
    database: process.env.DATABASE_NAME ?? 'nutrifit_supervisor',
  });

  await dataSource.initialize();

  try {
    await dataSource.query(
      `
        CREATE TABLE IF NOT EXISTS migrations (
          id int NOT NULL AUTO_INCREMENT,
          timestamp bigint NOT NULL,
          name varchar(255) NOT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB
      `,
    );

    const recorded = await dataSource.query(
      'SELECT timestamp, name FROM migrations ORDER BY timestamp',
    );

    const validMigrationNames = new Set(
      availableMigrations.map((migration) => migration.name),
    );

    for (const migration of recorded) {
      const hasMatchingTimestamp = availableMigrations.some(
        (available) => available.timestamp === migration.timestamp,
      );

      if (!validMigrationNames.has(migration.name) && hasMatchingTimestamp) {
        await dataSource.query(
          'DELETE FROM migrations WHERE timestamp = ? AND name = ?',
          [migration.timestamp, migration.name],
        );
        console.log(
          `repair-migration-history: removed invalid row ${migration.name} (${migration.timestamp})`,
        );
      }
    }

    const repairedRecorded = (await dataSource.query(
      'SELECT timestamp, name FROM migrations ORDER BY timestamp',
    )) as MigrationRow[];

    const recordedMigrationNames = new Set<string>(
      repairedRecorded.map((migration) => migration.name),
    );

    const hasHistoricalSchema =
      (await tableExists(dataSource, 'foto_progreso')) &&
      (await tableExists(dataSource, 'notificacion')) &&
      (await tableExists(dataSource, 'diploma'));

    const certTableExists = await tableExists(dataSource, 'certificacion');
    const formacionNivel = await columnMetadata(
      dataSource,
      'formacion_academica',
      'nivel',
    );
    const formacionAnioFin = await columnMetadata(
      dataSource,
      'formacion_academica',
      'anio_fin',
    );

    const hasStructuredProfessionalSchema =
      certTableExists &&
      formacionNivel?.type.includes('GRADO') === true &&
      formacionAnioFin?.nullable === true;

    const toRecord = resolveMigrationsToRecord(availableMigrations, {
      recordedMigrationNames,
      hasHistoricalSchema,
      hasStructuredProfessionalSchema,
    });

    if (toRecord.length === 0) {
      console.log('repair-migration-history: no changes needed');
      return;
    }

    for (const migration of toRecord) {
      await dataSource.query(
        'INSERT INTO migrations(timestamp, name) VALUES (?, ?)',
        [migration.timestamp, migration.name],
      );
      console.log(
        `repair-migration-history: registered ${migration.name} (${migration.timestamp})`,
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('repair-migration-history failed', error);
  process.exit(1);
});
