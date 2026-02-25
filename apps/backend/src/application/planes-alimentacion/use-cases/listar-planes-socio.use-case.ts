import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

@Injectable()
export class ListarPlanesSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
  ) {}

  async execute(socioId: number): Promise<PlanAlimentacionResponseDto[]> {
    const socio = await this.socioRepo.findOne({
      where: { idPersona: socioId },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const planes = await this.planRepo.find({
      where: {
        socio: { idPersona: socioId },
      },
      relations: {
        dias: { opcionesComida: { alimentos: true } },
        socio: true,
        nutricionista: true,
      },
      order: {
        fechaCreacion: 'DESC',
      },
    });

    return planes.map(mapPlanToResponse);
  }
}
