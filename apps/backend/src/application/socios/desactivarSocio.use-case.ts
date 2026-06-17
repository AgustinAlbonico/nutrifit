import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  NotFoundError,
  ConflictError,
} from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { Repository, IsNull } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { getArgentinaTodayDate } from 'src/common/utils/argentina-datetime.util';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';

export interface DesactivarSocioResultado {
  turnosCancelados: number;
  nutricionistasAfectados: number;
  tienePlanActivo: boolean;
}

@Injectable()
export class DesactivarSocioUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @InjectRepository(SocioOrmEntity)
    private readonly socioOrmRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoOrmRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioOrmRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planOrmRepository: Repository<PlanAlimentacionOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(
    id: number,
    motivo: string,
    usuarioId?: number,
  ): Promise<DesactivarSocioResultado> {
    const socio = await this.socioRepository.findById(id);
    if (!socio) {
      this.logger.warn(`Socio con ID ${id} no encontrado.`);
      throw new NotFoundError('Socio no encontrado.');
    }

    if (socio.fechaBaja) {
      throw new ConflictError('El socio ya se encuentra dado de baja.');
    }

    const socioUsuario = await this.usuarioOrmRepository.findOne({
      where: { persona: { idPersona: id } },
    });
    const socioUsuarioId = socioUsuario?.idUsuario ?? null;

    const today = getArgentinaTodayDate();

    const turnosFuturos = await this.turnoOrmRepository
      .createQueryBuilder('turno')
      .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('nutricionista.usuario', 'usuario_nutri')
      .where('turno.socio.idPersona = :id', { id })
      .andWhere('turno.fechaTurno >= :today', { today })
      .andWhere('turno.estadoTurno NOT IN (:...estadosNoActivos)', {
        estadosNoActivos: [
          EstadoTurno.CANCELADO,
          EstadoTurno.REALIZADO,
          EstadoTurno.AUSENTE,
        ],
      })
      .getMany();

    const nutricionistasAfectados = new Set<number>();

    for (const turno of turnosFuturos) {
      turno.estadoTurno = EstadoTurno.CANCELADO;
      turno.motivoCancelacion = `Socio desactivado: ${motivo}`;
      await this.turnoOrmRepository.save(turno);

      const nutriUsuarioId = turno.nutricionista?.usuario?.idUsuario;
      if (nutriUsuarioId) {
        nutricionistasAfectados.add(turno.nutricionista.idPersona!);

        await this.notificacionesService.crear({
          destinatarioId: nutriUsuarioId,
          tipo: TipoNotificacion.TURNO_CANCELADO,
          titulo: 'Turno cancelado',
          mensaje: `El turno del ${turno.fechaTurno} a las ${turno.horaTurno} fue cancelado porque el socio fue dado de baja. Motivo: ${motivo}.`,
          metadata: { turnoId: turno.idTurno, rutaNavegacion: '/turnos' },
        });
      }
    }

    const planActivo = await this.planOrmRepository.findOne({
      where: {
        socio: { idPersona: id },
        activo: true,
        eliminadoEn: IsNull(),
      },
    });
    const tienePlanActivo = planActivo !== null;

    await this.socioOrmRepository.update(id, {
      fechaBaja: new Date(),
    });

    if (socioUsuarioId) {
      await this.notificacionesService.crear({
        destinatarioId: socioUsuarioId,
        tipo: TipoNotificacion.SOCIO_DESACTIVADO,
        titulo: 'Tu cuenta fue desactivada',
        mensaje: `Tu cuenta de socio fue desactivada. Motivo: ${motivo}. Si crees que es un error, contactanos.`,
        metadata: { rutaNavegacion: '/login' },
      });
    }

    this.logger.log(
      `Socio ${id} desactivado. ${turnosFuturos.length} turnos cancelados, ${nutricionistasAfectados.size} nutricionistas notificados, plan activo: ${tienePlanActivo}.`,
    );

    return {
      turnosCancelados: turnosFuturos.length,
      nutricionistasAfectados: nutricionistasAfectados.size,
      tienePlanActivo,
    };
  }
}
