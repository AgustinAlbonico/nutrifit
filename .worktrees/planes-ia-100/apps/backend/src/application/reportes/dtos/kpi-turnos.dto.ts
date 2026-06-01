import { Expose } from 'class-transformer';

export class KpiTurnosDto {
  @Expose()
  programados: number;

  @Expose()
  presentes: number;

  @Expose()
  ausentes: number;

  @Expose()
  cancelados: number;

  @Expose()
  reprogramados: number;

  @Expose()
  total: number;

  @Expose()
  ratioPresencia: number;

  @Expose()
  ratioAusencia: number;
}
