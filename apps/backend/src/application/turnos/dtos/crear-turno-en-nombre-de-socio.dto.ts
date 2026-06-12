import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Matches, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * DTO de entrada del endpoint `POST /turnos/crear` (change
 * `crear-turno-en-nombre-del-socio`).
 *
 * Es identico en shape a `ReservarTurnoSocioDto` (CU-11) pero con
 * `socioId` explicito: en CU-11 el socio se infiere del JWT, en este
 * endpoint el actor (RECEPCION/ADMIN/NUTRI) lo elige de un buscador.
 *
 * NO incluye `gimnasioId`: el gimnasio del actor se resuelve del
 * `TenantContextService` (origen de verdad). NO incluye `tipoConsulta`
 * ni `motivo`: fuera de alcance de este PR.
 */
export class CrearTurnoEnNombreDeSocioDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  socioId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  nutricionistaId: number;

  @IsDateString()
  fechaTurno: string;

  @IsString()
  @Matches(TIME_REGEX, {
    message: 'horaTurno debe estar en formato HH:mm',
  })
  horaTurno: string;
}
