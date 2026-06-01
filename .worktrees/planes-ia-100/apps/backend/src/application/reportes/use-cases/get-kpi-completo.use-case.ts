import { Injectable } from '@nestjs/common';
import {
  GetTurnosKpiUseCase,
  FiltrosKpiTurnos,
} from './get-turnos-kpi.use-case';
import { GetSociosKpiUseCase } from './get-socios-kpi.use-case';
import {
  GetProfesionalKpiUseCase,
  FiltrosKpiProfesional,
} from './get-profesional-kpi.use-case';
import { GetIaUsoKpiUseCase, FiltrosKpiIa } from './get-ia-uso-kpi.use-case';
import { KpiCompletoDto, PeriodoDto } from '../dtos/kpi-completo.dto';

@Injectable()
export class GetKpiCompletoUseCase {
  constructor(
    private readonly getTurnosKpiUseCase: GetTurnosKpiUseCase,
    private readonly getSociosKpiUseCase: GetSociosKpiUseCase,
    private readonly getProfesionalKpiUseCase: GetProfesionalKpiUseCase,
    private readonly getIaUsoKpiUseCase: GetIaUsoKpiUseCase,
  ) {}

  async execute(
    fechaInicio: Date,
    fechaFin: Date,
    profesionalId?: number,
  ): Promise<KpiCompletoDto> {
    // Get turnos KPI
    const filtrosTurnos: FiltrosKpiTurnos = {
      fechaInicio,
      fechaFin,
      profesionalId,
    };
    const turnosKpi = await this.getTurnosKpiUseCase.execute(filtrosTurnos);

    // Get socios KPI
    const sociosKpi = await this.getSociosKpiUseCase.execute();

    // Get profesional KPIs
    const filtrosProfesional: FiltrosKpiProfesional = { fechaInicio, fechaFin };
    const profesionalKpi = await this.getProfesionalKpiUseCase.execute(
      fechaInicio,
      fechaFin,
      profesionalId,
    );

    // Get IA usage
    const filtrosIa: FiltrosKpiIa = { fechaInicio, fechaFin, profesionalId };
    const usoIa = await this.getIaUsoKpiUseCase.execute(filtrosIa);

    // Build periodo
    const periodo = new PeriodoDto();
    periodo.fechaInicio = fechaInicio.toISOString();
    periodo.fechaFin = fechaFin.toISOString();

    // Build complete KPI DTO
    const kpiCompleto = new KpiCompletoDto();
    kpiCompleto.turnos = turnosKpi;
    kpiCompleto.socios = sociosKpi;
    kpiCompleto.profesionales = profesionalKpi;
    kpiCompleto.usoIa = usoIa;
    kpiCompleto.periodo = periodo;

    return kpiCompleto;
  }
}
