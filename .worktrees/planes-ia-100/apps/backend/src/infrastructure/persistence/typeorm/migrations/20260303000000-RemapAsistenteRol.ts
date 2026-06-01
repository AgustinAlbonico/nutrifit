import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemapAsistenteRol20260303000000 implements MigrationInterface {
  name = 'RemapAsistenteRol20260303000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remap ASISTENTE -> RECEPCIONISTA in usuario table
    await queryRunner.query(`
      UPDATE \`usuario\` SET \`rol\` = 'RECEPCIONISTA' WHERE \`rol\` = 'ASISTENTE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`usuario\` SET \`rol\` = 'ASISTENTE' WHERE \`rol\` = 'RECEPCIONISTA'
    `);
  }
}
