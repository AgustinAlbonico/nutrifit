import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { Rol } from 'src/domain/entities/Usuario/Rol';

export interface AdminUserDto {
  id: number;
  email: string;
  nombre: string;
  apellido: string | null;
  rol: Rol;
  gimnasioId: number;
  activo: boolean;
  fechaCreacion?: Date;
}

@Injectable()
export class ListarAdminsGimnasioUseCase implements BaseUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async execute(gimnasioId: number): Promise<AdminUserDto[]> {
    const admins = await this.usuarioRepository.findAllByRolAndGimnasioId(
      Rol.ADMIN,
      gimnasioId,
    );

    return admins.map((admin) => ({
      id: admin.idUsuario ?? 0,
      email: admin.email,
      nombre: admin.persona?.nombre ?? '',
      apellido: admin.persona?.apellido ?? null,
      rol: admin.rol,
      gimnasioId: admin.persona?.gimnasioId ?? gimnasioId,
      activo: admin.fechaBaja === null,
      fechaCreacion: admin.fechaHoraAlta,
    }));
  }
}
