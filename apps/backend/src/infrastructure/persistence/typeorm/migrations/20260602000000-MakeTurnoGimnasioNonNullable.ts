import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Makes id_gimnasio NOT NULL in turno table to enforce multi-tenant isolation.
 *
 * IMPORTANT: Before running this migration, verify that no turno records
 * have id_gimnasio = NULL:
 *   SELECT COUNT(*) FROM turno WHERE id_gimnasio IS NULL;
 * If any exist, assign them to the correct gym before running.
 */
export class MakeTurnoGimnasioNonNullable20260602000000 implements MigrationInterface {
  name = 'MakeTurnoGimnasioNonNullable20260602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`turno\` MODIFY \`id_gimnasio\` INT NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`turno\` MODIFY \`id_gimnasio\` INT NULL`,
    );
  }
}
