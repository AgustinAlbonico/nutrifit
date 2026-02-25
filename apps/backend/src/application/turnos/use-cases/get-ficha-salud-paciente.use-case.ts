import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FichaSaludPacienteResponseDto } from 'src/application/turnos/dtos/ficha-salud-paciente-response.dto';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  SocioOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';

@Injectable()
export class GetFichaSaludPacienteUseCase implements BaseUseCase {
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
  ): Promise<FichaSaludPacienteResponseDto> {
    const nutricionista =
      await this.nutricionistaRepository.findById(nutricionistaId);

    if (!nutricionista) {
      throw new NotFoundError('Profesional', String(nutricionistaId));
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: socioId },
      relations: {
        fichaSalud: {
          alergias: true,
          patologias: true,
        },
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const hasVinculo = await this.hasTurnoVinculo(nutricionistaId, socioId);

    if (!hasVinculo) {
      throw new ForbiddenError(
        'Solo puede acceder a fichas de salud de socios con turnos asignados o historicos.',
      );
    }

    if (!socio.fichaSalud) {
      throw new NotFoundError('Ficha de salud', String(socioId));
    }

    const response = new FichaSaludPacienteResponseDto();
    response.socioId = socio.idPersona ?? 0;
    response.nombreCompleto = `${socio.nombre} ${socio.apellido}`.trim();
    response.dni = socio.dni ?? '';
    response.altura = socio.fichaSalud.altura;
    response.peso = socio.fichaSalud.peso;
    response.nivelActividadFisica = socio.fichaSalud.nivelActividadFisica;
    response.alergias = (socio.fichaSalud.alergias ?? []).map(
      (alergia) => alergia.nombre,
    );
    response.patologias = (socio.fichaSalud.patologias ?? []).map(
      (patologia) => patologia.nombre,
    );
    response.objetivoPersonal = socio.fichaSalud.objetivoPersonal ?? '';

    this.logger.log(
      `Ficha de salud consultada. Profesional=${nutricionistaId}, socio=${socioId}.`,
    );

    return response;
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
