import { Controller, ForbiddenException, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { PaginatedData } from '@nutrifit/shared';
import type { Response } from 'express';
import { Rol as RolEnum } from 'src/domain/entities/Usuario/Rol';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import {
  FiltrosAuditoria,
  RegistroAuditoriaReporte,
} from 'src/infrastructure/services/auditoria/auditoria.service';
import { AuditoriaReporteService } from 'src/infrastructure/services/auditoria/auditoria-reporte.service';
import { JwtAuthGuard } from 'src/infrastructure/auth/guards/auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { Rol } from 'src/infrastructure/auth/decorators/role.decorator';
import {
  CurrentUser,
  UsuarioAutenticadoPayload,
} from 'src/infrastructure/auth/decorators/current-user.decorator';

interface FiltrosAuditoriaDto {
  page?: string;
  pageSize?: string;
  limit?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  accion?: AccionAuditoria;
  modulo?: string;
  entidad?: string;
  entidadId?: string;
  usuarioId?: string;
  gimnasioId?: string;
  incluirSinGimnasio?: string;
  orden?: 'ASC' | 'DESC';
}

interface ExportarAuditoriaDto extends FiltrosAuditoriaDto {
  formato?: 'csv' | 'json';
}

@Controller('admin/auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminAuditoriaController {
  constructor(private readonly auditoriaReporteService: AuditoriaReporteService) {}

  @Get()
  @Rol(RolEnum.ADMIN, RolEnum.SUPERADMIN)
  async listarAuditoria(
    @Query() filtros: FiltrosAuditoriaDto,
    @CurrentUser() usuario: UsuarioAutenticadoPayload,
  ): Promise<PaginatedData<RegistroAuditoriaReporte>> {
    return this.auditoriaReporteService.listarConFiltros(
      this.construirFiltrosAuditoria(filtros, usuario, true),
    );
  }

  @Get('export')
  @Rol(RolEnum.ADMIN, RolEnum.SUPERADMIN)
  async exportarAuditoria(
    @Query() filtros: ExportarAuditoriaDto,
    @CurrentUser() usuario: UsuarioAutenticadoPayload,
    @Res() response: Response,
  ): Promise<void> {
    const formato = filtros.formato ?? 'csv';
    const resultado = await this.auditoriaReporteService.exportar(
      this.construirFiltrosAuditoria(filtros, usuario, false),
      formato,
    );

    response.setHeader('Content-Type', resultado.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${resultado.nombreArchivo}"`,
    );

    if (Buffer.isBuffer(resultado.contenido)) {
      response.end(resultado.contenido);
      return;
    }

    resultado.contenido.pipe(response);
  }

  private construirFiltrosAuditoria(
    filtros: FiltrosAuditoriaDto,
    usuario: UsuarioAutenticadoPayload,
    paginar: boolean,
  ): FiltrosAuditoria {
    const gimnasioId = this.resolverGimnasioAuditable(filtros.gimnasioId, usuario);

    return {
      page: this.parsearEntero(filtros.page) ?? 1,
      limit: paginar
        ? this.parsearEntero(filtros.pageSize ?? filtros.limit) ?? 50
        : this.parsearEntero(filtros.pageSize ?? filtros.limit),
      fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
      fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
      accion: filtros.accion,
      modulo: filtros.modulo,
      entidad: filtros.entidad,
      entidadId: filtros.entidadId,
      usuarioId: this.parsearEntero(filtros.usuarioId),
      gimnasioId,
      incluirSinGimnasio: this.parsearBooleano(filtros.incluirSinGimnasio),
      orden: filtros.orden ?? 'DESC',
    };
  }

  private resolverGimnasioAuditable(
    gimnasioIdFiltro: string | undefined,
    usuario: UsuarioAutenticadoPayload,
  ): number | null {
    const gimnasioIdSolicitado = this.parsearEntero(gimnasioIdFiltro);

    if (usuario.rol === RolEnum.SUPERADMIN) {
      return gimnasioIdSolicitado ?? usuario.gimnasioId ?? null;
    }

    if (usuario.gimnasioId == null) {
      throw new ForbiddenException('Seleccioná un gimnasio antes de consultar auditoría.');
    }

    if (
      gimnasioIdSolicitado !== undefined &&
      gimnasioIdSolicitado !== usuario.gimnasioId
    ) {
      throw new ForbiddenException('No tenés permisos para consultar ese gimnasio.');
    }

    return usuario.gimnasioId;
  }

  private parsearBooleano(valor: string | undefined): boolean | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }

    return valor === 'true' || valor === '1';
  }

  private parsearEntero(valor: string | undefined): number | undefined {
    if (valor === undefined || valor === '') {
      return undefined;
    }

    const numero = Number.parseInt(valor, 10);
    return Number.isNaN(numero) ? undefined : numero;
  }
}
