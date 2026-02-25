import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class CheckInTurnoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {}

  async execute(
    turnoId: number,
  ): Promise<{ success: boolean; estado: EstadoTurno }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
    });

    if (!turno) {
      throw new BadRequestError('Turno no encontrado');
    }

    if (
      turno.estadoTurno !== EstadoTurno.PENDIENTE &&
      turno.estadoTurno !== EstadoTurno.CONFIRMADO
    ) {
      throw new BadRequestError(
        `No se puede hacer check-in en un turno con estado ${turno.estadoTurno}`,
      );
    }

    turno.estadoTurno = EstadoTurno.PRESENTE;
    turno.checkInAt = new Date();

    await this.turnoRepository.save(turno);

    return { success: true, estado: EstadoTurno.PRESENTE };
  }
}
