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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  CreateNutricionistaDto,
  ListProfesionalesPublicQueryDto,
  NutricionistaResponseDto,
  PerfilProfesionalPublicoResponseDto,
  CatalogoProfesionalResponseDto,
  UpdateNutricionistaDto,
} from 'src/application/profesionales/dtos';
import {
  CreateNutricionistaUseCase,
  DeleteNutricionistaUseCase,
  GetNutricionistaUseCase,
  GetMiPerfilNutricionistaUseCase,
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
import { ACCIONES } from '@nutrifit/shared';
import { Public } from 'src/infrastructure/auth/decorators/public.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { CurrentUserId } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller('profesional')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class ProfesionalController {
  constructor(
    private readonly createNutricionistaUseCase: CreateNutricionistaUseCase,
    private readonly getNutricionistaUseCase: GetNutricionistaUseCase,
    private readonly getMiPerfilNutricionistaUseCase: GetMiPerfilNutricionistaUseCase,
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
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_CREAR)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'foto', maxCount: 1 },
      { name: 'diploma', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createNutricionistaDto: CreateNutricionistaDto,
    @UploadedFile() files?: {
      foto?: Express.Multer.File[];
      diploma?: Express.Multer.File[];
    },
  ) {
    console.log(
      '--- RAW BODY RECIBIDO EN CREATE NUTRICIONISTA ---',
      createNutricionistaDto,
    );
    this.logger.log(
      `Creando profesional con email: ${createNutricionistaDto.email}`,
    );

    let fotoPerfilKey: string | undefined;
    let diplomaKey: string | undefined;

    const foto = files?.foto?.[0];
    if (foto) {
      const extension = foto.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/nutricionistas/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        foto.buffer,
        foto.mimetype,
      );

      this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
    }

    const diploma = files?.diploma?.[0];
    if (diploma) {
      const extension = diploma.originalname.split('.').pop();
      diplomaKey = `perfiles/nutricionistas/diplomas/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        diplomaKey,
        diploma.buffer,
        diploma.mimetype,
      );

      this.logger.log(`Diploma subido: ${diplomaKey}`);
    }

    const nutricionista = await this.createNutricionistaUseCase.execute(
      createNutricionistaDto,
      fotoPerfilKey,
      diplomaKey,
    );
    return this.mapToResponseDto(nutricionista);
  }

  @Get()
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_VER)
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
  ): Promise<CatalogoProfesionalResponseDto> {
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

  @Get('mi-perfil')
  @Rol(RolEnum.NUTRICIONISTA)
  async getMiPerfil(
    @CurrentUserId() usuarioId: number,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Obteniendo mi-perfil para usuario ${usuarioId}`);
    const nutricionista =
      await this.getMiPerfilNutricionistaUseCase.execute(usuarioId);
    return this.mapToResponseDto(nutricionista);
  }

  @Get(':id')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_VER)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Obteniendo profesional con ID: ${id}`);
    const nutricionista = await this.getNutricionistaUseCase.execute(id);
    return this.mapToResponseDto(nutricionista);
  }

  @Put(':id')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.NUTRICIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_EDITAR)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'foto', maxCount: 1 },
      { name: 'diploma', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNutricionistaDto: UpdateNutricionistaDto,
    @UploadedFile() files?: {
      foto?: Express.Multer.File[];
      diploma?: Express.Multer.File[];
    },
    @Body('eliminarFoto') eliminarFotoRaw?: string,
    @Body('eliminarDiploma') eliminarDiplomaRaw?: string,
    @CurrentUserId() usuarioEditorId?: number,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Actualizando profesional con ID: ${id}`);

    let fotoPerfilKey: string | undefined;
    let diplomaKey: string | undefined;

    const foto = files?.foto?.[0];
    if (foto) {
      const extension = foto.originalname.split('.').pop();
      fotoPerfilKey = `perfiles/nutricionistas/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        fotoPerfilKey,
        foto.buffer,
        foto.mimetype,
      );

      this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
    }

    const diploma = files?.diploma?.[0];
    if (diploma) {
      const extension = diploma.originalname.split('.').pop();
      diplomaKey = `perfiles/nutricionistas/diplomas/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

      await this.objectStorage.subirArchivo(
        diplomaKey,
        diploma.buffer,
        diploma.mimetype,
      );

      this.logger.log(`Diploma actualizado: ${diplomaKey}`);
    }

    const eliminarFoto = eliminarFotoRaw === 'true';
    const eliminarDiploma = eliminarDiplomaRaw === 'true';

    const nutricionista = await this.updateNutricionistaUseCase.execute(
      id,
      updateNutricionistaDto,
      fotoPerfilKey,
      eliminarFoto,
      usuarioEditorId,
      diplomaKey,
      eliminarDiploma,
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

  @Get(':id/diploma')
  @Rol(RolEnum.SOCIO, RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  async obtenerDiploma(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const nutricionista = await this.getNutricionistaUseCase.execute(id);

    if (!nutricionista || !nutricionista.matriculaDocumentoKey) {
      return res.status(404).json({
        message: 'El profesional no tiene un diploma cargado.',
      });
    }

    const archivo = await this.objectStorage.obtenerArchivo(
      nutricionista.matriculaDocumentoKey,
    );

    if (!archivo) {
      return res.status(404).json({
        message: 'No se pudo recuperar el diploma del profesional.',
      });
    }

    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="diploma-${nutricionista.matricula || id}.${archivo.mimeType.split('/')[1] || 'pdf'}"`,
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(archivo.buffer);
  }

  @Delete(':id')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_ELIMINAR)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Dando de baja profesional con ID: ${id}`);
    await this.deleteNutricionistaUseCase.execute(id);
  }

  @Post(':id/reactivar')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_EDITAR)
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
    dto.aniosExperiencia = nutricionista.aniosExperiencia;
    dto.duracionTurnoMin = nutricionista.duracionTurnoMin;
    dto.email = nutricionista.email;
    dto.fechaBaja = nutricionista.fechaBaja;
    dto.activo = !nutricionista.fechaBaja;
    dto.fotoPerfilUrl = nutricionista.fotoPerfilKey
      ? `/profesional/${nutricionista.idPersona}/foto?v=${encodeURIComponent(nutricionista.fotoPerfilKey)}`
      : null;
    dto.diplomaUrl = nutricionista.matriculaDocumentoKey
      ? `/profesional/${nutricionista.idPersona}/diploma?v=${encodeURIComponent(nutricionista.matriculaDocumentoKey)}`
      : null;
    return dto;
  }
}
