import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiSociosDto } from '../dtos/kpi-socios.dto';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

@Injectable()
export class GetSociosKpiUseCase {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepository: Repository<FichaSaludOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepository: Repository<PlanAlimentacionOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(): Promise<KpiSociosDto> {
    // Filtro multi-tenant: SUPERADMIN ve todos los gimnasios, ADMIN
    // solo el suyo. Esto es crítico para no mezclar socios de distintos
    // gimnasios en el reporte. El `gimnasioId` se resuelve del JWT.
    const rol = this.tenantContext.rol;
    const esSuperadmin = rol === Rol.SUPERADMIN;

    const filtroGimnasio = esSuperadmin
      ? '1=1'
      : 'socio.id_gimnasio = :gimnasioId';
    const parametros: { gimnasioId?: number } = {};
    if (!esSuperadmin) {
      parametros.gimnasioId = this.tenantContext.gimnasioId;
    }

    // Total de socios del gimnasio (o de toda la red si es SUPERADMIN)
    const totalResult = await this.socioRepository
      .createQueryBuilder('socio')
      .select('COUNT(*)', 'total')
      .where(filtroGimnasio, parametros)
      .getRawOne();
    const totalSocios = Number(totalResult?.total) || 0;

    // Socios con ficha completa: ficha con objetivoPersonal
    // y cuyo socio pertenece al gimnasio correspondiente
    const fichaResult = await this.fichaSaludRepository
      .createQueryBuilder('ficha')
      .innerJoin('ficha.socio', 'socio')
      .select('COUNT(DISTINCT ficha.idFichaSalud)', 'conFicha')
      .where('ficha.objetivoPersonal IS NOT NULL')
      .andWhere("ficha.objetivoPersonal != ''")
      .andWhere(filtroGimnasio, parametros)
      .getRawOne();
    const conFichaCompleta = Number(fichaResult?.conFicha) || 0;

    // Socios con plan activo: planes en estado ACTIVO cuyos socios
    // pertenezcan al gimnasio correspondiente
    const planResult = await this.planRepository
      .createQueryBuilder('plan')
      .innerJoin('plan.socio', 'socio')
      .select('COUNT(DISTINCT socio.idPersona)', 'conPlan')
      .where('plan.estado = :estado', { estado: 'ACTIVO' })
      .andWhere(filtroGimnasio, parametros)
      .getRawOne();
    const conPlanActivo = Number(planResult?.conPlan) || 0;

    const dto = new KpiSociosDto();
    dto.totalSocios = totalSocios;
    dto.conFichaCompleta = conFichaCompleta;
    dto.sinFichaCompleta = Math.max(0, totalSocios - conFichaCompleta);
    dto.conPlanActivo = conPlanActivo;
    dto.sinPlanActivo = Math.max(0, totalSocios - conPlanActivo);

    return dto;
  }
}
