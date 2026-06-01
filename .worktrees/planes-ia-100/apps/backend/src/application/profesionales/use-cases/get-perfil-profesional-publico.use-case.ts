import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  HorarioProfesionalPublicoDto,
  PerfilProfesionalPublicoResponseDto,
} from 'src/application/profesionales/dtos';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

@Injectable()
export class GetPerfilProfesionalPublicoUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(id: number): Promise<PerfilProfesionalPublicoResponseDto> {
    const nutricionista = await this.nutricionistaRepository.findById(id);

    if (!nutricionista || nutricionista.fechaBaja) {
      throw new NotFoundError('Profesional', String(id));
    }

    this.logger.log(`Perfil publico consultado para profesional ${id}.`);

    const response = new PerfilProfesionalPublicoResponseDto();
    response.idPersona = nutricionista.idPersona ?? 0;
    response.nombre = nutricionista.nombre;
    response.apellido = nutricionista.apellido;
    response.especialidad = 'Nutricionista';
    response.ciudad = nutricionista.ciudad;
    response.provincia = nutricionista.provincia;
    response.añosExperiencia = nutricionista.añosExperiencia;
    response.tarifaSesion = nutricionista.tarifaSesion;
    response.matricula = nutricionista.matricula;
    response.email = nutricionista.email ?? '';
    response.telefono = nutricionista.telefono;
    response.direccion = nutricionista.direccion;
    response.genero = nutricionista.genero;
    response.biografia = null;
    response.calificacionPromedio = null;
    response.totalOpiniones = 0;
    response.horarios = (nutricionista.agendas ?? []).map((agenda) => {
      const horario = new HorarioProfesionalPublicoDto();
      horario.dia = agenda.dia;
      horario.horaInicio = agenda.horaInicio;
      horario.horaFin = agenda.horaFin;
      horario.duracionTurno = agenda.duracionTurno;
      return horario;
    });

    return response;
  }
}
