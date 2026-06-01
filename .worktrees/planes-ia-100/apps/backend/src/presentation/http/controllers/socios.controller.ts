import {
  Body,
  Controller,
  Delete,
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
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { RegistrarSocioUseCase } from 'src/application/socios/registrarSocio.use-case';
import { ListarSociosUseCase } from 'src/application/socios/listarSocios.use-case';
import { ActualizarSocioUseCase } from 'src/application/socios/actualizarSocio.use-case';
import { EliminarSocioUseCase } from 'src/application/socios/eliminarSocio.use-case';
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
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';

@Controller('socio')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class SocioController {
  constructor(
    private readonly registrarSocioUseCase: RegistrarSocioUseCase,
    private readonly listarSociosUseCase: ListarSociosUseCase,
    private readonly actualizarSocioUseCase: ActualizarSocioUseCase,
    private readonly eliminarSocioUseCase: EliminarSocioUseCase,
    private readonly reactivarSocioUseCase: ReactivarSocioUseCase,
    private readonly buscarSociosConFichaUseCase: BuscarSociosConFichaUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: AppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  @Get()
  @Rol(RolEnum.ADMIN)
  @Actions('socios.ver')
  async listarSocios() {
    this.logger.log('Listando todos los socios');
    const socios = await this.listarSociosUseCase.execute();
    return socios.map((socio) => new SocioResponseDto(socio));
  }

  @Get('buscar-con-ficha')
  @Rol(RolEnum.NUTRICIONISTA)
  async buscarSociosConFicha(@Query('q') busqueda?: string) {
    this.logger.log(`Buscando socios con ficha: ${busqueda ?? 'todos'}`);
    return this.buscarSociosConFichaUseCase.execute(busqueda);
  }

  @Post()
  @Rol(RolEnum.ADMIN)
  @Actions('socios.registrar')
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

    return await this.registrarSocioUseCase.execute(
      registrarSocioDto,
      fotoPerfilKey,
    );
  }

  @Put(':id')
  @Rol(RolEnum.ADMIN)
  @Actions('socios.editar')
  @UseInterceptors(FileInterceptor('foto'))
  async actualizarSocio(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarSocioDto: ActualizarSocioDto,
    @UploadedFile() file?: Express.Multer.File,
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

    const socioActualizado = await this.actualizarSocioUseCase.execute(
      id,
      actualizarSocioDto,
      fotoPerfilKey,
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

  @Delete(':id')
  @Rol(RolEnum.ADMIN)
  @Actions('socios.eliminar')
  async eliminarSocio(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Dando de baja socio ${id}`);
    await this.eliminarSocioUseCase.execute(id);
    return { message: 'Socio dado de baja exitosamente' };
  }

  @Post(':id/reactivar')
  @Rol(RolEnum.ADMIN)
  @Actions('socios.reactivar')
  async reactivarSocio(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Reactivando socio ${id}`);
    await this.reactivarSocioUseCase.execute(id);
    return { message: 'Socio reactivado exitosamente' };
  }
}
