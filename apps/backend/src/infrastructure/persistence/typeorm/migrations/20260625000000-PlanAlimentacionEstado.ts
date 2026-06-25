import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PlanAlimentacionEstado20260625000000
 * =====================================
 *
 * Plan IA v2 (Packet 4) — máquina de estados explícita para
 * `plan_alimentacion`. Antes solo había un flag `activo` boolean; ahora
 * necesitamos distinguir BORRADOR, ACTIVO y FINALIZADO.
 *
 * Columnas nuevas en `plan_alimentacion`:
 *   - `estado` enum/varchar(20) NOT NULL DEFAULT 'ACTIVO'
 *     (los planes pre-existentes con activo=true se interpretan como ACTIVO).
 *   - `finalizado_at` datetime NULL (timestamp de transición a FINALIZADO).
 *
 * Backfill: para cada fila existente se mapea `activo=true → 'ACTIVO'`,
 * `activo=false → 'BORRADOR'`. Esto preserva el comportamiento previo.
 *
 * Decisión: mantener `activo` para compatibilidad con queries existentes
 * (eager loading del OneToMany `dias`, controllers que filtran por activo,
 * índices). El nuevo `estado` agrega granularidad sin romper nada.
 *
 * Compatibilidad hacia atrás: el seed multi-tenant ya crea planes con
 * activo=true → estado='ACTIVO' (default). Tests existentes que filtran
 * por `activo=true` siguen funcionando.
 */
export class PlanAlimentacionEstado20260625000000
  implements MigrationInterface
{
  name = 'PlanAlimentacionEstado20260625000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Agregar columna `estado`
    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ADD COLUMN \`estado\` varchar(20) NOT NULL DEFAULT 'ACTIVO'
    `);

    // 2) Agregar columna `finalizado_at`
    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ADD COLUMN \`finalizado_at\` datetime NULL
    `);

    // 3) Backfill: planes con activo=false pasan a BORRADOR
    await queryRunner.query(`
      UPDATE \`plan_alimentacion\`
      SET \`estado\` = 'BORRADOR'
      WHERE \`activo\` = false
    `);

    // 4) Índice sobre estado para queries por estado del plan
    await queryRunner.query(`
      CREATE INDEX \`idx_plan_alimentacion_estado\` ON \`plan_alimentacion\` (\`estado\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX \`idx_plan_alimentacion_estado\` ON \`plan_alimentacion\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      DROP COLUMN \`finalizado_at\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      DROP COLUMN \`estado\`
    `);
  }
}