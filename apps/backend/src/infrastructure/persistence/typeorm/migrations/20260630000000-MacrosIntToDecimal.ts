import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migra columnas de macros nutricionales de INT a DECIMAL(8,2) para
 * soportar valores fraccionarios (ej: 3.5g de grasa por 100g de alimento).
 *
 * Tablas afectadas: alimento, item_comida.
 * No hay pérdida de datos — los valores INT existentes se convierten a DECIMAL.
 */
export class MacrosIntToDecimal20260630000000 implements MigrationInterface {
  name = 'MacrosIntToDecimal20260630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // alimento
    await queryRunner.query(`
      ALTER TABLE \`alimento\`
        MODIFY \`cantidad\` DECIMAL(8,2) NOT NULL,
        MODIFY \`calorias\` DECIMAL(8,2) NULL,
        MODIFY \`proteinas\` DECIMAL(8,2) NULL,
        MODIFY \`carbohidratos\` DECIMAL(8,2) NULL,
        MODIFY \`grasas\` DECIMAL(8,2) NULL,
        MODIFY \`hidratos_de_carbono\` DECIMAL(8,2) NULL
    `);

    // item_comida
    await queryRunner.query(`
      ALTER TABLE \`item_comida\`
        MODIFY \`calorias\` DECIMAL(8,2) NULL,
        MODIFY \`proteinas\` DECIMAL(8,2) NULL,
        MODIFY \`carbohidratos\` DECIMAL(8,2) NULL,
        MODIFY \`grasas\` DECIMAL(8,2) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`alimento\`
        MODIFY \`cantidad\` INT NOT NULL,
        MODIFY \`calorias\` INT NULL,
        MODIFY \`proteinas\` INT NULL,
        MODIFY \`carbohidratos\` INT NULL,
        MODIFY \`grasas\` INT NULL,
        MODIFY \`hidratos_de_carbono\` INT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`item_comida\`
        MODIFY \`calorias\` INT NULL,
        MODIFY \`proteinas\` INT NULL,
        MODIFY \`carbohidratos\` INT NULL,
        MODIFY \`grasas\` INT NULL
    `);
  }
}
