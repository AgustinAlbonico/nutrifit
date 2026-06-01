import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KpiTurnosDto } from '../dtos/kpi-turnos.dto';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

export interface FiltrosKpiTurnos {
  fechaInicio: Date;
  fechaFin: Date;
  profesionalId?: number;
  estado?: EstadoTurno;
}

@Injectable()
export class GetTurnosKpiUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {}

  async execute(filtros: FiltrosKpiTurnos): Promise<KpiTurnosDto> {
    const { fechaInicio, fechaFin, profesionalId } = filtros;

    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .select('turno.estadoTurno', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('turno.fechaTurno >= :fechaInicio', { fechaInicio })
      .andWhere('turno.fechaTurno <= :fechaFin', { fechaFin });

    if (profesionalId) {
      queryBuilder.andWhere('turno.nutricionistaId = :profesionalId', {
        profesionalId,
      });
    }

    const resultados = await queryBuilder
      .groupBy('turno.estadoTurno')
      .getRawMany();

    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of resultados) {
      counts[row.estado] = Number(row.cantidad);
      total += Number(row.cantidad);
    }

    const programados = counts[EstadoTurno.PROGRAMADO] || 0;
    const presentes = counts[EstadoTurno.PRESENTE] || 0;
    const ausentes = counts[EstadoTurno.AUSENTE] || 0;
    const cancelados = counts[EstadoTurno.CANCELADO] || 0;
    const reprogramados = programados;

    const dto = new KpiTurnosDto();
    dto.programados = programados;
    dto.presentes = presentes;
    dto.ausentes = ausentes;
    dto.cancelados = cancelados;
    dto.reprogramados = reprogramados;
    dto.total = total;
    dto.ratioPresencia =
      total > 0 ? Math.round((presentes / total) * 100) / 100 : 0;
    dto.ratioAusencia =
      total > 0 ? Math.round((ausentes / total) * 100) / 100 : 0;

    return dto;
  }
}
