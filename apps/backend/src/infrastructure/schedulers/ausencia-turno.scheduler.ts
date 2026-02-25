import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { EnvironmentConfigService } from '../config/environment-config/environment-config.service';

@Injectable()
export class AusenciaTurnoScheduler {
  private readonly logger = new Logger(AusenciaTurnoScheduler.name);

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    private readonly configService: EnvironmentConfigService,
  ) {}

  @Cron('*/5 * * * *')
  async marcarAusentesAutomaticos(): Promise<void> {
    this.logger.log('Ejecutando verificación de turnos ausentes...');

    const umbralMinutos = this.configService.getAusenciaUmbralMinutos();
    const ahora = new Date();
    const fechaHoy = ahora.toISOString().split('T')[0];

    const turnos = await this.turnoRepository
      .createQueryBuilder('turno')
      .where('turno.fechaTurno = :fecha', { fecha: fechaHoy })
      .andWhere('turno.estadoTurno IN (:...estados)', {
        estados: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO],
      })
      .getMany();

    for (const turno of turnos) {
      const [hora, minuto] = turno.horaTurno.split(':').map(Number);
      const turnoTime = new Date(ahora);
      turnoTime.setHours(hora, minuto + umbralMinutos, 0, 0);

      if (ahora > turnoTime) {
        turno.estadoTurno = EstadoTurno.AUSENTE;
        turno.ausenteAt = ahora;
        await this.turnoRepository.save(turno);
        this.logger.log(`Turno ${turno.idTurno} marcado como AUSENTE`);
      }
    }
  }
}
