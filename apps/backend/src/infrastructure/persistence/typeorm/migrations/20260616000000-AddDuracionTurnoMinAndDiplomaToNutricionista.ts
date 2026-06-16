import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDuracionTurnoMinAndDiplomaToNutricionista20260616000000 implements MigrationInterface {
  name = 'AddDuracionTurnoMinAndDiplomaToNutricionista20260616000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // IMPORTANTE: por single-table inheritance, "nutricionista" es una vista lógica;
    // las columnas viven en `persona` con tipo_persona='nutricionista'.
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `duracion_turno_min` INT NOT NULL DEFAULT 30',
    );
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `matricula_documento_key` VARCHAR(255) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` DROP COLUMN `matricula_documento_key`',
    );
    await queryRunner.query(
      'ALTER TABLE `persona` DROP COLUMN `duracion_turno_min`',
    );
  }
}
