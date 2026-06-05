import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEsGrupoSistema1717200000000 implements MigrationInterface {
  name = 'AddEsGrupoSistema1717200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE grupo_permiso ADD COLUMN es_grupo_sistema BOOLEAN NOT NULL DEFAULT FALSE`,
    );
    await queryRunner.query(
      `UPDATE grupo_permiso SET es_grupo_sistema = TRUE WHERE clave IN ('ADMIN', 'RECEPCIONISTA', 'NUTRICIONISTA', 'SOCIO')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE grupo_permiso DROP COLUMN es_grupo_sistema`,
    );
  }
}
