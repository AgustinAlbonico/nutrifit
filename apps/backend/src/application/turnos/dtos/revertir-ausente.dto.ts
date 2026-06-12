import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RevertirAusenteDto {
  @IsOptional()
  @IsString()
  motivoReversion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  llegadaTardeMin?: number;
}
