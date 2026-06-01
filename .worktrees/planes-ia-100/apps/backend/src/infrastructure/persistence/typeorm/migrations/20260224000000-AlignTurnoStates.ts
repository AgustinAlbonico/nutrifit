import { MigrationInterface, QueryRunner } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export class AlignTurnoStatesAndAddColumns20260224000000 implements MigrationInterface {
  name = 'AlignTurnoStatesAndAddColumns20260224000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns (nullable for safe migration)
    await queryRunner.query(`
      ALTER TABLE \`turno\`
      ADD COLUMN \`motivo_cancelacion\` VARCHAR(500) NULL,
      ADD COLUMN \`fecha_original\` DATETIME NULL,
      ADD COLUMN \`id_gimnasio\` INT NULL
    `);

    // Step 2: Create gimnasio table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`gimnasio\` (
        \`id_gimnasio\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(100) NOT NULL,
        \`direccion\` VARCHAR(255) NOT NULL,
        \`telefono\` VARCHAR(15) NOT NULL,
        \`ciudad\` VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Step 3: Create politica_operativa table if not exists
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`politica_operativa\` (
        \`id_politica\` INT AUTO_INCREMENT PRIMARY KEY,
        \`id_gimnasio\` INT NOT NULL,
        \`plazo_cancelacion_horas\` INT NOT NULL DEFAULT 24,
        \`plazo_reprogramacion_horas\` INT NOT NULL DEFAULT 24,
        \`umbral_ausente_minutos\` INT NOT NULL DEFAULT 15,
        CONSTRAINT \`fk_politica_gimnasio\` FOREIGN KEY (\`id_gimnasio\`) REFERENCES \`gimnasio\`(\`id_gimnasio\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Step 4: Add FK for gimnasio on turno table
    await queryRunner.query(`
      ALTER TABLE \`turno\`
      ADD CONSTRAINT \`fk_turno_gimnasio\`
      FOREIGN KEY (\`id_gimnasio\`) REFERENCES \`gimnasio\`(\`id_gimnasio\`) ON DELETE SET NULL
    `);

    // Step 5: Rename enum values (drop and recreate to rename values)
    // First, update any existing rows that might use old enum values
    await queryRunner.query(`
      UPDATE \`turno\` SET \`estado\` = 'PROGRAMADO' WHERE \`estado\` = 'PENDIENTE'
    `);
    // Note: REALIZADO is kept as final state (ASISTIO was an intermediate name that was discarded)

    // Drop the old enum and create new one with renamed values
    await queryRunner.query(`
      ALTER TABLE \`turno\` MODIFY COLUMN \`estado\` ENUM(
        'PROGRAMADO',
        'PRESENTE',
        'EN_CURSO',
        'REALIZADO',
        'CANCELADO',
        'AUSENTE'
      ) NOT NULL
    `);

    // Step 6: Insert default Gimnasio and PoliticaOperativa for backward compatibility
    await queryRunner.query(`
      INSERT INTO \`gimnasio\` (\`nombre\`, \`direccion\`, \`telefono\`, \`ciudad\`)
      SELECT 'Gimnasio Principal', 'Dirección por defecto', '0000000000', 'Ciudad por defecto'
      WHERE NOT EXISTS (SELECT 1 FROM \`gimnasio\` WHERE \`id_gimnasio\` = 1)
    `);

    await queryRunner.query(`
      INSERT INTO \`politica_operativa\` (\`id_gimnasio\`, \`plazo_cancelacion_horas\`, \`plazo_reprogramacion_horas\`, \`umbral_ausente_minutos\`)
      SELECT 1, 24, 24, 15
      WHERE NOT EXISTS (SELECT 1 FROM \`politica_operativa\` WHERE \`id_gimnasio\` = 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore enum values (PROGRAMADO -> PENDIENTE)
    // Note: REALIZADO is the final state, no need to change it
    await queryRunner.query(`
      UPDATE \`turno\` SET \`estado\` = 'PENDIENTE' WHERE \`estado\` = 'PROGRAMADO'
    `);

    // Restore original enum
    await queryRunner.query(`
      ALTER TABLE \`turno\` MODIFY COLUMN \`estado\` ENUM(
        'PENDIENTE',
        'CANCELADO',
        'REALIZADO',
        'AUSENTE'
      ) NOT NULL
    `);

    // Drop FK constraint
    await queryRunner.query(`
      ALTER TABLE \`turno\` DROP FOREIGN KEY \`fk_turno_gimnasio\`
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE \`turno\` DROP COLUMN IF EXISTS \`id_gimnasio\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`turno\` DROP COLUMN IF EXISTS \`fecha_original\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`turno\` DROP COLUMN IF EXISTS \`motivo_cancelacion\`
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS \`politica_operativa\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`gimnasio\``);
  }
}
