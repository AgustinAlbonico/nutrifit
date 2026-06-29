import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

export class GenerarIdeasComidaDto {
  @IsInt()
  @Min(1)
  planAlimentacionId: number;

  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsEnum(TipoComida)
  tipoComida: TipoComida;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  cantidadAlternativas?: number;
}
