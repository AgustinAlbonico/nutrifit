import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { AsignarAccionesDto } from 'src/application/permisos/dtos/asignar-acciones.dto';
import { AsignarGruposDto } from 'src/application/permisos/dtos/asignar-grupos.dto';
import { CreateAccionDto } from 'src/application/permisos/dtos/create-accion.dto';
import { CreateGrupoPermisoDto } from 'src/application/permisos/dtos/create-grupo-permiso.dto';
import { UpdateAccionDto } from 'src/application/permisos/dtos/update-accion.dto';
import { UpdateGrupoPermisoDto } from 'src/application/permisos/dtos/update-grupo-permiso.dto';
import { Actions } from 'src/infrastructure/auth/decorators/actions.decorator';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get('actions')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.read')
  async listarAcciones() {
    return this.permisosService.listarAcciones();
  }

  @Post('actions')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.write')
  async crearAccion(@Body() dto: CreateAccionDto) {
    return this.permisosService.crearAccion(dto);
  }

  @Put('actions/:id')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.write')
  async editarAccion(
    @Param('id', ParseIntPipe) actionId: number,
    @Body() dto: UpdateAccionDto,
  ) {
    return this.permisosService.actualizarAccion(actionId, dto);
  }

  @Get('groups')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.read')
  async listarGrupos() {
    return this.permisosService.listarGrupos();
  }

  @Post('groups')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.write')
  async crearGrupo(@Body() dto: CreateGrupoPermisoDto) {
    return this.permisosService.crearGrupo(dto);
  }

  @Put('groups/:id')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.write')
  async editarGrupo(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: UpdateGrupoPermisoDto,
  ) {
    return this.permisosService.actualizarGrupo(groupId, dto);
  }

  @Put('groups/:id/actions')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.assign')
  async asignarAccionesAGrupo(
    @Param('id', ParseIntPipe) groupId: number,
    @Body() dto: AsignarAccionesDto,
  ) {
    return this.permisosService.asignarAccionesAGrupo(groupId, dto.actionIds);
  }

  @Put('users/:id/groups')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.assign')
  async asignarGruposAUsuario(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: AsignarGruposDto,
  ) {
    return this.permisosService.asignarGruposAUsuario(userId, dto.groupIds);
  }

  @Put('users/:id/actions')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.assign')
  async asignarAccionesAUsuario(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: AsignarAccionesDto,
  ) {
    return this.permisosService.asignarAccionesAUsuario(userId, dto.actionIds);
  }

  @Get('users/:id/actions')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.read')
  async accionesDeUsuario(@Param('id', ParseIntPipe) userId: number) {
    return this.permisosService.getAccionesEfectivasUsuario(userId);
  }

  @Get('users')
  @Rol(RolEnum.ADMIN)
  @Actions('auth.permissions.read')
  async buscarUsuarios(@Req() req: Request) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = (req.query.search as string) || '';
    const isActive =
      req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined;

    return this.permisosService.listarUsuariosPaginado({
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get('me/actions')
  async misAcciones(@Req() req: Request) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return [];
    }

    return this.permisosService.getAccionesEfectivasUsuario(userId);
  }
}
