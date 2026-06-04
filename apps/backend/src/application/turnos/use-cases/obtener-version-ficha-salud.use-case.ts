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
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

/**
 * Devuelve los datos completos de una versión específica de la ficha
 * de salud del socio autenticado.
 *
 * RBs: RB50 (historial inmutable).
 */
@Injectable()
export class ObtenerVersionFichaSaludSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @Inject(FICHA_SALUD_VERSION_REPOSITORY)
    private readonly fichaSaludVersionRepository: FichaSaludVersionRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    userId: number,
    n: number,
  ): Promise<DatosVersionFichaSaludDto> {
    if (!Number.isInteger(n) || n < 1) {
      throw new NotFoundError('Versión no encontrada');
    }

    const socio = await this.resolveSocioByUserId(userId);

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
      `Versión ${n} de ficha de salud consultada para socio ${socio.idPersona}.`,
    );

    return {
      version: version.version,
      createdAt: version.createdAt,
      datos: version.datosJson,
    };
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: { persona: true },
    });

    const personaId = user?.persona?.idPersona;
    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: {
        idPersona: personaId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      relations: { fichaSalud: true },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }
}
