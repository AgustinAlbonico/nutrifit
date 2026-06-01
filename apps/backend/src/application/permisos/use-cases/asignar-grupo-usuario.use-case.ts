import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

export interface AsignarGrupoUsuarioInput {
  usuarioId: number;
  grupoPermisoId: number;
  gimnasioId: number | null; // null = aplica a todos los gimnasios
}

@Injectable()
export class AsignarGrupoUsuarioUseCase {
  constructor(
    @InjectRepository(UsuarioGrupoPermisoOrmEntity)
    private readonly usuarioGrupoRepo: Repository<UsuarioGrupoPermisoOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(
    input: AsignarGrupoUsuarioInput,
  ): Promise<UsuarioGrupoPermisoOrmEntity> {
    // Validar que el usuario existe
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: input.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID ${input.usuarioId} no encontrado`,
      );
    }

    // Validar que el grupo existe
    const grupo = await this.grupoRepo.findOne({
      where: { id: input.grupoPermisoId },
    });
    if (!grupo) {
      throw new NotFoundException(
        `Grupo de permiso con ID ${input.grupoPermisoId} no encontrado`,
      );
    }

    // Validar que no tiene ya ese grupo asignado (mismo grupo + mismo gimnasio)
    const whereClause: Record<string, unknown> = {
      usuario: { idUsuario: input.usuarioId },
      grupoPermiso: { id: input.grupoPermisoId },
    };
    if (input.gimnasioId !== null) {
      whereClause.gimnasioId = input.gimnasioId;
    } else {
      whereClause.gimnasioId = null;
    }
    const asignacionExistente = await this.usuarioGrupoRepo.findOne({
      where: whereClause,
    });
    if (asignacionExistente) {
      throw new ConflictException(
        'El usuario ya tiene asignado este grupo de permisos',
      );
    }

    // Crear la asignacion
    const asignacion = this.usuarioGrupoRepo.create({
      usuario,
      grupoPermiso: grupo,
      gimnasioId: input.gimnasioId,
    });
    return this.usuarioGrupoRepo.save(asignacion);
  }
}
