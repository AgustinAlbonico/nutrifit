import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';

export interface FiltrosReporteAsistenciaProfesionalesDto {
  fechaInicio: Date;
  fechaFin: Date;
  profesionalId?: number;
  socioId?: number;
  estado?: EstadoTurno;
}

export interface PeriodoReporteAsistenciaDto {
  fechaInicio: string;
  fechaFin: string;
}

export interface ResumenReporteAsistenciaDto {
  turnosProgramados: number;
  turnosRealizados: number;
  turnosCancelados: number;
  ausencias: number;
  porcentajeAsistencia: number;
  porcentajeAusentismo: number;
}

export interface AsistenciaPorNutricionistaDto extends ResumenReporteAsistenciaDto {
  nutricionistaId: number;
  nombreNutricionista: string;
}

export interface PuntoMensualAsistenciaDto {
  mes: string;
  programados: number;
  realizados: number;
  cancelados: number;
  ausencias: number;
}

export interface ReporteAsistenciaProfesionalesDto {
  periodo: PeriodoReporteAsistenciaDto;
  resumen: ResumenReporteAsistenciaDto;
  porNutricionista: AsistenciaPorNutricionistaDto[];
  grafico: {
    evolucionMensual: PuntoMensualAsistenciaDto[];
  };
}
