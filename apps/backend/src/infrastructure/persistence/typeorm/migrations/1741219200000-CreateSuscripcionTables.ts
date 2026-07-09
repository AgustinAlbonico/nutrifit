import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuscripcionTables1741219200000 implements MigrationInterface {
  name = 'CreateSuscripcionTables1741219200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`suscripcion_gimnasio\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`gimnasio_id\` int NOT NULL,
        \`monto\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`estado\` varchar(20) NOT NULL DEFAULT 'pendiente',
        \`fecha_inicio\` date NULL,
        \`fecha_proximo_pago\` date NULL,
        \`uuid\` varchar(36) NOT NULL,
        \`usuario_id_admin\` int NULL,
        \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`actualizado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_suscripcion_uuid\` (\`uuid\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pago_simulado\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`suscripcion_gimnasio_id\` int NOT NULL,
        \`monto\` decimal(10,2) NOT NULL,
        \`estado\` varchar(20) NOT NULL,
        \`motivo\` text NULL,
        \`creado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`suscripcion_gimnasio\` ADD CONSTRAINT \`FK_suscripcion_gimnasio\` FOREIGN KEY (\`gimnasio_id\`) REFERENCES \`gimnasio\`(\`id_gimnasio\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pago_simulado\` ADD CONSTRAINT \`FK_pago_suscripcion\` FOREIGN KEY (\`suscripcion_gimnasio_id\`) REFERENCES \`suscripcion_gimnasio\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`pago_simulado\` DROP FOREIGN KEY \`FK_pago_suscripcion\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`suscripcion_gimnasio\` DROP FOREIGN KEY \`FK_suscripcion_gimnasio\``,
    );
    await queryRunner.query(`DROP TABLE \`pago_simulado\``);
    await queryRunner.query(`DROP TABLE \`suscripcion_gimnasio\``);
  }
}
