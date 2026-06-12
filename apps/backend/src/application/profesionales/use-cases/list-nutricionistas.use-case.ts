import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

@Injectable()
export class ListNutricionistasUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(): Promise<NutricionistaEntity[]> {
    const nutricionistas = await this.nutricionistaRepository.findAll();

    const rol = this.tenantContext.rol;
    if (rol === Rol.ADMIN || rol === Rol.SUPERADMIN) {
      this.logger.log(
        `Se recuperaron ${nutricionistas.length} nutricionistas de la base de datos.`,
      );
      return nutricionistas;
    }

    const gimnasioId = this.tenantContext.gimnasioId;
    const filtrados =
      gimnasioId === null
        ? []
        : nutricionistas.filter((n) => n.gimnasioId === gimnasioId);

    this.logger.log(
      `Se recuperaron ${filtrados.length} nutricionistas del gimnasio ${gimnasioId}.`,
    );

    return filtrados;
  }
}
