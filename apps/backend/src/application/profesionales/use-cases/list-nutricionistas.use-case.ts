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
import { ListNutricionistasQueryDto } from '../dtos/list-nutricionistas-query.dto';
import { PaginatedData } from '@nutrifit/shared';
import { calcularMeta } from 'src/common/helpers/paginacion.helper';

@Injectable()
export class ListNutricionistasUseCase implements BaseUseCase {
  constructor(
    @Inject(NUTRICIONISTA_REPOSITORY)
    private readonly nutricionistaRepository: NutricionistaRepository,
    @Inject(APP_LOGGER_SERVICE) private readonly logger: IAppLoggerService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    query?: ListNutricionistasQueryDto,
  ): Promise<PaginatedData<NutricionistaEntity>> {
    const nutricionistas = await this.nutricionistaRepository.findAll();

    const rol = this.tenantContext.rol;
    let base = nutricionistas;

    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      const gimnasioId = this.tenantContext.gimnasioId;
      base =
        gimnasioId === null
          ? []
          : nutricionistas.filter((n) => n.gimnasioId === gimnasioId);
    }

    const filtrados = query ? this.aplicarFiltros(base, query) : base;

    const ordenados = query
      ? this.aplicarOrdenamiento(filtrados, query)
      : filtrados;

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 9;
    const inicio = (page - 1) * limit;
    const paginados = ordenados.slice(inicio, inicio + limit);

    this.logger.log(
      `Se recuperaron ${paginados.length} nutricionistas (total: ${ordenados.length}, pagina ${page}).`,
    );

    return {
      data: paginados,
      pagination: calcularMeta(ordenados.length, page, limit),
    };
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private aplicarFiltros(
    nutricionistas: NutricionistaEntity[],
    query: ListNutricionistasQueryDto,
  ): NutricionistaEntity[] {
    return nutricionistas.filter((n) => {
      if (query.search) {
        const texto = this.normalizarTexto(query.search);
        const campos = this.normalizarTexto(
          `${n.nombre} ${n.apellido} ${n.email} ${n.matricula} ${n.dni} ${n.ciudad} ${n.provincia}`,
        );
        if (!campos.includes(texto)) return false;
      }

      if (query.estado === 'ACTIVO' && n.fechaBaja) return false;
      if (query.estado === 'INACTIVO' && !n.fechaBaja) return false;

      if (
        query.provincia &&
        query.provincia !== 'TODAS' &&
        n.provincia !== query.provincia
      )
        return false;

      if (query.ciudad && query.ciudad !== 'TODAS' && n.ciudad !== query.ciudad)
        return false;

      if (query.antiguedad && query.antiguedad !== 'TODAS') {
        if (!this.cumpleAntiguedad(n.aniosExperiencia, query.antiguedad))
          return false;
      }

      return true;
    });
  }

  private cumpleAntiguedad(
    anios: number,
    filtro: '0-2' | '3-5' | '6-10' | '11+',
  ): boolean {
    switch (filtro) {
      case '0-2':
        return anios >= 0 && anios <= 2;
      case '3-5':
        return anios >= 3 && anios <= 5;
      case '6-10':
        return anios >= 6 && anios <= 10;
      case '11+':
        return anios >= 11;
      default:
        return true;
    }
  }

  private aplicarOrdenamiento(
    nutricionistas: NutricionistaEntity[],
    query: ListNutricionistasQueryDto,
  ): NutricionistaEntity[] {
    const multiplicador = query.ordenDireccion === 'DESC' ? -1 : 1;
    const campo = query.ordenCampo ?? 'NOMBRE';

    return [...nutricionistas].sort((a, b) => {
      switch (campo) {
        case 'ESTADO': {
          const estadoA = a.fechaBaja ? 'INACTIVO' : 'ACTIVO';
          const estadoB = b.fechaBaja ? 'INACTIVO' : 'ACTIVO';
          return estadoA.localeCompare(estadoB) * multiplicador;
        }
        case 'EXPERIENCIA':
          return (a.aniosExperiencia - b.aniosExperiencia) * multiplicador;
        case 'NOMBRE':
        default: {
          const nombreA = `${a.apellido} ${a.nombre}`;
          const nombreB = `${b.apellido} ${b.nombre}`;
          return nombreA.localeCompare(nombreB) * multiplicador;
        }
      }
    });
  }
}
