import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAusenteMotivoToTurno1770820000000
  implements MigrationInterface
{
  name = 'AddAusenteMotivoToTurno1770820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `turno` ADD COLUMN `ausente_motivo` VARCHAR(500) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `ausente_motivo`');
  }
}
