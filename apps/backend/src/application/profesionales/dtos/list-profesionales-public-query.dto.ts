import { IsOptional, IsString } from 'class-validator';

export class ListProfesionalesPublicQueryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;
}
