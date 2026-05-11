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
    const estadosExcluidos = [EstadoTurno.CANCELADO, EstadoTurno.AUSENTE];
    const turnos = await this.turnosRepo.find({
      where: { estadoTurno: Not(In(estadosExcluidos)) },
      relations: { socio: true, nutricionista: true },
    });
    for (const turno of turnos) {
      const tipo = this.definirTipoRecordatorio(turno);
      if (!tipo) continue;
      const existe = await this.recordatoriosRepo.findOne({
        where: { turnoId: turno.idTurno, tipoRecordatorio: tipo },
      });
      if (existe) continue;
      try {
        await this.emailService.enviarRecordatorio(
          {
            email: (turno.socio as any)?.usuario?.email ?? '',
            nombreSocio: turno.socio?.nombre ?? 'Socio',
            nombreProfesional: turno.nutricionista?.nombre ?? 'Profesional',
            fecha: turno.fechaTurno.toISOString().split('T')[0],
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
  }

  private definirTipoRecordatorio(
    turno: TurnoOrmEntity,
  ): TipoRecordatorio | null {
    const ahora = new Date();
    const turnoFecha = new Date(
      `${turno.fechaTurno.toISOString().split('T')[0]}T${turno.horaTurno}:00`,
    );
    const diffHoras = (turnoFecha.getTime() - ahora.getTime()) / 36e5;
    if (diffHoras <= 24 && diffHoras >= 0) return TipoRecordatorio.REMINDER_24H;
    if (diffHoras <= 48 && diffHoras > 24) return TipoRecordatorio.REMINDER_48H;
    return null;
  }
}
