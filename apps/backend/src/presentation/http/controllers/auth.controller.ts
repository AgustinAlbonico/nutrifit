import {
  Body,
  Controller,
  Get,
  Inject,
  Put,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import type { Request } from 'express';
import { LoginDto } from 'src/application/auth/dtos/login.dto';
import { LoginUseCase } from 'src/application/auth/login.use-case';
import { LogoutUseCase } from 'src/application/auth/logout.use-case';
import { RefreshTokenUseCase } from 'src/application/auth/refresh-token.use-case';
import { CambiarContrasenaUseCase } from 'src/application/auth/cambiar-contrasena.use-case';
import { EstablecerContrasenaUseCase } from 'src/application/auth/establecer-contrasena.use-case';
import { SolicitarRecuperacionContrasenaUseCase } from 'src/application/auth/solicitar-recuperacion-contrasena.use-case';
import { ConfirmarRecuperacionContrasenaUseCase } from 'src/application/auth/confirmar-recuperacion-contrasena.use-case';
import { CambiarContrasenaDto } from 'src/application/auth/dtos/cambiar-contrasena.dto';
import { EstablecerContrasenaDto } from 'src/application/auth/dtos/establecer-contrasena.dto';
import { SolicitarRecuperacionDto } from 'src/application/auth/dtos/solicitar-recuperacion.dto';
import { ConfirmarRecuperacionDto } from 'src/application/auth/dtos/confirmar-recuperacion.dto';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { PermisosService } from 'src/application/permisos/permisos.service';
import {
  CurrentUser,
  CurrentUserId,
  type UsuarioAutenticadoPayload,
} from 'src/infrastructure/auth/decorators/current-user.decorator';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { extraerOrigenRequest } from 'src/infrastructure/common/http/request-origin.helper';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly cambiarContrasenaUseCase: CambiarContrasenaUseCase,
    private readonly establecerContrasenaUseCase: EstablecerContrasenaUseCase,
    private readonly solicitarRecuperacionUseCase: SolicitarRecuperacionContrasenaUseCase,
    private readonly confirmarRecuperacionUseCase: ConfirmarRecuperacionContrasenaUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly permisosService: PermisosService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Req() request: Request) {
    this.logger.log(`Intentando loguear al usuario con email: ${body.email}`);
    const res = await this.loginUseCase.execute(
      body,
      extraerOrigenRequest(request),
    );
    this.logger.log(
      `Login correcto para el usuario con email: ${body.email}, tiene el rol de ${res.rol}`,
    );
    return res;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUserId() userId: number,
    @CurrentUser() user: UsuarioAutenticadoPayload,
    @Req() request: Request,
  ) {
    await this.logoutUseCase.execute(
      userId,
      user.gimnasioId,
      extraerOrigenRequest(request),
    );

    return { message: 'Sesión cerrada' };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(
    @CurrentUser() user: UsuarioAutenticadoPayload,
    @Req() request: Request,
  ) {
    return this.refreshTokenUseCase.execute(
      user,
      extraerOrigenRequest(request),
    );
  }

  @Post('solicitar-recuperacion')
  async solicitarRecuperacion(@Body() body: SolicitarRecuperacionDto) {
    return this.solicitarRecuperacionUseCase.execute(body);
  }

  @Post('confirmar-recuperacion')
  async confirmarRecuperacion(@Body() body: ConfirmarRecuperacionDto) {
    return this.confirmarRecuperacionUseCase.execute(body);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getPermissions(@CurrentUserId() userId: number) {
    return this.permisosService.getAccionesEfectivasUsuario(userId);
  }

  @Put('cambiar-contrasena')
  @UseGuards(JwtAuthGuard)
  async cambiarContrasena(
    @CurrentUserId() userId: number,
    @CurrentUser() user: UsuarioAutenticadoPayload,
    @Body() body: CambiarContrasenaDto,
  ) {
    return this.cambiarContrasenaUseCase.execute(userId, user.email, body);
  }

  @Put('establecer-contrasena')
  @UseGuards(JwtAuthGuard)
  async establecerContrasena(
    @CurrentUserId() userId: number,
    @CurrentUser() user: UsuarioAutenticadoPayload,
    @Body() body: EstablecerContrasenaDto,
  ) {
    return this.establecerContrasenaUseCase.execute(userId, user.email, body);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UsuarioAutenticadoPayload) {
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
