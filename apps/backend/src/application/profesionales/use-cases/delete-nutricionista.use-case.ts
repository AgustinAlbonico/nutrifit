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
import {
  ConflictError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { Repository } from 'typeorm';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { getArgentinaTodayDate } from 'src/common/utils/argentina-datetime.util';

@Injectable()
export class DeleteNutricionistaUseCase implements BaseUseCase {
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
  ) {}

  async execute(id: number): Promise<void> {
    // Find existing nutricionista
    const nutricionista = await this.nutricionistaRepository.findById(id);
    if (!nutricionista) {
      this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
      throw new NotFoundError('Nutricionista no encontrado.');
    }

    const today = getArgentinaTodayDate();

    const totalTurnosFuturosActivos = await this.turnoOrmRepository
      .createQueryBuilder('turno')
      .innerJoin('turno.nutricionista', 'nutricionista')
      .where('nutricionista.idPersona = :id', { id })
      .andWhere('turno.fechaTurno >= :today', { today })
      .andWhere('turno.estadoTurno != :estadoCancelado', {
        estadoCancelado: EstadoTurno.CANCELADO,
      })
      .getCount();

    if (totalTurnosFuturosActivos > 0) {
      throw new ConflictError(
        'No se puede dar de baja al profesional porque tiene turnos futuros activos.',
      );
    }

    // Soft delete: marcar fecha de baja
    await this.nutricionistaOrmRepository.update(id, {
      fechaBaja: new Date(),
    });

    this.logger.log(`Nutricionista ${id} dado de baja exitosamente.`);
  }
}
