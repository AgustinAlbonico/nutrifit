import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';

export interface ObtenerPermisosUsuarioOutput {
  usuarioId: number;
  email: string;
  rol: string;
  grupos: Array<{
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    acciones: string[];
  }>;
  acciones: string[];
}

@Injectable()
export class ObtenerPermisosUsuarioUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(GrupoPermisoOrmEntity)
    private readonly grupoRepo: Repository<GrupoPermisoOrmEntity>,
  ) {}

  async execute(usuarioId: number): Promise<ObtenerPermisosUsuarioOutput> {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: usuarioId },
      relations: {
        usuariosGruposPermisos: { grupoPermiso: { acciones: true } },
        acciones: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado`);
    }

    const grupos = (usuario.usuariosGruposPermisos ?? []).map((ugp) => ({
      id: ugp.grupoPermiso.id,
      clave: ugp.grupoPermiso.clave,
      nombre: ugp.grupoPermiso.nombre,
      descripcion: ugp.grupoPermiso.descripcion,
      acciones: (ugp.grupoPermiso.acciones ?? []).map((a) => a.clave),
    }));

    const accionesUsuario = (usuario.acciones ?? []).map((a) => a.clave);
    const accionesGrupos = grupos.flatMap((g) => g.acciones);
    const accionesUnicas = [...new Set([...accionesUsuario, ...accionesGrupos])];

    return {
      usuarioId: usuario.idUsuario ?? usuarioId,
      email: usuario.email,
      rol: usuario.rol,
      grupos,
      acciones: accionesUnicas,
    };
  }
}