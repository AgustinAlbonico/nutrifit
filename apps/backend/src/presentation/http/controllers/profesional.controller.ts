import {
  BadRequestException,
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
  CertificacionDto,
  CreateNutricionistaDto,
  DiplomaDto,
  DesactivarNutricionistaDto,
  DesactivarNutricionistaResultDto,
  ListNutricionistasQueryDto,
  ListProfesionalesPublicQueryDto,
  NutricionistaResponseDto,
  PerfilProfesionalPublicoResponseDto,
  CatalogoProfesionalResponseDto,
  UpdateNutricionistaDto,
  ActualizarPreferenciasIaDto,
} from 'src/application/profesionales/dtos';
import {
  CreateNutricionistaUseCase,
  DeleteNutricionistaUseCase,
  EliminarDiplomaUseCase,
  DesactivarNutricionistaUseCase,
  GetNutricionistaUseCase,
  GetMiPerfilNutricionistaUseCase,
  GetPerfilProfesionalPublicoUseCase,
  ListarDiplomasUseCase,
  ListNutricionistasUseCase,
  ListProfesionalesPublicosUseCase,
  ReactivarNutricionistaUseCase,
  SubirDiplomaUseCase,
  UpdateNutricionistaUseCase,
  ObtenerPreferenciasIaUseCase,
  ActualizarPreferenciasIaUseCase,
} from 'src/application/profesionales/use-cases';
import { DiplomaEntity } from 'src/domain/entities/Diploma/diploma.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  NutricionistaRepository,
  NUTRICIONISTA_REPOSITORY,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { FotoPerfilService } from 'src/application/shared/foto-perfil.service';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { ACCIONES, PaginatedData } from '@nutrifit/shared';
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
    private readonly desactivarNutricionistaUseCase: DesactivarNutricionistaUseCase,
    private readonly reactivarNutricionistaUseCase: ReactivarNutricionistaUseCase,
    private readonly listarDiplomasUseCase: ListarDiplomasUseCase,
    private readonly subirDiplomaUseCase: SubirDiplomaUseCase,
    private readonly eliminarDiplomaUseCase: EliminarDiplomaUseCase,
    private readonly obtenerPreferenciasIaUseCase: ObtenerPreferenciasIaUseCase,
    private readonly actualizarPreferenciasIaUseCase: ActualizarPreferenciasIaUseCase,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
    private readonly fotoPerfilService: FotoPerfilService,
  ) {}

  @Post()
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_CREAR)
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
      fotoPerfilKey = await this.fotoPerfilService.subir(
        'nutricionistas',
        file,
      );

      this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
    }

    const resultado = await this.createNutricionistaUseCase.execute(
      createNutricionistaDto,
      fotoPerfilKey,
    );
    const dto = this.mapToResponseDto(resultado.nutricionista);
    dto.contrasenaProvisional = resultado.contrasenaProvisional;
    return dto;
  }

  @Get()
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_VER)
  async findAll(
    @Query() query: ListNutricionistasQueryDto,
  ): Promise<PaginatedData<NutricionistaResponseDto>> {
    this.logger.log('Listando profesionales con paginacion');
    const resultado = await this.listNutricionistasUseCase.execute(query);
    return {
      data: resultado.data.map((n) => this.mapToResponseDto(n)),
      pagination: resultado.pagination,
    };
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

  /**
   * Preferencias IA persistentes del nutricionista (texto plano, max 2000).
   * Notas privadas que se concatenan con las notas de generación al construir
   * el prompt de generación de planes.
   */
  @Get('mi-perfil/preferencias-ia')
  @Rol(RolEnum.NUTRICIONISTA)
  async obtenerPreferenciasIa(
    @CurrentUserId() usuarioId: number,
  ): Promise<{ preferencias: string }> {
    this.logger.log(`Obteniendo preferencias IA para usuario ${usuarioId}`);
    const nutricionista =
      await this.getMiPerfilNutricionistaUseCase.execute(usuarioId);
    return this.obtenerPreferenciasIaUseCase.execute({
      nutricionistaId: nutricionista.idPersona ?? 0,
    });
  }

  /**
   * Actualiza las preferencias IA persistentes del nutricionista.
   * Sanitiza el input (HTML/scripts + markdown) y registra auditoría.
   * La acción `PLANES_IA_MEMORIA_EDITAR` se reusa para edición de IA.
   */
  @Put('mi-perfil/preferencias-ia')
  @Rol(RolEnum.NUTRICIONISTA)
  @Actions(ACCIONES.PLANES_IA_MEMORIA_EDITAR)
  async actualizarPreferenciasIa(
    @Body() dto: ActualizarPreferenciasIaDto,
    @CurrentUserId() usuarioId: number,
  ): Promise<{ preferencias: string }> {
    this.logger.log(`Actualizando preferencias IA para usuario ${usuarioId}`);
    const nutricionista =
      await this.getMiPerfilNutricionistaUseCase.execute(usuarioId);
    return this.actualizarPreferenciasIaUseCase.execute({
      nutricionistaId: nutricionista.idPersona ?? 0,
      preferencias: dto.preferencias,
      usuarioId,
    });
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
  @UseInterceptors(FileInterceptor('foto'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNutricionistaDto: UpdateNutricionistaDto,
    @UploadedFile() file?: Express.Multer.File,
    @Body('eliminarFoto') eliminarFotoRaw?: string,
    @CurrentUserId() usuarioEditorId?: number,
  ): Promise<NutricionistaResponseDto> {
    this.logger.log(`Actualizando profesional con ID: ${id}`);

    let fotoPerfilKey: string | undefined;

    if (file) {
      fotoPerfilKey = await this.fotoPerfilService.subir(
        'nutricionistas',
        file,
      );

      this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
    }

    const eliminarFoto = eliminarFotoRaw === 'true';

    const nutricionista = await this.updateNutricionistaUseCase.execute(
      id,
      updateNutricionistaDto,
      fotoPerfilKey,
      eliminarFoto,
      usuarioEditorId,
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

  /* ──────── Diplomas múltiples ──────── */

  @Get(':id/diplomas')
  @Rol(
    RolEnum.ADMIN,
    RolEnum.RECEPCIONISTA,
    RolEnum.NUTRICIONISTA,
    RolEnum.SOCIO,
  )
  async listarDiplomas(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DiplomaDto[]> {
    this.logger.log(`Listando diplomas del profesional ${id}`);
    const diplomas = await this.listarDiplomasUseCase.execute(id);
    return this.mapDiplomasToDto(diplomas, id);
  }

  @Post(':id/diplomas')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.NUTRICIONISTA)
  @UseInterceptors(FileInterceptor('diploma'))
  async subirDiploma(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() diploma: Express.Multer.File,
  ): Promise<DiplomaDto> {
    if (!diploma) {
      throw new BadRequestException('No se adjuntó ningún diploma.');
    }

    this.logger.log(
      `Subiendo diploma para profesional ${id} (${diploma.mimetype}, ${diploma.size} bytes)`,
    );

    const entity = await this.subirDiplomaUseCase.execute(id, diploma);
    return this.mapDiplomaToDto(entity, id);
  }

  @Delete(':id/diplomas/:diplomaId')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA, RolEnum.NUTRICIONISTA)
  async eliminarDiploma(
    @Param('diplomaId', ParseIntPipe) diplomaId: number,
  ): Promise<void> {
    this.logger.log(`Eliminando diploma ${diplomaId}`);
    await this.eliminarDiplomaUseCase.execute(diplomaId);
  }

  @Public()
  @Get(':id/diplomas/:diplomaId/archivo')
  async obtenerArchivoDiploma(
    @Param('id', ParseIntPipe) id: number,
    @Param('diplomaId', ParseIntPipe) diplomaId: number,
    @Res() res: Response,
  ) {
    const diplomas = await this.listarDiplomasUseCase.execute(id);
    const diploma = diplomas.find((d) => d.idDiploma === diplomaId);

    if (!diploma) {
      return res.status(404).json({ message: 'Diploma no encontrado.' });
    }

    const archivo = await this.objectStorage.obtenerArchivo(
      diploma.documentKey,
    );
    if (!archivo) {
      return res
        .status(404)
        .json({ message: 'No se pudo recuperar el archivo del diploma.' });
    }

    res.setHeader('Content-Type', archivo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${diploma.nombreOriginal || `diploma-${diplomaId}.${archivo.mimeType.split('/')[1] || 'pdf'}`}"`,
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:5173",
    );
    return res.send(archivo.buffer);
  }

  @Delete(':id')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_ELIMINAR)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    this.logger.log(`Dando de baja profesional con ID: ${id}`);
    await this.deleteNutricionistaUseCase.execute(id);
  }

  @Post(':id/desactivar')
  @Rol(RolEnum.ADMIN, RolEnum.RECEPCIONISTA)
  @Actions(ACCIONES.NUTRICIONISTAS_ELIMINAR)
  async desactivar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DesactivarNutricionistaDto,
    @CurrentUserId() usuarioId?: number,
  ): Promise<DesactivarNutricionistaResultDto> {
    this.logger.log(`Desactivando profesional con ID: ${id}`);
    const resultado = await this.desactivarNutricionistaUseCase.execute(
      id,
      dto.motivo,
      usuarioId,
    );
    return {
      message: `Nutricionista desactivado. ${resultado.turnosCancelados} turnos cancelados, ${resultado.sociosAfectados} socios notificados.`,
      turnosCancelados: resultado.turnosCancelados,
      sociosAfectados: resultado.sociosAfectados,
    };
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
    dto.presentacion = nutricionista.presentacion ?? null;
    dto.fotoPerfilUrl = nutricionista.fotoPerfilKey
      ? `/profesional/${nutricionista.idPersona}/foto?v=${encodeURIComponent(nutricionista.fotoPerfilKey)}`
      : null;
    dto.certificaciones = (nutricionista.certificaciones ?? []).map((c) =>
      this.mapCertificacionToDto(c),
    );
    dto.formacionAcademica = (nutricionista.formacionAcademica ?? []).map(
      (f) => ({
        idFormacionAcademica: f.idFormacionAcademica,
        titulo: f.titulo,
        institucion: f.institucion,
        anioInicio: f.añoComienzo,
        anioFin: f.añoFin,
        nivel: f.nivel,
        enCurso: f.añoFin === null,
      }),
    );
    dto.diplomas = (nutricionista.diplomas ?? []).map((d) =>
      this.mapDiplomaToDto(d, nutricionista.idPersona ?? 0),
    );
    return dto;
  }

  private mapCertificacionToDto(
    c: NutricionistaEntity['certificaciones'][number],
  ): CertificacionDto {
    const dto = new CertificacionDto();
    dto.idCertificacion = c.idCertificacion;
    dto.nombre = c.nombre;
    dto.entidad = c.entidad;
    dto.anio = c.anio;
    dto.cargaHoraria = c.cargaHoraria;
    dto.nivel = c.nivel;
    return dto;
  }

  private mapDiplomaToDto(d: DiplomaEntity, idPersona: number): DiplomaDto {
    const dto = new DiplomaDto();
    dto.idDiploma = d.idDiploma;
    dto.url = `/profesional/${idPersona}/diplomas/${d.idDiploma}/archivo`;
    dto.nombreOriginal = d.nombreOriginal;
    dto.mimeType = d.mimeType;
    return dto;
  }

  private mapDiplomasToDto(
    diplomas: DiplomaEntity[],
    idPersona: number,
  ): DiplomaDto[] {
    return diplomas.map((d) => this.mapDiplomaToDto(d, idPersona));
  }
}
