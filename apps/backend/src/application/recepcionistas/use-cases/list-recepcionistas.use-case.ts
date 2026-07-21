import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { RecepcionistaResponseDto } from '../dtos/recepcionista-response.dto';
import { ListRecepcionistasQueryDto } from '../dtos/list-recepcionistas-query.dto';
import {
  RECEPCIONISTA_REPOSITORY,
  RecepcionistaRepository,
} from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { PaginatedData } from '@nutrifit/shared';
import { calcularMeta } from 'src/common/helpers/paginacion.helper';

@Injectable()
export class ListRecepcionistasUseCase implements BaseUseCase {
  constructor(
    @Inject(RECEPCIONISTA_REPOSITORY)
    private readonly recepcionistaRepository: RecepcionistaRepository,
  ) {}

  async execute(
    query?: ListRecepcionistasQueryDto,
  ): Promise<PaginatedData<RecepcionistaResponseDto>> {
    const recepcionistas = await this.recepcionistaRepository.findAll();
    const dtos = recepcionistas.map((rec) =>
      RecepcionistaResponseDto.fromEntity(rec),
    );

    const filtrados = query ? this.aplicarFiltros(dtos, query) : dtos;
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

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private aplicarFiltros(
    dtos: RecepcionistaResponseDto[],
    query: ListRecepcionistasQueryDto,
  ): RecepcionistaResponseDto[] {
    return dtos.filter((r) => {
      if (query.search) {
        const texto = this.normalizarTexto(query.search);
        const campos = this.normalizarTexto(
          `${r.nombre} ${r.apellido} ${r.email} ${r.dni} ${r.ciudad} ${r.provincia}`,
        );
        if (!campos.includes(texto)) return false;
      }

      if (query.estado === 'ACTIVO' && !r.activo) return false;
      if (query.estado === 'INACTIVO' && r.activo) return false;

      if (
        query.provincia &&
        query.provincia !== 'TODAS' &&
        r.provincia !== query.provincia
      )
        return false;

      if (query.ciudad && query.ciudad !== 'TODAS' && r.ciudad !== query.ciudad)
        return false;

      return true;
    });
  }

  private aplicarOrdenamiento(
    dtos: RecepcionistaResponseDto[],
    query: ListRecepcionistasQueryDto,
  ): RecepcionistaResponseDto[] {
    const multiplicador = query.ordenDireccion === 'DESC' ? -1 : 1;
    const campo = query.ordenCampo ?? 'NOMBRE';

    return [...dtos].sort((a, b) => {
      switch (campo) {
        case 'ESTADO': {
          const estadoA = a.activo ? 'ACTIVO' : 'INACTIVO';
          const estadoB = b.activo ? 'ACTIVO' : 'INACTIVO';
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
