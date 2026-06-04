import { FichaSaludVersionEntity } from './ficha-salud-version.entity';

/**
 * Puerto (port) del repositorio de versiones de ficha de salud.
 *
 * **REGLA DE INMUTABILIDAD**: este puerto NO expone `update` ni `delete`.
 * Las versiones son append-only — solo se insertan filas nuevas. Esto
 * es defendible con tests: cualquier intento de tipar el contrato
 * agregando esos métodos debe fallar en compilación.
 *
 * El down de la migración es la única vía legítima para eliminar
 * versiones en operación normal (rollback).
 *
 * RBs: RB50 (historial inmutable), RB29 (versionado seguro con lock).
 */
export const FICHA_SALUD_VERSION_REPOSITORY = Symbol(
  'FichaSaludVersionRepository',
);

export abstract class FichaSaludVersionRepository {
  /**
   * Busca una versión por su ID primario.
   * Retorna null si no existe.
   */
  abstract findById(id: number): Promise<FichaSaludVersionEntity | null>;

  /**
   * Lista todas las versiones (DESC por número) de una ficha.
   * Retorna array vacío si la ficha no tiene versiones (caso bug).
   */
  abstract findByFichaId(
    idFichaSalud: number,
  ): Promise<FichaSaludVersionEntity[]>;

  /**
   * Busca una versión específica de una ficha.
   * Retorna null si no existe la combinación ficha+version.
   */
  abstract findByFichaIdAndVersion(
    idFichaSalud: number,
    version: number,
  ): Promise<FichaSaludVersionEntity | null>;

  /**
   * Devuelve la versión más alta (mayor número) registrada para una
   * ficha, o null si no hay versiones. Usa pessimistic_write para
   * serializar inserciones concurrentes (RB29, race condition safe).
   *
   * Importante: este método DEBE llamarse dentro de una transacción
   * activa — el lock pesimista se libera al commit/rollback.
   */
  abstract findMaxVersionByFichaId(
    idFichaSalud: number,
  ): Promise<FichaSaludVersionEntity | null>;

  /**
   * Inserta una nueva versión. Append-only.
   * Retorna la entidad con su ID auto-incrementado.
   */
  abstract save(
    entity: FichaSaludVersionEntity,
  ): Promise<FichaSaludVersionEntity>;
}
