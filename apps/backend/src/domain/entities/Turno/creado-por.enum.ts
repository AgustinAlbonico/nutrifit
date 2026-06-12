/**
 * Origen de creacion de un Turno.
 *
 * Se persiste en la columna `turno.creado_por` con la migracion
 * `TurnoCreadoPor` (PR 1.1 del change `crear-turno-en-nombre-del-socio`).
 *
 * Valores:
 *  - SOCIO: creado por el propio socio desde la app (CU-11, flujo
 *    historico). Tambien es el `DEFAULT` para backfill de filas
 *    pre-existentes a la migracion.
 *  - RECEPCION: creado por personal de recepcion. Se usa `RECEPCION`
 *    (no `RECEPCIONISTA`) por consistencia con la convencion del
 *    CU original (`spec-original.md` linea 4) y con el spec del
 *    endpoint `crear-turno-en-nombre-del-socio-endpoint.md` seccion
 *    Eventos (`'TURNO_CREADO_POR_RECEPCION'`). La columna de auditoria
 *    es mas corta que el nombre de rol.
 *  - ADMIN: creado por un administrador del gimnasio.
 *  - NUTRICIONISTA: creado por el nutricionista desde su agenda
 *    (AsignarTurnoModal o el endpoint POST /turnos/crear).
 */
export enum CreadoPor {
  SOCIO = 'SOCIO',
  RECEPCION = 'RECEPCION',
  ADMIN = 'ADMIN',
  NUTRICIONISTA = 'NUTRICIONISTA',
}
