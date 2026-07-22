import { MigrationInterface, QueryRunner } from 'typeorm';

export class MatriculaUnicaPorGimnasio1785000000000
  implements MigrationInterface
{
  name = 'MatriculaUnicaPorGimnasio1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_b9000711e4ac11ef438c9f405d\` ON \`persona\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_persona_matricula_gimnasio\` ON \`persona\` (\`matricula\`, \`id_gimnasio\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_persona_matricula_gimnasio\` ON \`persona\``,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_b9000711e4ac11ef438c9f405d\` ON \`persona\` (\`matricula\`)`,
    );
  }
}
