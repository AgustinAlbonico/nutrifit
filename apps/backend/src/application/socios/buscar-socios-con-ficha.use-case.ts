import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { normalizarTexto } from 'src/common/utils/text.util';
import { stripAccentsLowerSql } from 'src/common/utils/sql-text.util';

export interface SocioConFichaDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string | null;
  tieneFichaSalud: boolean;
  nombreCompleto: string;
}

@Injectable()
export class BuscarSociosConFichaUseCase {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(busqueda?: string): Promise<SocioConFichaDto[]> {
    const gimnasioId = this.tenantContext.gimnasioId;

    const queryBuilder = this.socioRepository
      .createQueryBuilder('socio')
      .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
      .distinct(true)
      .where('socio.fechaBaja IS NULL');

    if (gimnasioId !== null) {
      queryBuilder.andWhere('socio.gimnasioId = :gimnasioId', {
        gimnasioId,
      });
    }

    if (busqueda && busqueda.trim()) {
      const termino = `%${normalizarTexto(busqueda)}%`;
      queryBuilder.andWhere(
        `(${stripAccentsLowerSql(
          'LOWER(socio.nombre)',
        )} LIKE :termino OR ${stripAccentsLowerSql(
          'LOWER(socio.apellido)',
        )} LIKE :termino OR LOWER(socio.dni) LIKE :termino)`,
        { termino },
      );
    }

    const socios = await queryBuilder
      .orderBy('socio.apellido', 'ASC')
      .addOrderBy('socio.nombre', 'ASC')
      .limit(20)
      .getMany();

    return socios.map((socio) => ({
      idPersona: socio.idPersona ?? 0,
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      tieneFichaSalud: !!socio.fichaSalud,
      nombreCompleto: `${socio.apellido}, ${socio.nombre}`,
    }));
  }
}
