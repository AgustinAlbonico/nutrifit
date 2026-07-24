/**
 * Garantiza que un socio tenga un único plan ACTIVO al momento de activar/publicar.
 * Finaliza el resto de planes activos del mismo socio dentro de la transacción.
 */
import type { EntityManager } from 'typeorm';

import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { PlanAlimentacionVersionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion-version.entity';

/**
 * Bloquea y finaliza otros planes ACTIVO del socio, dejando solo `planAlimentacionId`
 * como candidato a quedar activo.
 */
export async function prepararActivacionExclusivaPlan(
  manager: EntityManager,
  socioId: number,
  planAlimentacionId: number,
  fechaActivacion: Date,
): Promise<void> {
  const planRepo = manager.getRepository(PlanAlimentacionOrmEntity);
  const versionRepo = manager.getRepository(PlanAlimentacionVersionOrmEntity);

  const otrosActivos = await planRepo
    .createQueryBuilder('plan')
    .setLock('pessimistic_write')
    .innerJoin('plan.socio', 'socio')
    .where('socio.idPersona = :socioId', { socioId })
    .andWhere('plan.idPlanAlimentacion != :planAlimentacionId', {
      planAlimentacionId,
    })
    .andWhere('plan.estado = :estado', { estado: 'ACTIVO' })
    .andWhere('plan.eliminadoEn IS NULL')
    .getMany();

  if (otrosActivos.length === 0) {
    return;
  }

  const idsOtros = otrosActivos.map((plan) => plan.idPlanAlimentacion);

  await planRepo
    .createQueryBuilder()
    .update(PlanAlimentacionOrmEntity)
    .set({
      estado: 'FINALIZADO',
      activo: false,
      finalizadoAt: fechaActivacion,
    })
    .where('id_plan_alimentacion IN (:...idsOtros)', { idsOtros })
    .execute();

  await versionRepo
    .createQueryBuilder()
    .update(PlanAlimentacionVersionOrmEntity)
    .set({ activa: false })
    .where('id_plan_alimentacion IN (:...idsOtros)', { idsOtros })
    .execute();
}
