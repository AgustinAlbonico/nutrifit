import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGimnasioIdToAuditoria1735689600000 implements MigrationInterface {
  name = 'AddGimnasioIdToAuditoria1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column with nullable initially
    await queryRunner.query(`
      ALTER TABLE auditoria
      ADD COLUMN id_gimnasio INT NULL AFTER metadata
    `);

    // Add index for tenant-scoped queries
    await queryRunner.query(`
      CREATE INDEX idx_auditoria_gimnasio ON auditoria (id_gimnasio)
    `);

    // Backfill existing audit records with gimnasioId = 1 (assumes single-tenant or default gym)
    // In multi-gym scenario this should be updated per-record based on related entities
    await queryRunner.query(`
      UPDATE auditoria SET id_gimnasio = 1 WHERE id_gimnasio IS NULL
    `);

    // Add FK constraint
    await queryRunner.query(`
      ALTER TABLE auditoria
      ADD CONSTRAINT fk_auditoria_gimnasio
      FOREIGN KEY (id_gimnasio) REFERENCES gimnasio(id_gimnasio) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE auditoria DROP FOREIGN KEY fk_auditoria_gimnasio
    `);
    await queryRunner.query(`
      DROP INDEX idx_auditoria_gimnasio ON auditoria
    `);
    await queryRunner.query(`
      ALTER TABLE auditoria DROP COLUMN id_gimnasio
    `);
  }
}
