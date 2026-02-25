import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class PlanAlimentacionDias20260220000000 implements MigrationInterface {
  name = 'PlanAlimentacionDias20260220000000';

  /**
   * Helper function to check if a column exists in a table
   */
  private async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return false;
    }
    const columns = table.columns;
    return columns.some((col) => col.name === columnName);
  }

  /**
   * Helper function to get foreign key name by table and column
   * Returns null if FK doesn't exist
   */
  private async getForeignKeyName(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<string | null> {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return null;
    }

    const foreignKey = table.foreignKeys.find((fk) =>
      fk.columnNames.includes(columnName),
    );
    return foreignKey?.name ?? null;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla dia_plan si no existe
    const diaPlanExists = await queryRunner.hasTable('dia_plan');
    if (!diaPlanExists) {
      await queryRunner.createTable(
        new Table({
          name: 'dia_plan',
          columns: [
            {
              name: 'id_dia_plan',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'dia',
              type: 'enum',
              enum: [
                'LUNES',
                'MARTES',
                'MIERCOLES',
                'JUEVES',
                'VIERNES',
                'SABADO',
                'DOMINGO',
              ],
            },
            { name: 'orden', type: 'int' },
            { name: 'id_plan_alimentacion', type: 'int' },
          ],
        }),
        true,
      );

      // Agregar índice a id_plan_alimentacion para mejor rendimiento
      await queryRunner.createIndex(
        'dia_plan',
        new TableIndex({
          name: 'IDX_DIA_PLAN_PLAN_ALIMENTACION',
          columnNames: ['id_plan_alimentacion'],
        }),
      );

      // Agregar FK de dia_plan a plan_alimentacion
      await queryRunner.createForeignKey(
        'dia_plan',
        new TableForeignKey({
          name: 'FK_DIA_PLAN_PLAN_ALIMENTACION',
          columnNames: ['id_plan_alimentacion'],
          referencedTableName: 'plan_alimentacion',
          referencedColumnNames: ['id_plan_alimentacion'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // 2. Verificar si las columnas nuevas ya existen en plan_alimentacion
    const colActivoExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'activo',
    );
    const colEliminadoEnExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'eliminado_en',
    );
    const colMotivoEliminacionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'motivo_eliminacion',
    );
    const colMotivoEdicionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'motivo_edicion',
    );
    const colUltimaEdicionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'ultima_edicion',
    );

    // 3. Agregar columnas nuevas a plan_alimentacion si no existen
    if (!colActivoExists) {
      await queryRunner.addColumn(
        'plan_alimentacion',
        new TableColumn({
          name: 'activo',
          type: 'boolean',
          default: true,
        }),
      );
    }

    if (!colEliminadoEnExists) {
      await queryRunner.addColumn(
        'plan_alimentacion',
        new TableColumn({
          name: 'eliminado_en',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }

    if (!colMotivoEliminacionExists) {
      await queryRunner.addColumn(
        'plan_alimentacion',
        new TableColumn({
          name: 'motivo_eliminacion',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!colMotivoEdicionExists) {
      await queryRunner.addColumn(
        'plan_alimentacion',
        new TableColumn({
          name: 'motivo_edicion',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!colUltimaEdicionExists) {
      await queryRunner.addColumn(
        'plan_alimentacion',
        new TableColumn({
          name: 'ultima_edicion',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }

    // 4. Obtener nombre de la FK antigua antes de modificar la estructura
    const oldFkName = await this.getForeignKeyName(
      queryRunner,
      'opcion_comida',
      'id_plan_alimentacion',
    );

    // 5. Agregar columna id_dia_plan a opcion_comida si no existe
    const colIdDiaPlanExists = await this.columnExists(
      queryRunner,
      'opcion_comida',
      'id_dia_plan',
    );
    if (!colIdDiaPlanExists) {
      await queryRunner.addColumn(
        'opcion_comida',
        new TableColumn({
          name: 'id_dia_plan',
          type: 'int',
          isNullable: true,
        }),
      );

      // Agregar FK de opcion_comida a dia_plan
      await queryRunner.createForeignKey(
        'opcion_comida',
        new TableForeignKey({
          name: 'FK_OPCION_COMIDA_DIA_PLAN',
          columnNames: ['id_dia_plan'],
          referencedTableName: 'dia_plan',
          referencedColumnNames: ['id_dia_plan'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // 6. Verificar si la columna antigua id_plan_alimentación existe
    const colIdPlanAlimentacionExists = await this.columnExists(
      queryRunner,
      'opcion_comida',
      'id_plan_alimentacion',
    );

    // 7. Bloque independiente de migración de datos legacy
    // Se ejecuta SIEMPRE si la columna antigua existe, independientemente de id_dia_plan
    if (colIdPlanAlimentacionExists) {
      // 7a. Crear UN dia_plan por cada id_plan_alimentación (LUNES por defecto)
      // Usando NOT EXISTS para evitar duplicados
      await queryRunner.query(`
        INSERT INTO dia_plan (dia, orden, id_plan_alimentacion)
        SELECT 'LUNES', 1, oc.id_plan_alimentacion
        FROM opcion_comida oc
        WHERE oc.id_plan_alimentacion IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM dia_plan dp
            WHERE dp.id_plan_alimentacion = oc.id_plan_alimentacion
          )
        GROUP BY oc.id_plan_alimentacion
      `);

      // 7b. Establecer id_dia_plan en TODOS los registros de opcion_comida
      await queryRunner.query(`
        UPDATE opcion_comida oc
        JOIN dia_plan dp ON oc.id_plan_alimentacion = dp.id_plan_alimentacion
        SET oc.id_dia_plan = dp.id_dia_plan
        WHERE oc.id_dia_plan IS NULL
      `);

      // 7c. Eliminar la FK antigua de opcion_comida a plan_alimentación
      if (oldFkName) {
        try {
          await queryRunner.dropForeignKey('opcion_comida', oldFkName);
        } catch (error) {
          // FK might not exist, continue
        }
      }

      // 7d. Eliminar columna id_plan_alimentación de opcion_comida
      await queryRunner.dropColumn('opcion_comida', 'id_plan_alimentacion');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Obtener nombres de las FKs antes de modificar la estructura
    const newFkName = await this.getForeignKeyName(
      queryRunner,
      'opcion_comida',
      'id_dia_plan',
    );
    const diaPlanFkName = await this.getForeignKeyName(
      queryRunner,
      'dia_plan',
      'id_plan_alimentacion',
    );

    // 2. Eliminar la nueva FK de opcion_comida a dia_plan si existe
    if (newFkName) {
      try {
        await queryRunner.dropForeignKey('opcion_comida', newFkName);
      } catch (error) {
        // FK might not exist, continue
      }
    }

    // 3. Restaurar id_plan_alimentación desde id_dia_plan y luego eliminar id_dia_plan
    // Se ejecuta SIEMPRE si id_dia_plan existe, independientemente de id_plan_alimentación
    const colIdDiaPlanExists = await this.columnExists(
      queryRunner,
      'opcion_comida',
      'id_dia_plan',
    );
    if (colIdDiaPlanExists) {
      // 3a. Agregar columna id_plan_alimentación si no existe
      const colIdPlanAlimentacionExists = await this.columnExists(
        queryRunner,
        'opcion_comida',
        'id_plan_alimentacion',
      );
      if (!colIdPlanAlimentacionExists) {
        await queryRunner.addColumn(
          'opcion_comida',
          new TableColumn({
            name: 'id_plan_alimentacion',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      // 3b. Establecer id_plan_alimentación desde id_dia_plan
      // Esto preserva las relaciones cuando se revierte la migración
      await queryRunner.query(`
        UPDATE opcion_comida oc
        JOIN dia_plan dp ON oc.id_dia_plan = dp.id_dia_plan
        SET oc.id_plan_alimentacion = dp.id_plan_alimentacion
        WHERE oc.id_plan_alimentacion IS NULL
      `);

      // 3c. Eliminar columna id_dia_plan
      await queryRunner.dropColumn('opcion_comida', 'id_dia_plan');
    }

    // 5. Eliminar la FK de dia_plan a plan_alimentación si existe
    if (diaPlanFkName) {
      try {
        await queryRunner.dropForeignKey('dia_plan', diaPlanFkName);
      } catch (error) {
        // FK might not exist, continue
      }
    }

    // 6. Eliminar columnas de plan_alimentación si existen
    const colUltimaEdicionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'ultima_edicion',
    );
    if (colUltimaEdicionExists) {
      await queryRunner.dropColumn('plan_alimentacion', 'ultima_edicion');
    }

    const colMotivoEdicionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'motivo_edicion',
    );
    if (colMotivoEdicionExists) {
      await queryRunner.dropColumn('plan_alimentacion', 'motivo_edicion');
    }

    const colMotivoEliminacionExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'motivo_eliminacion',
    );
    if (colMotivoEliminacionExists) {
      await queryRunner.dropColumn('plan_alimentacion', 'motivo_eliminacion');
    }

    const colEliminadoEnExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'eliminado_en',
    );
    if (colEliminadoEnExists) {
      await queryRunner.dropColumn('plan_alimentacion', 'eliminado_en');
    }

    const colActivoExists = await this.columnExists(
      queryRunner,
      'plan_alimentacion',
      'activo',
    );
    if (colActivoExists) {
      await queryRunner.dropColumn('plan_alimentacion', 'activo');
    }

    // 8. Eliminar tabla dia_plan si existe
    const diaPlanExists = await queryRunner.hasTable('dia_plan');
    if (diaPlanExists) {
      await queryRunner.dropTable('dia_plan');
    }
  }
}
