import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { ContextoPaciente } from '@nutrifit/shared';

@Injectable()
export class PrepararContextoPacienteUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(socioId: number): Promise<ContextoPaciente> {
    // 1. Validar que el socio existe
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

    // 2. Validar que el socio tiene ficha de salud
    if (!socio.fichaSalud) {
      throw new BadRequestError(
        'El paciente debe completar su ficha de salud para poder generar recomendaciones de alimentación.',
      );
    }

    // 3. Transformar a ContextoPaciente (datos anonimizados)
    const contextoPaciente: ContextoPaciente = {
      socioId: socio.idPersona ?? 0,
      peso: socio.fichaSalud.peso,
      altura: socio.fichaSalud.altura,
      objetivoPersonal:
        socio.fichaSalud.objetivoPersonal ?? 'Sin objetivo definido',
      nivelActividadFisica: this.convertirNivelActividadFisica(
        socio.fichaSalud.nivelActividadFisica,
      ),
      alergias: (socio.fichaSalud.alergias ?? []).map(
        (alergia) => alergia.nombre,
      ),
      patologias: (socio.fichaSalud.patologias ?? []).map(
        (patologia) => patologia.nombre,
      ),
      restriccionesAlimentarias:
        socio.fichaSalud.restriccionesAlimentarias ?? null,
      frecuenciaComidas: this.convertirFrecuenciaComidas(
        socio.fichaSalud.frecuenciaComidas,
      ),
      consumoAguaDiario: socio.fichaSalud.consumoAguaDiario,
      consumoAlcohol: this.convertirConsumoAlcohol(
        socio.fichaSalud.consumoAlcohol,
      ),
      fumaTabaco: socio.fichaSalud.fumaTabaco,
      horasSueno: socio.fichaSalud.horasSueno,
      medicamentosActuales: socio.fichaSalud.medicacionActual ?? null,
      suplementosActuales: socio.fichaSalud.suplementosActuales ?? null,
      cirugiasPrevias: socio.fichaSalud.cirugiasPrevias ?? null,
      antecedentesFamiliares: socio.fichaSalud.antecedentesFamiliares ?? null,
    };

    this.logger.log(
      `Contexto de paciente preparado para IA. Socio=${socioId}. Datos anonimizados listos para prompt.`,
    );

    return contextoPaciente;
  }

  /**
   * Convierte NivelActividadFisica enum a string
   */
  private convertirNivelActividadFisica(
    nivelActividadFisica: 'Sedentario' | 'Moderado' | 'Intenso' | 'Bajo',
  ): string {
    switch (nivelActividadFisica) {
      case 'Sedentario':
        return 'SEDENTARIO';
      case 'Moderado':
        return 'MODERADO';
      case 'Intenso':
        return 'ALTO';
      case 'Bajo':
        return 'BAJO';
      default:
        return 'SEDENTARIO';
    }
  }

  /**
   * Convierte FrecuenciaComidas enum a string
   */
  private convertirFrecuenciaComidas(
    frecuenciaComidas:
      | '1-2 comidas'
      | '3 comidas'
      | '4-5 comidas'
      | '6 o más comidas'
      | null,
  ): string | null {
    if (!frecuenciaComidas) return null;

    switch (frecuenciaComidas) {
      case '1-2 comidas':
        return '1';
      case '3 comidas':
        return '3';
      case '4-5 comidas':
        return '4';
      case '6 o más comidas':
        return '5+';
      default:
        return '3';
    }
  }

  /**
   * Convierte ConsumoAlcohol enum a string
   */
  private convertirConsumoAlcohol(
    consumoAlcohol: 'Nunca' | 'Ocasional' | 'Moderado' | 'Frecuente' | null,
  ): string | null {
    if (!consumoAlcohol) return null;

    switch (consumoAlcohol) {
      case 'Nunca':
        return 'NUNCA';
      case 'Ocasional':
        return 'OCCASIONAL';
      case 'Moderado':
        return 'FRECUENTE';
      case 'Frecuente':
        return 'FRECUENTE';
      default:
        return 'NUNCA';
    }
  }
}
