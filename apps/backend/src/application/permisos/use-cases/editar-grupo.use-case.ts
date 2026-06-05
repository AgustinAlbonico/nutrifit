import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UpdateGrupoPermisoDto } from '../dtos/update-grupo-permiso.dto';

export interface ActorContexto {
  id: number;
  rol: string;
}

@Injectable()
export class EditarGrupoUseCase {
  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(
    actor: ActorContexto,
    grupoId: number,
    dto: UpdateGrupoPermisoDto,
  ): Promise<void> {
    if (actor.rol !== 'ADMIN' && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo ADMIN o SUPERADMIN pueden editar grupos',
      );
    }

    const grupo = await this.grupoRepo.findOne({ where: { id: grupoId } });

    if (!grupo) {
      throw new NotFoundException(`Grupo con id ${grupoId} no encontrado`);
    }

    if (grupo.esGrupoSistema && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo SUPERADMIN puede modificar grupos del sistema',
      );
    }

    if (dto.clave !== undefined) {
      grupo.clave = dto.clave;
    }
    if (dto.nombre !== undefined) {
      grupo.nombre = dto.nombre;
    }
    if (dto.descripcion !== undefined) {
      grupo.descripcion = dto.descripcion ?? null;
    }

    await this.grupoRepo.save(grupo);
  }
}
