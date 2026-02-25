"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPermissionsModel1766750000000 = void 0;
class AddPermissionsModel1766750000000 {
    name = 'AddPermissionsModel1766750000000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`accion\` (\`id_accion\` int NOT NULL AUTO_INCREMENT, \`clave\` varchar(120) NOT NULL, \`nombre\` varchar(120) NOT NULL, \`descripcion\` varchar(255) NULL, UNIQUE INDEX \`IDX_accion_clave\` (\`clave\`), PRIMARY KEY (\`id_accion\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`grupo_permiso\` (\`id_grupo_permiso\` int NOT NULL AUTO_INCREMENT, \`clave\` varchar(100) NOT NULL, \`nombre\` varchar(120) NOT NULL, \`descripcion\` varchar(255) NULL, UNIQUE INDEX \`IDX_grupo_permiso_clave\` (\`clave\`), PRIMARY KEY (\`id_grupo_permiso\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario_accion\` (\`id_usuario\` int NOT NULL, \`id_accion\` int NOT NULL, INDEX \`IDX_usuario_accion_usuario\` (\`id_usuario\`), INDEX \`IDX_usuario_accion_accion\` (\`id_accion\`), PRIMARY KEY (\`id_usuario\`, \`id_accion\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuario_grupo_permiso\` (\`id_usuario\` int NOT NULL, \`id_grupo_permiso\` int NOT NULL, INDEX \`IDX_usuario_grupo_usuario\` (\`id_usuario\`), INDEX \`IDX_usuario_grupo_grupo\` (\`id_grupo_permiso\`), PRIMARY KEY (\`id_usuario\`, \`id_grupo_permiso\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`grupo_permiso_accion\` (\`id_grupo_permiso\` int NOT NULL, \`id_accion\` int NOT NULL, INDEX \`IDX_grupo_permiso_accion_grupo\` (\`id_grupo_permiso\`), INDEX \`IDX_grupo_permiso_accion_accion\` (\`id_accion\`), PRIMARY KEY (\`id_grupo_permiso\`, \`id_accion\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`grupo_permiso_hijo\` (\`id_grupo_padre\` int NOT NULL, \`id_grupo_hijo\` int NOT NULL, INDEX \`IDX_grupo_hijo_padre\` (\`id_grupo_padre\`), INDEX \`IDX_grupo_hijo_hijo\` (\`id_grupo_hijo\`), PRIMARY KEY (\`id_grupo_padre\`, \`id_grupo_hijo\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`usuario_accion\` ADD CONSTRAINT \`FK_usuario_accion_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`usuario_accion\` ADD CONSTRAINT \`FK_usuario_accion_accion\` FOREIGN KEY (\`id_accion\`) REFERENCES \`accion\`(\`id_accion\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`usuario_grupo_permiso\` ADD CONSTRAINT \`FK_usuario_grupo_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuario\`(\`id_usuario\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`usuario_grupo_permiso\` ADD CONSTRAINT \`FK_usuario_grupo_grupo\` FOREIGN KEY (\`id_grupo_permiso\`) REFERENCES \`grupo_permiso\`(\`id_grupo_permiso\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_accion\` ADD CONSTRAINT \`FK_grupo_permiso_accion_grupo\` FOREIGN KEY (\`id_grupo_permiso\`) REFERENCES \`grupo_permiso\`(\`id_grupo_permiso\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_accion\` ADD CONSTRAINT \`FK_grupo_permiso_accion_accion\` FOREIGN KEY (\`id_accion\`) REFERENCES \`accion\`(\`id_accion\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_hijo\` ADD CONSTRAINT \`FK_grupo_hijo_padre\` FOREIGN KEY (\`id_grupo_padre\`) REFERENCES \`grupo_permiso\`(\`id_grupo_permiso\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_hijo\` ADD CONSTRAINT \`FK_grupo_hijo_hijo\` FOREIGN KEY (\`id_grupo_hijo\`) REFERENCES \`grupo_permiso\`(\`id_grupo_permiso\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_hijo\` DROP FOREIGN KEY \`FK_grupo_hijo_hijo\``);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_hijo\` DROP FOREIGN KEY \`FK_grupo_hijo_padre\``);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_accion\` DROP FOREIGN KEY \`FK_grupo_permiso_accion_accion\``);
        await queryRunner.query(`ALTER TABLE \`grupo_permiso_accion\` DROP FOREIGN KEY \`FK_grupo_permiso_accion_grupo\``);
        await queryRunner.query(`ALTER TABLE \`usuario_grupo_permiso\` DROP FOREIGN KEY \`FK_usuario_grupo_grupo\``);
        await queryRunner.query(`ALTER TABLE \`usuario_grupo_permiso\` DROP FOREIGN KEY \`FK_usuario_grupo_usuario\``);
        await queryRunner.query(`ALTER TABLE \`usuario_accion\` DROP FOREIGN KEY \`FK_usuario_accion_accion\``);
        await queryRunner.query(`ALTER TABLE \`usuario_accion\` DROP FOREIGN KEY \`FK_usuario_accion_usuario\``);
        await queryRunner.query(`DROP INDEX \`IDX_grupo_hijo_hijo\` ON \`grupo_permiso_hijo\``);
        await queryRunner.query(`DROP INDEX \`IDX_grupo_hijo_padre\` ON \`grupo_permiso_hijo\``);
        await queryRunner.query(`DROP TABLE \`grupo_permiso_hijo\``);
        await queryRunner.query(`DROP INDEX \`IDX_grupo_permiso_accion_accion\` ON \`grupo_permiso_accion\``);
        await queryRunner.query(`DROP INDEX \`IDX_grupo_permiso_accion_grupo\` ON \`grupo_permiso_accion\``);
        await queryRunner.query(`DROP TABLE \`grupo_permiso_accion\``);
        await queryRunner.query(`DROP INDEX \`IDX_usuario_grupo_grupo\` ON \`usuario_grupo_permiso\``);
        await queryRunner.query(`DROP INDEX \`IDX_usuario_grupo_usuario\` ON \`usuario_grupo_permiso\``);
        await queryRunner.query(`DROP TABLE \`usuario_grupo_permiso\``);
        await queryRunner.query(`DROP INDEX \`IDX_usuario_accion_accion\` ON \`usuario_accion\``);
        await queryRunner.query(`DROP INDEX \`IDX_usuario_accion_usuario\` ON \`usuario_accion\``);
        await queryRunner.query(`DROP TABLE \`usuario_accion\``);
        await queryRunner.query(`DROP INDEX \`IDX_grupo_permiso_clave\` ON \`grupo_permiso\``);
        await queryRunner.query(`DROP TABLE \`grupo_permiso\``);
        await queryRunner.query(`DROP INDEX \`IDX_accion_clave\` ON \`accion\``);
        await queryRunner.query(`DROP TABLE \`accion\``);
    }
}
exports.AddPermissionsModel1766750000000 = AddPermissionsModel1766750000000;
//# sourceMappingURL=1766750000000-AddPermissionsModel.js.map