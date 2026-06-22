import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaginatedData, PaginationParams } from '@nutrifit/shared';
import {
  AuditoriaOrmEntity,
  AccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { paginarQuery } from 'src/common/helpers/paginacion.helper';
import { getArgentinaMonthRange } from 'src/common/utils/argentina-datetime.util';

export interface AuditoriaDto {
  usuarioId?: number | null;
  accion: AccionAuditoria;
  entidad: string;
  entidadId?: number | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  /** ID del gimnasio (tenant). Si no se provee, se usa el contexto actual. */
  gimnasioId?: number | null;
}

export interface FiltrosAuditoria {
  page?: number;
  limit?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  accion?: AccionAuditoria;
  entidad?: string;
  usuarioId?: number;
  /** Filtrar por gimnasio. Si no se provee, usa el contexto actual. */
  gimnasioId?: number | null;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaOrmEntity)
    private readonly auditoriaRepository: Repository<AuditoriaOrmEntity>,
    private readonly tenantContext?: TenantContextService,
  ) {}

  async registrar(dto: AuditoriaDto): Promise<void> {
    // Determinar el gimnasioId: usar el proporcionado o el del contexto actual
    let gimnasioId = dto.gimnasioId ?? null;
    if (gimnasioId === null && this.tenantContext?.isInitialized) {
      try {
        gimnasioId = this.tenantContext.gimnasioId;
      } catch {
        // Si no hay contexto, queda null
      }
    }

    const registro = this.auditoriaRepository.create({
      usuarioId: dto.usuarioId,
      accion: dto.accion,
      entidad: dto.entidad,
      entidadId: dto.entidadId,
      ipOrigen: dto.ipOrigen ?? null,
      userAgent: dto.userAgent ?? null,
      metadata: dto.metadata ?? null,
      gimnasioId,
    });

    await this.auditoriaRepository.save(registro);
  }

  async listarConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<PaginatedData<AuditoriaOrmEntity>> {
    // Si se provee gimnasioId, usar ese (incluye null para admin)
    let gimnasioId = filtros.gimnasioId;

    // Si NO se provee y hay contexto, usar el del contexto (comportamiento seguro para no-admin)
    if (gimnasioId === undefined && this.tenantContext?.isInitialized) {
      try {
        gimnasioId = this.tenantContext.gimnasioId;
      } catch {
        // Sin contexto, buscar sin filtro de gimnasio
      }
    }

    // Si gimnasioId sigue siendo undefined, no aplicar filtro de gymnasio
    // (comportamiento legacy para backward compatibility)
    // Si es null explícitamente, tampoco aplicar filtro

    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .orderBy('auditoria.timestamp', 'DESC');

    if (gimnasioId !== undefined && gimnasioId !== null) {
      queryBuilder.andWhere('auditoria.gimnasioId = :gimnasioId', {
        gimnasioId,
      });
    }

    if (filtros.fechaDesde) {
      queryBuilder.andWhere('auditoria.timestamp >= :fechaDesde', {
        fechaDesde: filtros.fechaDesde,
      });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('auditoria.timestamp <= :fechaHasta', {
        fechaHasta: filtros.fechaHasta,
      });
    }

    if (filtros.accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', {
        accion: filtros.accion,
      });
    }

    if (filtros.entidad) {
      queryBuilder.andWhere('auditoria.entidad = :entidad', {
        entidad: filtros.entidad,
      });
    }

    if (filtros.usuarioId) {
      queryBuilder.andWhere('auditoria.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    const paginationParams: PaginationParams = {
      page: filtros.page ?? 1,
      limit: filtros.limit ?? 20,
    };

    return paginarQuery(queryBuilder, paginationParams);
  }

  /**
   * Cuenta las reprogramaciones hechas por un socio en un gimnasio durante el
   * mes natural (Argentina) que contiene a la fecha de referencia.
   *
   * Considera registros de `TURNO_ESTADO_CAMBIO` con `metadata.tipo = 'REPROGRAMACION'`.
   */
  async contarReprogramacionesSocioEnMes(
    socioUsuarioId: number,
    gimnasioId: number,
    fechaReferencia: Date,
  ): Promise<number> {
    const { inicioMes, finMes } =
      this.calcularRangoMesNaturalArgentina(fechaReferencia);

    return this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .where('auditoria.usuarioId = :socioUsuarioId', { socioUsuarioId })
      .andWhere('auditoria.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere('auditoria.accion = :accion', {
        accion: 'TURNO_ESTADO_CAMBIO',
      })
      .andWhere('auditoria.entidad = :entidad', { entidad: 'Turno' })
      .andWhere('auditoria.timestamp >= :inicioMes', { inicioMes })
      .andWhere('auditoria.timestamp < :finMes', { finMes })
      .andWhere("JSON_EXTRACT(auditoria.metadata, '$.tipo') = :tipo", {
        tipo: 'REPROGRAMACION',
      })
      .getCount();
  }

  private calcularRangoMesNaturalArgentina(referencia: Date): {
    inicioMes: Date;
    finMes: Date;
  } {
    return getArgentinaMonthRange(referencia);
  }
}
