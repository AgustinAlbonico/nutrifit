import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDebeCambiarPasswordToUsuario20260616010000 implements MigrationInterface {
  name = 'AddDebeCambiarPasswordToUsuario20260616010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `usuario` ADD COLUMN `debe_cambiar_password` TINYINT(1) NOT NULL DEFAULT 0',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `usuario` DROP COLUMN `debe_cambiar_password`',
    );
  }
}
