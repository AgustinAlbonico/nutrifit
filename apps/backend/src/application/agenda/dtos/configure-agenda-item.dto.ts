import { IsEnum, IsString, Matches } from 'class-validator';
import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ConfigureAgendaItemDto {
  @IsEnum(DiaSemana)
  dia: DiaSemana;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaInicio debe estar en formato HH:mm',
  })
  horaInicio: string;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaFin debe estar en formato HH:mm',
  })
  horaFin: string;
}
