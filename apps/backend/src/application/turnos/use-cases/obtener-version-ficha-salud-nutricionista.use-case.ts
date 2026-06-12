import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { DatosVersionFichaSaludDto } from 'src/application/turnos/dtos/datos-version-ficha-salud.dto';
import {
  FICHA_SALUD_VERSION_REPOSITORY,
  FichaSaludVersionRepository,
} from 'src/domain/entities/FichaSalud/ficha-salud-version.repository';
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

/**
 * Devuelve los datos completos de una versión específica de la ficha
 * de salud de un socio, accesible solo por un nutricionista con
 * turno previo o histórico con ese socio (RB13).
 *
 * RBs: RB13 (vincular nutricionista-socio por turno), RB50.
 */
@Injectable()
export class ObtenerVersionFichaSaludNutricionistaUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
    @Inject(FICHA_SALUD_VERSION_REPOSITORY)
    private readonly fichaSaludVersionRepository: FichaSaludVersionRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaId: number,
    socioId: number,
    n: number,
  ): Promise<DatosVersionFichaSaludDto> {
    if (!Number.isInteger(n) || n < 1) {
      throw new NotFoundError('Versión no encontrada');
    }

    const socio = await this.socioRepository.findOne({
      where: {
        idPersona: socioId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      relations: { fichaSalud: true },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const hasVinculo = await this.hasTurnoVinculo(nutricionistaId, socioId);
    if (!hasVinculo) {
      throw new ForbiddenError('No tiene vínculo con este socio');
    }

    if (!socio.fichaSalud) {
      throw new NotFoundError('No se encontraron fichas de salud');
    }

    const version =
      await this.fichaSaludVersionRepository.findByFichaIdAndVersion(
        socio.fichaSalud.idFichaSalud ?? 0,
        n,
      );

    if (!version) {
      throw new NotFoundError('Versión no encontrada');
    }

    this.logger.log(
      `Versión ${n} de ficha consultada por nutricionista ${nutricionistaId} para socio ${socioId}.`,
    );

    return {
      version: version.version,
      createdAt: version.createdAt,
      datos: version.datosJson,
    };
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
