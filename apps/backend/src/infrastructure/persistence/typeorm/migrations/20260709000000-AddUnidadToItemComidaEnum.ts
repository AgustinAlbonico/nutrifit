import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sincroniza el ENUM de `item_comida.unidad_medida` con el enum TypeScript
 * `UnidadMedida` del dominio (apps/backend/src/domain/entities/Alimento/UnidadMedida.ts).
 *
 * Contexto:
 * - La migration `20260507010000-UseItemComidaRelation` creó la columna con 8
 *   valores (gramo, kilogramo, mililitro, litro, miligramo, taza, cucharada,
 *   cucharadita).
 * - El enum de dominio fue extendido con `UNIDAD = 'unidad'`, pero la BD nunca
 *   se migró. Cualquier INSERT/UPDATE con `unidad_medida = 'unidad'` falla con
 *   `Data truncated for column 'unidad_medida' at row 1`.
 *
 * Esta migration agrega `'unidad'` al ENUM sin alterar filas existentes.
 */
export class AddUnidadToItemComidaEnum20260709000000 implements MigrationInterface {
  name = 'AddUnidadToItemComidaEnum20260709000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columna = (await queryRunner.query(
      `SELECT COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'item_comida'
         AND COLUMN_NAME = 'unidad_medida'
       LIMIT 1`,
    )) as Array<{ COLUMN_TYPE: string }>;

    const tipoActual = columna[0]?.COLUMN_TYPE ?? '';
    if (tipoActual.includes("'unidad'")) {
      // Ya migrado: no-op idempotente.
      return;
    }

    await queryRunner.query(
      `ALTER TABLE item_comida
       MODIFY COLUMN unidad_medida
         ENUM('gramo','kilogramo','mililitro','litro','miligramo','taza','cucharada','cucharadita','unidad')
         NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Antes de quitar 'unidad' del ENUM, asegurar que ninguna fila lo usa.
    await queryRunner.query(
      `UPDATE item_comida
       SET unidad_medida = 'gramo'
       WHERE unidad_medida = 'unidad'`,
    );

    await queryRunner.query(
      `ALTER TABLE item_comida
       MODIFY COLUMN unidad_medida
         ENUM('gramo','kilogramo','mililitro','litro','miligramo','taza','cucharada','cucharadita')
         NOT NULL`,
    );
  }
}