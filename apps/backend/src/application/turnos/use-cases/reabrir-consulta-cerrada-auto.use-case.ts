import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { ForbiddenError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ReabrirConsultaCerradaAutoUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {}

  async execute(turnoId: number, nutricionistaId: number): Promise<{ success: boolean; estado: string }> {
    const turno = await this.turnoRepository.findOne({
      where: { idTurno: turnoId },
      relations: { nutricionista: true },
    });

    if (!turno) {
      throw new NotFoundError('Turno no encontrado');
    }

    if (turno.nutricionista.idPersona !== nutricionistaId) {
      throw new ForbiddenError('No tenés permiso para reabrir este turno');
    }

    if (turno.estadoTurno !== EstadoTurno.REALIZADO) {
      throw new ConflictError(
        `No se puede reabrir: el turno debe estar REALIZADO, actual: ${turno.estadoTurno}`,
      );
    }

    if (!turno.cierreAutomatico) {
      throw new ConflictError(
        'No se puede reabrir: el turno no fue cerrado automáticamente',
      );
    }

    turno.estadoTurno = EstadoTurno.EN_CURSO;
    turno.reabiertaPorCierreAuto = true;

    await this.turnoRepository.save(turno);

    return { success: true, estado: EstadoTurno.EN_CURSO };
  }
}
