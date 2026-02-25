"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultaClinicaInfra1770000000000 = void 0;
class ConsultaClinicaInfra1770000000000 {
    name = 'ConsultaClinicaInfra1770000000000';
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `turno` ADD COLUMN `check_in_at` datetime NULL');
        await queryRunner.query('ALTER TABLE `turno` ADD COLUMN `consulta_iniciada_at` datetime NULL');
        await queryRunner.query('ALTER TABLE `turno` ADD COLUMN `consulta_finalizada_at` datetime NULL');
        await queryRunner.query('ALTER TABLE `turno` ADD COLUMN `ausente_at` datetime NULL');
        await queryRunner.query("ALTER TABLE `turno` MODIFY COLUMN `estado` ENUM('PENDIENTE','CONFIRMADO','PRESENTE','EN_CURSO','CANCELADO','REALIZADO','AUSENTE','REPROGRAMADO','BLOQUEADO') NOT NULL");
        await queryRunner.query("ALTER TABLE `usuario` MODIFY COLUMN `rol` ENUM('ADMIN','NUTRICIONISTA','RECEPCIONISTA','SOCIO') NOT NULL");
        await queryRunner.query(`CREATE TABLE \`medicion\` (
        \`id_medicion\` int NOT NULL AUTO_INCREMENT,
        \`peso\` decimal(5,2) NOT NULL,
        \`altura\` int NOT NULL,
        \`imc\` decimal(5,2) NOT NULL,
        \`perimetro_cintura\` decimal(5,2) NULL,
        \`perimetro_cadera\` decimal(5,2) NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`id_turno\` int NOT NULL,
        PRIMARY KEY (\`id_medicion\`),
        KEY \`FK_medicion_turno\` (\`id_turno\`),
        CONSTRAINT \`FK_medicion_turno\` FOREIGN KEY (\`id_turno\`) REFERENCES \`turno\` (\`id_turno\`) ON DELETE CASCADE
      )`);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE \`medicion\`');
        await queryRunner.query("ALTER TABLE `usuario` MODIFY COLUMN `rol` ENUM('ADMIN','NUTRICIONISTA','SOCIO') NOT NULL");
        await queryRunner.query("ALTER TABLE `turno` MODIFY COLUMN `estado` ENUM('PENDIENTE','CONFIRMADO','CANCELADO','REALIZADO','AUSENTE','REPROGRAMADO','BLOQUEADO') NOT NULL");
        await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `ausente_at`');
        await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `consulta_finalizada_at`');
        await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `consulta_iniciada_at`');
        await queryRunner.query('ALTER TABLE `turno` DROP COLUMN `check_in_at`');
    }
}
exports.ConsultaClinicaInfra1770000000000 = ConsultaClinicaInfra1770000000000;
//# sourceMappingURL=1770000000000-ConsultaClinicaInfra.js.map