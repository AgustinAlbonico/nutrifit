import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiplomaTable20260616200000 implements MigrationInterface {
  name = 'CreateDiplomaTable20260616200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE diploma (
        id_diploma INT AUTO_INCREMENT PRIMARY KEY,
        id_nutricionista INT NOT NULL,
        document_key VARCHAR(255) NOT NULL,
        nombre_original VARCHAR(255) NULL,
        mime_type VARCHAR(100) NULL,
        creado_en DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        created_by VARCHAR(255) NULL,
        updated_by VARCHAR(255) NULL,
        CONSTRAINT FK_diploma_nutricionista FOREIGN KEY (id_nutricionista)
          REFERENCES persona(id_persona) ON DELETE CASCADE
      )
    `);

    // Migrar diplomas existentes de persona.matricula_documento_key a la nueva tabla
    await queryRunner.query(`
      INSERT INTO diploma (id_nutricionista, document_key, creado_en, created_at, updated_at)
      SELECT id_persona, matricula_documento_key, NOW(), NOW(), NOW()
      FROM persona
      WHERE tipo_persona = 'nutricionista' AND matricula_documento_key IS NOT NULL
    `);

    // Mantenemos la columna vieja para no romper código existente durante la transición
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS diploma');
  }
}
