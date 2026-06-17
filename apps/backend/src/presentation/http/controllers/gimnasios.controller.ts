import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { Rol as RolesDecorator } from 'src/infrastructure/auth/decorators/role.decorator';
import { CurrentUserId } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { CrearGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-gimnasio.use-case';
import { CrearAdminGimnasioUseCase } from 'src/application/gimnasios/use-cases/crear-admin-gimnasio.use-case';
import { ListarAdminsGimnasioUseCase } from 'src/application/gimnasios/use-cases/listar-admins-gimnasio.use-case';
import { ListarGimnasiosUseCase } from 'src/application/gimnasios/use-cases/listar-gimnasios.use-case';
import { ObtenerGimnasioUseCase } from 'src/application/gimnasios/use-cases/obtener-gimnasio.use-case';
import { ActualizarGimnasioUseCase } from 'src/application/gimnasios/use-cases/actualizar-gimnasio.use-case';
import { EliminarGimnasioUseCase } from 'src/application/gimnasios/use-cases/eliminar-gimnasio.use-case';
import { ImpersonarUsuarioUseCase } from 'src/application/gimnasios/use-cases/impersonar-usuario.use-case';
import {
  CrearGimnasioDto,
  ActualizarGimnasioDto,
} from 'src/domain/entities/Gimnasio/gimnasio.repository';
import { CrearAdminGimnasioDto } from 'src/application/gimnasios/dtos/crear-admin-gimnasio.dto';

@ApiTags('Gimnasios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gimnasios')
@RolesDecorator(Rol.SUPERADMIN)
export class GimnasiosController {
  constructor(
    private readonly crearGimnasioUseCase: CrearGimnasioUseCase,
    private readonly crearAdminGimnasioUseCase: CrearAdminGimnasioUseCase,
    private readonly listarAdminsGimnasioUseCase: ListarAdminsGimnasioUseCase,
    private readonly listarGimnasiosUseCase: ListarGimnasiosUseCase,
    private readonly obtenerGimnasioUseCase: ObtenerGimnasioUseCase,
    private readonly actualizarGimnasioUseCase: ActualizarGimnasioUseCase,
    private readonly eliminarGimnasioUseCase: EliminarGimnasioUseCase,
    private readonly impersonarUsuarioUseCase: ImpersonarUsuarioUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo gimnasio (con admin opcional)' })
  async crear(@Body() dto: CrearGimnasioDto) {
    const gimnasio = await this.crearGimnasioUseCase.execute(dto);

    let contrasenaProvisional: string | undefined;

    if (dto.admin) {
      const resultadoAdmin = await this.crearAdminGimnasioUseCase.execute(
        dto.admin.nombre,
        dto.admin.email,
        gimnasio.id,
      );
      contrasenaProvisional = resultadoAdmin.contrasenaProvisional;
    }

    return {
      id: gimnasio.id,
      nombre: gimnasio.nombre,
      direccion: gimnasio.direccion,
      telefono: gimnasio.telefono,
      email: gimnasio.email,
      activo: gimnasio.activo,
      fechaAlta: gimnasio.fechaAlta,
      contrasenaProvisional,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los gimnasios activos' })
  async listar() {
    const gimnasios = await this.listarGimnasiosUseCase.execute();
    return gimnasios.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      direccion: g.direccion,
      telefono: g.telefono,
      email: g.email,
      activo: g.activo,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gimnasio por ID' })
  @ApiParam({ name: 'id', type: 'number' })
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const gimnasio = await this.obtenerGimnasioUseCase.execute(id);
    return {
      id: gimnasio.id,
      nombre: gimnasio.nombre,
      direccion: gimnasio.direccion,
      telefono: gimnasio.telefono,
      email: gimnasio.email,
      activo: gimnasio.activo,
      fechaAlta: gimnasio.fechaAlta,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un gimnasio' })
  @ApiParam({ name: 'id', type: 'number' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarGimnasioDto,
  ) {
    const gimnasio = await this.actualizarGimnasioUseCase.execute(id, dto);
    return {
      id: gimnasio.id,
      nombre: gimnasio.nombre,
      direccion: gimnasio.direccion,
      telefono: gimnasio.telefono,
      email: gimnasio.email,
      activo: gimnasio.activo,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar (soft delete) un gimnasio' })
  @ApiParam({ name: 'id', type: 'number' })
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.eliminarGimnasioUseCase.execute(id);
  }

  @Post(':id/impersonar')
  @ApiOperation({
    summary: 'Impersonar a un usuario del gimnasio especificado',
    description:
      'Solo SUPERADMIN puede impersonar. Genera un JWT con gimnasioId del objetivo.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID del gimnasio' })
  async impersonar(
    @Param('id', ParseIntPipe) gimnasioId: number,
    @Body() body: { email: string },
    @CurrentUserId() superadminId: number,
  ) {
    const resultado = await this.impersonarUsuarioUseCase.execute(
      superadminId,
      gimnasioId,
      body.email,
    );
    return resultado;
  }

  @Get(':id/admins')
  @ApiOperation({ summary: 'Listar admins de un gimnasio' })
  @ApiParam({ name: 'id', type: 'number' })
  async listarAdmins(@Param('id', ParseIntPipe) gimnasioId: number) {
    return this.listarAdminsGimnasioUseCase.execute(gimnasioId);
  }

  @Post(':id/admins')
  @ApiOperation({ summary: 'Agregar un admin a un gimnasio existente' })
  @ApiParam({ name: 'id', type: 'number' })
  async crearAdmin(
    @Param('id', ParseIntPipe) gimnasioId: number,
    @Body() dto: CrearAdminGimnasioDto,
  ) {
    const resultado = await this.crearAdminGimnasioUseCase.execute(
      dto.nombre,
      dto.email,
      gimnasioId,
    );
    return {
      usuarioId: resultado.usuarioId,
      personaId: resultado.personaId,
      contrasenaProvisional: resultado.contrasenaProvisional,
    };
  }
}
