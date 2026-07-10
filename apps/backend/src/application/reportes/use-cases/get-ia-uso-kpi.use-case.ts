import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsoIaItemDto } from '../dtos/kpi-completo.dto';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

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
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(filtros: FiltrosKpiIa): Promise<UsoIaItemDto[]> {
    const { fechaInicio, fechaFin } = filtros;

    // `sugerencia_ia` no tiene columna `nutricionista_id`; la sugerencia
    // se vincula al socio que la pidio, no al nutricionista. Reportamos
    // el total agregado por gimnasio (o por toda la red si es SUPERADMIN)
    // en un unico item para mantener el shape de UsoIaItemDto[] que
    // consume el frontend.
    const rol = this.tenantContext.rol;
    const esSuperadmin = rol === Rol.SUPERADMIN;

    const queryBuilder = this.sugerenciaIaRepository
      .createQueryBuilder('sugerencia')
      .innerJoin('sugerencia.socio', 'socio')
      .select('COUNT(*)', 'cantidad')
      .where('sugerencia.creadaEn >= :fechaInicio', { fechaInicio })
      .andWhere('sugerencia.creadaEn <= :fechaFin', { fechaFin });

    if (!esSuperadmin) {
      queryBuilder.andWhere('socio.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      });
    }

    const resultado = await queryBuilder.getRawOne();
    const total = Number(resultado?.cantidad) || 0;

    const dto = new UsoIaItemDto();
    dto.profesionalId = 'TOTAL';
    dto.cantidad = total;

    return [dto];
  }
}