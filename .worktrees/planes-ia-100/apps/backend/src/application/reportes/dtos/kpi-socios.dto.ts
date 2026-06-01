import { Expose } from 'class-transformer';

export class KpiSociosDto {
  @Expose()
  totalSocios: number;

  @Expose()
  conFichaCompleta: number;

  @Expose()
  sinFichaCompleta: number;

  @Expose()
  conPlanActivo: number;

  @Expose()
  sinPlanActivo: number;
}
