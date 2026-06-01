import { Expose, Type } from 'class-transformer';
import { KpiTurnosDto } from './kpi-turnos.dto';
import { KpiSociosDto } from './kpi-socios.dto';
import { KpiProfesionalDto } from './kpi-profesional.dto';

export class UsoIaItemDto {
  @Expose()
  profesionalId: string;

  @Expose()
  cantidad: number;
}

export class PeriodoDto {
  @Expose()
  fechaInicio: string;

  @Expose()
  fechaFin: string;
}

export class KpiCompletoDto {
  @Expose()
  @Type(() => KpiTurnosDto)
  turnos: KpiTurnosDto;

  @Expose()
  @Type(() => KpiSociosDto)
  socios: KpiSociosDto;

  @Expose()
  @Type(() => KpiProfesionalDto)
  profesionales: KpiProfesionalDto[];

  @Expose()
  @Type(() => UsoIaItemDto)
  usoIa: UsoIaItemDto[];

  @Expose()
  @Type(() => PeriodoDto)
  periodo: PeriodoDto;
}
