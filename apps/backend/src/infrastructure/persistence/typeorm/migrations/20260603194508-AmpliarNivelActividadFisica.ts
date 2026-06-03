import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Amplía el enum `nivel_actividad_fisica` de 3 a 5 valores.
 *
 * Valores originales en DB (capital-case): 'Sedentario', 'Moderado', 'Intenso'
 * Valores nuevos (upper-case, alineados con el enum TS): SEDENTARIO, LIGERO,
 * MODERADO, INTENSO, MUY_INTENSO.
 *
 * La migración primero normaliza los valores existentes a upper-case para
 * que ningún registro quede inválido al modificar el tipo de columna.
 */
export class AmpliarNivelActividadFisica20260603194508 implements MigrationInterface {
  name = 'AmpliarNivelActividadFisica20260603194508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Normalizar valores existentes a upper-case para no perder datos
    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'SEDENTARIO'
      WHERE \`nivel_actividad_fisica\` = 'Sedentario'
    `);

    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'MODERADO'
      WHERE \`nivel_actividad_fisica\` = 'Moderado'
    `);

    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'INTENSO'
      WHERE \`nivel_actividad_fisica\` = 'Intenso'
    `);

    // 2. Modificar la columna al nuevo enum de 5 valores
    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      MODIFY COLUMN \`nivel_actividad_fisica\`
      enum('SEDENTARIO','LIGERO','MODERADO','INTENSO','MUY_INTENSO') NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Volver al enum original de 3 valores (sin LIGERO ni MUY_INTENSO)
    // Primero asegurarse de que no haya valores que no entren en el enum viejo
    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'MODERADO'
      WHERE \`nivel_actividad_fisica\` IN ('LIGERO', 'MUY_INTENSO')
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      MODIFY COLUMN \`nivel_actividad_fisica\`
      enum('Sedentario','Moderado','Intenso') NOT NULL
    `);

    // 2. Revertir capital-case (opcional, no estrictamente necesario)
    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'Sedentario'
      WHERE \`nivel_actividad_fisica\` = 'SEDENTARIO'
    `);

    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'Moderado'
      WHERE \`nivel_actividad_fisica\` = 'MODERADO'
    `);

    await queryRunner.query(`
      UPDATE \`ficha_salud\`
      SET \`nivel_actividad_fisica\` = 'Intenso'
      WHERE \`nivel_actividad_fisica\` = 'INTENSO'
    `);
  }
}
