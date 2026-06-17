import { AgendaResponseDto } from './agenda-response.dto';

export class ConfigureAgendaResponseDto {
  agendas: AgendaResponseDto[];
  slotsDisponiblesProximos60Dias: number;
}
