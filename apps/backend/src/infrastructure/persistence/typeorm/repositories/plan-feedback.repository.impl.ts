import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanFeedbackOrmEntity } from '../entities/plan-feedback.entity';
import {
  PlanFeedbackRepository,
  CrearPlanFeedbackInput,
  ActualizarPlanFeedbackInput,
} from 'src/domain/repositories/plan-feedback.repository';
import { PlanFeedbackEntity } from 'src/domain/entities/PlanFeedback/plan-feedback.entity';

@Injectable()
export class PlanFeedbackRepositoryImpl implements PlanFeedbackRepository {
  constructor(
    @InjectRepository(PlanFeedbackOrmEntity)
    private readonly repo: Repository<PlanFeedbackOrmEntity>,
  ) {}

  async crear(input: CrearPlanFeedbackInput): Promise<PlanFeedbackEntity> {
    const orm = this.repo.create({
      idPlanAlimentacionVersion: input.idPlanAlimentacionVersion,
      idNutricionista: input.idNutricionista,
      voto: input.voto,
      comentario: input.comentario,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async actualizar(
    id: number,
    cambios: ActualizarPlanFeedbackInput,
  ): Promise<PlanFeedbackEntity> {
    await this.repo.update(
      { idPlanFeedback: id },
      {
        voto: cambios.voto,
        comentario: cambios.comentario,
      },
    );
    const updated = await this.repo.findOne({
      where: { idPlanFeedback: id },
    });
    if (!updated) {
      throw new Error(
        `PlanFeedback ${id} no encontrado después de actualizar`,
      );
    }
    return this.toDomain(updated);
  }

  async obtenerPorVersion(
    versionId: number,
  ): Promise<PlanFeedbackEntity | null> {
    const orm = await this.repo.findOne({
      where: { idPlanAlimentacionVersion: versionId },
    });
    return orm ? this.toDomain(orm) : null;
  }

  private toDomain(orm: PlanFeedbackOrmEntity): PlanFeedbackEntity {
    return new PlanFeedbackEntity(
      orm.idPlanFeedback,
      orm.idPlanAlimentacionVersion,
      orm.idNutricionista,
      orm.voto,
      orm.comentario,
      orm.createdAt,
      orm.updatedAt,
    );
  }
}