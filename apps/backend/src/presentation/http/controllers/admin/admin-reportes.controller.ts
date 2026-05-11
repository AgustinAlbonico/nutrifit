import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { GetKpiCompletoUseCase } from 'src/application/reportes/use-cases/get-kpi-completo.use-case';

@Controller('admin/reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReportesController {
  constructor(private readonly getKpiCompletoUseCase: GetKpiCompletoUseCase) {}

  @Get('kpi/export')
  @Rol(RolEnum.ADMIN)
  async exportKpi(
    @Query('formato') formato: 'csv' | 'pdf',
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Res() res: Response,
  ): Promise<void> {
    const kpiCompleto = await this.getKpiCompletoUseCase.execute(
      new Date(fechaInicio),
      new Date(fechaFin),
    );

    if (formato === 'csv') {
      const csv = this.generarCsvKpi(kpiCompleto);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="kpi-report.csv"',
      );
      res.send(csv);
    } else {
      // PDF placeholder - pdfkit would be installed and used here
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="kpi-report.pdf"',
      );
      res.status(501).send('PDF generation not yet implemented');
    }
  }

  @Get('consultas/export')
  @Rol(RolEnum.ADMIN)
  async exportConsultas(
    @Query('formato') formato: 'csv' | 'pdf',
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Res() res: Response,
    @Query('profesionalId') profesionalId?: string,
  ): Promise<void> {
    // Placeholder for consultas export
    if (formato === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="consultas-report.csv"',
      );
      res.send('fecha,profesional,socio,estado\n');
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="consultas-report.pdf"',
      );
      res.status(501).send('PDF generation not yet implemented');
    }
  }

  private generarCsvKpi(kpi: any): string {
    const lines: string[] = [];

    // Header
    lines.push('NutriFit - Reporte de KPIs');

    // Periodo
    lines.push(`Periodo,${kpi.periodo.fechaInicio},${kpi.periodo.fechaFin}`);

    // Turnos
    lines.push('');
    lines.push('=== TURNS ===');
    lines.push('Estado,Cantidad');
    lines.push(`Programados,${kpi.turnos.programados}`);
    lines.push(`Presentes,${kpi.turnos.presentes}`);
    lines.push(`Ausentes,${kpi.turnos.ausentes}`);
    lines.push(`Cancelados,${kpi.turnos.cancelados}`);
    lines.push(`Reprogramados,${kpi.turnos.reprogramados}`);
    lines.push(`Total,${kpi.turnos.total}`);
    lines.push(`Ratio Presencia,${kpi.turnos.ratioPresencia}`);
    lines.push(`Ratio Ausencia,${kpi.turnos.ratioAusencia}`);

    // Socios
    lines.push('');
    lines.push('=== SOCIOS ===');
    lines.push('Metrica,Valor');
    lines.push(`Total Socios,${kpi.socios.totalSocios}`);
    lines.push(`Con Ficha Completa,${kpi.socios.conFichaCompleta}`);
    lines.push(`Sin Ficha Completa,${kpi.socios.sinFichaCompleta}`);
    lines.push(`Con Plan Activo,${kpi.socios.conPlanActivo}`);
    lines.push(`Sin Plan Activo,${kpi.socios.sinPlanActivo}`);

    // Profesionales
    lines.push('');
    lines.push('=== PROFESIONALES ===');
    lines.push(
      'Profesional ID,Nombre,Turnos Programados,Turnos Realizados,Ratio Ausencias,Uso IA',
    );
    for (const p of kpi.profesionales) {
      lines.push(
        `${p.profesionalId},"${p.nombreProfesional}",${p.turnosProgramados},${p.turnosRealizados},${p.ratioAusencias},${p.usoIa}`,
      );
    }

    // IA Usage
    lines.push('');
    lines.push('=== USO IA ===');
    lines.push('Profesional ID,Cantidad');
    for (const ia of kpi.usoIa) {
      lines.push(`${ia.profesionalId},${ia.cantidad}`);
    }

    return lines.join('\n');
  }
}
