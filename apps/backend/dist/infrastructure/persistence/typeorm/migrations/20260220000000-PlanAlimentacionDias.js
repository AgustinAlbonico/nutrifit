"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanAlimentacionDias20260220000000 = void 0;
const typeorm_1 = require("typeorm");
class PlanAlimentacionDias20260220000000 {
    name = 'PlanAlimentacionDias20260220000000';
    async columnExists(queryRunner, tableName, columnName) {
        const table = await queryRunner.getTable(tableName);
        if (!table) {
            return false;
        }
        const columns = table.columns;
        return columns.some((col) => col.name === columnName);
    }
    async getForeignKeyName(queryRunner, tableName, columnName) {
        const table = await queryRunner.getTable(tableName);
        if (!table) {
            return null;
        }
        const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.includes(columnName));
        return foreignKey?.name ?? null;
    }
    async up(queryRunner) {
        const diaPlanExists = await queryRunner.hasTable('dia_plan');
        if (!diaPlanExists) {
            await queryRunner.createTable(new typeorm_1.Table({
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
            }), true);
            await queryRunner.createIndex('dia_plan', new typeorm_1.TableIndex({
                name: 'IDX_DIA_PLAN_PLAN_ALIMENTACION',
                columnNames: ['id_plan_alimentacion'],
            }));
            await queryRunner.createForeignKey('dia_plan', new typeorm_1.TableForeignKey({
                name: 'FK_DIA_PLAN_PLAN_ALIMENTACION',
                columnNames: ['id_plan_alimentacion'],
                referencedTableName: 'plan_alimentacion',
                referencedColumnNames: ['id_plan_alimentacion'],
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }));
        }
        const colActivoExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'activo');
        const colEliminadoEnExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'eliminado_en');
        const colMotivoEliminacionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'motivo_eliminacion');
        const colMotivoEdicionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'motivo_edicion');
        const colUltimaEdicionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'ultima_edicion');
        if (!colActivoExists) {
            await queryRunner.addColumn('plan_alimentacion', new typeorm_1.TableColumn({
                name: 'activo',
                type: 'boolean',
                default: true,
            }));
        }
        if (!colEliminadoEnExists) {
            await queryRunner.addColumn('plan_alimentacion', new typeorm_1.TableColumn({
                name: 'eliminado_en',
                type: 'datetime',
                isNullable: true,
            }));
        }
        if (!colMotivoEliminacionExists) {
            await queryRunner.addColumn('plan_alimentacion', new typeorm_1.TableColumn({
                name: 'motivo_eliminacion',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }));
        }
        if (!colMotivoEdicionExists) {
            await queryRunner.addColumn('plan_alimentacion', new typeorm_1.TableColumn({
                name: 'motivo_edicion',
                type: 'varchar',
                length: '255',
                isNullable: true,
            }));
        }
        if (!colUltimaEdicionExists) {
            await queryRunner.addColumn('plan_alimentacion', new typeorm_1.TableColumn({
                name: 'ultima_edicion',
                type: 'datetime',
                isNullable: true,
            }));
        }
        const oldFkName = await this.getForeignKeyName(queryRunner, 'opcion_comida', 'id_plan_alimentacion');
        const colIdDiaPlanExists = await this.columnExists(queryRunner, 'opcion_comida', 'id_dia_plan');
        if (!colIdDiaPlanExists) {
            await queryRunner.addColumn('opcion_comida', new typeorm_1.TableColumn({
                name: 'id_dia_plan',
                type: 'int',
                isNullable: true,
            }));
            await queryRunner.createForeignKey('opcion_comida', new typeorm_1.TableForeignKey({
                name: 'FK_OPCION_COMIDA_DIA_PLAN',
                columnNames: ['id_dia_plan'],
                referencedTableName: 'dia_plan',
                referencedColumnNames: ['id_dia_plan'],
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }));
        }
        const colIdPlanAlimentacionExists = await this.columnExists(queryRunner, 'opcion_comida', 'id_plan_alimentacion');
        if (colIdPlanAlimentacionExists) {
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
            await queryRunner.query(`
        UPDATE opcion_comida oc
        JOIN dia_plan dp ON oc.id_plan_alimentacion = dp.id_plan_alimentacion
        SET oc.id_dia_plan = dp.id_dia_plan
        WHERE oc.id_dia_plan IS NULL
      `);
            if (oldFkName) {
                try {
                    await queryRunner.dropForeignKey('opcion_comida', oldFkName);
                }
                catch (error) {
                }
            }
            await queryRunner.dropColumn('opcion_comida', 'id_plan_alimentacion');
        }
    }
    async down(queryRunner) {
        const newFkName = await this.getForeignKeyName(queryRunner, 'opcion_comida', 'id_dia_plan');
        const diaPlanFkName = await this.getForeignKeyName(queryRunner, 'dia_plan', 'id_plan_alimentacion');
        if (newFkName) {
            try {
                await queryRunner.dropForeignKey('opcion_comida', newFkName);
            }
            catch (error) {
            }
        }
        const colIdDiaPlanExists = await this.columnExists(queryRunner, 'opcion_comida', 'id_dia_plan');
        if (colIdDiaPlanExists) {
            const colIdPlanAlimentacionExists = await this.columnExists(queryRunner, 'opcion_comida', 'id_plan_alimentacion');
            if (!colIdPlanAlimentacionExists) {
                await queryRunner.addColumn('opcion_comida', new typeorm_1.TableColumn({
                    name: 'id_plan_alimentacion',
                    type: 'int',
                    isNullable: true,
                }));
            }
            await queryRunner.query(`
        UPDATE opcion_comida oc
        JOIN dia_plan dp ON oc.id_dia_plan = dp.id_dia_plan
        SET oc.id_plan_alimentacion = dp.id_plan_alimentacion
        WHERE oc.id_plan_alimentacion IS NULL
      `);
            await queryRunner.dropColumn('opcion_comida', 'id_dia_plan');
        }
        if (diaPlanFkName) {
            try {
                await queryRunner.dropForeignKey('dia_plan', diaPlanFkName);
            }
            catch (error) {
            }
        }
        const colUltimaEdicionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'ultima_edicion');
        if (colUltimaEdicionExists) {
            await queryRunner.dropColumn('plan_alimentacion', 'ultima_edicion');
        }
        const colMotivoEdicionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'motivo_edicion');
        if (colMotivoEdicionExists) {
            await queryRunner.dropColumn('plan_alimentacion', 'motivo_edicion');
        }
        const colMotivoEliminacionExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'motivo_eliminacion');
        if (colMotivoEliminacionExists) {
            await queryRunner.dropColumn('plan_alimentacion', 'motivo_eliminacion');
        }
        const colEliminadoEnExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'eliminado_en');
        if (colEliminadoEnExists) {
            await queryRunner.dropColumn('plan_alimentacion', 'eliminado_en');
        }
        const colActivoExists = await this.columnExists(queryRunner, 'plan_alimentacion', 'activo');
        if (colActivoExists) {
            await queryRunner.dropColumn('plan_alimentacion', 'activo');
        }
        const diaPlanExists = await queryRunner.hasTable('dia_plan');
        if (diaPlanExists) {
            await queryRunner.dropTable('dia_plan');
        }
    }
}
exports.PlanAlimentacionDias20260220000000 = PlanAlimentacionDias20260220000000;
//# sourceMappingURL=20260220000000-PlanAlimentacionDias.js.map