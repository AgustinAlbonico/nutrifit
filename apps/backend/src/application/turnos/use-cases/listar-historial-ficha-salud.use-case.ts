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
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

/**
 * Lista el historial de versiones inmutables de la ficha de salud
 * del socio autenticado.
 *
 * RBs: RB50 (historial).
 */
@Injectable()
export class ListarHistorialFichaSaludSocioUseCase implements BaseUseCase {
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

  async execute(userId: number): Promise<HistorialFichaSaludItemDto[]> {
    const socio = await this.resolveSocioByUserId(userId);

    if (!socio.fichaSalud) {
      throw new NotFoundError('No se encontraron fichas de salud');
    }

    const versiones = await this.fichaSaludVersionRepository.findByFichaId(
      socio.fichaSalud.idFichaSalud ?? 0,
    );

    this.logger.log(
      `Historial de ficha de salud listado para socio ${socio.idPersona}. Versiones=${versiones.length}.`,
    );

    return versiones.map((v) => ({
      version: v.version,
      versionId: v.idFichaSaludVersion ?? 0,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
    }));
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
