import { Inject, Injectable } from '@nestjs/common';
import {
  CatalogoProfesionalResponseDto,
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
import {
  ListProfesionalesPublicQueryDto,
  SortCatalogo,
} from 'src/application/profesionales/dtos/list-profesionales-public-query.dto';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Injectable()
export class ListProfesionalesPublicosUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
    private readonly slotComputation: SlotComputationService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    query: ListProfesionalesPublicQueryDto,
  ): Promise<CatalogoProfesionalResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort: SortCatalogo = query.sort ?? 'nombre';

    // RB25: la list ya viene filtrada por gimnasioId desde el repository
    const nutricionistas = await this.nutricionistaRepository.findAll();

    // RB17: solo activos (proxy: !fechaBaja)
    const activos = nutricionistas.filter((n) => !n.fechaBaja);

    // Calcular slotsProximos7Dias por nutricionista en paralelo
    const itemsConSlots = await Promise.all(
      activos.map(async (nutri) => {
        let slots = 0;
        try {
          slots = await this.slotComputation.contarSlotsProximos(
            nutri.idPersona ?? 0,
            7,
          );
        } catch (err) {
          this.logger.warn(
            `No se pudieron calcular slots para nutricionista ${nutri.idPersona}: ${
              err instanceof Error ? err.message : 'error desconocido'
            }`,
          );
        }
        return { nutri, slots };
      }),
    );

    // Filtros
    let filtrados = itemsConSlots;

    if (query.nombre?.trim()) {
      const normalizar = (s: string) =>
        s
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      const termino = normalizar(query.nombre.trim());
      filtrados = filtrados.filter(({ nutri }) => {
        const fullName = normalizar(`${nutri.nombre} ${nutri.apellido}`.trim());
        return fullName.includes(termino);
      });
    }

    if (query.especialidad?.trim()) {
      const termino = query.especialidad.trim().toLowerCase();
      filtrados = filtrados.filter(() => 'nutricionista'.includes(termino));
    }

    if (query.disponible === true) {
      filtrados = filtrados.filter((x) => x.slots > 0);
    }

    // Sort
    filtrados.sort((a, b) => {
      if (sort === 'disponible') {
        return b.slots - a.slots;
      }
      if (sort === 'recientes') {
        return (b.nutri.idPersona ?? 0) - (a.nutri.idPersona ?? 0);
      }
      // 'nombre' (default)
      const nombreA = `${a.nutri.apellido} ${a.nutri.nombre}`.toLowerCase();
      const nombreB = `${b.nutri.apellido} ${b.nutri.nombre}`.toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

    const total = filtrados.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pageItems = filtrados.slice(offset, offset + limit);

    this.logger.log(
      `Listado publico de profesionales: ${total} resultados, página ${page}/${totalPages}.`,
    );

    const items: ProfesionalPublicoResponseDto[] = pageItems.map(
      ({ nutri, slots }) => {
        const fotoUrl = this.construirFotoUrl(
          nutri.idPersona,
          nutri.fotoPerfilKey,
        );
        const diplomaUrl = this.construirDiplomaUrl(
          nutri.idPersona,
          nutri.matriculaDocumentoKey,
        );
        const dto = new ProfesionalPublicoResponseDto();
        dto.idPersona = nutri.idPersona ?? 0;
        dto.nombre = nutri.nombre;
        dto.apellido = nutri.apellido;
        dto.matricula = nutri.matricula;
        dto.especialidad = 'Nutricionista';
        dto.ciudad = nutri.ciudad;
        dto.provincia = nutri.provincia;
        dto.aniosExperiencia = nutri.aniosExperiencia;
        dto.tarifaSesion = nutri.tarifaSesion;
        dto.fotoUrl = fotoUrl;
        dto.presentacion = nutri.presentacion ?? null;
        dto.duracionTurnoMin = nutri.duracionTurnoMin;
        dto.diplomaUrl = diplomaUrl;
        dto.slotsProximos7Dias = slots;
        return dto;
      },
    );

    return {
      items,
      pagination: {
        total,
        page,
        per_page: limit,
        total_pages: totalPages,
      },
    };
  }

  private construirFotoUrl(
    idPersona: number | null,
    fotoPerfilKey: string | null,
  ): string | null {
    if (!fotoPerfilKey) return null;
    return `/api/profesional/${idPersona ?? 0}/foto?v=${encodeURIComponent(fotoPerfilKey)}`;
  }

  private construirDiplomaUrl(
    idPersona: number | null,
    matriculaDocumentoKey: string | null,
  ): string | null {
    if (!matriculaDocumentoKey) return null;
    return `/api/profesional/${idPersona ?? 0}/diploma?v=${encodeURIComponent(matriculaDocumentoKey)}`;
  }
}
