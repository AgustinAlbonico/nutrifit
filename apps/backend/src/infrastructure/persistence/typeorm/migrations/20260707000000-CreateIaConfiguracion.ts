import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIaConfiguracion20260707000000 implements MigrationInterface {
  name = 'CreateIaConfiguracion20260707000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`ia_configuracion\` (
        \`id_ia_configuracion\` INT NOT NULL AUTO_INCREMENT,
        \`provider\` VARCHAR(50) NOT NULL,
        \`api_key_encrypted\` TEXT NULL,
        \`model\` VARCHAR(255) NULL,
        \`base_url\` VARCHAR(500) NULL,
        \`max_tokens\` INT NULL,
        \`temperature\` DECIMAL(4,3) NULL,
        \`timeout_ms\` INT NULL,
        \`habilitado\` TINYINT NOT NULL DEFAULT 1,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`gimnasio_id\` INT NULL,
        \`creado_en\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`actualizado_en\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uq_ia_configuracion_provider_gimnasio\` (\`provider\`, \`gimnasio_id\`),
        INDEX \`idx_ia_configuracion_orden\` (\`habilitado\`, \`orden\`),
        PRIMARY KEY (\`id_ia_configuracion\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `ia_configuracion`');
  }
}
