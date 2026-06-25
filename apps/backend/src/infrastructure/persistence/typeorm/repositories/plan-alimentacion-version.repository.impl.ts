import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanAlimentacionVersionOrmEntity } from '../entities/plan-alimentacion-version.entity';
import {
  PlanAlimentacionVersionRepository,
  CrearPlanAlimentacionVersionInput,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PlanAlimentacionVersionEntity } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-version.entity';

@Injectable()
export class PlanAlimentacionVersionRepositoryImpl implements PlanAlimentacionVersionRepository {
  constructor(
    @InjectRepository(PlanAlimentacionVersionOrmEntity)
    private readonly repo: Repository<PlanAlimentacionVersionOrmEntity>,
  ) {}

  async crear(
    input: CrearPlanAlimentacionVersionInput,
  ): Promise<PlanAlimentacionVersionEntity> {
    const orm = this.repo.create({
      idPlanAlimentacion: input.idPlanAlimentacion,
      numeroVersion: input.numeroVersion,
      datosJson: input.datosJson,
      motivoCambio: input.motivoCambio,
      activa: input.activa,
      createdBy: input.createdBy,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async obtenerPorId(
    id: number,
  ): Promise<PlanAlimentacionVersionEntity | null> {
    const orm = await this.repo.findOne({
      where: { idPlanAlimentacionVersion: id },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async listarPorPlan(
    planAlimentacionId: number,
  ): Promise<PlanAlimentacionVersionEntity[]> {
    const orms = await this.repo.find({
      where: { idPlanAlimentacion: planAlimentacionId },
      order: { numeroVersion: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async obtenerActiva(
    planAlimentacionId: number,
  ): Promise<PlanAlimentacionVersionEntity | null> {
    const orm = await this.repo.findOne({
      where: {
        idPlanAlimentacion: planAlimentacionId,
        activa: true,
      },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async marcarActiva(
    planAlimentacionId: number,
    versionId: number,
  ): Promise<PlanAlimentacionVersionEntity> {
    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(PlanAlimentacionVersionOrmEntity);

      // 1) Desactivar todas las del plan
      await repo
        .createQueryBuilder()
        .update()
        .set({ activa: false })
        .where('id_plan_alimentacion = :planId', { planId: planAlimentacionId })
        .execute();

      // 2) Activar la indicada
      await repo
        .createQueryBuilder()
        .update()
        .set({ activa: true })
        .where('id_plan_alimentacion_version = :versionId', { versionId })
        .execute();

      const orm = await repo.findOne({
        where: { idPlanAlimentacionVersion: versionId },
      });
      if (!orm) {
        throw new Error(
          `PlanAlimentacionVersion ${versionId} no encontrada después de activar`,
        );
      }
      return this.toDomain(orm);
    });
  }

  private toDomain(
    orm: PlanAlimentacionVersionOrmEntity,
  ): PlanAlimentacionVersionEntity {
    return new PlanAlimentacionVersionEntity(
      orm.idPlanAlimentacionVersion,
      orm.idPlanAlimentacion,
      orm.numeroVersion,
      orm.datosJson,
      orm.motivoCambio,
      orm.activa,
      orm.createdAt,
      orm.createdBy,
    );
  }
}
