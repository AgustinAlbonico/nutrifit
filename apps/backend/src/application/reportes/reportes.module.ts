import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TurnoOrmEntity,
  SocioOrmEntity,
  FichaSaludOrmEntity,
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SugerenciaIAOrmEntity,
  GimnasioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { GetTurnosKpiUseCase } from './use-cases/get-turnos-kpi.use-case';
import { GetSociosKpiUseCase } from './use-cases/get-socios-kpi.use-case';
import { GetProfesionalKpiUseCase } from './use-cases/get-profesional-kpi.use-case';
import { GetIaUsoKpiUseCase } from './use-cases/get-ia-uso-kpi.use-case';
import { GetKpiCompletoUseCase } from './use-cases/get-kpi-completo.use-case';
import { GetReporteAsistenciaProfesionalesUseCase } from './use-cases/get-reporte-asistencia-profesionales.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurnoOrmEntity,
      SocioOrmEntity,
      FichaSaludOrmEntity,
      PlanAlimentacionOrmEntity,
      NutricionistaOrmEntity,
      SugerenciaIAOrmEntity,
      GimnasioOrmEntity,
    ]),
  ],
  providers: [
    GetTurnosKpiUseCase,
    GetSociosKpiUseCase,
    GetProfesionalKpiUseCase,
    GetIaUsoKpiUseCase,
    GetKpiCompletoUseCase,
    GetReporteAsistenciaProfesionalesUseCase,
  ],
  exports: [
    GetTurnosKpiUseCase,
    GetSociosKpiUseCase,
    GetProfesionalKpiUseCase,
    GetIaUsoKpiUseCase,
    GetKpiCompletoUseCase,
    GetReporteAsistenciaProfesionalesUseCase,
  ],
})
export class ReportesModule {}
