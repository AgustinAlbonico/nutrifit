import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

export interface GrupoPermisoOutput {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  acciones: string[];
}

@Injectable()
export class ListarGruposPermisosUseCase {
  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(): Promise<GrupoPermisoOutput[]> {
    const grupos = await this.grupoRepo.find({
      relations: { acciones: true },
      order: { clave: 'ASC' },
    });

    return grupos.map((g) => ({
      id: g.id,
      clave: g.clave,
      nombre: g.nombre,
      descripcion: g.descripcion,
      acciones: (g.acciones ?? []).map((a) => a.clave),
    }));
  }
}