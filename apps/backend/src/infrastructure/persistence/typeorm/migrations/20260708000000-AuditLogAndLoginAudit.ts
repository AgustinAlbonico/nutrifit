import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogAndLoginAudit20260708000000 implements MigrationInterface {
  name = 'AuditLogAndLoginAudit20260708000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existeAuditLog = await queryRunner.hasTable('audit_log');
    const existeAuditoria = await queryRunner.hasTable('auditoria');

    if (!existeAuditLog && existeAuditoria) {
      await queryRunner.query('RENAME TABLE `auditoria` TO `audit_log`');
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`audit_log\` (
        \`id_audit_log\` INT NOT NULL AUTO_INCREMENT,
        \`fecha\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`id_gimnasio\` INT NULL,
        \`id_usuario\` VARCHAR(50) NULL,
        \`modulo\` VARCHAR(100) NOT NULL DEFAULT 'legacy',
        \`accion\` VARCHAR(100) NOT NULL,
        \`entidad\` VARCHAR(100) NOT NULL,
        \`entidad_id\` VARCHAR(100) NULL,
        \`tipo_accion\` VARCHAR(50) NULL,
        \`descripcion\` VARCHAR(500) NULL,
        \`ip\` VARCHAR(45) NULL,
        \`user_agent\` VARCHAR(500) NULL,
        \`metadata_legacy\` JSON NULL,
        \`valores_antes\` JSON NULL,
        \`valores_despues\` JSON NULL,
        PRIMARY KEY (\`id_audit_log\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this.migrarColumnasLegacy(queryRunner);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`login_audit\` (
        \`id_login_audit\` INT NOT NULL AUTO_INCREMENT,
        \`fecha\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`id_usuario\` INT NULL,
        \`email_intentado\` VARCHAR(255) NULL,
        \`resultado\` VARCHAR(20) NOT NULL,
        \`ip\` VARCHAR(45) NULL,
        \`user_agent\` VARCHAR(500) NULL,
        \`id_gimnasio\` INT NULL,
        PRIMARY KEY (\`id_login_audit\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await this.crearIndices(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `login_audit`');

    if (await queryRunner.hasTable('audit_log')) {
      await queryRunner.query('DROP TABLE IF EXISTS `auditoria`');
      await queryRunner.query('RENAME TABLE `audit_log` TO `auditoria`');
    }
  }

  private async migrarColumnasLegacy(queryRunner: QueryRunner): Promise<void> {
    await this.renombrarColumnaSiExiste(queryRunner, 'audit_log', 'id_auditoria', 'id_audit_log', 'INT NOT NULL AUTO_INCREMENT');
    await this.renombrarColumnaSiExiste(queryRunner, 'audit_log', 'timestamp', 'fecha', 'DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.renombrarColumnaSiExiste(queryRunner, 'audit_log', 'metadata', 'metadata_legacy', 'JSON NULL');
    await this.renombrarColumnaSiExiste(queryRunner, 'audit_log', 'ip_origen', 'ip', 'VARCHAR(45) NULL');
    await this.modificarColumnaSiExiste(queryRunner, 'audit_log', 'id_usuario', 'VARCHAR(50) NULL');
    await this.modificarColumnaSiExiste(queryRunner, 'audit_log', 'entidad_id', 'VARCHAR(100) NULL');
    await this.modificarColumnaSiExiste(queryRunner, 'audit_log', 'user_agent', 'VARCHAR(500) NULL');

    await this.agregarColumnaSiFalta(queryRunner, 'audit_log', 'modulo', "VARCHAR(100) NOT NULL DEFAULT 'legacy'");
    await this.agregarColumnaSiFalta(queryRunner, 'audit_log', 'tipo_accion', 'VARCHAR(50) NULL');
    await this.agregarColumnaSiFalta(queryRunner, 'audit_log', 'descripcion', 'VARCHAR(500) NULL');
    await this.agregarColumnaSiFalta(queryRunner, 'audit_log', 'valores_antes', 'JSON NULL');
    await this.agregarColumnaSiFalta(queryRunner, 'audit_log', 'valores_despues', 'JSON NULL');
  }

  private async crearIndices(queryRunner: QueryRunner): Promise<void> {
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_fecha', '(`fecha`)');
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_usuario', '(`id_usuario`)');
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_accion', '(`accion`)');
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_modulo', '(`modulo`)');
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_entidad', '(`entidad`, `entidad_id`)');
    await this.crearIndiceSiFalta(queryRunner, 'audit_log', 'idx_audit_log_gimnasio_fecha', '(`id_gimnasio`, `fecha`)');
    await this.crearIndiceSiFalta(queryRunner, 'login_audit', 'idx_login_audit_fecha', '(`fecha`)');
    await this.crearIndiceSiFalta(queryRunner, 'login_audit', 'idx_login_audit_usuario', '(`id_usuario`)');
    await this.crearIndiceSiFalta(queryRunner, 'login_audit', 'idx_login_audit_email', '(`email_intentado`)');
    await this.crearIndiceSiFalta(queryRunner, 'login_audit', 'idx_login_audit_resultado', '(`resultado`)');
    await this.crearIndiceSiFalta(queryRunner, 'login_audit', 'idx_login_audit_gimnasio_fecha', '(`id_gimnasio`, `fecha`)');
  }

  private async renombrarColumnaSiExiste(
    queryRunner: QueryRunner,
    tabla: string,
    anterior: string,
    nueva: string,
    definicion: string,
  ): Promise<void> {
    if ((await queryRunner.hasColumn(tabla, anterior)) && !(await queryRunner.hasColumn(tabla, nueva))) {
      await queryRunner.query(`ALTER TABLE \`${tabla}\` CHANGE \`${anterior}\` \`${nueva}\` ${definicion}`);
    }
  }

  private async agregarColumnaSiFalta(
    queryRunner: QueryRunner,
    tabla: string,
    columna: string,
    definicion: string,
  ): Promise<void> {
    if (!(await queryRunner.hasColumn(tabla, columna))) {
      await queryRunner.query(`ALTER TABLE \`${tabla}\` ADD COLUMN \`${columna}\` ${definicion}`);
    }
  }

  private async modificarColumnaSiExiste(
    queryRunner: QueryRunner,
    tabla: string,
    columna: string,
    definicion: string,
  ): Promise<void> {
    if (await queryRunner.hasColumn(tabla, columna)) {
      await queryRunner.query(`ALTER TABLE \`${tabla}\` MODIFY COLUMN \`${columna}\` ${definicion}`);
    }
  }

  private async crearIndiceSiFalta(
    queryRunner: QueryRunner,
    tabla: string,
    indice: string,
    columnas: string,
  ): Promise<void> {
    const indices = await queryRunner.query(
      'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
      [tabla, indice],
    );

    if ((indices as unknown[]).length === 0) {
      await queryRunner.query(`CREATE INDEX \`${indice}\` ON \`${tabla}\` ${columnas}`);
    }
  }
}
