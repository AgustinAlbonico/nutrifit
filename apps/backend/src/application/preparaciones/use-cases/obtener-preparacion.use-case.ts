import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { PreparacionResponseDto } from '../dtos';
import { mapPreparacionToResponse } from '../preparacion.mapper';

@Injectable()
export class ObtenerPreparacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(id: number): Promise<PreparacionResponseDto> {
    const preparacion = await this.preparacionRepo.findOne({
      where: { idPreparacion: id },
      relations: { items: { alimento: true } },
    });

    if (!preparacion || preparacion.fechaBaja) {
      throw new NotFoundError('Preparación', String(id));
    }

    if (preparacion.gimnasioId !== this.tenantContext.gimnasioId) {
      throw new ForbiddenError('No tiene acceso a esta preparación.');
    }

    return mapPreparacionToResponse(preparacion);
  }
}
