import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiSociosDto } from '../dtos/kpi-socios.dto';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';

@Injectable()
export class GetSociosKpiUseCase {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepository: Repository<PlanAlimentacionOrmEntity>,
  ) {}

  async execute(): Promise<KpiSociosDto> {
    // Total socios
    const totalResult = await this.socioRepository
      .createQueryBuilder('socio')
      .select('COUNT(*)', 'total')
      .getRawOne();
    const totalSocios = Number(totalResult?.total) || 0;

    // Socios con ficha completa (fichaSalud con objetivoPersonal set)
    const fichaResult = await this.fichaSaludRepository
      .createQueryBuilder('ficha')
      .select('COUNT(*)', 'conFicha')
      .where('ficha.objetivoPersonal IS NOT NULL')
      .andWhere("ficha.objetivoPersonal != ''")
      .getRawOne();
    const conFichaCompleta = Number(fichaResult?.conFicha) || 0;

    // Socios con plan activo (planes con estado 'ACTIVO')
    const planResult = await this.planRepository
      .createQueryBuilder('plan')
      .select('COUNT(DISTINCT plan.socioId)', 'conPlan')
      .where('plan.estado = :estado', { estado: 'ACTIVO' })
      .getRawOne();
    const conPlanActivo = Number(planResult?.conPlan) || 0;

    const dto = new KpiSociosDto();
    dto.totalSocios = totalSocios;
    dto.conFichaCompleta = conFichaCompleta;
    dto.sinFichaCompleta = totalSocios - conFichaCompleta;
    dto.conPlanActivo = conPlanActivo;
    dto.sinPlanActivo = totalSocios - conPlanActivo;

    return dto;
  }
}
