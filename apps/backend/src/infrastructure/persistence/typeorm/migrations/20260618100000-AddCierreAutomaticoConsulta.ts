import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCierreAutomaticoConsulta20260618100000 implements MigrationInterface {
  name = 'AddCierreAutomaticoConsulta20260618100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD \`cierre_automatico\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD \`motivo_cierre_automatico\` varchar(50) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD \`cierre_automatico_en\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD \`preaviso_cierre_auto_enviado_en\` datetime NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD \`reabierta_por_cierre_auto\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`politica_operativa\` ADD \`umbral_cierre_consulta_min\` int NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`politica_operativa\` ADD \`preaviso_cierre_consulta_min\` int NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`politica_operativa\` DROP COLUMN \`preaviso_cierre_consulta_min\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`politica_operativa\` DROP COLUMN \`umbral_cierre_consulta_min\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP COLUMN \`reabierta_por_cierre_auto\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP COLUMN \`preaviso_cierre_auto_enviado_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP COLUMN \`cierre_automatico_en\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP COLUMN \`motivo_cierre_automatico\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP COLUMN \`cierre_automatico\``,
    );
  }
}
