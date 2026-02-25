import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ConfigureAgendaItemDto } from './configure-agenda-item.dto';

export class ConfigureAgendaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfigureAgendaItemDto)
  agendas: ConfigureAgendaItemDto[];
}
