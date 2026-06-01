import { IsOptional, IsString } from 'class-validator';

export class ListPacientesProfesionalQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;
}
