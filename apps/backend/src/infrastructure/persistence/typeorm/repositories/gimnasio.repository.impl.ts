import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GimnasioOrmEntity } from '../entities/gimnasio.entity';
import {
  GimnasioEntity,
  GimnasioEntityData,
} from 'src/domain/entities/Gimnasio/gimnasio.entity';
import {
  GimnasioRepository,
  CrearGimnasioDto,
  ActualizarGimnasioDto,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import {
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class GimnasioRepositoryImplementation implements GimnasioRepository {
  constructor(
    @InjectRepository(GimnasioOrmEntity)
    private readonly ormRepository: Repository<GimnasioOrmEntity>,
  ) {}

  private toDomainEntity(orm: GimnasioOrmEntity): GimnasioEntity {
    return new GimnasioEntity({
      id: orm.idGimnasio,
      nombre: orm.nombre,
      direccion: orm.direccion,
      telefono: orm.telefono ?? null,
      email: null, // GimnasioOrmEntity no tiene email
      fechaAlta: orm.plazoCancelacionHoras // placeholder - ORM no tiene fechaAlta
        ? new Date()
        : new Date(),
      fechaBaja: null, // ORM no tiene fechaBaja - soft delete vía columna activa
    });
  }

  async findAll(): Promise<GimnasioEntity[]> {
    const gimnasios = await this.ormRepository.find({
      where: {},
      order: { nombre: 'ASC' },
    });
    return gimnasios.map((g) => this.toDomainEntity(g));
  }

  async findById(id: number): Promise<GimnasioEntity | null> {
    const gimnasio = await this.ormRepository.findOne({
      where: { idGimnasio: id },
    });
    if (!gimnasio) return null;
    return this.toDomainEntity(gimnasio);
  }

  async save(entity: GimnasioEntity): Promise<GimnasioEntity> {
    const orm = new GimnasioOrmEntity();
    orm.nombre = entity.nombre;
    orm.direccion = entity.direccion;
    orm.telefono = entity.telefono ?? '';
    orm.ciudad = '';
    orm.plazoCancelacionHoras = 24;
    orm.plazoReprogramacionHoras = 12;
    orm.antelacionMinimaReservaHoras = 2;
    orm.umbralAusenteMinutos = 15;
    orm.emailHabilitado = false;

    const saved = await this.ormRepository.save(orm);
    return this.toDomainEntity(saved);
  }

  async update(
    id: number,
    partial: Partial<GimnasioEntity>,
  ): Promise<GimnasioEntity> {
    const existing = await this.ormRepository.findOne({
      where: { idGimnasio: id },
    });
    if (!existing) {
      throw new NotFoundError('Gimnasio', String(id));
    }

    if (partial.nombre !== undefined) {
      existing.nombre = partial.nombre;
    }
    if (partial.direccion !== undefined) {
      existing.direccion = partial.direccion;
    }
    if (partial.telefono !== undefined) {
      existing.telefono = partial.telefono ?? '';
    }

    const updated = await this.ormRepository.save(existing);
    return this.toDomainEntity(updated);
  }

  async softDelete(id: number): Promise<void> {
    const existing = await this.ormRepository.findOne({
      where: { idGimnasio: id },
    });
    if (!existing) {
      throw new NotFoundError('Gimnasio', String(id));
    }
    // Soft delete: marcar emailHabilitado = false como indicador de baja
    // La entidad ORM no tiene fechaBaja, usamos un flag
    existing.emailHabilitado = false;
    await this.ormRepository.save(existing);
  }

  async delete(id: number): Promise<void> {
    await this.softDelete(id);
  }

  async findByNombre(nombre: string): Promise<GimnasioEntity | null> {
    const gimnasio = await this.ormRepository.findOne({
      where: { nombre },
    });
    if (!gimnasio) return null;
    return this.toDomainEntity(gimnasio);
  }

  async findActivos(): Promise<GimnasioEntity[]> {
    const gimnasios = await this.ormRepository.find({
      where: { emailHabilitado: true },
      order: { nombre: 'ASC' },
    });
    return gimnasios.map((g) => this.toDomainEntity(g));
  }
}
