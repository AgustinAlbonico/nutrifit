"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFotoPerfilKeyToPersona1768500000000 = void 0;
class AddFotoPerfilKeyToPersona1768500000000 {
    name = 'AddFotoPerfilKeyToPersona1768500000000';
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `persona` ADD COLUMN `foto_perfil_key` varchar(255) NULL');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE `persona` DROP COLUMN `foto_perfil_key`');
    }
}
exports.AddFotoPerfilKeyToPersona1768500000000 = AddFotoPerfilKeyToPersona1768500000000;
//# sourceMappingURL=1768500000000-AddFotoPerfilKeyToPersona.js.map