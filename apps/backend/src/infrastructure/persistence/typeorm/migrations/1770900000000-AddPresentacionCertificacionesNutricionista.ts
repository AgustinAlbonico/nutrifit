import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPresentacionCertificacionesNutricionista1770900000000
  implements MigrationInterface
{
  name = 'AddPresentacionCertificacionesNutricionista1770900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // IMPORTANTE: por single-table inheritance, "nutricionista" es una vista lógica;
    // las columnas viven en `persona` con tipo_persona='nutricionista'.
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `presentacion` TEXT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `certificaciones` TEXT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `persona` DROP COLUMN `certificaciones`');
    await queryRunner.query('ALTER TABLE `persona` DROP COLUMN `presentacion`');
  }
}
