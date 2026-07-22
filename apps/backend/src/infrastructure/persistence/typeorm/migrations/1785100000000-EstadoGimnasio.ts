import { MigrationInterface, QueryRunner } from 'typeorm';

export class EstadoGimnasio1785100000000 implements MigrationInterface {
  name = 'EstadoGimnasio1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('gimnasio', 'estado'))) {
      await queryRunner.query(
        `ALTER TABLE \`gimnasio\` ADD \`estado\` enum ('PENDIENTE_PAGO', 'ACTIVO', 'SUSPENDIDO', 'DADO_DE_BAJA') NOT NULL DEFAULT 'ACTIVO' AFTER \`email_habilitado\``,
      );
    }
    await queryRunner.query(
      `UPDATE \`gimnasio\` SET \`estado\` = 'DADO_DE_BAJA' WHERE \`fecha_baja\` IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE \`gimnasio\` g SET g.\`estado\` = 'ACTIVO' WHERE g.\`fecha_baja\` IS NULL AND EXISTS (SELECT 1 FROM \`suscripcion_gimnasio\` s WHERE s.\`gimnasio_id\` = g.\`id_gimnasio\` AND s.\`estado\` = 'activa')`,
    );
    await queryRunner.query(
      `UPDATE \`gimnasio\` g SET g.\`estado\` = 'PENDIENTE_PAGO' WHERE g.\`fecha_baja\` IS NULL AND NOT EXISTS (SELECT 1 FROM \`suscripcion_gimnasio\` s WHERE s.\`gimnasio_id\` = g.\`id_gimnasio\` AND s.\`estado\` = 'activa') AND EXISTS (SELECT 1 FROM \`suscripcion_gimnasio\` s WHERE s.\`gimnasio_id\` = g.\`id_gimnasio\` AND s.\`estado\` = 'pendiente')`,
    );
    await queryRunner.query(
      `UPDATE \`gimnasio\` g SET g.\`estado\` = 'SUSPENDIDO' WHERE g.\`fecha_baja\` IS NULL AND EXISTS (SELECT 1 FROM \`suscripcion_gimnasio\` s WHERE s.\`gimnasio_id\` = g.\`id_gimnasio\`) AND NOT EXISTS (SELECT 1 FROM \`suscripcion_gimnasio\` s WHERE s.\`gimnasio_id\` = g.\`id_gimnasio\` AND s.\`estado\` IN ('activa', 'pendiente'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('gimnasio', 'estado')) {
      await queryRunner.query(`ALTER TABLE \`gimnasio\` DROP COLUMN \`estado\``);
    }
  }
}
