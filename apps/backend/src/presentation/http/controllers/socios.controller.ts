import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { RegistrarSocioDto } from 'src/application/socios/dtos/registrarSocio.dto';
import { ActualizarSocioDto } from 'src/application/socios/dtos/actualizarSocio.dto';
import {
  DesactivarSocioDto,
  DesactivarSocioResultDto,
} from 'src/application/socios/dtos/desactivar-socio.dto';
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { ListSociosQueryDto } from 'src/application/socios/dtos/list-socios-query.dto';
import { RegistrarSocioUseCase } from 'src/application/socios/registrarSocio.use-case';
import { ListarSociosUseCase } from 'src/application/socios/listarSocios.use-case';
import { ActualizarSocioUseCase } from 'src/application/socios/actualizarSocio.use-case';
import { DesactivarSocioUseCase } from 'src/application/socios/desactivarSocio.use-case';
import { ReactivarSocioUseCase } from 'src/application/socios/reactivarSocio.use-case';
import { BuscarSociosConFichaUseCase } from 'src/application/socios/buscar-socios-con-ficha.use-case';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { OBJECT_STORAGE_SERVICE } from 'src/domain/services/object-storage.service';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { AppLoggerService } from 'src/infrastructure/common/logger/app-logger.service';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Public } from 'src/infrastructure/auth/decorators/public.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { CurrentUserId } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';

@Controller('socio')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class SocioController {
  constructor(
    private readonly registrarSocioUseCase: RegistrarSocioUseCase,
    private readonly listarSociosUseCase: ListarSociosUseCase,
    private readonly actualizarSocioUseCase: ActualizarSocioUseCase,
    private readonly desactivarSocioUseCase: DesactivarSocioUseCase,
    private readonly reactivarSocioUseCase: ReactivarSocioUseCase,
    private readonly buscarSociosConFichaUseCase: BuscarSociosConFichaUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: AppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  @Get()
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('socios.ver')
  async listarSocios(@Query() query: ListSociosQueryDto) {
    this.logger.log('Listando socios con paginacion');
    const resultado = await this.listarSociosUseCase.execute(query);
    return {
      data: resultado.data.map((socio) => new SocioResponseDto(socio)),
      pagination: resultado.pagination,
    };
  }

  @Get('buscar-con-ficha')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.NUTRICIONISTA)
  async buscarSociosConFicha(@Query('q') busqueda?: string) {
    this.logger.log(`Buscando socios con ficha: ${busqueda ?? 'todos'}`);
    return this.buscarSociosConFichaUseCase.execute(busqueda);
  }

  @Post()
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('socios.crear')
  @UseInterceptors(FileInterceptor('foto'))
  async registrarSocio(
    @Body() registrarSocioDto: RegistrarSocioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.logger.log('Registrando Socio' + registrarSocioDto.email);

    let fotoPerfilKey: string | undefined;

    if (file) {
      // Generar clave única para la foto
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/socios/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Subir archivo a MinIO
      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
    }

    const resultado = await this.registrarSocioUseCase.execute(
      registrarSocioDto,
      fotoPerfilKey,
    );

    return {
      message: 'Socio registrado exitosamente',
      id: resultado.socio.idPersona,
      socio: new SocioResponseDto(resultado.socio),
      contrasenaProvisional: resultado.contrasenaProvisional,
    };
  }

  @Put(':id')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('socios.editar')
  @UseInterceptors(FileInterceptor('foto'))
  async actualizarSocio(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarSocioDto: ActualizarSocioDto,
    @UploadedFile() file?: Express.Multer.File,
    @Body('eliminarFoto') eliminarFotoRaw?: string,
  ) {
    this.logger.log(`Actualizando socio ${id}`);

    let fotoPerfilKey: string | undefined;

    if (file) {
      // Generar clave única para la foto
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/socios/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      // Subir archivo a MinIO
      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
    }

    const eliminarFoto = eliminarFotoRaw === 'true';

    const socioActualizado = await this.actualizarSocioUseCase.execute(
      id,
      actualizarSocioDto,
      fotoPerfilKey,
      eliminarFoto,
    );
    return new SocioResponseDto(socioActualizado);
  }

  @Public()
  @Get(':id/foto')
  async obtenerFoto(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const socio = await this.listarSociosUseCase.findById(id);

    if (!socio || !socio.fotoPerfilKey) {
      // Retornar imagen placeholder por defecto
      return res.redirect(
        'https://ui-avatars.com/api/?name=Socio&background=6366f1&color=fff&size=200',
      );
    }

    const archivo = await this.objectStorage.obtenerArchivo(
      socio.fotoPerfilKey,
    );

    if (!archivo) {
      return res.redirect(
        'https://ui-avatars.com/api/?name=Socio&background=6366f1&color=fff&size=200',
      );
    }

    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(archivo.buffer);
  }

  @Post(':id/desactivar')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('socios.eliminar')
  async desactivarSocio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesactivarSocioDto,
    @CurrentUserId() usuarioId?: number,
  ): Promise<DesactivarSocioResultDto> {
    this.logger.log(`Desactivando socio con ID: ${id}`);
    const resultado = await this.desactivarSocioUseCase.execute(
      id,
      dto.motivo,
      usuarioId,
    );
    return {
      message: `Socio desactivado. ${resultado.turnosCancelados} turnos cancelados, ${resultado.nutricionistasAfectados} nutricionistas notificados.`,
      turnosCancelados: resultado.turnosCancelados,
      nutricionistasAfectados: resultado.nutricionistasAfectados,
      tienePlanActivo: resultado.tienePlanActivo,
    };
  }

  @Post(':id/reactivar')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions('socios.reactivar')
  async reactivarSocio(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Reactivando socio ${id}`);
    await this.reactivarSocioUseCase.execute(id);
    return { message: 'Socio reactivado exitosamente' };
  }
}
