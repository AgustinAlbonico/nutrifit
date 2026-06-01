import { Inject, Injectable } from '@nestjs/common';
import {
  ListProfesionalesPublicQueryDto,
  ProfesionalPublicoResponseDto,
} from 'src/application/profesionales/dtos';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

@Injectable()
export class ListProfesionalesPublicosUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    query: ListProfesionalesPublicQueryDto,
  ): Promise<ProfesionalPublicoResponseDto[]> {
    const nutricionistas = await this.nutricionistaRepository.findAll();

    const normalizedNombre = query.nombre?.trim().toLowerCase();
    const normalizedEspecialidad = query.especialidad?.trim().toLowerCase();

    const profesionalesActivos = nutricionistas
      .filter((nutricionista) => !nutricionista.fechaBaja)
      .filter((nutricionista) => {
        if (!normalizedNombre) {
          return true;
        }

        const fullName = `${nutricionista.nombre} ${nutricionista.apellido}`
          .trim()
          .toLowerCase();

        return fullName.includes(normalizedNombre);
      })
      .filter(() => {
        if (!normalizedEspecialidad) {
          return true;
        }

        return 'nutricionista'.includes(normalizedEspecialidad);
      });

    this.logger.log(
      `Listado publico de profesionales recuperado: ${profesionalesActivos.length} resultados.`,
    );

    return profesionalesActivos.map((nutricionista) => {
      const response = new ProfesionalPublicoResponseDto();
      response.idPersona = nutricionista.idPersona ?? 0;
      response.nombre = nutricionista.nombre;
      response.apellido = nutricionista.apellido;
      response.especialidad = 'Nutricionista';
      response.ciudad = nutricionista.ciudad;
      response.provincia = nutricionista.provincia;
      response.añosExperiencia = nutricionista.añosExperiencia;
      response.tarifaSesion = nutricionista.tarifaSesion;
      return response;
    });
  }
}
