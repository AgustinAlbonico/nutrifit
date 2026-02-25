import {
  Body,
  Controller,
  Get,
  Inject,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { LoginDto } from 'src/application/auth/dtos/login.dto';
import { LoginUseCase } from 'src/application/auth/login.use-case';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { Request } from 'express';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly permisosService: PermisosService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    this.logger.log(`Intentando loguear al usuario con email: ${body.email}`);
    const res = await this.loginUseCase.execute(body);
    this.logger.log(
      `Login correcto para el usuario con email: ${body.email}, tiene el rol de ${res.rol}`,
    );
    return res;
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return [];
    }

    return this.permisosService.getAccionesEfectivasUsuario(userId);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      return {
        idUsuario: null,
        idPersona: null,
        email: null,
        rol: null,
        nombre: null,
        apellido: null,
        fotoPerfilUrl: null,
      };
    }

    const perfil = await this.usuarioRepository.findPerfilByUserId(userId);

    if (!perfil) {
      return {
        idUsuario: userId,
        idPersona: null,
        email: user?.email ?? null,
        rol: user?.rol ?? null,
        nombre: null,
        apellido: null,
        fotoPerfilUrl: null,
      };
    }

    // Construir URL de foto de perfil
    const fotoPerfilUrl = perfil.fotoPerfilKey
      ? `/${perfil.rol === 'SOCIO' ? 'socio' : 'profesional'}/${perfil.idPersona}/foto?v=${encodeURIComponent(perfil.fotoPerfilKey)}`
      : null;

    return {
      idUsuario: perfil.idUsuario,
      idPersona: perfil.idPersona,
      email: perfil.email,
      rol: perfil.rol,
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      fotoPerfilUrl,
    };
  }
}
