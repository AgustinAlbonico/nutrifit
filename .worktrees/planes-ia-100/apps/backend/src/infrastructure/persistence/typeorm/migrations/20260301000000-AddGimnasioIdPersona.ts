import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGimnasioIdPersona20260301000000 implements MigrationInterface {
  name = 'AddGimnasioIdPersona20260301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add nullable column first
    await queryRunner.query(`
      ALTER TABLE \`persona\`
      ADD COLUMN \`id_gimnasio\` INT NULL
    `);

    // Backfill existing personas with gimnasioId = 1
    await queryRunner.query(`
      UPDATE \`persona\` SET \`id_gimnasio\` = 1 WHERE \`id_gimnasio\` IS NULL
    `);

    // Add FK constraint
    await queryRunner.query(`
      ALTER TABLE \`persona\`
      ADD CONSTRAINT \`fk_persona_gimnasio\`
      FOREIGN KEY (\`id_gimnasio\`) REFERENCES \`gimnasio\`(\`id_gimnasio\`) ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    // Make NOT NULL after backfill
    await queryRunner.query(`
      ALTER TABLE \`persona\` MODIFY COLUMN \`id_gimnasio\` INT NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`persona\` DROP FOREIGN KEY \`fk_persona_gimnasio\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`persona\` DROP COLUMN \`id_gimnasio\`
    `);
  }
}
