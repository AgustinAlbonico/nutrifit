import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';

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
  ) {}

  async execute(busqueda?: string): Promise<SocioConFichaDto[]> {
    const queryBuilder = this.socioRepository
      .createQueryBuilder('socio')
      .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
      .where('socio.fechaBaja IS NULL');

    if (busqueda && busqueda.trim()) {
      const termino = `%${busqueda.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(socio.nombre) LIKE :busqueda OR LOWER(socio.apellido) LIKE :busqueda OR socio.dni LIKE :busqueda)',
        { busqueda: termino },
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
