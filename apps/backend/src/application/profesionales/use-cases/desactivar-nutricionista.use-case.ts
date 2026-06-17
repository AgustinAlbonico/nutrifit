import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
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
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { getArgentinaTodayDate } from 'src/common/utils/argentina-datetime.util';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';

@Injectable()
export class DesactivarNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaOrmRepository: Repository<NutricionistaOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoOrmRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioOrmRepository: Repository<UsuarioOrmEntity>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(
    id: number,
    motivo: string,
    usuarioId?: number,
  ): Promise<{ turnosCancelados: number; sociosAfectados: number }> {
    const nutricionista = await this.nutricionistaRepository.findById(id);
    if (!nutricionista) {
      this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
      throw new NotFoundError('Nutricionista no encontrado.');
    }

    const nutriUsuario = await this.usuarioOrmRepository.findOne({
      where: { email: nutricionista.email },
    });
    if (!nutriUsuario?.idUsuario) {
      this.logger.warn(
        `Usuario (email: ${nutricionista.email}) no encontrado para nutricionista ${id}.`,
      );
      throw new NotFoundError('Usuario del nutricionista no encontrado.');
    }
    const nutriUsuarioId = nutriUsuario.idUsuario;

    const today = getArgentinaTodayDate();

    const turnosFuturos = await this.turnoOrmRepository
      .createQueryBuilder('turno')
      .innerJoinAndSelect('turno.socio', 'socio')
      .leftJoinAndSelect('socio.usuario', 'usuario_socio')
      .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
      .leftJoinAndSelect('nutricionista.usuario', 'usuario_nutri')
      .where('nutricionista.idPersona = :id', { id })
      .andWhere('turno.fechaTurno >= :today', { today })
      .andWhere('turno.estadoTurno NOT IN (:...estadosNoActivos)', {
        estadosNoActivos: [
          EstadoTurno.CANCELADO,
          EstadoTurno.REALIZADO,
          EstadoTurno.AUSENTE,
        ],
      })
      .getMany();

    const sociosAfectados = new Set<number>();

    for (const turno of turnosFuturos) {
      turno.estadoTurno = EstadoTurno.CANCELADO;
      turno.motivoCancelacion = `Nutricionista desactivado: ${motivo}`;
      await this.turnoOrmRepository.save(turno);

      const socioUsuarioId = turno.socio?.usuario?.idUsuario;
      if (socioUsuarioId) {
        sociosAfectados.add(turno.socio.idPersona!);

        await this.notificacionesService.crear({
          destinatarioId: socioUsuarioId,
          tipo: TipoNotificacion.TURNO_CANCELADO,
          titulo: 'Turno cancelado',
          mensaje: `Tu turno con ${nutricionista.nombre} ${nutricionista.apellido} del ${turno.fechaTurno} a las ${turno.horaTurno} fue cancelado porque el profesional fue desactivado.`,
          metadata: { turnoId: turno.idTurno },
        });
      }

      await this.notificacionesService.crear({
        destinatarioId: nutriUsuarioId,
        tipo: TipoNotificacion.TURNO_CANCELADO,
        titulo: 'Turno cancelado por desactivación',
        mensaje: `Tu turno del ${turno.fechaTurno} a las ${turno.horaTurno} fue cancelado porque tu cuenta fue desactivada.`,
        metadata: { turnoId: turno.idTurno },
      });
    }

    await this.nutricionistaOrmRepository.update(id, {
      fechaBaja: new Date(),
    });

    await this.notificacionesService.crear({
      destinatarioId: nutriUsuarioId,
      tipo: TipoNotificacion.NUTRICIONISTA_DESACTIVADO,
      titulo: 'Cuenta desactivada',
      mensaje: `Tu cuenta de nutricionista fue desactivada. Motivo: ${motivo}.`,
      metadata: { rutaNavegacion: '/nutricionistas' },
    });

    this.logger.log(
      `Nutricionista ${id} desactivado. ${turnosFuturos.length} turnos cancelados, ${sociosAfectados.size} socios afectados.`,
    );

    return {
      turnosCancelados: turnosFuturos.length,
      sociosAfectados: sociosAfectados.size,
    };
  }
}
