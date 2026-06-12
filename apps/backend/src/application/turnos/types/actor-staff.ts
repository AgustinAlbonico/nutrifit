import { Rol } from 'src/domain/entities/Usuario/Rol';

/**
 * Snapshot del actor (staff interno) que ejecuta una accion sobre
 * turnos ajenos. El `TurnosController` construye este objeto a partir
 * del `UsuarioAutenticadoPayload` (decorador `@CurrentUser()`) y del
 * `TenantContextService.gimnasioId` (gimnasio del tenant actual).
 *
 * Esta estructura NO se serializa al cliente. Vive en la capa de
 * aplicacion (application/turnos/types) porque:
 *  - el controller es el unico punto que la construye (origen: JWT +
 *    TenantContext),
 *  - los use-cases la reciben como parametro tipado (en vez de varios
 *    sueltos), lo que mejora la legibilidad y testeabilidad.
 *
 * Campos:
 *  - `usuarioId`: id del `UsuarioOrmEntity` (quien realizo la accion).
 *    Es lo que se persiste en `auditoria.id_usuario`.
 *  - `personaId`: id de la `PersonaOrmEntity` asociada al usuario. Para
 *    `NUTRICIONISTA` coincide con el `nutricionistaId` que envia en el
 *    body; en `RECEPCION`/`ADMIN` puede ser `null` (un admin no es
 *    nutricionista). El controller lo deja opcional.
 *  - `rol`: rol del actor. Es la fuente de verdad para la politica
 *    RB14 diferenciada (BLOCK para nutri, WARN para recep/admin) y
 *    para mapear a `CreadoPor` (RECEPCION/ADMIN/NUTRICIONISTA).
 *  - `gimnasioId`: id del gimnasio del tenant activo. Es la fuente de
 *    verdad para validar el scope cross-gym (socio y nutri deben
 *    pertenecer a este gimnasio).
 */
export interface ActorStaff {
  usuarioId: number;
  personaId: number | null;
  rol: Rol;
  gimnasioId: number;
}
