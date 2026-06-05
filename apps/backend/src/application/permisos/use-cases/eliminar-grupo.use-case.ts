import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

export interface ActorContexto {
  id: number;
  rol: string;
}

@Injectable()
export class EliminarGrupoUseCase {
  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(actor: ActorContexto, grupoId: number): Promise<void> {
    if (actor.rol !== 'ADMIN' && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo ADMIN o SUPERADMIN pueden eliminar grupos',
      );
    }

    const grupo = await this.grupoRepo.findOne({ where: { id: grupoId } });
    if (!grupo) {
      throw new NotFoundException(`Grupo con id ${grupoId} no encontrado`);
    }

    if (grupo.esGrupoSistema && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo SUPERADMIN puede eliminar grupos del sistema',
      );
    }

    await this.grupoRepo.remove(grupo);
  }
}
