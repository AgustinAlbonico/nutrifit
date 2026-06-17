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
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from 'src/domain/entities/Usuario/usuario.repository';

@Injectable()
export class GetMiPerfilNutricionistaUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
  ) {}

  async execute(usuarioId: number): Promise<NutricionistaEntity> {
    const idPersona =
      await this.usuarioRepository.findPersonaIdByUserId(usuarioId);

    if (!idPersona) {
      this.logger.warn(
        `El usuario ${usuarioId} no tiene una persona asociada.`,
      );
      throw new NotFoundError('No tenés un perfil de nutricionista asociado.');
    }

    const nutricionista =
      await this.nutricionistaRepository.findById(idPersona);
    if (!nutricionista) {
      this.logger.warn(
        `El usuario ${usuarioId} (persona ${idPersona}) no es un nutricionista válido.`,
      );
      throw new NotFoundError('No tenés un perfil de nutricionista asociado.');
    }

    return nutricionista;
  }
}
