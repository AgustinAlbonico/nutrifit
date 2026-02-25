import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFotoPerfilKeyToPersona1768500000000 implements MigrationInterface {
  name = 'AddFotoPerfilKeyToPersona1768500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` ADD COLUMN `foto_perfil_key` varchar(255) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `persona` DROP COLUMN `foto_perfil_key`',
    );
  }
}
