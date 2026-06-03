import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla `ficha_salud_version` para historial inmutable (RB50, RB29, RB42)
 * y agrega columnas de versionado a `ficha_salud` (RB14, RB44).
 *
 * Tabla nueva `ficha_salud_version`:
 *   - PK auto-increment `id_ficha_salud_version`
 *   - FK a `ficha_salud` (CASCADE)
 *   - FK a `persona` (RESTRICT) + INDEX para queries directos
 *   - `version` int, UNIQUE(id_ficha_salud, version)
 *   - `datos_json` json (snapshot completo de la ficha)
 *   - `created_at` timestamp (default CURRENT_TIMESTAMP)
 *   - `created_by` int NULL (FK a usuario)
 *   - INDEX sobre `created_at` para ordenar historial DESC
 *
 * Columnas nuevas en `ficha_salud`:
 *   - `completada` boolean NOT NULL DEFAULT false  (RB14)
 *   - `completada_at` datetime NULL                (RB50, RB15)
 *   - `actualizada_at` datetime NULL               (RB15, RB42)
 *   - `consent_at` datetime NULL                   (RB44)
 *   - `version_actual_id` int NULL FK a ficha_salud_version (RB50, ON DELETE RESTRICT)
 *   - `revisada_por_nutricionista_at` datetime NULL (RB45)
 *   - INDEX sobre `completada` para optimizar RB14
 *
 * Backfill: para cada fila existente en `ficha_salud` se asume que está
 * completada (pre-RGPD implícito) y se crea una versión v1 con snapshot
 * de los campos actuales.
 */
export class FichaSaludVersionado20260603194401 implements MigrationInterface {
  name = 'FichaSaludVersionado20260603194401';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla `ficha_salud_version`
    await queryRunner.query(`
      CREATE TABLE \`ficha_salud_version\` (
        \`id_ficha_salud_version\` int NOT NULL AUTO_INCREMENT,
        \`id_ficha_salud\` int NOT NULL,
        \`id_socio\` int NOT NULL,
        \`version\` int NOT NULL,
        \`datos_json\` json NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`created_by\` int NULL,
        PRIMARY KEY (\`id_ficha_salud_version\`),
        UNIQUE KEY \`idx_fsv_ficha_version\` (\`id_ficha_salud\`, \`version\`),
        KEY \`idx_fsv_socio\` (\`id_socio\`),
        KEY \`idx_fsv_created_at\` (\`created_at\`),
        CONSTRAINT \`fk_fsv_ficha_salud\`
          FOREIGN KEY (\`id_ficha_salud\`) REFERENCES \`ficha_salud\` (\`id_ficha_salud\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_fsv_socio\`
          FOREIGN KEY (\`id_socio\`) REFERENCES \`persona\` (\`id_persona\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Agregar columnas nuevas a `ficha_salud`
    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`completada\` boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`completada_at\` datetime NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`actualizada_at\` datetime NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`consent_at\` datetime NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`version_actual_id\` int NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD COLUMN \`revisada_por_nutricionista_at\` datetime NULL
    `);

    // 3. Crear índice sobre `completada` (optimiza RB14)
    await queryRunner.query(`
      CREATE INDEX \`idx_fs_completada\` ON \`ficha_salud\` (\`completada\`)
    `);

    // 4. Backfill de fichas pre-existentes
    // Asumimos: si existe la ficha, está completada (caso conservador pre-RB14).
    // Pre-RGPD: si la subieron, consintieron implícitamente.
    const fichasExistentes: Array<{
      id_ficha_salud: number;
      id_ficha_salud_real: number;
      fecha_creacion: Date;
    }> = await queryRunner.query(`
      SELECT
        \`id_ficha_salud\`,
        \`fecha_creacion\`
      FROM \`ficha_salud\`
      ORDER BY \`id_ficha_salud\` ASC
    `);

    let contadorBackfill = 0;

