import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega la columna `creado_por` a la tabla `turno` para registrar
 * quien origino cada turno (trazabilidad RB33).
 *
 * Cambios:
 *  - `creado_por VARCHAR(20) NOT NULL DEFAULT 'SOCIO'`: backfill
 *    implicito. Todas las filas pre-existentes quedan en `'SOCIO'`
 *    porque antes de este change no existia ninguna otra via de
 *    creacion de turnos. Es la unica suposicion defendible.
 *  - `chk_turno_creado_por` CHECK constraint: defensa en profundidad
 *    sobre los 4 valores validos del enum `CreadoPor`. Caveat MySQL:
 *    en MySQL 5.7 el CHECK no se enforza (es un no-op). En MySQL
 *    8.0.16+ si se enforza. La validacion real sigue viviendo en el
 *    use-case `CrearTurnoEnNombreDeSocioUseCase` (PR 2 del change).
 *  - `idx_turno_creado_por`: soporta queries de auditoria y reportes
 *    "turnos creados por recepcion este mes". Se crea explicitamente
 *    (no via decorator @Index) para tener control total del nombre.
 */
export class TurnoCreadoPor20260612000000 implements MigrationInterface {
  name = 'TurnoCreadoPor20260612000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `turno` ADD COLUMN `creado_por` VARCHAR(20) NOT NULL DEFAULT 'SOCIO'",
    );

    await queryRunner.query(
      "ALTER TABLE `turno` ADD CONSTRAINT `chk_turno_creado_por` CHECK (creado_por IN ('SOCIO','RECEPCION','ADMIN','NUTRICIONISTA'))",
    );

    await queryRunner.query(
      'CREATE INDEX `idx_turno_creado_por` ON `turno` (`creado_por`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `idx_turno_creado_por` ON `turno`');
    await queryRunner.query(
      'ALTER TABLE `turno` DROP CONSTRAINT `chk_turno_creado_por`',
    );
    await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `creado_por`');
  }
}
