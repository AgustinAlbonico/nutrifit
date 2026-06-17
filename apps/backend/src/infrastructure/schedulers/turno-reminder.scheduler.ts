import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { EmailService } from 'src/application/email/email.service';
import {
  RecordatorioEnviadoOrmEntity,
  TipoRecordatorio,
} from '../persistence/typeorm/entities/recordatorio-enviado.entity';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';

@Injectable()
export class TurnoReminderScheduler {
  private readonly logger = new Logger(TurnoReminderScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnosRepo: Repository<TurnoOrmEntity>,
    @InjectRepository(RecordatorioEnviadoOrmEntity)
    private readonly recordatoriosRepo: Repository<RecordatorioEnviadoOrmEntity>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(process.env.REMINDERS_CRON_EXPR ?? '0 * * * *')
  async ejecutarRecordatorios(): Promise<void> {
    const turnos = await this.cargarTurnosVigentes();

    for (const turno of turnos) {
      await this.procesarRecordatorio(turno);
    }
  }

  private async cargarTurnosVigentes(): Promise<TurnoOrmEntity[]> {
    const estadosExcluidos = [EstadoTurno.CANCELADO, EstadoTurno.AUSENTE];

    return this.turnosRepo.find({
      where: { estadoTurno: Not(In(estadosExcluidos)) },
      relations: {
        socio: { usuario: true },
        nutricionista: true,
        gimnasio: true,
      },
    });
  }

  private async procesarRecordatorio(turno: TurnoOrmEntity): Promise<void> {
    const tipo = this.definirTipoRecordatorio(turno);
    if (!tipo) return;

    const yaEnviado = await this.yaSeEnvio(turno.idTurno, tipo);
    if (yaEnviado) return;

    const email = turno.socio?.usuario?.email;
    if (!email) {
      this.logger.warn(
        `Sin email del socio para turno ${turno.idTurno}; recordatorio omitido.`,
      );
      return;
    }

    try {
      await this.emailService.enviarRecordatorio(
        {
          email,
          nombreSocio: turno.socio?.nombre ?? 'Socio',
          nombreProfesional: turno.nutricionista?.nombre ?? 'Profesional',
          fecha: turno.fechaTurno.toISOString().split('T')[0] ?? '',
          hora: turno.horaTurno,
          enlaceConfirmacion: `${process.env.FRONTEND_URL ?? ''}/turnos/${turno.idTurno}/confirmar`,
          enlaceCancelacion: `${process.env.FRONTEND_URL ?? ''}/turnos/${turno.idTurno}/cancelar`,
        },
        tipo,
      );

      await this.recordatoriosRepo.save(
        this.recordatoriosRepo.create({
          turnoId: turno.idTurno,
          tipoRecordatorio: tipo,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error enviando recordatorio para turno ${turno.idTurno}`,
        error as Error,
      );
    }
  }

  private async yaSeEnvio(
    turnoId: number,
    tipo: TipoRecordatorio,
  ): Promise<boolean> {
    const existe = await this.recordatoriosRepo.findOne({
      where: { turnoId, tipoRecordatorio: tipo },
    });
    return existe !== null;
  }

  private definirTipoRecordatorio(
    turno: TurnoOrmEntity,
  ): TipoRecordatorio | null {
    const ahora = new Date();
    const fechaStr =
      typeof turno.fechaTurno === 'string'
        ? turno.fechaTurno
        : turno.fechaTurno.toISOString().split('T')[0];
    const turnoFecha = new Date(`${fechaStr}T${turno.horaTurno}:00`);
    const diffHoras = (turnoFecha.getTime() - ahora.getTime()) / 36e5;

    if (diffHoras <= 24 && diffHoras >= 0) return TipoRecordatorio.REMINDER_24H;
    if (diffHoras <= 48 && diffHoras > 24) return TipoRecordatorio.REMINDER_48H;

    return null;
  }
}
