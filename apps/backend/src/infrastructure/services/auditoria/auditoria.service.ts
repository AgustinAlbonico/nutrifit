import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditoriaOrmEntity,
  AccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

export interface AuditoriaDto {
  usuarioId?: number | null;
  accion: AccionAuditoria;
  entidad: string;
  entidadId?: number | null;
  ipOrigen?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface FiltrosAuditoria {
  fechaDesde?: Date;
  fechaHasta?: Date;
  accion?: AccionAuditoria;
  entidad?: string;
  usuarioId?: number;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaOrmEntity)
    private readonly auditoriaRepository: Repository<AuditoriaOrmEntity>,
  ) {}

  async registrar(dto: AuditoriaDto): Promise<void> {
    const registro = this.auditoriaRepository.create({
      usuarioId: dto.usuarioId,
      accion: dto.accion,
      entidad: dto.entidad,
      entidadId: dto.entidadId,
      ipOrigen: dto.ipOrigen ?? null,
      userAgent: dto.userAgent ?? null,
      metadata: dto.metadata ?? null,
    });

    await this.auditoriaRepository.save(registro);
  }

  async listarConFiltros(
    filtros: FiltrosAuditoria,
  ): Promise<AuditoriaOrmEntity[]> {
    const queryBuilder = this.auditoriaRepository
      .createQueryBuilder('auditoria')
      .orderBy('auditoria.timestamp', 'DESC')
      .take(500);

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

    return queryBuilder.getMany();
  }
}
