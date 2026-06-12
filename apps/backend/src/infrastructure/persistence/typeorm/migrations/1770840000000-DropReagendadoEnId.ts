import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropReagendadoEnId1770840000000 implements MigrationInterface {
  name = 'DropReagendadoEnId1770840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `reagendado_en_id`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `turno` ADD COLUMN `reagendado_en_id` INT NULL',
    );
  }
}
