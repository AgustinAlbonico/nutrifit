import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FormacionAcademicaPublicaDto,
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
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class GetPerfilProfesionalPublicoUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(id: number): Promise<PerfilProfesionalPublicoResponseDto> {
    const nutricionista = await this.nutricionistaRepository.findById(id);

    if (!nutricionista || nutricionista.fechaBaja) {
      throw new NotFoundError('Profesional', String(id));
    }

    // RB25: nutricionista debe pertenecer al mismo gimnasio que el socio
    if (nutricionista.gimnasioId !== this.tenantContext.gimnasioId) {
      throw new NotFoundError('Profesional', String(id));
    }

    this.logger.log(`Perfil publico consultado para profesional ${id}.`);

    const fotoUrl = this.construirFotoUrl(
      nutricionista.idPersona,
      nutricionista.fotoPerfilKey,
    );

    const response = new PerfilProfesionalPublicoResponseDto();
    response.idPersona = nutricionista.idPersona ?? 0;
    response.nombre = nutricionista.nombre;
    response.apellido = nutricionista.apellido;
    response.especialidad = 'Nutricionista';
    response.ciudad = nutricionista.ciudad;
    response.provincia = nutricionista.provincia;
    response.aniosExperiencia = nutricionista.aniosExperiencia;
    response.tarifaSesion = nutricionista.tarifaSesion;
    response.matricula = nutricionista.matricula;
    response.presentacion = nutricionista.presentacion ?? null;
    response.certificaciones = (nutricionista.certificaciones ?? []).map(
      (c) => ({
        idCertificacion: c.idCertificacion,
        nombre: c.nombre,
        entidad: c.entidad,
        anio: c.anio,
        cargaHoraria: c.cargaHoraria,
        nivel: c.nivel,
      }),
    );
    response.fotoUrl = fotoUrl;
    response.duracionTurnoMin = nutricionista.duracionTurnoMin;
    response.agendaConfigurada = (nutricionista.agendas ?? []).length > 0;
    response.diplomas = (nutricionista.diplomas ?? []).map((d) => ({
      idDiploma: d.idDiploma,
      url: `/profesional/${nutricionista.idPersona ?? 0}/diplomas/${d.idDiploma}/archivo`,
      nombreOriginal: d.nombreOriginal,
      mimeType: d.mimeType,
    }));
    response.formacionAcademica = (nutricionista.formacionAcademica ?? []).map(
      (f) => {
        const dto = new FormacionAcademicaPublicaDto();
        dto.titulo = f.titulo;
        dto.institucion = f.institucion;
        dto.anioInicio = f.añoComienzo;
        dto.anioFin = f.añoFin;
        dto.nivel = f.nivel;
        dto.enCurso = f.añoFin === null;
        return dto;
      },
    );
    response.horarios = (nutricionista.agendas ?? []).map((agenda) => {
      const horario = new HorarioProfesionalPublicoDto();
      horario.dia = agenda.dia;
      horario.horaInicio = agenda.horaInicio;
      horario.horaFin = agenda.horaFin;
      horario.duracionTurno = nutricionista.duracionTurnoMin;
      return horario;
    });

    return response;
  }

  private construirFotoUrl(
    idPersona: number | null,
    fotoPerfilKey: string | null,
  ): string | null {
    if (!fotoPerfilKey) return null;
    // TODO(spec-futura): si en el futuro se migra a S3 presigned, este campo se transforma a URL absoluto.
    return `/profesional/${idPersona ?? 0}/foto?v=${encodeURIComponent(fotoPerfilKey)}`;
  }
}
