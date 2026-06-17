import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ConfigureAgendaItemDto } from './configure-agenda-item.dto';

export class ConfigureAgendaDto {
  @IsInt()
  @Type(() => Number)
  @Min(5)
  @Max(240)
  duracionTurno: number;

  @IsOptional()
  @IsBoolean()
  confirmarCambiosConTurnos?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfigureAgendaItemDto)
  agendas: ConfigureAgendaItemDto[];
}
