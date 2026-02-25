import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

@Injectable()
export class ObtenerPlanPorIdUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
  ) {}

  async execute(planId: number): Promise<PlanAlimentacionResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planId },
      relations: {
        dias: { opcionesComida: { alimentos: true } },
        socio: true,
        nutricionista: true,
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan de alimentación', String(planId));
    }

    return mapPlanToResponse(plan);
  }
}
