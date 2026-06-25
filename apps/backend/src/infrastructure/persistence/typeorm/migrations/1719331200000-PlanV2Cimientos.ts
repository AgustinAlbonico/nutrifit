import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanV2Cimientos1719331200000 implements MigrationInterface {
  name = 'PlanV2Cimientos1719331200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Columnas nuevas en tablas existentes
    await queryRunner.query(
      `ALTER TABLE plan_alimentacion ADD COLUMN notas_generacion VARCHAR(1000) NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE nutricionista_orm ADD COLUMN preferencias_ia TEXT NULL`,
    );

    // 2) Tabla plan_alimentacion_version
    await queryRunner.query(
      `CREATE TABLE plan_alimentacion_version (
        id_plan_alimentacion_version INT AUTO_INCREMENT PRIMARY KEY,
        id_plan_alimentacion INT NOT NULL,
        numero_version INT NOT NULL,
        datos_json JSON NOT NULL,
        motivo_cambio VARCHAR(255) NULL,
        activa BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by INT NOT NULL,
        CONSTRAINT fk_plan_version_plan
          FOREIGN KEY (id_plan_alimentacion) REFERENCES plan_alimentacion(id_plan_alimentacion),
        CONSTRAINT fk_plan_version_persona
          FOREIGN KEY (created_by) REFERENCES persona(id_persona),
        UNIQUE KEY uk_plan_version_numero (id_plan_alimentacion, numero_version),
        INDEX idx_plan_version_activa (id_plan_alimentacion, activa)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

    // 3) Tabla plan_feedback
    await queryRunner.query(
      `CREATE TABLE plan_feedback (
        id_plan_feedback INT AUTO_INCREMENT PRIMARY KEY,
        id_plan_alimentacion_version INT NOT NULL,
        id_nutricionista INT NOT NULL,
        voto ENUM('POSITIVO','NEGATIVO') NOT NULL,
        comentario VARCHAR(500) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_feedback_version
          FOREIGN KEY (id_plan_alimentacion_version) REFERENCES plan_alimentacion_version(id_plan_alimentacion_version)
          ON DELETE CASCADE,
        CONSTRAINT fk_feedback_nutricionista
          FOREIGN KEY (id_nutricionista) REFERENCES persona(id_persona),
        UNIQUE KEY uk_feedback_version (id_plan_alimentacion_version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

    // 4) Tabla nutricionista_ia_memoria
    await queryRunner.query(
      `CREATE TABLE nutricionista_ia_memoria (
        id_nutricionista_ia_memoria INT AUTO_INCREMENT PRIMARY KEY,
        id_nutricionista INT NOT NULL,
        tipo_ejemplo ENUM('POSITIVO','NEGATIVO') NOT NULL,
        comentario VARCHAR(500) NOT NULL,
        id_plan_alimentacion_version INT NULL,
        archivada BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_memoria_nutricionista
          FOREIGN KEY (id_nutricionista) REFERENCES persona(id_persona),
        CONSTRAINT fk_memoria_version
          FOREIGN KEY (id_plan_alimentacion_version) REFERENCES plan_alimentacion_version(id_plan_alimentacion_version)
          ON DELETE SET NULL,
        INDEX idx_memoria_seleccion (id_nutricionista, tipo_ejemplo, archivada)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );

    // 5) Backfill: crear v1 para cada plan_alimentacion existente
    await queryRunner.query(
      `INSERT INTO plan_alimentacion_version
        (id_plan_alimentacion, numero_version, datos_json, motivo_cambio, activa, created_by, created_at)
      SELECT
        id_plan_alimentacion,
        1,
        JSON_OBJECT(
          'estructura', JSON_ARRAY(),
          'macrosPorDia', JSON_OBJECT(),
          'razonamientoCumplimiento', JSON_OBJECT('restriccionesCumplidas', JSON_ARRAY(), 'restriccionesNoCumplidas', JSON_ARRAY())
        ),
        'creacion_inicial_backfill',
        TRUE,
        id_nutricionista,
        created_at
      FROM plan_alimentacion`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS nutricionista_ia_memoria`);
    await queryRunner.query(`DROP TABLE IF EXISTS plan_feedback`);
    await queryRunner.query(`DROP TABLE IF EXISTS plan_alimentacion_version`);
    await queryRunner.query(
      `ALTER TABLE nutricionista_orm DROP COLUMN preferencias_ia`,
    );
    await queryRunner.query(
      `ALTER TABLE plan_alimentacion DROP COLUMN notas_generacion`,
    );
  }
}