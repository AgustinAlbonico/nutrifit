import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsuarioGrupoPermiso1735689601000 implements MigrationInterface {
  name = 'AddUsuarioGrupoPermiso1735689601000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add auto-increment primary key column to existing join table
    await queryRunner.query(`
      ALTER TABLE \`usuario_grupo_permiso\`
      ADD COLUMN \`id_usuario_grupo_permiso\` int NOT NULL AUTO_INCREMENT,
      ADD COLUMN \`fecha_asignacion\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      DROP PRIMARY KEY,
      ADD PRIMARY KEY (\`id_usuario_grupo_permiso\`),
      MODIFY \`id_usuario\` int NOT NULL,
      MODIFY \`id_grupo_permiso\` int NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to simple join table without the extra columns
    await queryRunner.query(`
      ALTER TABLE \`usuario_grupo_permiso\`
      DROP COLUMN \`id_usuario_grupo_permiso\`,
      DROP COLUMN \`fecha_asignacion\`,
      DROP PRIMARY KEY,
      ADD PRIMARY KEY (\`id_usuario\`, \`id_grupo_permiso\`)
    `);
  }
}
