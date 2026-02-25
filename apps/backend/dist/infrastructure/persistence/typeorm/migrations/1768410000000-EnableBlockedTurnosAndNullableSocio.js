"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableBlockedTurnosAndNullableSocio1768410000000 = void 0;
class EnableBlockedTurnosAndNullableSocio1768410000000 {
    name = 'EnableBlockedTurnosAndNullableSocio1768410000000';
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE `turno` MODIFY COLUMN `estado` enum ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO', 'BLOQUEADO') NOT NULL");
        await queryRunner.query('ALTER TABLE `turno` MODIFY COLUMN `id_socio` int NULL');
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM `turno` WHERE `estado` = 'BLOQUEADO' OR `id_socio` IS NULL");
        await queryRunner.query("ALTER TABLE `turno` MODIFY COLUMN `estado` enum ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO') NOT NULL");
        await queryRunner.query('ALTER TABLE `turno` MODIFY COLUMN `id_socio` int NOT NULL');
    }
}
exports.EnableBlockedTurnosAndNullableSocio1768410000000 = EnableBlockedTurnosAndNullableSocio1768410000000;
//# sourceMappingURL=1768410000000-EnableBlockedTurnosAndNullableSocio.js.map