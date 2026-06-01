import { IsOptional, IsString } from 'class-validator';

export class ListMisTurnosQueryDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;

  @IsOptional()
  @IsString()
  profesional?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;
}
