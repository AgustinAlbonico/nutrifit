import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVersionToObservacionClinica1770800000000
  implements MigrationInterface
{
  name = 'AddVersionToObservacionClinica1770800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `observacion_clinica` ADD COLUMN `version` INT NOT NULL DEFAULT 1',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `observacion_clinica` DROP COLUMN `version`',
    );
  }
}
