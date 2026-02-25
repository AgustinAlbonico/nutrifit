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
import {
  CreateNutricionistaDto,
  ListProfesionalesPublicQueryDto,
  NutricionistaResponseDto,
  PerfilProfesionalPublicoResponseDto,
  ProfesionalPublicoResponseDto,
  UpdateNutricionistaDto,
} from 'src/application/profesionales/dtos';
import {
  CreateNutricionistaUseCase,
  DeleteNutricionistaUseCase,
  GetNutricionistaUseCase,
  GetPerfilProfesionalPublicoUseCase,
  ListNutricionistasUseCase,
  ListProfesionalesPublicosUseCase,
  ReactivarNutricionistaUseCase,
  UpdateNutricionistaUseCase,
} from 'src/application/profesionales/use-cases';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Public } from 'src/infrastructure/auth/decorators/public.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller('profesional')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class ProfesionalController {
  constructor(
    private readonly createNutricionistaUseCase: CreateNutricionistaUseCase,
    private readonly getNutricionistaUseCase: GetNutricionistaUseCase,
    private readonly listNutricionistasUseCase: ListNutricionistasUseCase,
    private readonly listProfesionalesPublicosUseCase: ListProfesionalesPublicosUseCase,
    private readonly getPerfilProfesionalPublicoUseCase: GetPerfilProfesionalPublicoUseCase,
    private readonly updateNutricionistaUseCase: UpdateNutricionistaUseCase,
    private readonly deleteNutricionistaUseCase: DeleteNutricionistaUseCase,
    private readonly reactivarNutricionistaUseCase: ReactivarNutricionistaUseCase,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  @Post()
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.crear')
  @UseInterceptors(FileInterceptor('foto'))
  async create(
    @Body() createNutricionistaDto: CreateNutricionistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.logger.log(
      `Creando profesional con email: ${createNutricionistaDto.email}`,
    );

    let fotoPerfilKey: string | undefined;

    if (file) {
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/nutricionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
    }

    const nutricionista = await this.createNutricionistaUseCase.execute(
      createNutricionistaDto,
      fotoPerfilKey,
    );
    return this.mapToResponseDto(nutricionista);
  }

  @Get()
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.listar')
  async findAll(): Promise<NutricionistaResponseDto[]> {
    this.logger.log('Listando todos los profesionales');
    const nutricionistas = await this.listNutricionistasUseCase.execute();
    return nutricionistas.map((nutricionista) =>
      this.mapToResponseDto(nutricionista),
    );
  }

  @Get('publico/disponibles')
  @Rol(RolEnum.SOCIO)
  async findDisponiblesForSocio(
    @Query() query: ListProfesionalesPublicQueryDto,
  ): Promise<ProfesionalPublicoResponseDto[]> {
    this.logger.log('Listando profesionales activos para socio');
    return this.listProfesionalesPublicosUseCase.execute(query);
  }

  @Get('publico/:id/perfil')
  @Rol(RolEnum.SOCIO)
  async findPublicProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PerfilProfesionalPublicoResponseDto> {
    this.logger.log(`Consultando perfil publico del profesional ${id}`);
    return this.getPerfilProfesionalPublicoUseCase.execute(id);
  }

  @Get(':id')
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.ver')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Obteniendo profesional con ID: ${id}`);
    const nutricionista = await this.getNutricionistaUseCase.execute(id);
    return this.mapToResponseDto(nutricionista);
  }

  @Put(':id')
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.actualizar')
  @UseInterceptors(FileInterceptor('foto'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNutricionistaDto: UpdateNutricionistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Actualizando profesional con ID: ${id}`);

    let fotoPerfilKey: string | undefined;

    if (file) {
      const timestamp = Date.now();
      const extension = file.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/nutricionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
    }

    const nutricionista = await this.updateNutricionistaUseCase.execute(
      id,
      updateNutricionistaDto,
      fotoPerfilKey,
    );
    return this.mapToResponseDto(nutricionista);
  }

  @Public()
  @Get(':id/foto')
  async obtenerFoto(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const nutricionista = await this.getNutricionistaUseCase.execute(id);

    if (!nutricionista || !nutricionista.fotoPerfilKey) {
      return res.redirect(
        'https://ui-avatars.com/api/?name=Nutricionista&background=10b981&color=fff&size=200',
      );
    }

    const archivo = await this.objectStorage.obtenerArchivo(
      nutricionista.fotoPerfilKey,
    );

    if (!archivo) {
      return res.redirect(
        'https://ui-avatars.com/api/?name=Nutricionista&background=10b981&color=fff&size=200',
      );
    }

    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(archivo.buffer);
  }

  @Delete(':id')
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.eliminar')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Dando de baja profesional con ID: ${id}`);
    await this.deleteNutricionistaUseCase.execute(id);
  }

  @Post(':id/reactivar')
  @Rol(RolEnum.ADMIN)
  @Actions('profesionales.actualizar')
  async reactivar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Reactivando profesional con ID: ${id}`);
    await this.reactivarNutricionistaUseCase.execute(id);
  }

  private mapToResponseDto(
    nutricionista: NutricionistaEntity,
  ): NutricionistaResponseDto {
    const dto = new NutricionistaResponseDto();
    dto.idPersona = nutricionista.idPersona ?? 0;
    dto.nombre = nutricionista.nombre;
    dto.apellido = nutricionista.apellido;
    dto.fechaNacimiento = nutricionista.fechaNacimiento;
    dto.telefono = nutricionista.telefono;
    dto.genero = nutricionista.genero;
    dto.direccion = nutricionista.direccion;
    dto.ciudad = nutricionista.ciudad;
    dto.provincia = nutricionista.provincia;
    dto.dni = nutricionista.dni;
    dto.matricula = nutricionista.matricula;
    dto.tarifaSesion = nutricionista.tarifaSesion;
    dto.añosExperiencia = nutricionista.añosExperiencia;
    dto.email = nutricionista.email;
    dto.fechaBaja = nutricionista.fechaBaja;
    dto.activo = !nutricionista.fechaBaja;
    dto.fotoPerfilUrl = nutricionista.fotoPerfilKey
      ? `/profesional/${nutricionista.idPersona}/foto?v=${encodeURIComponent(nutricionista.fotoPerfilKey)}`
      : null;
    return dto;
  }
}
