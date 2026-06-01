import { IsBoolean } from 'class-validator';

export class RegistrarAsistenciaTurnoDto {
  @IsBoolean()
  asistio: boolean;
}
