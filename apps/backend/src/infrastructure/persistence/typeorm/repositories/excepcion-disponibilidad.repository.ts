import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcepcionDisponibilidadOrmEntity } from '../entities/excepcion-disponibilidad.entity';
import { ExcepcionDisponibilidadEntity } from 'src/domain/entities/Agenda/excepcion-disponibilidad.entity';
import { ExcepcionDisponibilidadRepository } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';

@Injectable()
export class ExcepcionDisponibilidadRepositoryImpl implements ExcepcionDisponibilidadRepository {
  constructor(
    @InjectRepository(ExcepcionDisponibilidadOrmEntity)
    private readonly repository: Repository<ExcepcionDisponibilidadOrmEntity>,
  ) {}

  async save(
    entity: ExcepcionDisponibilidadEntity,
  ): Promise<ExcepcionDisponibilidadEntity> {
    const orm = this.toOrm(entity);
    const saved = await this.repository.save(orm);
    return this.toDomain(saved);
  }

  async update(
    id: number,
    entity: ExcepcionDisponibilidadEntity,
  ): Promise<ExcepcionDisponibilidadEntity> {
    const existing = await this.repository.findOne({
      where: { idExcepcion: id },
    });
    if (!existing) {
      throw new Error(`ExcepcionDisponibilidad ${id} not found`);
    }
    existing.fechaInicio = entity.fechaInicio;
    existing.fechaFin = entity.fechaFin;
    existing.motivo = entity.motivo;
    const saved = await this.repository.save(existing);
    return this.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    const res = await this.repository.delete({ idExcepcion: id });
    if (res.affected === 0) {
      throw new Error(`ExcepcionDisponibilidad ${id} not found`);
    }
  }

  async findAll(): Promise<ExcepcionDisponibilidadEntity[]> {
    const rows = await this.repository.find();
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<ExcepcionDisponibilidadEntity | null> {
    const row = await this.repository.findOne({ where: { idExcepcion: id } });
    return row ? this.toDomain(row) : null;
  }

  async findVigentesEnVentana(
    nutricionistaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ): Promise<ExcepcionDisponibilidadEntity[]> {
    const rows = await this.repository
      .createQueryBuilder('e')
      .where('e.nutricionista = :nutriId', { nutriId: nutricionistaId })
      .andWhere('e.fechaInicio <= :hasta', { hasta: fechaHasta })
      .andWhere('e.fechaFin > :desde', { desde: fechaDesde })
      .getMany();

    return rows.map((r) => this.toDomain(r));
  }

  private toOrm(
    entity: ExcepcionDisponibilidadEntity,
  ): Partial<ExcepcionDisponibilidadOrmEntity> {
    return {
      idExcepcion: entity.idExcepcion ?? undefined,
      fechaInicio: entity.fechaInicio,
      fechaFin: entity.fechaFin,
      motivo: entity.motivo,
      nutricionista: {
        idPersona: entity.nutricionista.idPersona ?? null,
      } as ExcepcionDisponibilidadOrmEntity['nutricionista'],
    };
  }

  private toDomain(
    orm: ExcepcionDisponibilidadOrmEntity,
  ): ExcepcionDisponibilidadEntity {
    // Construimos un NutricionistaEntity mínimo a partir de la FK.
    // Solo necesitamos idPersona para el algoritmo de slots.
    const nutriPlaceholder = new NutricionistaEntity(
      orm.nutricionista?.idPersona ?? null,
      '',
      '',
      new Date(),
      '',
      'OTRO' as never,
      '',
      '',
      '',
      '',
      0,
      0,
    );
    return new ExcepcionDisponibilidadEntity(
      nutriPlaceholder,
      orm.fechaInicio,
      orm.fechaFin,
      orm.motivo,
      orm.idExcepcion,
    );
  }
}
