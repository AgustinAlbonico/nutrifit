import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsoIaItemDto } from '../dtos/kpi-completo.dto';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';

export interface FiltrosKpiIa {
  fechaInicio: Date;
  fechaFin: Date;
  profesionalId?: number;
}

@Injectable()
export class GetIaUsoKpiUseCase {
  constructor(
    @InjectRepository(SugerenciaIAOrmEntity)
    private readonly sugerenciaIaRepository: Repository<SugerenciaIAOrmEntity>,
  ) {}

  async execute(filtros: FiltrosKpiIa): Promise<UsoIaItemDto[]> {
    const { fechaInicio, fechaFin, profesionalId } = filtros;

    const queryBuilder = this.sugerenciaIaRepository
      .createQueryBuilder('sugerencia')
      .select('sugerencia.nutricionistaId', 'profesionalId')
      .addSelect('COUNT(*)', 'cantidad')
      .where('sugerencia.creadaEn >= :fechaInicio', { fechaInicio })
      .andWhere('sugerencia.creadaEn <= :fechaFin', { fechaFin });

    if (profesionalId) {
      queryBuilder.andWhere('sugerencia.nutricionistaId = :profesionalId', {
        profesionalId,
      });
    }

    const resultados = await queryBuilder
      .groupBy('sugerencia.nutricionistaId')
      .getRawMany();

    return resultados.map((row) => {
      const dto = new UsoIaItemDto();
      dto.profesionalId = String(row.profesionalId);
      dto.cantidad = Number(row.cantidad);
      return dto;
    });
  }
}
