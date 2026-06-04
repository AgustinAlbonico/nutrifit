import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { HistorialFichaSaludItemDto } from 'src/application/turnos/dtos/historial-ficha-salud.dto';
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
 * Lista el historial de versiones inmutables de la ficha de salud
 * de un socio, accesible solo por un nutricionista con turno previo
 * o histórico con ese socio (RB13).
 *
 * RBs: RB13 (vincular nutricionista-socio por turno), RB50.
 */
@Injectable()
export class ListarHistorialFichaSaludNutricionistaUseCase
  implements BaseUseCase
{
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
  ): Promise<HistorialFichaSaludItemDto[]> {
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

    const versiones =
      await this.fichaSaludVersionRepository.findByFichaId(
        socio.fichaSalud.idFichaSalud ?? 0,
      );

    this.logger.log(
      `Historial de ficha de salud listado por nutricionista ${nutricionistaId} para socio ${socioId}. Versiones=${versiones.length}.`,
    );

    return versiones.map((v) => ({
      version: v.version,
      versionId: v.idFichaSaludVersion ?? 0,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    }));
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
