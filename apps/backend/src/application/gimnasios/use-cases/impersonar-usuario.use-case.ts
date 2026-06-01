import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '../../shared/use-case.base';
import { UsuarioRepository } from 'src/domain/entities/Usuario/usuario.repository';
import {
  GimnasioRepository,
  GIMNASIO_REPOSITORY,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import {
  IJwtService,
  JWT_SERVICE,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from 'src/domain/exceptions/custom-exceptions';
import { randomUUID } from 'crypto';

export interface ImpersonarResultado {
  token: string;
  usuario: {
    id: number;
    email: string;
    rol: Rol;
  };
  gimnasio: {
    id: number;
    nombre: string;
  };
  impersonatedBy: number;
  expiraEn: string;
}

@Injectable()
export class ImpersonarUsuarioUseCase implements BaseUseCase {
  constructor(
    @Inject(UsuarioRepository)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(GIMNASIO_REPOSITORY)
    private readonly gimnasioRepository: GimnasioRepository,
    @Inject(JWT_SERVICE)
    private readonly jwtService: IJwtService,
  ) {}

  async execute(
    superadminId: number,
    gimnasioId: number,
    email: string,
  ): Promise<ImpersonarResultado> {
    // 1. Verificar que el gimnasio existe
    const gimnasio = await this.gimnasioRepository.findById(gimnasioId);
    if (!gimnasio) {
      throw new NotFoundError('Gimnasio', String(gimnasioId));
    }

    // 2. Buscar el usuario a impersonar
    const usuario = await this.usuarioRepository.findByEmail(email);
    if (!usuario) {
      throw new NotFoundError('Usuario', email);
    }

    // 3. Validar: no se puede impersonar a otro SUPERADMIN
    if (usuario.rol === Rol.SUPERADMIN) {
      throw new BadRequestError(
        'No se puede impersonar a un SUPERADMIN',
      );
    }

    // 4. Validar: el usuario debe tener gimnasio asociado
    if (!usuario.persona?.gimnasioId) {
      throw new BadRequestError(
        'El usuario no tiene un gimnasio asociado',
      );
    }

    // 5. Validar: el gimnasio del usuario debe coincidir con el solicitado
    if (usuario.persona.gimnasioId !== gimnasioId) {
      throw new BadRequestError(
        'El usuario no pertenece al gimnasio especificado',
      );
    }

    // 6. Validar: el usuario debe estar activo (fechaBaja null)
    if (usuario.persona.fechaBaja) {
      throw new BadRequestError(
        'El usuario está inactivo y no puede ser impersonado',
      );
    }

    // 7. Generar JWT con el gimnasioId del usuario y impersonatedBy del SUPERADMIN
    const jti = randomUUID();
    const payload: JwtPayload = {
      id: usuario.idUsuario,
      email: usuario.email,
      rol: usuario.rol,
      acciones: usuario.getAccionesEfectivas(),
      personaId: usuario.persona.idPersona,
      gimnasioId: usuario.persona.gimnasioId,
      jti,
    };

    // Agregar impersonatedBy para indicar que es una sesión de impersonación
    (payload as any).impersonatedBy = superadminId;

    const token = this.jwtService.sign(payload);

    return {
      token,
      usuario: {
        id: usuario.idUsuario ?? 0,
        email: usuario.email,
        rol: usuario.rol,
      },
      gimnasio: {
        id: gimnasio.id,
        nombre: gimnasio.nombre,
      },
      impersonatedBy: superadminId,
      expiraEn: '2h',
    };
  }
}