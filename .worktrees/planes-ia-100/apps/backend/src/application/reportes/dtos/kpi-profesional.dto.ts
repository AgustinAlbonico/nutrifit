import { Expose } from 'class-transformer';

export class KpiProfesionalDto {
  @Expose()
  profesionalId: string;

  @Expose()
  nombreProfesional: string;

  @Expose()
  turnosProgramados: number;

  @Expose()
  turnosRealizados: number;

  @Expose()
  ratioAusencias: number;

  @Expose()
  usoIa: number;
}
