import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedData } from '@nutrifit/shared';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { PreparacionResponseDto } from '../dtos';
import { mapPreparacionToResponse } from '../preparacion.mapper';
import {
  paginarQuery,
  crearParametrosPaginacion,
} from 'src/common/helpers/paginacion.helper';
import { normalizarTexto } from 'src/common/utils/text.util';
import { stripAccentsLowerSql } from 'src/common/utils/sql-text.util';

@Injectable()
export class ListarPreparacionesUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(options: {
    search?: string;
    page?: string;
    limit?: string;
  }): Promise<PaginatedData<PreparacionResponseDto>> {
    const params = crearParametrosPaginacion(
      { page: options.page, limit: options.limit },
      { maxLimit: 50 },
    );

    const qb = this.preparacionRepo
      .createQueryBuilder('preparacion')
      .leftJoinAndSelect('preparacion.items', 'item')
      .leftJoinAndSelect('item.alimento', 'alimento')
      .where('preparacion.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      })
      .andWhere('preparacion.fechaBaja IS NULL')
      .orderBy('preparacion.nombre', 'ASC');

    if (options.search?.trim()) {
      const termino = `%${normalizarTexto(options.search)}%`;
      qb.andWhere(
        `${stripAccentsLowerSql('LOWER(preparacion.nombre)')} LIKE :termino`,
        { termino },
      );
    }

    const result = await paginarQuery(qb, params);

    return {
      data: result.data.map(mapPreparacionToResponse),
      pagination: result.pagination,
    };
  }
}
