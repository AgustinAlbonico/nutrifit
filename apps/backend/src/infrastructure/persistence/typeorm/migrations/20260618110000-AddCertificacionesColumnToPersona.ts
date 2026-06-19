import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificacionesColumnToPersona20260618110000 implements MigrationInterface {
  name = 'AddCertificacionesColumnToPersona20260618110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnas = (await queryRunner.query(
      `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'persona'
          AND COLUMN_NAME = 'certificaciones'
      `,
    )) as Array<{ COLUMN_NAME: string }>;

    if (columnas.length === 0) {
      await queryRunner.query(
        'ALTER TABLE `persona` ADD COLUMN `certificaciones` TEXT NULL',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` DROP COLUMN `certificaciones`',
    );
  }
}
