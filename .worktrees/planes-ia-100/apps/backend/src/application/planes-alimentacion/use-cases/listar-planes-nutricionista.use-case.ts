import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

@Injectable()
export class ListarPlanesNutricionistaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
  ) {}

  async execute(
    nutricionistaId: number,
  ): Promise<PlanAlimentacionResponseDto[]> {
    const planes = await this.planRepo.find({
      where: { nutricionista: { idPersona: nutricionistaId } },
      relations: {
        socio: true,
        nutricionista: true,
        dias: { opcionesComida: { items: { alimento: true } } },
      },
      order: { fechaCreacion: 'DESC' },
    });

    return planes.map(mapPlanToResponse);
  }
}
