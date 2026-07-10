import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiProfesionalDto } from '../dtos/kpi-profesional.dto';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

export interface FiltrosKpiProfesional {
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class GetProfesionalKpiUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    fechaInicio: Date,
    fechaFin: Date,
    profesionalId?: number,
  ): Promise<KpiProfesionalDto[]> {
    // Query para stats de turnos por profesional
    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .select('nutricionista.idPersona', 'profesionalId')
      .addSelect(
        "CONCAT(nutricionista.nombre, ' ', nutricionista.apellido)",
        'nombreProfesional',
      )
      .addSelect(
        'COUNT(CASE WHEN turno.estadoTurno = :programado THEN 1 END)',
        'turnosProgramados',
      )
      .addSelect(
        'COUNT(CASE WHEN turno.estadoTurno = :realizado THEN 1 END)',
        'turnosRealizados',
      )
      .addSelect(
        'COUNT(CASE WHEN turno.estadoTurno = :ausente THEN 1 END)',
        'ausentes',
      )
      .innerJoin('turno.nutricionista', 'nutricionista')
      .where('turno.fechaTurno >= :fechaInicio', { fechaInicio })
      .andWhere('turno.fechaTurno <= :fechaFin', { fechaFin })
      .setParameters({
        programado: 'CONFIRMADO',
        realizado: 'REALIZADO',
        ausente: 'AUSENTE',
      })
      .groupBy('nutricionista.idPersona')
      .addGroupBy("CONCAT(nutricionista.nombre, ' ', nutricionista.apellido)");

    // Filtro multi-tenant via TurnoOrmEntity.id_gimnasio.
    const rol = this.tenantContext.rol;
    const esSuperadmin = rol === Rol.SUPERADMIN;
    if (!esSuperadmin) {
      queryBuilder.andWhere('turno.gimnasioId = :gimnasioId', {
        gimnasioId: this.tenantContext.gimnasioId,
      });
    }

    if (profesionalId) {
      queryBuilder.andWhere('nutricionista.idPersona = :profesionalId', {
        profesionalId,
      });
    }

    const resultados = await queryBuilder.getRawMany();

    // NOTA: `usoIa` queda en 0 aca. La entidad SugerenciaIA se vincula al
    // socio (no al nutricionista), asi que el conteo total por gimnasio
    // vive en GetIaUsoKpiUseCase y se expone aparte en usoIa.
    const dtos: KpiProfesionalDto[] = [];
    for (const row of resultados) {
      const turnosProgramados = Number(row.turnosProgramados) || 0;
      const turnosRealizados = Number(row.turnosRealizados) || 0;
      const ausentes = Number(row.ausentes) || 0;

      const dto = new KpiProfesionalDto();
      dto.profesionalId = String(row.profesionalId);
      dto.nombreProfesional = row.nombreProfesional;
      dto.turnosProgramados = turnosProgramados;
      dto.turnosRealizados = turnosRealizados;
      dto.ratioAusencias =
        turnosProgramados > 0
          ? Math.round((ausentes / turnosProgramados) * 100) / 100
          : 0;
      dto.usoIa = 0;

      dtos.push(dto);
    }

    return dtos;
  }
}
