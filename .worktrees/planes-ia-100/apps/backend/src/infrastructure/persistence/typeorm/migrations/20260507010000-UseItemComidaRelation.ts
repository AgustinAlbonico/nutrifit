import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class UseItemComidaRelation20260507010000 implements MigrationInterface {
  name = 'UseItemComidaRelation20260507010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const itemComidaExiste = await queryRunner.hasTable('item_comida');

    if (!itemComidaExiste) {
      await queryRunner.createTable(
        new Table({
          name: 'item_comida',
          columns: [
            {
              name: 'id_item_comida',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'id_opcion_comida',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'id_alimento',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'alimento_nombre',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'cantidad',
              type: 'int',
              isNullable: false,
            },
            {
              name: 'unidad_medida',
              type: 'enum',
              enum: [
                'gramo',
                'kilogramo',
                'mililitro',
                'litro',
                'miligramo',
                'taza',
                'cucharada',
                'cucharadita',
              ],
              isNullable: false,
            },
            {
              name: 'notas',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'calorias',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'proteinas',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'carbohidratos',
              type: 'int',
              isNullable: true,
            },
            {
              name: 'grasas',
              type: 'int',
              isNullable: true,
            },
          ],
        }),
      );

      await queryRunner.createIndex(
        'item_comida',
        new TableIndex({
          name: 'IDX_ITEM_COMIDA_OPCION',
          columnNames: ['id_opcion_comida'],
        }),
      );

      await queryRunner.createIndex(
        'item_comida',
        new TableIndex({
          name: 'IDX_ITEM_COMIDA_ALIMENTO',
          columnNames: ['id_alimento'],
        }),
      );

      await queryRunner.createForeignKey(
        'item_comida',
        new TableForeignKey({
          name: 'FK_ITEM_COMIDA_OPCION',
          columnNames: ['id_opcion_comida'],
          referencedTableName: 'opcion_comida',
          referencedColumnNames: ['id_opcion_comida'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'item_comida',
        new TableForeignKey({
          name: 'FK_ITEM_COMIDA_ALIMENTO',
          columnNames: ['id_alimento'],
          referencedTableName: 'alimento',
          referencedColumnNames: ['id_alimento'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    const relacionLegacyExiste = await queryRunner.hasTable(
      'opcion_comida_alimento',
    );

    if (relacionLegacyExiste) {
      await queryRunner.query(`
        INSERT INTO item_comida (
          id_opcion_comida,
          id_alimento,
          alimento_nombre,
          cantidad,
          unidad_medida,
          notas,
          calorias,
          proteinas,
          carbohidratos,
          grasas
        )
        SELECT
          oca.id_opcion_comida,
          oca.id_alimento,
          a.nombre,
          a.cantidad,
          a.unidad_medida,
          NULL,
          a.calorias,
          a.proteinas,
          a.carbohidratos,
          a.grasas
        FROM opcion_comida_alimento oca
        INNER JOIN alimento a ON a.id_alimento = oca.id_alimento
        WHERE NOT EXISTS (
          SELECT 1
          FROM item_comida ic
          WHERE ic.id_opcion_comida = oca.id_opcion_comida
            AND ic.id_alimento = oca.id_alimento
        )
      `);

      await queryRunner.query('DROP TABLE opcion_comida_alimento');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const relacionLegacyExiste = await queryRunner.hasTable(
      'opcion_comida_alimento',
    );

    if (!relacionLegacyExiste) {
      await queryRunner.createTable(
        new Table({
          name: 'opcion_comida_alimento',
          columns: [
            {
              name: 'id_opcion_comida',
              type: 'int',
              isPrimary: true,
            },
            {
              name: 'id_alimento',
              type: 'int',
              isPrimary: true,
            },
          ],
        }),
      );

      await queryRunner.createIndex(
        'opcion_comida_alimento',
        new TableIndex({
          name: 'IDX_d1f65f794858b3454db81858ae',
          columnNames: ['id_opcion_comida'],
        }),
      );

      await queryRunner.createIndex(
        'opcion_comida_alimento',
        new TableIndex({
          name: 'IDX_56cc0a2d6395fe58501652d543',
          columnNames: ['id_alimento'],
        }),
      );

      await queryRunner.createForeignKey(
        'opcion_comida_alimento',
        new TableForeignKey({
          name: 'FK_d1f65f794858b3454db81858ae8',
          columnNames: ['id_opcion_comida'],
          referencedTableName: 'opcion_comida',
          referencedColumnNames: ['id_opcion_comida'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'opcion_comida_alimento',
        new TableForeignKey({
          name: 'FK_56cc0a2d6395fe58501652d5438',
          columnNames: ['id_alimento'],
          referencedTableName: 'alimento',
          referencedColumnNames: ['id_alimento'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        }),
      );
    }

    const itemComidaExiste = await queryRunner.hasTable('item_comida');

    if (itemComidaExiste) {
      await queryRunner.query(`
        INSERT IGNORE INTO opcion_comida_alimento (id_opcion_comida, id_alimento)
        SELECT DISTINCT id_opcion_comida, id_alimento
        FROM item_comida
      `);

      await queryRunner.dropTable('item_comida');
    }
  }
}
