import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntrenadorPersona20260302000000 implements MigrationInterface {
  name = 'AddEntrenadorPersona20260302000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns for Entrenador STI child (specialty + baja date)
    await queryRunner.query(`
      ALTER TABLE \`persona\`
      ADD COLUMN \`especialidad\` VARCHAR(100) NULL,
      ADD COLUMN \`fecha_baja\` DATETIME NULL
    `);

    // Now update existing rows with sensible defaults
    // entrenador rows will be identified by tipo_persona = 'Entrenador'
    await queryRunner.query(`
      UPDATE \`persona\` SET \`especialidad\` = 'General' WHERE \`tipo_persona\` = 'Entrenador' AND \`especialidad\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`persona\` DROP COLUMN \`fecha_baja\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`persona\` DROP COLUMN \`especialidad\`
    `);
  }
}
