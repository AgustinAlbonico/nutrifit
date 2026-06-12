import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import {
  CurrentUser,
  UsuarioAutenticadoPayload,
} from 'src/infrastructure/auth/decorators/current-user.decorator';

interface FiltrosAuditoriaDto {
  fechaDesde?: string;
  fechaHasta?: string;
  accion?: AccionAuditoria;
  entidad?: string;
  usuarioId?: number;
  /** ID del gimnasio a filtrar. Requerido para admins. */
  gimnasioId?: number;
}

interface RegistroAuditoria {
  idAuditoria: number;
  usuarioId: number | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  timestamp: Date;
  ipOrigen: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

@Controller('admin/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Rol(RolEnum.ADMIN, RolEnum.SUPERADMIN)
  async listarAuditoria(
    @Query() filtros: FiltrosAuditoriaDto,
    @CurrentUser() usuario: UsuarioAutenticadoPayload,
  ): Promise<RegistroAuditoria[]> {
    const esSuperadmin = usuario.rol === RolEnum.SUPERADMIN;

    // Admin usa su propio gimnasioId si no se especificó otro
    // SUPERADMIN puede ver todo (sin filtro de gimnasio)
    const gimnasioId =
      filtros.gimnasioId ?? (!esSuperadmin ? usuario.gimnasioId : undefined);

    return this.auditoriaService.listarConFiltros({
      fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
      fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
      accion: filtros.accion,
      entidad: filtros.entidad,
      usuarioId: filtros.usuarioId,
      gimnasioId,
    });
  }
}
