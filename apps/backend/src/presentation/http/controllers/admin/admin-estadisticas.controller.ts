import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { GimnasioRequeridoGuard } from 'src/infrastructure/auth/guards/gimnasio-requerido.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
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
import { GetReporteAsistenciaProfesionalesUseCase } from 'src/application/reportes/use-cases/get-reporte-asistencia-profesionales.use-case';
import { KpiTurnosDto } from 'src/application/reportes/dtos/kpi-turnos.dto';
import { KpiSociosDto } from 'src/application/reportes/dtos/kpi-socios.dto';
import { KpiProfesionalDto } from 'src/application/reportes/dtos/kpi-profesional.dto';
import { UsoIaItemDto } from 'src/application/reportes/dtos/kpi-completo.dto';
import { KpiCompletoDto } from 'src/application/reportes/dtos/kpi-completo.dto';
import { ReporteAsistenciaProfesionalesDto } from 'src/application/reportes/dtos/reporte-asistencia-profesionales.dto';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

function parseEstadoTurno(valor: string | undefined): EstadoTurno | undefined {
  if (!valor) return undefined;
  const valoresValidos = Object.values(EstadoTurno) as string[];
  return valoresValidos.includes(valor) ? (valor as EstadoTurno) : undefined;
}

function parseFechaRequerida(valor: string | undefined, campo: string): Date {
  if (!valor) {
    throw new BadRequestError(`El parámetro ${campo} es obligatorio.`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new BadRequestError(
      `El parámetro ${campo} debe tener formato YYYY-MM-DD.`,
    );
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);
  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  ) {
    throw new BadRequestError(`El parámetro ${campo} es inválido.`);
  }

  return fecha;
}

function parseFechaFinRequerida(valor: string | undefined): Date {
  const fecha = parseFechaRequerida(valor, 'fechaFin');
  fecha.setUTCHours(23, 59, 59, 999);
  return fecha;
}

function parseEnteroPositivoOpcional(
  valor: string | undefined,
  campo: string,
): number | undefined {
  if (!valor) return undefined;
  if (!/^\d+$/.test(valor)) {
    throw new BadRequestError(
      `El parámetro ${campo} debe ser un entero positivo.`,
    );
  }

  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new BadRequestError(
      `El parámetro ${campo} debe ser un entero positivo.`,
    );
  }

  return numero;
}

function parseEstadoTurnoRequerido(
  valor: string | undefined,
): EstadoTurno | undefined {
  if (!valor) return undefined;
  const estado = parseEstadoTurno(valor);
  if (!estado) {
    throw new BadRequestError('El parámetro estado no es válido.');
  }
  return estado;
}

@Controller('admin/estadisticas')
@UseGuards(JwtAuthGuard, RolesGuard, GimnasioRequeridoGuard)
export class AdminEstadisticasController {
  constructor(
    private readonly getTurnosKpiUseCase: GetTurnosKpiUseCase,
    private readonly getSociosKpiUseCase: GetSociosKpiUseCase,
    private readonly getProfesionalKpiUseCase: GetProfesionalKpiUseCase,
    private readonly getIaUsoKpiUseCase: GetIaUsoKpiUseCase,
    private readonly getKpiCompletoUseCase: GetKpiCompletoUseCase,
    private readonly getReporteAsistenciaProfesionalesUseCase: GetReporteAsistenciaProfesionalesUseCase,
  ) {}

  @Get('asistencia-profesionales')
  @Rol(RolEnum.ADMIN)
  async getReporteAsistenciaProfesionales(
    @Query('fechaInicio') fechaInicio: string | undefined,
    @Query('fechaFin') fechaFin: string | undefined,
    @Query('profesionalId') profesionalId?: string,
    @Query('socioId') socioId?: string,
    @Query('estado') estado?: string,
  ): Promise<ReporteAsistenciaProfesionalesDto> {
    return this.getReporteAsistenciaProfesionalesUseCase.execute({
      fechaInicio: parseFechaRequerida(fechaInicio, 'fechaInicio'),
      fechaFin: parseFechaFinRequerida(fechaFin),
      profesionalId: parseEnteroPositivoOpcional(
        profesionalId,
        'profesionalId',
      ),
      socioId: parseEnteroPositivoOpcional(socioId, 'socioId'),
      estado: parseEstadoTurnoRequerido(estado),
    });
  }

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
      estado: parseEstadoTurno(estado),
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
