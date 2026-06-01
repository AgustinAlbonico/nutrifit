import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import {
  EstadoObjetivo,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';

export class CrearObjetivoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  socioId?: number;

  @IsIn(['PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO'])
  tipoMetrica: TipoMetrica;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  valorInicial: number;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  valorObjetivo: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaObjetivo?: Date;
}

export class ActualizarObjetivoDto {
  @IsNumber({ allowInfinity: false, allowNaN: false })
  valorActual: number;
}

export class ObjetivoResponseDto {
  idObjetivo: number;
  socioId: number;
  tipoMetrica: TipoMetrica;
  valorInicial: number;
  valorActual: number;
  valorObjetivo: number;
  estado: EstadoObjetivo;
  fechaInicio: Date;
  fechaObjetivo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  progreso: number;
}

export class ListaObjetivosResponseDto {
  activos: ObjetivoResponseDto[];
  completados: ObjetivoResponseDto[];
}