    for (const fila of fichasExistentes) {
      const idFicha = fila.id_ficha_salud;
      const fechaCreacion = fila.fecha_creacion ?? new Date();

      // Marcar como completada y setear timestamps
      await queryRunner.query(
        `UPDATE \`ficha_salud\`
         SET \`completada\` = true,
             \`completada_at\` = ?,
             \`actualizada_at\` = ?,
             \`consent_at\` = ?
         WHERE \`id_ficha_salud\` = ?`,
        [fechaCreacion, fechaCreacion, fechaCreacion, idFicha],
      );

      // Obtener datos crudos para construir snapshot JSON.
      // Incluimos solo los campos pre-existentes; los nuevos quedan null
      // porque son metadatos de versionado (consent_at, etc.).
      const datos: Array<{
        altura: number;
        peso: number;
        nivel_actividad_fisica: string | null;
        objetivo_personal: string | null;
        medicacion_actual: string | null;
        suplementos_actuales: string | null;
        cirugias_previas: string | null;
        antecedentes_familiares: string | null;
        frecuencia_comidas: string | null;
        consumo_agua_diario: number | null;
        restricciones_alimentarias: string | null;
        consumo_alcohol: string | null;
        fuma_tabaco: boolean | null;
        horas_sueno: number | null;
        contacto_emergencia_nombre: string | null;
        contacto_emergencia_telefono: string | null;
      }> = await queryRunner.query(
        `SELECT
           \`altura\`, \`peso\`, \`nivel_actividad_fisica\`, \`objetivo_personal\`,
           \`medicacion_actual\`, \`suplementos_actuales\`,
           \`cirugias_previas\`, \`antecedentes_familiares\`,
           \`frecuencia_comidas\`, \`consumo_agua_diario\`, \`restricciones_alimentarias\`,
           \`consumo_alcohol\`, \`fuma_tabaco\`, \`horas_sueno\`,
           \`contacto_emergencia_nombre\`, \`contacto_emergencia_telefono\`
         FROM \`ficha_salud\`
         WHERE \`id_ficha_salud\` = ?`,
        [idFicha],
      );

      if (!datos.length) {
        continue;
      }

      const snapshot = {
        ...datos[0],
        // id_socio no está directamente en ficha_salud; lo buscamos vía persona->socio
        alergias: [],
        patologias: [],
      };

      // Obtener id_socio (persona dueña de la ficha)
      const socioRows: Array<{ id_persona: number }> = await queryRunner.query(
        `SELECT \`id_persona\` FROM \`persona\` WHERE \`id_ficha_salud\` = ? LIMIT 1`,
        [idFicha],
      );

      const idSocio = socioRows[0]?.id_persona;
      if (idSocio == null) {
        // No hay socio asociado; saltamos esta ficha (no debería pasar)
        continue;
      }

      // Obtener nombres de alergias
      const alergiaRows: Array<{ nombre: string }> = await queryRunner.query(
        `SELECT a.\`nombre\`
         FROM \`alergia\` a
         INNER JOIN \`ficha_salud_alergias\` fa ON fa.\`id_alergia\` = a.\`id_alergia\`
         WHERE fa.\`id_ficha_salud\` = ?`,
        [idFicha],
      );
      snapshot.alergias = alergiaRows.map((a) => a.nombre);

      // Obtener nombres de patologías
      const patologiaRows: Array<{ nombre: string }> = await queryRunner.query(
        `SELECT p.\`nombre\`
         FROM \`patologia\` p
         INNER JOIN \`ficha_salud_patologias\` fp ON fp.\`id_patologia\` = p.\`id_patologia\`
         WHERE fp.\`id_ficha_salud\` = ?`,
        [idFicha],
      );
      snapshot.patologias = patologiaRows.map((p) => p.nombre);

      // Insertar versión v1
      const insertVersionResult: Array<{ id_ficha_salud_version: number }> =
        await queryRunner.query(
          `INSERT INTO \`ficha_salud_version\`
           (\`id_ficha_salud\`, \`id_socio\`, \`version\`, \`datos_json\`, \`created_at\`, \`created_by\`)
           VALUES (?, ?, 1, ?, ?, NULL)`,
          [idFicha, idSocio, JSON.stringify(snapshot), fechaCreacion],
        );

      const idVersion = insertVersionResult.insertId;

      // Apuntar la ficha a su versión actual
      await queryRunner.query(
        `UPDATE \`ficha_salud\` SET \`version_actual_id\` = ? WHERE \`id_ficha_salud\` = ?`,
        [idVersion, idFicha],
      );

      contadorBackfill += 1;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[FichaSaludVersionado] Backfill completado: ${contadorBackfill} fichas migradas a v1.`,
    );

    // 5. Ahora que versión_actual_id está poblado, agregar la FK
    // (se hace al final para evitar problemas de orden con el backfill)
    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\`
      ADD CONSTRAINT \`fk_fs_version_actual\`
        FOREIGN KEY (\`version_actual_id\`) REFERENCES \`ficha_salud_version\` (\`id_ficha_salud_version\`)
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en orden inverso
    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP FOREIGN KEY \`fk_fs_version_actual\`
    `);

    await queryRunner.query(`
      DROP INDEX \`idx_fs_completada\` ON \`ficha_salud\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`revisada_por_nutricionista_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`version_actual_id\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`consent_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`actualizada_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`completada_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`ficha_salud\` DROP COLUMN \`completada\`
    `);

    await queryRunner.query(`
      DROP TABLE \`ficha_salud_version\`
    `);
  }
}
