import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from '../shared/use-case.base';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { ListSociosQueryDto } from './dtos/list-socios-query.dto';
import { PaginatedData } from '@nutrifit/shared';
import { calcularMeta } from 'src/common/helpers/paginacion.helper';

@Injectable()
export class ListarSociosUseCase implements BaseUseCase {
  constructor(
    @Inject(SOCIO_REPOSITORY) private readonly socioRepository: SocioRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    query?: ListSociosQueryDto,
  ): Promise<PaginatedData<SocioEntity>> {
    const socios = await this.socioRepository.findAll();

    const rol = this.tenantContext.rol;
    let base = socios;

    if (rol !== Rol.ADMIN && rol !== Rol.SUPERADMIN) {
      const gimnasioId = this.tenantContext.gimnasioId;
      base =
        gimnasioId === null
          ? []
          : socios.filter((socio) => socio.gimnasioId === gimnasioId);
    }

    const filtrados = query ? this.aplicarFiltros(base, query) : base;
    const ordenados = query
      ? this.aplicarOrdenamiento(filtrados, query)
      : filtrados;

    const page = query?.page ?? 1;
    const limit = query?.limit ?? 9;
    const inicio = (page - 1) * limit;
    const paginados = ordenados.slice(inicio, inicio + limit);

    return {
      data: paginados,
      pagination: calcularMeta(ordenados.length, page, limit),
    };
  }

  async findById(id: number): Promise<SocioEntity | null> {
    return this.socioRepository.findById(id);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private aplicarFiltros(
    socios: SocioEntity[],
    query: ListSociosQueryDto,
  ): SocioEntity[] {
    return socios.filter((s) => {
      if (query.search) {
        const texto = this.normalizarTexto(query.search);
        const campos = this.normalizarTexto(
          `${s.nombre} ${s.apellido} ${s.email} ${s.dni} ${s.ciudad} ${s.provincia}`,
        );
        if (!campos.includes(texto)) return false;
      }

      if (query.estado === 'ACTIVO' && s.fechaBaja) return false;
      if (query.estado === 'INACTIVO' && !s.fechaBaja) return false;

      if (query.provincia && query.provincia !== 'TODAS' && s.provincia !== query.provincia)
        return false;

      if (query.ciudad && query.ciudad !== 'TODAS' && s.ciudad !== query.ciudad)
        return false;

      return true;
    });
  }

  private aplicarOrdenamiento(
    socios: SocioEntity[],
    query: ListSociosQueryDto,
  ): SocioEntity[] {
    const multiplicador = query.ordenDireccion === 'DESC' ? -1 : 1;
    const campo = query.ordenCampo ?? 'NOMBRE';

    return [...socios].sort((a, b) => {
      switch (campo) {
        case 'ESTADO': {
          const estadoA = a.fechaBaja ? 'INACTIVO' : 'ACTIVO';
          const estadoB = b.fechaBaja ? 'INACTIVO' : 'ACTIVO';
          return estadoA.localeCompare(estadoB) * multiplicador;
        }
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
