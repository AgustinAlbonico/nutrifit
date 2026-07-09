import 'reflect-metadata';
import { readdirSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  extractMigrationEntriesFromModule,
  parseMigrationArtifactName,
} from 'src/infrastructure/config/typeorm/migration-history';

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

    const recorded = (await dataSource.query(
      'SELECT timestamp, name FROM migrations ORDER BY timestamp',
    )) as { timestamp: number; name: string }[];

    const recordedNames = new Set(recorded.map((r) => r.name));

    // Si la DB ya tiene tablas pero no tiene registros de migración,
    // marcar todas las migraciones como ejecutadas.
    const tables = await dataSource.query('SHOW TABLES');
    const hasSchema = tables.length > 1; // más que solo la tabla migrations

    const toRecord = availableMigrations.filter(
      (m) => !recordedNames.has(m.name) && hasSchema,
    );

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
