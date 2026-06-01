import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMigration1755396917066 implements MigrationInterface {
  name = 'InitMigration1755396917066';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`formacion_academica\` (\`id_formacion_academica\` int NOT NULL AUTO_INCREMENT, \`titulo\` varchar(255) NOT NULL, \`institucion\` varchar(255) NOT NULL, \`anio_inicio\` int NOT NULL, \`anio_fin\` int NOT NULL, \`nivel\` varchar(50) NOT NULL, \`id_nutricionista\` int NOT NULL, PRIMARY KEY (\`id_formacion_academica\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ficha_salud\` (\`id_ficha_salud\` int NOT NULL AUTO_INCREMENT, \`altura\` int NOT NULL, \`peso\` decimal(5,2) NOT NULL, \`fecha_creacion\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`objetivo_personal\` varchar(255) NULL, \`nivel_actividad_fisica\` enum ('Sedentario', 'Moderado', 'Intenso') NOT NULL, PRIMARY KEY (\`id_ficha_salud\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`patologia\` (\`id_patologia\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, PRIMARY KEY (\`id_patologia\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`alergia\` (\`id_alergia\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, PRIMARY KEY (\`id_alergia\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`grupo_alimenticio\` (\`id_grupo_alimenticio\` int NOT NULL AUTO_INCREMENT, \`descripcion\` varchar(255) NOT NULL, PRIMARY KEY (\`id_grupo_alimenticio\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`alimento\` (\`id_alimento\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(255) NOT NULL, \`cantidad\` int NOT NULL, \`calorias\` int NULL, \`proteinas\` int NULL, \`carbohidratos\` int NULL, \`grasas\` int NULL, \`hidratos_de_carbono\` int NULL, \`unidad_medida\` enum ('gramo', 'kilogramo', 'mililitro', 'litro', 'miligramo', 'taza', 'cucharada', 'cucharadita') NOT NULL, PRIMARY KEY (\`id_alimento\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`opcion_comida\` (\`id_opcion_comida\` int NOT NULL AUTO_INCREMENT, \`comentarios\` varchar(255) NULL, \`tipo_comida\` enum ('DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION') NOT NULL, \`id_plan_alimentacion\` int NULL, PRIMARY KEY (\`id_opcion_comida\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`plan_alimentacion\` (\`id_plan_alimentacion\` int NOT NULL AUTO_INCREMENT, \`fechaCreacion\` date NOT NULL, \`objetivo_nutricional\` varchar(255) NOT NULL, \`id_socio\` int NOT NULL, \`id_nutricionista\` int NOT NULL, PRIMARY KEY (\`id_plan_alimentacion\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`usuario\` (\`id_usuario\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`contrasenia\` varchar(255) NOT NULL, \`fecha_hora_alta\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`rol\` enum ('ADMIN', 'NUTRICIONISTA', 'SOCIO') NOT NULL, \`id_persona\` int NULL, UNIQUE INDEX \`IDX_2863682842e688ca198eb25c12\` (\`email\`), UNIQUE INDEX \`REL_1fbc7de91b8e96937ed27739e8\` (\`id_persona\`), PRIMARY KEY (\`id_usuario\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`observacion_clinica\` (\`id_observacion\` int NOT NULL AUTO_INCREMENT, \`comentario\` varchar(255) NOT NULL, \`peso\` decimal(5,2) NOT NULL, \`altura\` int NOT NULL, \`imc\` decimal(5,2) NOT NULL, \`sugerencias\` varchar(255) NULL, \`habitos_socio\` varchar(255) NULL, \`objetivos_socio\` varchar(255) NULL, PRIMARY KEY (\`id_observacion\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`turno\` (\`id_turno\` int NOT NULL AUTO_INCREMENT, \`fecha\` date NOT NULL, \`hora_turno\` varchar(10) NOT NULL, \`estado\` enum ('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO') NOT NULL, \`id_observacion\` int NULL, \`id_socio\` int NOT NULL, \`id_nutricionista\` int NOT NULL, UNIQUE INDEX \`REL_9be9fbc2d26ef165f67571ef12\` (\`id_observacion\`), PRIMARY KEY (\`id_turno\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`persona\` (\`id_persona\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(100) NOT NULL, \`apellido\` varchar(100) NOT NULL, \`fecha_nacimiento\` date NOT NULL, \`genero\` enum ('MASCULINO', 'FEMENINO', 'OTRO') NOT NULL, \`telefono\` varchar(15) NOT NULL, \`direccion\` varchar(255) NOT NULL, \`ciudad\` varchar(100) NOT NULL, \`provincia\` varchar(100) NOT NULL, \`fecha_alta\` date NULL, \`matricula\` varchar(50) NULL, \`anios_experiencia\` int NULL, \`tarifa_sesion\` decimal(10,2) NULL, \`tipo_persona\` varchar(255) NOT NULL, \`id_ficha_salud\` int NULL, UNIQUE INDEX \`IDX_b9000711e4ac11ef438c9f405d\` (\`matricula\`), UNIQUE INDEX \`REL_db90e04e1d41b8184641cd0c43\` (\`id_ficha_salud\`), INDEX \`IDX_36e1631311d9cb31089523a5c8\` (\`tipo_persona\`), PRIMARY KEY (\`id_persona\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`agenda\` (\`id_agenda\` int NOT NULL AUTO_INCREMENT, \`dia\` enum ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo') NOT NULL, \`hora_inicio\` time NOT NULL, \`hora_fin\` time NOT NULL, \`duracion_turno\` int NOT NULL, \`id_nutricionista\` int NOT NULL, PRIMARY KEY (\`id_agenda\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ficha_salud_patologias\` (\`id_ficha_salud\` int NOT NULL, \`id_patologia\` int NOT NULL, INDEX \`IDX_5bf46ddbfe209c294727edc541\` (\`id_ficha_salud\`), INDEX \`IDX_a8ad649ae6b21f3fd7b8bae27b\` (\`id_patologia\`), PRIMARY KEY (\`id_ficha_salud\`, \`id_patologia\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`ficha_salud_alergias\` (\`id_ficha_salud\` int NOT NULL, \`id_alergia\` int NOT NULL, INDEX \`IDX_3e5f971871c73f7fc57d65cbb2\` (\`id_ficha_salud\`), INDEX \`IDX_8ed1bd229d8da6c417607331b2\` (\`id_alergia\`), PRIMARY KEY (\`id_ficha_salud\`, \`id_alergia\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`alimento_grupo_alimenticio\` (\`id_alimento\` int NOT NULL, \`id_grupo_alimenticio\` int NOT NULL, INDEX \`IDX_8a4cc7b70ebc5506fac6139ee9\` (\`id_alimento\`), INDEX \`IDX_a356657e838536adea1e2b5e4c\` (\`id_grupo_alimenticio\`), PRIMARY KEY (\`id_alimento\`, \`id_grupo_alimenticio\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`opcion_comida_alimento\` (\`id_opcion_comida\` int NOT NULL, \`id_alimento\` int NOT NULL, INDEX \`IDX_d1f65f794858b3454db81858ae\` (\`id_opcion_comida\`), INDEX \`IDX_56cc0a2d6395fe58501652d543\` (\`id_alimento\`), PRIMARY KEY (\`id_opcion_comida\`, \`id_alimento\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`formacion_academica\` ADD CONSTRAINT \`FK_1ef35a7b9797cede5e8a8f1d041\` FOREIGN KEY (\`id_nutricionista\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida\` ADD CONSTRAINT \`FK_5ca45f7694255c195d8bc9e0c47\` FOREIGN KEY (\`id_plan_alimentacion\`) REFERENCES \`plan_alimentacion\`(\`id_plan_alimentacion\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_alimentacion\` ADD CONSTRAINT \`FK_8fc31e3c4ec5684f52acd5c653f\` FOREIGN KEY (\`id_socio\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_alimentacion\` ADD CONSTRAINT \`FK_001ae7206a911557d5e2867dd03\` FOREIGN KEY (\`id_nutricionista\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario\` ADD CONSTRAINT \`FK_1fbc7de91b8e96937ed27739e8f\` FOREIGN KEY (\`id_persona\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD CONSTRAINT \`FK_9be9fbc2d26ef165f67571ef123\` FOREIGN KEY (\`id_observacion\`) REFERENCES \`observacion_clinica\`(\`id_observacion\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD CONSTRAINT \`FK_86edec0569d10a7679e7c1f27d7\` FOREIGN KEY (\`id_socio\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` ADD CONSTRAINT \`FK_62c7eeed5943b2d4d67124f78aa\` FOREIGN KEY (\`id_nutricionista\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona\` ADD CONSTRAINT \`FK_db90e04e1d41b8184641cd0c435\` FOREIGN KEY (\`id_ficha_salud\`) REFERENCES \`ficha_salud\`(\`id_ficha_salud\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`agenda\` ADD CONSTRAINT \`FK_316839d84a9fa0a50fbf6d7652c\` FOREIGN KEY (\`id_nutricionista\`) REFERENCES \`persona\`(\`id_persona\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_patologias\` ADD CONSTRAINT \`FK_5bf46ddbfe209c294727edc5410\` FOREIGN KEY (\`id_ficha_salud\`) REFERENCES \`ficha_salud\`(\`id_ficha_salud\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_patologias\` ADD CONSTRAINT \`FK_a8ad649ae6b21f3fd7b8bae27be\` FOREIGN KEY (\`id_patologia\`) REFERENCES \`patologia\`(\`id_patologia\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_alergias\` ADD CONSTRAINT \`FK_3e5f971871c73f7fc57d65cbb28\` FOREIGN KEY (\`id_ficha_salud\`) REFERENCES \`ficha_salud\`(\`id_ficha_salud\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_alergias\` ADD CONSTRAINT \`FK_8ed1bd229d8da6c417607331b28\` FOREIGN KEY (\`id_alergia\`) REFERENCES \`alergia\`(\`id_alergia\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alimento_grupo_alimenticio\` ADD CONSTRAINT \`FK_8a4cc7b70ebc5506fac6139ee92\` FOREIGN KEY (\`id_alimento\`) REFERENCES \`alimento\`(\`id_alimento\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`alimento_grupo_alimenticio\` ADD CONSTRAINT \`FK_a356657e838536adea1e2b5e4cd\` FOREIGN KEY (\`id_grupo_alimenticio\`) REFERENCES \`grupo_alimenticio\`(\`id_grupo_alimenticio\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida_alimento\` ADD CONSTRAINT \`FK_d1f65f794858b3454db81858ae8\` FOREIGN KEY (\`id_opcion_comida\`) REFERENCES \`opcion_comida\`(\`id_opcion_comida\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida_alimento\` ADD CONSTRAINT \`FK_56cc0a2d6395fe58501652d5438\` FOREIGN KEY (\`id_alimento\`) REFERENCES \`alimento\`(\`id_alimento\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida_alimento\` DROP FOREIGN KEY \`FK_56cc0a2d6395fe58501652d5438\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida_alimento\` DROP FOREIGN KEY \`FK_d1f65f794858b3454db81858ae8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`alimento_grupo_alimenticio\` DROP FOREIGN KEY \`FK_a356657e838536adea1e2b5e4cd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`alimento_grupo_alimenticio\` DROP FOREIGN KEY \`FK_8a4cc7b70ebc5506fac6139ee92\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_alergias\` DROP FOREIGN KEY \`FK_8ed1bd229d8da6c417607331b28\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_alergias\` DROP FOREIGN KEY \`FK_3e5f971871c73f7fc57d65cbb28\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_patologias\` DROP FOREIGN KEY \`FK_a8ad649ae6b21f3fd7b8bae27be\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ficha_salud_patologias\` DROP FOREIGN KEY \`FK_5bf46ddbfe209c294727edc5410\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`agenda\` DROP FOREIGN KEY \`FK_316839d84a9fa0a50fbf6d7652c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`persona\` DROP FOREIGN KEY \`FK_db90e04e1d41b8184641cd0c435\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP FOREIGN KEY \`FK_62c7eeed5943b2d4d67124f78aa\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP FOREIGN KEY \`FK_86edec0569d10a7679e7c1f27d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`turno\` DROP FOREIGN KEY \`FK_9be9fbc2d26ef165f67571ef123\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`usuario\` DROP FOREIGN KEY \`FK_1fbc7de91b8e96937ed27739e8f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_alimentacion\` DROP FOREIGN KEY \`FK_001ae7206a911557d5e2867dd03\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`plan_alimentacion\` DROP FOREIGN KEY \`FK_8fc31e3c4ec5684f52acd5c653f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`opcion_comida\` DROP FOREIGN KEY \`FK_5ca45f7694255c195d8bc9e0c47\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`formacion_academica\` DROP FOREIGN KEY \`FK_1ef35a7b9797cede5e8a8f1d041\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_56cc0a2d6395fe58501652d543\` ON \`opcion_comida_alimento\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d1f65f794858b3454db81858ae\` ON \`opcion_comida_alimento\``,
    );
    await queryRunner.query(`DROP TABLE \`opcion_comida_alimento\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a356657e838536adea1e2b5e4c\` ON \`alimento_grupo_alimenticio\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8a4cc7b70ebc5506fac6139ee9\` ON \`alimento_grupo_alimenticio\``,
    );
    await queryRunner.query(`DROP TABLE \`alimento_grupo_alimenticio\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8ed1bd229d8da6c417607331b2\` ON \`ficha_salud_alergias\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_3e5f971871c73f7fc57d65cbb2\` ON \`ficha_salud_alergias\``,
    );
    await queryRunner.query(`DROP TABLE \`ficha_salud_alergias\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_a8ad649ae6b21f3fd7b8bae27b\` ON \`ficha_salud_patologias\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_5bf46ddbfe209c294727edc541\` ON \`ficha_salud_patologias\``,
    );
    await queryRunner.query(`DROP TABLE \`ficha_salud_patologias\``);
    await queryRunner.query(`DROP TABLE \`agenda\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_36e1631311d9cb31089523a5c8\` ON \`persona\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_db90e04e1d41b8184641cd0c43\` ON \`persona\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b9000711e4ac11ef438c9f405d\` ON \`persona\``,
    );
    await queryRunner.query(`DROP TABLE \`persona\``);
    await queryRunner.query(
      `DROP INDEX \`REL_9be9fbc2d26ef165f67571ef12\` ON \`turno\``,
    );
    await queryRunner.query(`DROP TABLE \`turno\``);
    await queryRunner.query(`DROP TABLE \`observacion_clinica\``);
    await queryRunner.query(
      `DROP INDEX \`REL_1fbc7de91b8e96937ed27739e8\` ON \`usuario\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_2863682842e688ca198eb25c12\` ON \`usuario\``,
    );
    await queryRunner.query(`DROP TABLE \`usuario\``);
    await queryRunner.query(`DROP TABLE \`plan_alimentacion\``);
    await queryRunner.query(`DROP TABLE \`opcion_comida\``);
    await queryRunner.query(`DROP TABLE \`alimento\``);
    await queryRunner.query(`DROP TABLE \`grupo_alimenticio\``);
    await queryRunner.query(`DROP TABLE \`alergia\``);
    await queryRunner.query(`DROP TABLE \`patologia\``);
    await queryRunner.query(`DROP TABLE \`ficha_salud\``);
    await queryRunner.query(`DROP TABLE \`formacion_academica\``);
  }
}
