"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFotoProgresoAndObjetivo20260223000000 = void 0;
class AddFotoProgresoAndObjetivo20260223000000 {
    name = 'AddFotoProgresoAndObjetivo20260223000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`foto_progreso\` (\`id_foto\` int NOT NULL AUTO_INCREMENT, \`id_socio\` int NOT NULL, \`tipo_foto\` enum ('frente', 'perfil', 'espalda', 'otro') NOT NULL, \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`object_key\` varchar(255) NOT NULL, \`mime_type\` varchar(120) NOT NULL, \`notas\` text NULL, INDEX \`IDX_FOTO_PROGRESO_SOCIO\` (\`id_socio\`), PRIMARY KEY (\`id_foto\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`objetivo\` (\`id_objetivo\` int NOT NULL AUTO_INCREMENT, \`id_socio\` int NOT NULL, \`tipo_metrica\` enum ('PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO') NOT NULL, \`valor_inicial\` decimal(10,2) NOT NULL, \`valor_objetivo\` decimal(10,2) NOT NULL, \`valor_actual\` decimal(10,2) NOT NULL, \`estado\` enum ('ACTIVO', 'COMPLETADO', 'ABANDONADO') NOT NULL, \`fecha_inicio\` datetime NOT NULL, \`fecha_objetivo\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_OBJETIVO_SOCIO\` (\`id_socio\`), PRIMARY KEY (\`id_objetivo\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`foto_progreso\` ADD CONSTRAINT \`FK_FOTO_PROGRESO_SOCIO\` FOREIGN KEY (\`id_socio\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`objetivo\` ADD CONSTRAINT \`FK_OBJETIVO_SOCIO\` FOREIGN KEY (\`id_socio\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`objetivo\` DROP FOREIGN KEY \`FK_OBJETIVO_SOCIO\``);
        await queryRunner.query(`ALTER TABLE \`foto_progreso\` DROP FOREIGN KEY \`FK_FOTO_PROGRESO_SOCIO\``);
        await queryRunner.query(`DROP TABLE \`objetivo\``);
        await queryRunner.query(`DROP TABLE \`foto_progreso\``);
    }
}
exports.AddFotoProgresoAndObjetivo20260223000000 = AddFotoProgresoAndObjetivo20260223000000;
//# sourceMappingURL=20260223000000-AddFotoProgresoAndObjetivo.js.map