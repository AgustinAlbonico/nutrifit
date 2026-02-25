import { PartialType } from '@nestjs/mapped-types';
import { CreateNutricionistaDto } from './create-nutricionista.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateNutricionistaDto extends PartialType(
  CreateNutricionistaDto,
) {
  @IsNumber()
  @IsOptional()
  idPersona?: number;
}
