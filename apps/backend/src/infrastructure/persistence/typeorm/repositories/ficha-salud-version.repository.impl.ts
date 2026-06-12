import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FichaSaludVersionOrmEntity } from '../entities/ficha-salud-version.entity';
import { FichaSaludVersionEntity } from 'src/domain/entities/FichaSalud/ficha-salud-version.entity';
import { FichaSaludVersionRepository } from 'src/domain/entities/FichaSalud/ficha-salud-version.repository';

/**
 * Adaptador TypeORM del repositorio de versiones de ficha de salud.
 *
 * Implementa el puerto `FichaSaludVersionRepository` (Clean
 * Architecture — capa de infrastructure). La capa de aplicación
 * (use cases) solo conoce el puerto.
 *
 * **Importante**: el método `findMaxVersionByFichaId` usa
 * `setLockMode('pessimistic_write')` para serializar inserciones
 * concurrentes (RB29). Este método debe invocarse dentro de una
 * transacción activa — ver `UpsertFichaSaludSocioUseCase` que ya
 * envuelve la operación en `dataSource.transaction()`.
 *
 * **REGLA DE INMUTABILIDAD**: el puerto NO expone `update`/`delete`
 * y este adaptador tampoco. Toda escritura es INSERT puro.
 */
@Injectable()
export class FichaSaludVersionRepositoryImpl implements FichaSaludVersionRepository {
  constructor(
    @InjectRepository(FichaSaludVersionOrmEntity)
    private readonly repository: Repository<FichaSaludVersionOrmEntity>,
  ) {}

  async findById(id: number): Promise<FichaSaludVersionEntity | null> {
    const orm = await this.repository.findOne({
      where: { idFichaSaludVersion: id },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findByFichaId(
    idFichaSalud: number,
  ): Promise<FichaSaludVersionEntity[]> {
    const orms = await this.repository.find({
      where: { idFichaSalud },
      order: { version: 'DESC' },
    });
    return orms.map((orm) => this.toDomain(orm));
  }

  async findByFichaIdAndVersion(
    idFichaSalud: number,
    version: number,
  ): Promise<FichaSaludVersionEntity | null> {
    const orm = await this.repository.findOne({
      where: { idFichaSalud, version },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async findMaxVersionByFichaId(
    idFichaSalud: number,
  ): Promise<FichaSaludVersionEntity | null> {
    // pessimistic_write serializa inserciones concurrentes (RB29).
    // Debe ejecutarse dentro de una transacción activa — el lock se
    // libera al hacer commit/rollback.
    const orm = await this.repository
      .createQueryBuilder('v')
      .setLock('pessimistic_write')
      .where('v.idFichaSalud = :idFichaSalud', { idFichaSalud })
      .orderBy('v.version', 'DESC')
      .getOne();
    return orm ? this.toDomain(orm) : null;
  }

  async save(
    entity: FichaSaludVersionEntity,
  ): Promise<FichaSaludVersionEntity> {
    const orm = this.repository.create({
      idFichaSalud: entity.idFichaSalud,
      idSocio: entity.idSocio,
      version: entity.version,
      datosJson: entity.datosJson,
      createdAt: entity.createdAt,
      createdBy: entity.createdBy,
    });
    const saved = await this.repository.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(orm: FichaSaludVersionOrmEntity): FichaSaludVersionEntity {
    return new FichaSaludVersionEntity(
      orm.idFichaSaludVersion,
      orm.idFichaSalud,
      orm.idSocio,
      orm.version,
      orm.datosJson,
      orm.createdAt,
      orm.createdBy,
    );
  }
}
