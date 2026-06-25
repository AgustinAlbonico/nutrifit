import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NutricionistaIAMemoriaOrmEntity } from '../entities/nutricionista-ia-memoria.entity';
import {
  NutricionistaIAMemoriaRepository,
  CrearMemoriaIaInput,
} from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { NutricionistaIAMemoriaEntity } from 'src/domain/entities/NutricionistaIAPreferencias/nutricionista-ia-memoria.entity';

@Injectable()
export class NutricionistaIAMemoriaRepositoryImpl implements NutricionistaIAMemoriaRepository {
  constructor(
    @InjectRepository(NutricionistaIAMemoriaOrmEntity)
    private readonly repo: Repository<NutricionistaIAMemoriaOrmEntity>,
  ) {}

  async crear(
    input: CrearMemoriaIaInput,
  ): Promise<NutricionistaIAMemoriaEntity> {
    const orm = this.repo.create({
      idNutricionista: input.idNutricionista,
      tipoEjemplo: input.tipoEjemplo,
      comentario: input.comentario,
      idPlanAlimentacionVersion: input.idPlanAlimentacionVersion,
      archivada: false,
    });
    const saved = await this.repo.save(orm);
    return this.toDomain(saved);
  }

  async obtenerPorId(id: number): Promise<NutricionistaIAMemoriaEntity | null> {
    const orm = await this.repo.findOne({
      where: { idNutricionistaIaMemoria: id },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async listarPorNutricionista(
    nutricionistaId: number,
    incluirArchivadas = false,
  ): Promise<NutricionistaIAMemoriaEntity[]> {
    const orms = await this.repo.find({
      where: {
        idNutricionista: nutricionistaId,
        ...(incluirArchivadas ? {} : { archivada: false }),
      },
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async obtenerParaSeleccion(
    nutricionistaId: number,
    limite = 100,
  ): Promise<NutricionistaIAMemoriaEntity[]> {
    const orms = await this.repo.find({
      where: {
        idNutricionista: nutricionistaId,
        archivada: false,
      },
      order: { createdAt: 'DESC' },
      take: limite,
    });
    return orms.map((o) => this.toDomain(o));
  }

  async contarActivas(nutricionistaId: number): Promise<number> {
    return this.repo.count({
      where: {
        idNutricionista: nutricionistaId,
        archivada: false,
      },
    });
  }

  async marcarArchivada(id: number): Promise<void> {
    await this.repo.update(
      { idNutricionistaIaMemoria: id },
      { archivada: true },
    );
  }

  async rotarSiExcede100(nutricionistaId: number): Promise<void> {
    const activas = await this.repo.count({
      where: {
        idNutricionista: nutricionistaId,
        archivada: false,
      },
    });

    if (activas <= 100) {
      return;
    }

    // Obtener la entrada activa más vieja (FIFO)
    const oldest = await this.repo.findOne({
      where: {
        idNutricionista: nutricionistaId,
        archivada: false,
      },
      order: { createdAt: 'ASC' },
    });

    if (oldest) {
      await this.repo.update(
        { idNutricionistaIaMemoria: oldest.idNutricionistaIaMemoria },
        { archivada: true },
      );
    }
  }

  private toDomain(
    orm: NutricionistaIAMemoriaOrmEntity,
  ): NutricionistaIAMemoriaEntity {
    return new NutricionistaIAMemoriaEntity(
      orm.idNutricionistaIaMemoria,
      orm.idNutricionista,
      orm.tipoEjemplo,
      orm.comentario,
      orm.idPlanAlimentacionVersion,
      orm.archivada,
      orm.createdAt,
    );
  }
}
