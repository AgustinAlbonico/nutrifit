import { IsInt, Max, Min } from 'class-validator';

export class AvisoLlegadaTardeDto {
  @IsInt()
  @Min(5)
  @Max(30)
  minutosTarde: number;
}
