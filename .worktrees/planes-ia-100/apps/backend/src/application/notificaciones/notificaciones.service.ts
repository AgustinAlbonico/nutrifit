import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { EstadoNotificacion } from 'src/domain/entities/Notificacion/estado-notificacion.enum';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import type { NotificacionMetaData } from 'src/domain/entities/Notificacion/notificacion-metadata.interface';
import { NotificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/notificacion.entity';

interface CrearNotificacionInput {
  destinatarioId: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  metadata?: NotificacionMetaData;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(NotificacionOrmEntity)
    private readonly repositorio: Repository<NotificacionOrmEntity>,
  ) {}

  async crear(input: CrearNotificacionInput): Promise<NotificacionOrmEntity> {
    const notificacion = this.repositorio.create({
      ...input,
      estado: EstadoNotificacion.NO_LEIDA,
      leidaEn: null,
      metadata: input.metadata ?? null,
    });
    return this.repositorio.save(notificacion);
  }

  async listar(
    usuarioId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: NotificacionOrmEntity[]; total: number }> {
    const [data, total] = await this.repositorio.findAndCount({
      where: { destinatarioId: usuarioId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async contarNoLeidas(usuarioId: number): Promise<number> {
    return this.repositorio.count({
      where: { destinatarioId: usuarioId, estado: EstadoNotificacion.NO_LEIDA },
    });
  }

  async marcarLeida(
    usuarioId: number,
    notificacionId: number,
  ): Promise<NotificacionOrmEntity> {
    const notificacion = await this.repositorio.findOne({
      where: { idNotificacion: notificacionId },
    });
    if (!notificacion)
      throw new NotFoundException('Notificación no encontrada');
    if (notificacion.destinatarioId !== usuarioId)
      throw new ForbiddenException('No tenés permisos para esta notificación');
    if (notificacion.estado === EstadoNotificacion.LEIDA) return notificacion;
    notificacion.estado = EstadoNotificacion.LEIDA;
    notificacion.leidaEn = new Date();
    return this.repositorio.save(notificacion);
  }

  async marcarTodasLeidas(usuarioId: number): Promise<number> {
    const result = await this.repositorio.update(
      { destinatarioId: usuarioId, estado: EstadoNotificacion.NO_LEIDA },
      { estado: EstadoNotificacion.LEIDA, leidaEn: new Date() },
    );
    return result.affected ?? 0;
  }

  async listarAdmin(filtros: {
    destinatarioId?: number;
    tipo?: TipoNotificacion;
    estado?: EstadoNotificacion;
    desde?: Date;
    hasta?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: NotificacionOrmEntity[]; total: number }> {
    const where: FindOptionsWhere<NotificacionOrmEntity> = {};
    if (filtros.destinatarioId !== undefined) {
      where.destinatarioId = filtros.destinatarioId;
    }
    if (filtros.tipo !== undefined) {
      where.tipo = filtros.tipo;
    }
    if (filtros.estado !== undefined) {
      where.estado = filtros.estado;
    }
    if (filtros.desde) {
      where.createdAt = MoreThanOrEqual(filtros.desde);
    }
    if (filtros.hasta) {
      where.createdAt = LessThanOrEqual(filtros.hasta);
    }

    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 50;
    const [data, total] = await this.repositorio.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
