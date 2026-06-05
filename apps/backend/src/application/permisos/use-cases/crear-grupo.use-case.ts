import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { CreateGrupoPermisoDto } from '../dtos/create-grupo-permiso.dto';

export interface ActorContexto {
  id: number;
  rol: string;
}

@Injectable()
export class CrearGrupoUseCase {
  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(
    actor: ActorContexto,
    dto: CreateGrupoPermisoDto,
  ): Promise<{ id: number; clave: string; nombre: string }> {
    if (actor.rol !== 'ADMIN' && actor.rol !== 'SUPERADMIN') {
      throw new ConflictException(
        'No tiene permisos para crear grupos de sistema',
      );
    }

    const existe = await this.grupoRepo.findOne({
      where: { clave: dto.clave },
    });

    if (existe) {
      throw new ConflictException('El grupo ya existe');
    }

    const grupo = this.grupoRepo.create({
      clave: dto.clave,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? null,
      esGrupoSistema: false,
    });

    const saved = await this.grupoRepo.save(grupo);

    return { id: saved.id, clave: saved.clave, nombre: saved.nombre };
  }
}
