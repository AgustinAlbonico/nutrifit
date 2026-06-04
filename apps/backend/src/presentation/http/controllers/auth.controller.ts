import { Body, Controller, Get, Inject, UseGuards, Post } from '@nestjs/common';
import { LoginDto } from 'src/application/auth/dtos/login.dto';
import { LoginUseCase } from 'src/application/auth/login.use-case';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { PermisosService } from 'src/application/permisos/permisos.service';
import {
  CurrentUser,
  CurrentUserId,
} from 'src/infrastructure/auth/decorators/current-user.decorator';
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
  async getPermissions(@CurrentUserId() userId: number) {
    return this.permisosService.getAccionesEfectivasUsuario(userId);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  // @ts-ignore - augmentación de Express namespace definida en src/types/express.d.ts, ts-node no la registra consistentemente
  async getProfile(@CurrentUser() user: Express.AuthenticatedUserPayload) {
    const perfil = await this.usuarioRepository.findPerfilByUserId(user.id);

    if (!perfil) {
      return {
        idUsuario: user.id,
        idPersona: null,
        email: user.email ?? null,
        rol: user.rol ?? null,
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
