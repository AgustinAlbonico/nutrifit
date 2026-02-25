"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpandirFichaSalud1769000000000 = void 0;
class ExpandirFichaSalud1769000000000 {
    name = 'ExpandirFichaSalud1769000000000';
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `medicacion_actual` text NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `suplementos_actuales` text NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `cirugias_previas` text NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `antecedentes_familiares` text NULL');
        await queryRunner.query("ALTER TABLE `ficha_salud` ADD COLUMN `frecuencia_comidas` enum('1-2 comidas','3 comidas','4-5 comidas','6 o más comidas') NULL");
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `consumo_agua_diario` decimal(4,1) NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `restricciones_alimentarias` text NULL');
        await queryRunner.query("ALTER TABLE `ficha_salud` ADD COLUMN `consumo_alcohol` enum('Nunca','Ocasional','Moderado','Frecuente') NULL");
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `fuma_tabaco` boolean NOT NULL DEFAULT false');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `horas_sueno` int NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `contacto_emergencia_nombre` varchar(100) NULL');
        await queryRunner.query('ALTER TABLE `ficha_salud` ADD COLUMN `contacto_emergencia_telefono` varchar(20) NULL');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `contacto_emergencia_telefono`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `contacto_emergencia_nombre`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `horas_sueno`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `fuma_tabaco`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `consumo_alcohol`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `restricciones_alimentarias`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `consumo_agua_diario`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `frecuencia_comidas`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `antecedentes_familiares`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `cirugias_previas`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `suplementos_actuales`');
        await queryRunner.query('ALTER TABLE `ficha_salud` DROP COLUMN `medicacion_actual`');
    }
}
exports.ExpandirFichaSalud1769000000000 = ExpandirFichaSalud1769000000000;
//# sourceMappingURL=1769000000000-ExpandirFichaSalud.js.map