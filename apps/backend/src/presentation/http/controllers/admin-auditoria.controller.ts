import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';

interface FiltrosAuditoriaDto {
  fechaDesde?: string;
  fechaHasta?: string;
  accion?: string;
  entidad?: string;
  usuarioId?: number;
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
  @Rol(RolEnum.ADMIN)
  async listarAuditoria(
    @Query() filtros: FiltrosAuditoriaDto,
  ): Promise<RegistroAuditoria[]> {
    return this.auditoriaService.listarConFiltros({
      fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
      fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
      accion: filtros.accion as any,
      entidad: filtros.entidad,
      usuarioId: filtros.usuarioId,
    });
  }
}
