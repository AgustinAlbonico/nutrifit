import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddObservacionesToPersona20260616020000 implements MigrationInterface {
  name = 'AddObservacionesToPersona20260616020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `observaciones` TEXT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` DROP COLUMN `observaciones`',
    );
  }
}
