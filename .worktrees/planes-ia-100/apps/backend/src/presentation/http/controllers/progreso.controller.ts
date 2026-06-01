import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubirFotoProgresoUseCase } from 'src/application/fotos/use-cases/subir-foto-progreso.use-case';
import { ObtenerGaleriaFotosUseCase } from 'src/application/fotos/use-cases/obtener-galeria-fotos.use-case';
import { EliminarFotoProgresoUseCase } from 'src/application/fotos/use-cases/eliminar-foto-progreso.use-case';
import { CrearObjetivoUseCase } from 'src/application/objetivos/use-cases/crear-objetivo.use-case';
import { ActualizarObjetivoUseCase } from 'src/application/objetivos/use-cases/actualizar-objetivo.use-case';
import { MarcarObjetivoCompletadoUseCase } from 'src/application/objetivos/use-cases/marcar-objetivo-completado.use-case';
import { ObtenerObjetivosActivosUseCase } from 'src/application/objetivos/use-cases/obtener-objetivos-activos.use-case';
import {
  CrearObjetivoDto,
  ActualizarObjetivoDto,
} from 'src/application/objetivos/dtos/objetivo.dto';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { AppLoggerService } from 'src/infrastructure/common/logger/app-logger.service';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SocioResourceAccessGuard } from 'src/infrastructure/auth/guards/socio-resource-access.guard';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

@Controller('progreso')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard, SocioResourceAccessGuard)
export class ProgresoController {
  constructor(
    private readonly subirFotoProgresoUseCase: SubirFotoProgresoUseCase,
    private readonly obtenerGaleriaFotosUseCase: ObtenerGaleriaFotosUseCase,
    private readonly eliminarFotoProgresoUseCase: EliminarFotoProgresoUseCase,
    private readonly crearObjetivoUseCase: CrearObjetivoUseCase,
    private readonly actualizarObjetivoUseCase: ActualizarObjetivoUseCase,
    private readonly marcarObjetivoCompletadoUseCase: MarcarObjetivoCompletadoUseCase,
    private readonly obtenerObjetivosActivosUseCase: ObtenerObjetivosActivosUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: AppLoggerService,
  ) {}

  @Post(':socioId/fotos')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  @Actions('progreso.editar')
  @UseInterceptors(FileInterceptor('file'))
  async subirFoto(
    @Param('socioId', ParseIntPipe) socioId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('tipoFoto') tipoFoto: string,
    @Body('notas') notas?: string,
  ) {
    this.logger.log(`Subiendo foto de progreso para socio ${socioId}`);

    if (!file) {
      throw new Error('Se requiere un archivo de imagen');
    }

    return await this.subirFotoProgresoUseCase.execute(
      {
        socioId,
        tipoFoto: tipoFoto.toLowerCase() as TipoFoto,
        notas,
      },
      file.buffer,
      file.mimetype,
    );
  }

  @Get(':socioId/fotos')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  async obtenerGaleria(@Param('socioId', ParseIntPipe) socioId: number) {
    this.logger.log(`Obteniendo galeria de fotos para socio ${socioId}`);
    return await this.obtenerGaleriaFotosUseCase.execute(socioId);
  }

  @Delete(':socioId/fotos/:fotoId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  @Actions('progreso.editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarFoto(
    @Param('socioId', ParseIntPipe) socioId: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
  ) {
    this.logger.log(`Eliminando foto ${fotoId} del socio ${socioId}`);
    await this.eliminarFotoProgresoUseCase.execute(fotoId, socioId);
  }

  @Post(':socioId/objetivos')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  @Actions('progreso.editar')
  async crearObjetivo(
    @Param('socioId', ParseIntPipe) socioId: number,
    @Body() crearObjetivoDto: CrearObjetivoDto,
  ) {
    this.logger.log(`Creando objetivo para socio ${socioId}`);
    crearObjetivoDto.socioId = socioId;
    return await this.crearObjetivoUseCase.execute(crearObjetivoDto);
  }

  @Get(':socioId/objetivos')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  async obtenerObjetivos(@Param('socioId', ParseIntPipe) socioId: number) {
    this.logger.log(`Obteniendo objetivos para socio ${socioId}`);
    return await this.obtenerObjetivosActivosUseCase.execute(socioId);
  }

  @Patch(':socioId/objetivos/:objetivoId')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  @Actions('progreso.editar')
  async actualizarObjetivo(
    @Param('socioId', ParseIntPipe) socioId: number,
    @Param('objetivoId', ParseIntPipe) objetivoId: number,
    @Body() actualizarObjetivoDto: ActualizarObjetivoDto,
  ) {
    this.logger.log(`Actualizando objetivo ${objetivoId} del socio ${socioId}`);
    return await this.actualizarObjetivoUseCase.execute(
      objetivoId,
      actualizarObjetivoDto,
    );
  }

  @Patch(':socioId/objetivos/:objetivoId/estado')
  @Rol(RolEnum.NUTRICIONISTA, RolEnum.SOCIO, RolEnum.ADMIN)
  @Actions('progreso.editar')
  async marcarObjetivo(
    @Param('socioId', ParseIntPipe) socioId: number,
    @Param('objetivoId', ParseIntPipe) objetivoId: number,
    @Body('estado') estado: 'COMPLETADO' | 'ABANDONADO',
  ) {
    this.logger.log(
      `Marcando objetivo ${objetivoId} como ${estado} para socio ${socioId}`,
    );
    return await this.marcarObjetivoCompletadoUseCase.execute(
      objetivoId,
      estado,
    );
  }
}
