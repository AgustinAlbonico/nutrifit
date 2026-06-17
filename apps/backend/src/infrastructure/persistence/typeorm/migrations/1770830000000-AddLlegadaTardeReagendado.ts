import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLlegadaTardeReagendado1770830000000 implements MigrationInterface {
  name = 'AddLlegadaTardeReagendado1770830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `turno` ADD COLUMN `llegada_tarde_min` INT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `turno` ADD COLUMN `reagendado_en_id` INT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `turno` DROP COLUMN `reagendado_en_id`',
    );
    await queryRunner.query(
      'ALTER TABLE `turno` DROP COLUMN `llegada_tarde_min`',
    );
  }
}
