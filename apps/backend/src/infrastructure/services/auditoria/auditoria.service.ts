import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { Readable } from 'stream';
import type { PaginatedData, PaginationParams } from '@nutrifit/shared';
import {
  AuditoriaOrmEntity,
  AccionAuditoria,
  TipoAccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { paginarQuery } from 'src/common/helpers/paginacion.helper';
import { getArgentinaMonthRange } from 'src/common/utils/argentina-datetime.util';
import { AuditoriaSanitizer } from './auditoria-sanitizer.service';

type ValorAuditoria = Record<string, unknown> | null;
type UsuarioAuditoria = number | 'system' | null;

export interface AuditoriaRegistroDto {
  gimnasioId?: number | null;
  usuarioId?: UsuarioAuditoria;
  modulo?: string;
  entidad: string;
  entidadId?: number | string | null;
  accion: AccionAuditoria | string;
  descripcion?: string | null;
  tipoAccion?: TipoAccionAuditoria | string;
  valoresAntes?: ValorAuditoria;
  valoresDespues?: ValorAuditoria;
  metadata?: Record<string, unknown> | null;
  ipOrigen?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  camposSensibles?: string[];
}

export type AuditoriaDto = AuditoriaRegistroDto;

export interface FiltrosAuditoria {
  page?: number;
  limit?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  accion?: AccionAuditoria | string;
  modulo?: string;
  entidad?: string;
  entidadId?: number | string;
  usuarioId?: number;
  /** Filtrar por gimnasio. Si no se provee, usa el contexto actual. */
  gimnasioId?: number | null;
  incluirSinGimnasio?: boolean;
  orden?: 'ASC' | 'DESC';
}

export interface CambioAuditoria {
  campo: string;
  antes: unknown;
  despues: unknown;
}

export interface ExportarAuditoriaResultado {
  contenido: Buffer | Readable;
  nombreArchivo: string;
  contentType: string;
  esStream: boolean;
}

export interface RegistroAuditoriaReporte {
  kind?: 'audit_log' | 'login_audit';
  id: number;
  fecha: Date;
  gimnasioId: number | null;
  usuarioId: string | null;
  modulo: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  tipoAccion: string | null;
  descripcion: string | null;
  ip: string | null;
  userAgent: string | null;
  valoresAntes: Record<string, unknown> | null;
  valoresDespues: Record<string, unknown> | null;
  resultado?: string | null;
  emailIntentado?: string | null;
  motivo?: string | null;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(AuditoriaOrmEntity)
    private readonly auditoriaRepository: Repository<AuditoriaOrmEntity>,
    private readonly sanitizer: AuditoriaSanitizer,
    private readonly tenantContext?: TenantContextService,
  ) {}

  async registrar(dto: AuditoriaDto): Promise<void> {
    void this.persistirRegistro(dto).catch((error: unknown) => {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo registrar auditoria: ${mensaje}`);
    });
  }

  snapshot(
    valoresAntes: ValorAuditoria,
    valoresDespues: ValorAuditoria,
    accion: AccionAuditoria | string,
    camposSensibles: string[] = [],
  ): { valoresAntes: ValorAuditoria; valoresDespues: ValorAuditoria } {
    const antesSanitizado = this.sanitizer.sanitizar(valoresAntes, camposSensibles);
    const despuesSanitizado = this.sanitizer.sanitizar(valoresDespues, camposSensibles);

    if (accion === AccionAuditoria.UPDATE || accion === 'UPDATE') {
      return {
        valoresAntes: null,
        valoresDespues: { cambios: this.calcularDiff(antesSanitizado, despuesSanitizado) },
      };
    }

    if (accion === AccionAuditoria.CREATE || accion === 'CREATE') {
      return { valoresAntes: null, valoresDespues: despuesSanitizado };
    }

    if (accion === AccionAuditoria.DELETE || accion === 'DELETE') {
      return { valoresAntes: antesSanitizado, valoresDespues: null };
    }

    return { valoresAntes: antesSanitizado, valoresDespues: despuesSanitizado };
  }

  private async persistirRegistro(dto: AuditoriaDto): Promise<void> {
    const gimnasioId = this.resolverGimnasioId(dto.gimnasioId);
    const snapshot = this.snapshot(
      dto.valoresAntes ?? null,
      dto.valoresDespues ?? dto.metadata ?? null,
      dto.accion,
      dto.camposSensibles,
    );

    const registro = this.auditoriaRepository.create({
      usuarioId: this.serializarUsuarioId(dto.usuarioId ?? null),
      modulo: dto.modulo ?? 'legacy',
      accion: dto.accion,
      entidad: dto.entidad,
      entidadId: dto.entidadId == null ? null : String(dto.entidadId),
      tipoAccion: dto.tipoAccion ?? null,
      descripcion: dto.descripcion ?? null,
      ip: dto.ip ?? dto.ipOrigen ?? null,
      userAgent: dto.userAgent ?? null,
      metadataLegacy: this.sanitizer.sanitizar(dto.metadata ?? null, dto.camposSensibles),
      valoresAntes: snapshot.valoresAntes,
      valoresDespues: snapshot.valoresDespues,
      gimnasioId,
    });

    await this.auditoriaRepository.save(registro);
  }

  async listarConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<PaginatedData<RegistroAuditoriaReporte>> {
    const queryBuilder = this.crearQueryFiltrada(filtros);

    const paginationParams: PaginationParams = {
      page: filtros.page ?? 1,
      limit: filtros.limit ?? 50,
    };

    const resultado = await paginarQuery(queryBuilder, paginationParams);

    return {
      data: resultado.data.map((registro) => this.mapearReporte(registro)),
      pagination: resultado.pagination,
    };
  }

  async exportar(
    filtros: FiltrosAuditoria,
    formato: 'csv' | 'json',
  ): Promise<ExportarAuditoriaResultado> {
    const limite = filtros.limit ?? 1000;
    const registros = await this.crearQueryFiltrada({ ...filtros, limit: undefined })
      .take(limite)
      .getMany();
    const reportes = registros.map((registro) => this.mapearReporte(registro));
    const contenido = formato === 'json'
      ? JSON.stringify(reportes, null, 2)
      : this.convertirCsv(reportes);
    const buffer = Buffer.from(contenido, 'utf8');
    const esStream = limite > 1000;

    if (formato === 'json') {
      return {
        contenido: esStream ? Readable.from([buffer]) : buffer,
        nombreArchivo: 'auditoria.json',
        contentType: 'application/json',
        esStream,
      };
    }

    return {
      contenido: esStream ? Readable.from([buffer]) : buffer,
      nombreArchivo: 'auditoria.csv',
      contentType: 'text/csv; charset=utf-8',
      esStream,
    };
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
      .andWhere('auditoria.fecha >= :inicioMes', { inicioMes })
      .andWhere('auditoria.fecha < :finMes', { finMes })
      .andWhere("JSON_EXTRACT(auditoria.metadataLegacy, '$.tipo') = :tipo", {
        tipo: 'REPROGRAMACION',
      })
      .getCount();
  }

  private crearQueryFiltrada(
    filtros: FiltrosAuditoria,
  ): SelectQueryBuilder<AuditoriaOrmEntity> {
    const gimnasioId =
      filtros.gimnasioId === undefined
        ? this.resolverGimnasioId(undefined)
        : filtros.gimnasioId;

    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .orderBy('auditoria.fecha', filtros.orden ?? 'DESC');

    if (gimnasioId !== undefined && gimnasioId !== null) {
      queryBuilder.andWhere('auditoria.gimnasioId = :gimnasioId', { gimnasioId });
    }

    if (filtros.fechaDesde) {
      queryBuilder.andWhere('auditoria.fecha >= :fechaDesde', { fechaDesde: filtros.fechaDesde });
    }

    if (filtros.fechaHasta) {
      queryBuilder.andWhere('auditoria.fecha <= :fechaHasta', { fechaHasta: filtros.fechaHasta });
    }

    if (filtros.modulo) {
      queryBuilder.andWhere('auditoria.modulo = :modulo', { modulo: filtros.modulo });
    }

    if (filtros.accion) {
      queryBuilder.andWhere('auditoria.accion = :accion', { accion: filtros.accion });
    }

    if (filtros.entidad) {
      queryBuilder.andWhere('auditoria.entidad = :entidad', { entidad: filtros.entidad });
    }

    if (filtros.entidadId != null) {
      queryBuilder.andWhere('auditoria.entidadId = :entidadId', {
        entidadId: String(filtros.entidadId),
      });
    }

    if (filtros.usuarioId) {
      queryBuilder.andWhere('auditoria.usuarioId = :usuarioId', {
        usuarioId: String(filtros.usuarioId),
      });
    }

    return queryBuilder;
  }

  private calcularDiff(
    antes: ValorAuditoria,
    despues: ValorAuditoria,
  ): CambioAuditoria[] {
    const claves = new Set([
      ...Object.keys(antes ?? {}),
      ...Object.keys(despues ?? {}),
    ]);

    return [...claves].flatMap((campo) => {
      const valorAntes = antes?.[campo];
      const valorDespues = despues?.[campo];
      return JSON.stringify(valorAntes) === JSON.stringify(valorDespues)
        ? []
        : [{ campo, antes: valorAntes ?? null, despues: valorDespues ?? null }];
    });
  }

  private resolverGimnasioId(gimnasioId?: number | null): number | null | undefined {
    if (gimnasioId !== undefined) {
      return gimnasioId;
    }

    if (this.tenantContext?.isInitialized) {
      try {
        return this.tenantContext.gimnasioId;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private serializarUsuarioId(usuarioId: UsuarioAuditoria): string | null {
    if (usuarioId === null) {
      return null;
    }

    return String(usuarioId);
  }

  private mapearReporte(registro: AuditoriaOrmEntity): RegistroAuditoriaReporte {
    return {
      id: registro.idAuditLog,
      fecha: registro.fecha,
      gimnasioId: registro.gimnasioId,
      usuarioId: registro.usuarioId,
      modulo: registro.modulo,
      accion: registro.accion,
      entidad: registro.entidad,
      entidadId: registro.entidadId,
      tipoAccion: registro.tipoAccion,
      descripcion: registro.descripcion,
      ip: registro.ip,
      userAgent: registro.userAgent,
      valoresAntes: registro.valoresAntes,
      valoresDespues: registro.valoresDespues,
    };
  }

  private convertirCsv(registros: RegistroAuditoriaReporte[]): string {
    const encabezados = [
      'id',
      'fecha',
      'gimnasioId',
      'usuarioId',
      'modulo',
      'accion',
      'entidad',
      'entidadId',
      'descripcion',
    ];
    const filas = registros.map((registro) =>
      [
        registro.id,
        registro.fecha.toISOString(),
        registro.gimnasioId ?? '',
        registro.usuarioId ?? '',
        registro.modulo,
        registro.accion,
        registro.entidad,
        registro.entidadId ?? '',
        registro.descripcion ?? '',
      ]
        .map((valor) => this.escaparCsv(String(valor)))
        .join(','),
    );

    return [encabezados.join(','), ...filas].join('\n');
  }

  private escaparCsv(valor: string): string {
    return `"${valor.replace(/"/g, '""')}"`;
  }

  private calcularRangoMesNaturalArgentina(referencia: Date): {
    inicioMes: Date;
    finMes: Date;
  } {
    return getArgentinaMonthRange(referencia);
  }
}
