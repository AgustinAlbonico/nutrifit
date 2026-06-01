import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableBlockedTurnosAndNullableSocio1768410000000 implements MigrationInterface {
  name = 'EnableBlockedTurnosAndNullableSocio1768410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `turno` MODIFY COLUMN `estado` enum ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO', 'BLOQUEADO') NOT NULL",
    );

    await queryRunner.query(
      'ALTER TABLE `turno` MODIFY COLUMN `id_socio` int NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `turno` WHERE `estado` = 'BLOQUEADO' OR `id_socio` IS NULL",
    );

    await queryRunner.query(
      "ALTER TABLE `turno` MODIFY COLUMN `estado` enum ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO') NOT NULL",
    );

    await queryRunner.query(
      'ALTER TABLE `turno` MODIFY COLUMN `id_socio` int NOT NULL',
    );
  }
}
