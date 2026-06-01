import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class EliminarPlanAlimentacionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  planId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivoEliminacion: string;
}
