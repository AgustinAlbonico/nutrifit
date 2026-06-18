import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTurnoToFotoProgreso20260618000000 implements MigrationInterface {
  name = 'AddTurnoToFotoProgreso20260618000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` ADD \`id_turno\` int NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_FOTO_PROGRESO_TURNO\` ON \`foto_progreso\` (\`id_turno\`)`,
    );
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` ADD CONSTRAINT \`FK_FOTO_PROGRESO_TURNO\` FOREIGN KEY (\`id_turno\`) REFERENCES \`turno\`(\`id_turno\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` DROP FOREIGN KEY \`FK_FOTO_PROGRESO_TURNO\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_FOTO_PROGRESO_TURNO\` ON \`foto_progreso\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`foto_progreso\` DROP COLUMN \`id_turno\``,
    );
  }
}
