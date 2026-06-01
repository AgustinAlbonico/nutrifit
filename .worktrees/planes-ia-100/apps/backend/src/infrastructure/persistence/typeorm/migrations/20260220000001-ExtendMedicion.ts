import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendMedicion20260220000001 implements MigrationInterface {
  name = 'ExtendMedicion20260220000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if medicion table exists
    const tableExists = await queryRunner.hasTable('medicion');

    if (!tableExists) {
      // Create the complete medicion table with all columns
      await queryRunner.query(`
        CREATE TABLE \`medicion\` (
          \`id_medicion\` int NOT NULL AUTO_INCREMENT,
          \`peso\` decimal(5,2) NOT NULL,
          \`altura\` int NOT NULL,
          \`imc\` decimal(5,2) NOT NULL,
          \`perimetro_cintura\` decimal(5,2) NULL,
          \`perimetro_cadera\` decimal(5,2) NULL,
          \`perimetro_brazo\` decimal(5,2) NULL,
          \`perimetro_muslo\` decimal(5,2) NULL,
          \`perimetro_pecho\` decimal(5,2) NULL,
          \`pliegue_triceps\` decimal(5,2) NULL,
          \`pliegue_abdominal\` decimal(5,2) NULL,
          \`pliegue_muslo\` decimal(5,2) NULL,
          \`porcentaje_grasa\` decimal(5,2) NULL,
          \`masa_magra\` decimal(5,2) NULL,
          \`frecuencia_cardiaca\` int NULL,
          \`tension_sistolica\` int NULL,
          \`tension_diastolica\` int NULL,
          \`notas_medicion\` text NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`id_turno\` int NOT NULL,
          PRIMARY KEY (\`id_medicion\`),
          KEY \`FK_medicion_turno\` (\`id_turno\`),
          CONSTRAINT \`FK_medicion_turno\` FOREIGN KEY (\`id_turno\`) REFERENCES \`turno\` (\`id_turno\`) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);
    } else {
      // Table exists - check which columns need to be added
      const table = await queryRunner.getTable('medicion');
      const existingColumns = table?.columns.map((col) => col.name) || [];

      // Add new perimeter columns if they don't exist
      if (!existingColumns.includes('perimetro_brazo')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`perimetro_brazo\` decimal(5,2) NULL AFTER \`perimetro_cadera\`
        `);
      }
      if (!existingColumns.includes('perimetro_muslo')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`perimetro_muslo\` decimal(5,2) NULL AFTER \`perimetro_brazo\`
        `);
      }
      if (!existingColumns.includes('perimetro_pecho')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`perimetro_pecho\` decimal(5,2) NULL AFTER \`perimetro_muslo\`
        `);
      }

      // Add skinfold columns if they don't exist
      if (!existingColumns.includes('pliegue_triceps')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`pliegue_triceps\` decimal(5,2) NULL AFTER \`perimetro_pecho\`
        `);
      }
      if (!existingColumns.includes('pliegue_abdominal')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`pliegue_abdominal\` decimal(5,2) NULL AFTER \`pliegue_triceps\`
        `);
      }
      if (!existingColumns.includes('pliegue_muslo')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`pliegue_muslo\` decimal(5,2) NULL AFTER \`pliegue_abdominal\`
        `);
      }

      // Add body composition columns if they don't exist
      if (!existingColumns.includes('porcentaje_grasa')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`porcentaje_grasa\` decimal(5,2) NULL AFTER \`pliegue_muslo\`
        `);
      }
      if (!existingColumns.includes('masa_magra')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`masa_magra\` decimal(5,2) NULL AFTER \`porcentaje_grasa\`
        `);
      }

      // Add vital signs columns if they don't exist
      if (!existingColumns.includes('frecuencia_cardiaca')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`frecuencia_cardiaca\` int NULL AFTER \`masa_magra\`
        `);
      }
      if (!existingColumns.includes('tension_sistolica')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`tension_sistolica\` int NULL AFTER \`frecuencia_cardiaca\`
        `);
      }
      if (!existingColumns.includes('tension_diastolica')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`tension_diastolica\` int NULL AFTER \`tension_sistolica\`
        `);
      }

      // Add notes column if it doesn't exist
      if (!existingColumns.includes('notas_medicion')) {
        await queryRunner.query(`
          ALTER TABLE \`medicion\`
          ADD COLUMN \`notas_medicion\` text NULL AFTER \`tension_diastolica\`
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('medicion');

    if (!tableExists) {
      // Nothing to revert if table doesn't exist
      return;
    }

    // Check which columns exist and drop them
    const table = await queryRunner.getTable('medicion');
    const existingColumns = table?.columns.map((col) => col.name) || [];

    if (existingColumns.includes('notas_medicion')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`notas_medicion\``,
      );
    }

    if (existingColumns.includes('tension_diastolica')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`tension_diastolica\``,
      );
    }
    if (existingColumns.includes('tension_sistolica')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`tension_sistolica\``,
      );
    }
    if (existingColumns.includes('frecuencia_cardiaca')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`frecuencia_cardiaca\``,
      );
    }

    if (existingColumns.includes('masa_magra')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`masa_magra\``,
      );
    }
    if (existingColumns.includes('porcentaje_grasa')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`porcentaje_grasa\``,
      );
    }

    if (existingColumns.includes('pliegue_muslo')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`pliegue_muslo\``,
      );
    }
    if (existingColumns.includes('pliegue_abdominal')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`pliegue_abdominal\``,
      );
    }
    if (existingColumns.includes('pliegue_triceps')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`pliegue_triceps\``,
      );
    }

    if (existingColumns.includes('perimetro_pecho')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`perimetro_pecho\``,
      );
    }
    if (existingColumns.includes('perimetro_muslo')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`perimetro_muslo\``,
      );
    }
    if (existingColumns.includes('perimetro_brazo')) {
      await queryRunner.query(
        `ALTER TABLE \`medicion\` DROP COLUMN \`perimetro_brazo\``,
      );
    }
  }
}
