import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanDuplicateAgenda20260608000000 implements MigrationInterface {
  name = 'CleanDuplicateAgenda20260608000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar filas duplicadas exactas, conservando solo la de menor id_agenda
    await queryRunner.query(`
      DELETE a1 FROM agenda a1
      INNER JOIN agenda a2
      WHERE a1.id_agenda > a2.id_agenda
        AND a1.id_nutricionista = a2.id_nutricionista
        AND a1.dia = a2.dia
        AND a1.hora_inicio = a2.hora_inicio
        AND a1.hora_fin = a2.hora_fin
    `);

    // Agregar unique constraint para evitar futuros duplicados
    await queryRunner.query(`
      ALTER TABLE \`agenda\`
      ADD UNIQUE INDEX \`UQ_AGENDA_NUTRI_DIA_HORARIO\`
        (\`id_nutricionista\`, \`dia\`, \`hora_inicio\`, \`hora_fin\`)
    `).catch(() => {
      // Ignorar si el index ya existe (puede haberse agregado manualmente)
    });
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`agenda\` DROP INDEX \`UQ_AGENDA_NUTRI_DIA_HORARIO\`
    `);
  }
}
