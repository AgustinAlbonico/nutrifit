import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { FichaSaludSocioResponseDto } from 'src/application/turnos/dtos';
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
import { Repository } from 'typeorm';

@Injectable()
export class GetFichaSaludSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepository: Repository<UsuarioOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(userId: number): Promise<FichaSaludSocioResponseDto | null> {
    const socio = await this.resolveSocioByUserId(userId);

    if (!socio.fichaSalud) {
      this.logger.log(
        `Socio ${socio.idPersona} no tiene ficha de salud cargada.`,
      );
      return null;
    }

    const response = new FichaSaludSocioResponseDto();
    response.socioId = socio.idPersona ?? 0;
    response.fichaSaludId = socio.fichaSalud.idFichaSalud ?? 0;
    response.altura = socio.fichaSalud.altura;
    response.peso = socio.fichaSalud.peso;
    response.nivelActividadFisica = socio.fichaSalud.nivelActividadFisica;
    response.alergias = (socio.fichaSalud.alergias ?? []).map(
      (item) => item.nombre,
    );
    response.patologias = (socio.fichaSalud.patologias ?? []).map(
      (item) => item.nombre,
    );
    response.objetivoPersonal = socio.fichaSalud.objetivoPersonal ?? '';
    // --- Medicación y suplementos ---
    response.medicacionActual = socio.fichaSalud.medicacionActual;
    response.suplementosActuales = socio.fichaSalud.suplementosActuales;
    // --- Historial médico ---
    response.cirugiasPrevias = socio.fichaSalud.cirugiasPrevias;
    response.antecedentesFamiliares = socio.fichaSalud.antecedentesFamiliares;
    // --- Hábitos alimentarios ---
    response.frecuenciaComidas = socio.fichaSalud.frecuenciaComidas;
    response.consumoAguaDiario = socio.fichaSalud.consumoAguaDiario;
    response.restriccionesAlimentarias =
      socio.fichaSalud.restriccionesAlimentarias;
    // --- Hábitos de vida ---
    response.consumoAlcohol = socio.fichaSalud.consumoAlcohol;
    response.fumaTabaco = socio.fichaSalud.fumaTabaco ?? false;
    response.horasSueno = socio.fichaSalud.horasSueno;
    // --- Contacto de emergencia ---
    response.contactoEmergenciaNombre =
      socio.fichaSalud.contactoEmergenciaNombre;
    response.contactoEmergenciaTelefono =
      socio.fichaSalud.contactoEmergenciaTelefono;

    return response;
  }

  private async resolveSocioByUserId(userId: number): Promise<SocioOrmEntity> {
    const user = await this.usuarioRepository.findOne({
      where: { idUsuario: userId },
      relations: {
        persona: true,
      },
    });

    const personaId = user?.persona?.idPersona;

    if (!personaId) {
      throw new ForbiddenError(
        'El usuario autenticado no tiene un socio asociado.',
      );
    }

    const socio = await this.socioRepository.findOne({
      where: { idPersona: personaId },
      relations: {
        fichaSalud: {
          alergias: true,
          patologias: true,
        },
      },
    });

    if (!socio) {
      throw new NotFoundError('Socio', String(personaId));
    }

    return socio;
  }
}
