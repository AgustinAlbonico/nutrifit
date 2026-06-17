export interface MigrationHistoryEntry {
  timestamp: number;
  name: string;
}

type MigrationConstructor = {
  new (...args: unknown[]): unknown;
  name: string;
  prototype?: {
    up?: unknown;
    down?: unknown;
  };
};

export interface LegacySchemaState {
  recordedMigrationNames: Set<string>;
  hasHistoricalSchema: boolean;
  hasStructuredProfessionalSchema: boolean;
}

export const HISTORICAL_BASELINE_TIMESTAMP = 20260616200000;
export const STRUCTURED_PROFESSIONAL_TIMESTAMP = 20260617150000;

export function parseMigrationArtifactName(
  fileName: string,
): MigrationHistoryEntry | null {
  const match = fileName.match(/^(\d+)-([^./]+)\.(?:ts|js)$/i);

  if (!match) return null;

  const [, rawTimestamp, rawName] = match;
  const timestamp = Number(rawTimestamp);

  if (!Number.isFinite(timestamp)) return null;

  return {
    timestamp,
    name: `${rawName}${rawTimestamp}`,
  };
}

export function extractMigrationEntriesFromModule(
  moduleExports: Record<string, unknown>,
): MigrationHistoryEntry[] {
  return Object.values(moduleExports)
    .filter(
      (candidate): candidate is MigrationConstructor =>
        typeof candidate === 'function' &&
        !!candidate.prototype &&
        'up' in candidate.prototype &&
        'down' in candidate.prototype,
    )
    .map((migrationClass) => {
      const match = migrationClass.name.match(/^(.*?)(\d+)$/);
      if (!match) return null;

      return {
        timestamp: Number(match[2]),
        name: migrationClass.name,
      };
    })
    .filter((entry): entry is MigrationHistoryEntry => entry !== null);
}

export function resolveMigrationsToRecord(
  availableMigrations: MigrationHistoryEntry[],
  state: LegacySchemaState,
): MigrationHistoryEntry[] {
  return availableMigrations.filter((migration) => {
    if (state.recordedMigrationNames.has(migration.name)) {
      return false;
    }

    if (
      state.hasHistoricalSchema &&
      migration.timestamp <= HISTORICAL_BASELINE_TIMESTAMP
    ) {
      return true;
    }

    if (
      state.hasStructuredProfessionalSchema &&
      migration.timestamp === STRUCTURED_PROFESSIONAL_TIMESTAMP
    ) {
      return true;
    }

    return false;
  });
}
