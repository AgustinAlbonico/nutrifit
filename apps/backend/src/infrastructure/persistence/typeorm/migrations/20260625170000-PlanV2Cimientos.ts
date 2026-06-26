import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlanV2Cimientos20260625170000 implements MigrationInterface {
  name = 'PlanV2Cimientos20260625170000';

  /**
   * Helper: agrega una columna SOLO si no existe.
   * Necesario porque el rollback de MySQL en ALTER TABLE no siempre es completo.
   */
  private async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    definition: string,
  ): Promise<void> {
    const result: unknown = await queryRunner.query(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName],
    );
    const rows = this.extractRows(result);
    const total = Number(rows[0]?.total ?? 0);
    if (total === 0) {
      await queryRunner.query(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
      );
    }
  }

  /**
   * Helper: crea una tabla SOLO si no existe.
   */
  private async createTableIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    definition: string,
  ): Promise<void> {
    const result: unknown = await queryRunner.query(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?`,
      [tableName],
    );
    const rows = this.extractRows(result);
    const total = Number(rows[0]?.total ?? 0);
    if (total === 0) {
      await queryRunner.query(`CREATE TABLE ${tableName} ${definition}`);
    }
  }

  /**
   * Helper: extrae el array de filas de un resultado de query que puede
   * venir como [rows, fields] (mysql2 nativo) o como rows (typeorm abstract).
   */
  private extractRows(result: unknown): Record<string, unknown>[] {
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as Record<string, unknown>[];
    }
    if (Array.isArray(result)) {
      return result as Record<string, unknown>[];
    }
    return [];
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Columnas nuevas en tablas existentes (idempotente)
    await this.addColumnIfNotExists(
      queryRunner,
      'plan_alimentacion',
      'notas_generacion',
      'VARCHAR(1000) NULL',
    );

    await this.addColumnIfNotExists(
      queryRunner,
      'persona',
      'preferencias_ia',
      'TEXT NULL',
    );

    // 2) Tabla plan_alimentacion_version
    await this.createTableIfNotExists(
      queryRunner,
      'plan_alimentacion_version',
      `(
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
    await this.createTableIfNotExists(
      queryRunner,
      'plan_feedback',
      `(
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
    await this.createTableIfNotExists(
      queryRunner,
      'nutricionista_ia_memoria',
      `(
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

    // 5) Backfill: crear v1 para cada plan_alimentacion existente (solo si NO hay version ya)
    const existingResult: unknown = await queryRunner.query(
      `SELECT COUNT(*) AS total FROM plan_alimentacion_version`,
    );
    const existingRows = this.extractRows(existingResult);
    const existingTotal = Number(existingRows[0]?.total ?? 0);
    if (existingTotal === 0) {
      // El proyecto usa fechaCreacion (no created_at) en plan_alimentacion.
      // Para created_at del version usamos NOW() consistente.
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
          CURRENT_TIMESTAMP
        FROM plan_alimentacion`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS nutricionista_ia_memoria`);
    await queryRunner.query(`DROP TABLE IF EXISTS plan_feedback`);
    await queryRunner.query(`DROP TABLE IF EXISTS plan_alimentacion_version`);
    await this.dropColumnIfExists(queryRunner, 'persona', 'preferencias_ia');
    await this.dropColumnIfExists(
      queryRunner,
      'plan_alimentacion',
      'notas_generacion',
    );
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const result: unknown = await queryRunner.query(
      `SELECT COUNT(*) AS total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
      [tableName, columnName],
    );
    const rows = this.extractRows(result);
    const total = Number(rows[0]?.total ?? 0);
    if (total > 0) {
      await queryRunner.query(
        `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`,
      );
    }
  }
}