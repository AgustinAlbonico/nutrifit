import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';

export interface QuitarGrupoUsuarioInput {
  usuarioId: number;
  grupoPermisoId: number;
}

@Injectable()
export class QuitarGrupoUsuarioUseCase {
  constructor(
    @InjectRepository(UsuarioGrupoPermisoOrmEntity)
    private readonly usuarioGrupoRepo: Repository<UsuarioGrupoPermisoOrmEntity>,
  ) {}

  async execute(input: QuitarGrupoUsuarioInput): Promise<void> {
    const asignacion = await this.usuarioGrupoRepo.findOne({
      where: {
        usuario: { idUsuario: input.usuarioId },
        grupoPermiso: { id: input.grupoPermisoId },
      },
    });

    if (!asignacion) {
      throw new NotFoundException(
        `Asignacion de grupo no encontrada para usuario ${input.usuarioId} y grupo ${input.grupoPermisoId}`,
      );
    }

    await this.usuarioGrupoRepo.remove(asignacion);
  }
}
