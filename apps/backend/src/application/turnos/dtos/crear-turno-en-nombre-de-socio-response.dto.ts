import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { CreadoPor } from 'src/domain/entities/Turno/creado-por.enum';

/**
 * DTO de respuesta del endpoint `POST /turnos/crear`.
 *
 * Refleja el contrato del spec `crear-turno-en-nombre-del-socio-endpoint.md`
 * (campo `creadoPor` obligatorio) mas el flag opcional `warning` que
 * implementa la politica RB14 diferenciada:
 *  - Para `RECEPCION`/`ADMIN`: si el socio no tiene ficha completa
 *    (`fichaSalud === null || fichaSalud.completada === false`), el
 *    use-case setea `warning: 'socio_sin_ficha'` y devuelve 201 OK.
 *  - Para `NUTRICIONISTA`: el use-case lanza `BadRequestError(400)` si
 *    la ficha esta incompleta (RB14 estricto), por lo que este DTO
 *    NUNCA se serializa con `warning` cuando el actor es nutri.
 *
 * `gimnasioId` se popula desde `actor.gimnasioId` (TenantContext) y
 * se incluye en la respuesta para que el frontend pueda invalidar las
 * queries de agenda que dependen del gimnasio.
 */
export class CrearTurnoEnNombreDeSocioResponseDto {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: EstadoTurno;
  socioId: number;
  nutricionistaId: number;
  gimnasioId: number;
  creadoPor: CreadoPor;
  warning?: 'socio_sin_ficha';
}
