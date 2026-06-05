import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { AsignarAccionesDto } from '../dtos/asignar-acciones.dto';

export interface ActorContexto {
  id: number;
  rol: string;
}

@Injectable()
export class AsignarAccionesGrupoUseCase {
  constructor(
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
    @InjectRepository(AccionOrmEntity)
    private readonly accionRepo: Repository<AccionOrmEntity>,
  ) {}

  async execute(
    actor: ActorContexto,
    grupoId: number,
    dto: AsignarAccionesDto,
  ): Promise<GrupoPermisoOrmEntity> {
    if (actor.rol !== 'ADMIN' && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo ADMIN o SUPERADMIN pueden modificar las acciones de un grupo',
      );
    }

    const grupo = await this.grupoRepo.findOne({
      where: { id: grupoId },
      relations: { acciones: true },
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo con id ${grupoId} no encontrado`);
    }

    if (grupo.esGrupoSistema && actor.rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Solo SUPERADMIN puede modificar las acciones de un grupo del sistema',
      );
    }

    const acciones = await this.accionRepo.find({
      where: { id: In(dto.actionIds) },
    });
    if (acciones.length !== dto.actionIds.length) {
      throw new NotFoundException('Una o mas acciones no existen');
    }

    grupo.acciones = acciones;
    return this.grupoRepo.save(grupo);
  }
}
