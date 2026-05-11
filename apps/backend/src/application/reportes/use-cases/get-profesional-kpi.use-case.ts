import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiProfesionalDto } from '../dtos/kpi-profesional.dto';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';

export interface FiltrosKpiProfesional {
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class GetProfesionalKpiUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SugerenciaIAOrmEntity)
    private readonly sugerenciaIaRepository: Repository<SugerenciaIAOrmEntity>,
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
        programado: 'PROGRAMADO',
        realizado: 'REALIZADO',
        ausente: 'AUSENTE',
      })
      .groupBy('nutricionista.idPersona')
      .addGroupBy("CONCAT(nutricionista.nombre, ' ', nutricionista.apellido)");

    if (profesionalId) {
      queryBuilder.andWhere('nutricionista.idPersona = :profesionalId', {
        profesionalId,
      });
    }

    const resultados = await queryBuilder.getRawMany();

    // Query para uso de IA por profesional
    const iaQueryBuilder = this.sugerenciaIaRepository
      .createQueryBuilder('sugerencia')
      .select('sugerencia.nutricionistaId', 'profesionalId')
      .addSelect('COUNT(*)', 'cantidad')
      .where('sugerencia.creadaEn >= :fechaInicio', { fechaInicio })
      .andWhere('sugerencia.creadaEn <= :fechaFin', { fechaFin })
      .groupBy('sugerencia.nutricionistaId');

    if (profesionalId) {
      iaQueryBuilder.andWhere('sugerencia.nutricionistaId = :profesionalId', {
        profesionalId,
      });
    }

    const iaResultados = await iaQueryBuilder.getRawMany();
    const iaPorProfesional: Record<string, number> = {};
    for (const row of iaResultados) {
      iaPorProfesional[row.profesionalId] = Number(row.cantidad);
    }

    // Mapear resultados
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
      dto.usoIa = iaPorProfesional[row.profesionalId] || 0;

      dtos.push(dto);
    }

    return dtos;
  }
}
