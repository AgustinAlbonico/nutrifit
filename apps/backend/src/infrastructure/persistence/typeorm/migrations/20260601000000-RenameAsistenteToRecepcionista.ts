import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAsistenteToRecepcionista20260601000000 implements MigrationInterface {
  name = 'RenameAsistenteToRecepcionista20260601000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`persona\` 
      SET \`tipo_persona\` = 'RecepcionistaOrmEntity' 
      WHERE \`tipo_persona\` = 'AsistenteOrmEntity'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`persona\` 
      SET \`tipo_persona\` = 'AsistenteOrmEntity' 
      WHERE \`tipo_persona\` = 'RecepcionistaOrmEntity'
    `);
  }
}
