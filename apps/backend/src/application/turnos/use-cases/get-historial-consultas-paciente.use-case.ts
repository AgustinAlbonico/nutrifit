import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { HistorialConsultaPacienteResponseDto } from 'src/application/turnos/dtos/historial-consulta-paciente-response.dto';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  formatArgentinaDate,
  normalizeTimeToHHmm,
} from 'src/common/utils/argentina-datetime.util';
import {
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { In, Repository } from 'typeorm';

@Injectable()
export class GetHistorialConsultasPacienteUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    nutricionistaId: number,
    socioId: number,
  ): Promise<HistorialConsultaPacienteResponseDto[]> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const hasVinculo = await this.hasTurnoVinculo(nutricionistaId, socioId);

    if (!hasVinculo) {
      throw new ForbiddenError(
        'Solo puede acceder al historial de socios con turnos asignados o historicos.',
      );
    }

    const turnos = await this.turnoRepository.find({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
        },
        socio: {
          idPersona: socioId,
        },
        estadoTurno: In([EstadoTurno.REALIZADO, EstadoTurno.AUSENTE]),
      },
      relations: {
        observacionClinica: true,
      },
      order: {
        fechaTurno: 'DESC',
        horaTurno: 'DESC',
      },
    });

    this.logger.log(
      `Historial de consultas consultado. Profesional=${nutricionistaId}, socio=${socioId}, resultados=${turnos.length}.`,
    );

    return turnos.map((turno) => {
      const response = new HistorialConsultaPacienteResponseDto();
      response.idTurno = turno.idTurno;
      response.fechaTurno = formatArgentinaDate(turno.fechaTurno);
      response.horaTurno = normalizeTimeToHHmm(turno.horaTurno);
      response.estadoTurno = turno.estadoTurno;
      response.tipoConsulta = 'Consulta nutricional';
      response.notasProfesional = turno.observacionClinica?.comentario ?? null;
      response.sugerencias = turno.observacionClinica?.sugerencias ?? null;
      response.esPublica = turno.observacionClinica?.esPublica ?? false;
      response.archivosAdjuntos = [];
      return response;
    });
  }

  private async hasTurnoVinculo(
    nutricionistaId: number,
    socioId: number,
  ): Promise<boolean> {
    const totalTurnos = await this.turnoRepository.count({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
        },
        socio: {
          idPersona: socioId,
        },
      },
    });

    return totalTurnos > 0;
  }
}
