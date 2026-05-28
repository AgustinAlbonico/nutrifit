import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ActionsGuard } from 'src/infrastructure/auth/guards/actions.guard';
import { CurrentUserId } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { EstadoNotificacion } from 'src/domain/entities/Notificacion/estado-notificacion.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard, ActionsGuard)
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get('mias')
  async listar(
    @CurrentUserId() usuarioId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificacionesService.listar(
      usuarioId,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
  }

  @Get('mias/no-leidas')
  async contarNoLeidas(@CurrentUserId() usuarioId: number) {
    const total = await this.notificacionesService.contarNoLeidas(usuarioId);
    return { total };
  }

  @Patch(':id/leer')
  async marcarLeida(
    @CurrentUserId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificacionesService.marcarLeida(usuarioId, id);
  }

  @Patch('leer-todas')
  async marcarTodasLeidas(@CurrentUserId() usuarioId: number) {
    const actualizadas =
      await this.notificacionesService.marcarTodasLeidas(usuarioId);
    return { actualizadas };
  }

  @Get()
  @Rol(RolEnum.ADMIN)
  async listarAdmin(
    @Query('destinatarioId') destinatarioId?: string,
    @Query('tipo') tipo?: TipoNotificacion,
    @Query('estado') estado?: EstadoNotificacion,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificacionesService.listarAdmin({
      destinatarioId:
        destinatarioId && destinatarioId !== ''
          ? Number(destinatarioId)
          : undefined,
      tipo: tipo ?? undefined,
      estado: estado ?? undefined,
      desde: desde ? new Date(desde) : undefined,
      hasta: hasta ? new Date(hasta) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
