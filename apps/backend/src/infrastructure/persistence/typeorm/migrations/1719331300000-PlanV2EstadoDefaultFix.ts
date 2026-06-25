import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PlanV2EstadoDefaultFix — Hotfix Packet 8 (plan-alimentacion-ia-v2)
 * ==================================================================
 *
 * Corrige los defaults de `plan_alimentacion.activo` y
 * `plan_alimentacion.estado` para alinearlos con el diseño v2:
 *
 *   - Antes: `activo` default `true`, `estado` default `'ACTIVO'`
 *   - Después: `activo` default `false`, `estado` default `'BORRADOR'`
 *
 * Razón: la primera generación de un plan debe quedar en estado
 * BORRADOR (no ACTIVO) hasta que el nutricionista lo active
 * explícitamente vía `ActivarPlanAlimentacionUseCase`. Si el default
 * es ACTIVO, los planes recién generados se exponen al socio sin
 * revisión clínica.
 *
 * Compatibilidad hacia atrás:
 *   - Esta migración SOLO cambia los defaults a nivel de columna.
 *   - NO toca filas existentes: los planes legacy con `activo=true` /
 *     `estado='ACTIVO'` mantienen su valor actual.
 *   - Las próximas inserciones que no especifiquen `activo` o `estado`
 *     recibirán los nuevos defaults (`false` / `'BORRADOR'`).
 *
 * Rollback (`down`): revierte los defaults a los valores legacy.
 */
export class PlanV2EstadoDefaultFix1719331300000
  implements MigrationInterface
{
  name = 'PlanV2EstadoDefaultFix1719331300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Cambiar default de `activo` a `false`
    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ALTER COLUMN \`activo\` SET DEFAULT false
    `);

    // 2) Cambiar default de `estado` a 'BORRADOR'
    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ALTER COLUMN \`estado\` SET DEFAULT 'BORRADOR'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: restaurar defaults legacy
    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ALTER COLUMN \`activo\` SET DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE \`plan_alimentacion\`
      ALTER COLUMN \`estado\` SET DEFAULT 'ACTIVO'
    `);
  }
}