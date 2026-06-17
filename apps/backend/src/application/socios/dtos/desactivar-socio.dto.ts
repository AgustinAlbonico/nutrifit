import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class DesactivarSocioDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'El motivo debe tener al menos 10 caracteres.',
  })
  @MaxLength(500, {
    message: 'El motivo no puede superar los 500 caracteres.',
  })
  motivo: string;
}

export class DesactivarSocioResultDto {
  message: string;
  turnosCancelados: number;
  nutricionistasAfectados: number;
  tienePlanActivo: boolean;
}
