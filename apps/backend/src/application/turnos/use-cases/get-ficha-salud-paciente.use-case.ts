import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { AbrirFichaDesdeTurnoUseCase } from 'src/application/turnos/use-cases/abrir-ficha-desde-turno.use-case';
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
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class GetFichaSaludPacienteUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    private readonly abrirFichaDesdeTurnoUseCase: AbrirFichaDesdeTurnoUseCase,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
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
      where: { idPersona: socioId, gimnasioId: this.tenantContext.gimnasioId },
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

    // RB45: delegar en AbrirFichaDesdeTurnoUseCase (single source of truth).
    // Encontramos un turno previo entre (nutricionistaId, socioId) para pasar
    // su idTurno al use case. Esto agrega 1 query, aceptada por el diseno.
    const turnoPrevio = await this.turnoRepository.findOne({
      where: {
        nutricionista: {
          idPersona: nutricionistaId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        socio: { idPersona: socioId },
      },
      order: { idTurno: 'DESC' },
    });

    if (turnoPrevio) {
      await this.abrirFichaDesdeTurnoUseCase.execute({
        turnoId: turnoPrevio.idTurno,
        nutricionistaId,
        socioId,
      });
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
          gimnasioId: this.tenantContext.gimnasioId,
        },
        socio: {
          idPersona: socioId,
        },
      },
    });

    return totalTurnos > 0;
  }
}
