import {
  extractMigrationEntriesFromModule,
  HISTORICAL_BASELINE_TIMESTAMP,
  STRUCTURED_PROFESSIONAL_TIMESTAMP,
  parseMigrationArtifactName,
  resolveMigrationsToRecord,
} from './migration-history';

describe('migration-history helpers', () => {
  it('parsea artifacts TypeORM a timestamp + class name', () => {
    expect(
      parseMigrationArtifactName('20260616200000-CreateDiplomaTable.js'),
    ).toEqual({
      timestamp: 20260616200000,
      name: 'CreateDiplomaTable20260616200000',
    });

    expect(parseMigrationArtifactName('align-turno-states.spec.ts')).toBeNull();
  });

  it('extrae el nombre real de clase cuando no coincide con el filename', () => {
    class AlignTurnoStatesAndAddColumns20260224000000 {
      up() {}
      down() {}
    }

    expect(
      extractMigrationEntriesFromModule({
        AlignTurnoStatesAndAddColumns20260224000000,
      }),
    ).toEqual([
      {
        timestamp: 20260224000000,
        name: 'AlignTurnoStatesAndAddColumns20260224000000',
      },
    ]);
  });

  it('marca migraciones históricas cuando el schema ya existe pero falta historia', () => {
    const result = resolveMigrationsToRecord(
      [
        {
          timestamp: HISTORICAL_BASELINE_TIMESTAMP,
          name: 'CreateDiplomaTable20260616200000',
        },
        {
          timestamp: STRUCTURED_PROFESSIONAL_TIMESTAMP,
          name: 'AddStructuredCertificacionesAndNivelFormacion20260617150000',
        },
      ],
      {
        recordedMigrationNames: new Set(['PlanAlimentacionDias20260220000000']),
        hasHistoricalSchema: true,
        hasStructuredProfessionalSchema: false,
      },
    );

    expect(result).toEqual([
      {
        timestamp: HISTORICAL_BASELINE_TIMESTAMP,
        name: 'CreateDiplomaTable20260616200000',
      },
    ]);
  });

  it('solo marca la migración estructurada si el schema nuevo ya está presente', () => {
    const result = resolveMigrationsToRecord(
      [
        {
          timestamp: STRUCTURED_PROFESSIONAL_TIMESTAMP,
          name: 'AddStructuredCertificacionesAndNivelFormacion20260617150000',
        },
      ],
      {
        recordedMigrationNames: new Set(),
        hasHistoricalSchema: false,
        hasStructuredProfessionalSchema: true,
      },
    );

    expect(result).toEqual([
      {
        timestamp: STRUCTURED_PROFESSIONAL_TIMESTAMP,
        name: 'AddStructuredCertificacionesAndNivelFormacion20260617150000',
      },
    ]);
  });
});
