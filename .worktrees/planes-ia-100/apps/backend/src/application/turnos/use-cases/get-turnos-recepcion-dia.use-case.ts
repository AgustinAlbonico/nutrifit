import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RecepcionTurnoResponseDto } from 'src/application/turnos/dtos/recepcion-turno-response.dto';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  getArgentinaTodayDate,
} from 'src/common/utils/argentina-datetime.util';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class GetTurnosRecepcionDiaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(fecha?: string): Promise<RecepcionTurnoResponseDto[]> {
    const targetDate = fecha || getArgentinaTodayDate();

    const queryBuilder = this.turnoRepository
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.socio', 'socio')
      .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
      .where('DATE(turno.fechaTurno) = :targetDate', { targetDate })
      .andWhere('turno.estadoTurno IN (:...estados)', {
        estados: ['PROGRAMADO', 'PRESENTE', 'EN_CURSO'],
      })
      .orderBy('turno.horaTurno', 'ASC');

    const turnos = await queryBuilder.getMany();

    this.logger.log(
      `Turnos de recepcion consultados para fecha ${targetDate}: ${turnos.length} resultados.`,
    );

    return turnos.map((turno) => {
      const response = new RecepcionTurnoResponseDto();
      response.idTurno = turno.idTurno;
      response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
      response.horaTurno = turno.horaTurno;
      response.estadoTurno = turno.estadoTurno;
      response.nombreSocio = turno.socio
        ? `${turno.socio.nombre} ${turno.socio.apellido}`.trim()
        : 'Sin socio asignado';
      response.nombreNutricionista =
        `${turno.nutricionista.nombre} ${turno.nutricionista.apellido}`.trim();
      response.dniSocio = turno.socio?.dni ?? '';

      return response;
    });
  }
}
