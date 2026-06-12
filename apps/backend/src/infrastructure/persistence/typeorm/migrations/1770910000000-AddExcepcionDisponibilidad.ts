import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExcepcionDisponibilidad1770910000000 implements MigrationInterface {
  name = 'AddExcepcionDisponibilidad1770910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`excepcion_disponibilidad\` (
        \`id_excepcion\` INT NOT NULL AUTO_INCREMENT,
        \`fecha_inicio\` DATETIME NOT NULL,
        \`fecha_fin\` DATETIME NOT NULL,
        \`motivo\` VARCHAR(255) NULL,
        \`id_nutricionista\` INT NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_excepcion\`),
        KEY \`idx_excepcion_nutricionista\` (\`id_nutricionista\`),
        KEY \`idx_excepcion_fechas\` (\`fecha_inicio\`, \`fecha_fin\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `excepcion_disponibilidad`');
  }
}
