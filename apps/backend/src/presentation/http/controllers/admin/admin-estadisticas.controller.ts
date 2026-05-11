import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  GetTurnosKpiUseCase,
  FiltrosKpiTurnos,
} from 'src/application/reportes/use-cases/get-turnos-kpi.use-case';
import { GetSociosKpiUseCase } from 'src/application/reportes/use-cases/get-socios-kpi.use-case';
import { GetProfesionalKpiUseCase } from 'src/application/reportes/use-cases/get-profesional-kpi.use-case';
import {
  GetIaUsoKpiUseCase,
  FiltrosKpiIa,
} from 'src/application/reportes/use-cases/get-ia-uso-kpi.use-case';
import { GetKpiCompletoUseCase } from 'src/application/reportes/use-cases/get-kpi-completo.use-case';
import { KpiTurnosDto } from 'src/application/reportes/dtos/kpi-turnos.dto';
import { KpiSociosDto } from 'src/application/reportes/dtos/kpi-socios.dto';
import { KpiProfesionalDto } from 'src/application/reportes/dtos/kpi-profesional.dto';
import { UsoIaItemDto } from 'src/application/reportes/dtos/kpi-completo.dto';
import { KpiCompletoDto } from 'src/application/reportes/dtos/kpi-completo.dto';

@Controller('admin/estadisticas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminEstadisticasController {
  constructor(
    private readonly getTurnosKpiUseCase: GetTurnosKpiUseCase,
    private readonly getSociosKpiUseCase: GetSociosKpiUseCase,
    private readonly getProfesionalKpiUseCase: GetProfesionalKpiUseCase,
    private readonly getIaUsoKpiUseCase: GetIaUsoKpiUseCase,
    private readonly getKpiCompletoUseCase: GetKpiCompletoUseCase,
  ) {}

  @Get('turnos')
  @Rol(RolEnum.ADMIN)
  async getTurnosKpi(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('profesionalId') profesionalId?: string,
    @Query('estado') estado?: string,
  ): Promise<KpiTurnosDto> {
    const filtros: FiltrosKpiTurnos = {
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      profesionalId: profesionalId ? parseInt(profesionalId, 10) : undefined,
      estado: estado as any,
    };
    return this.getTurnosKpiUseCase.execute(filtros);
  }

  @Get('socios')
  @Rol(RolEnum.ADMIN)
  async getSociosKpi(): Promise<KpiSociosDto> {
    return this.getSociosKpiUseCase.execute();
  }

  @Get('profesionales')
  @Rol(RolEnum.ADMIN)
  async getProfesionalKpi(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('profesionalId') profesionalId?: string,
  ): Promise<KpiProfesionalDto[]> {
    return this.getProfesionalKpiUseCase.execute(
      new Date(fechaInicio),
      new Date(fechaFin),
      profesionalId ? parseInt(profesionalId, 10) : undefined,
    );
  }

  @Get('ia-uso')
  @Rol(RolEnum.ADMIN)
  async getIaUsoKpi(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('profesionalId') profesionalId?: string,
  ): Promise<UsoIaItemDto[]> {
    const filtros: FiltrosKpiIa = {
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      profesionalId: profesionalId ? parseInt(profesionalId, 10) : undefined,
    };
    return this.getIaUsoKpiUseCase.execute(filtros);
  }

  @Get('kpi-completo')
  @Rol(RolEnum.ADMIN)
  async getKpiCompleto(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Query('profesionalId') profesionalId?: string,
  ): Promise<KpiCompletoDto> {
    return this.getKpiCompletoUseCase.execute(
      new Date(fechaInicio),
      new Date(fechaFin),
      profesionalId ? parseInt(profesionalId, 10) : undefined,
    );
  }
}
