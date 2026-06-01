import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';

export interface AccionOutput {
  id: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
}

@Injectable()
export class ListarAccionesUseCase {
  constructor(
    @InjectRepository(AccionOrmEntity)
    private readonly accionRepo: Repository<AccionOrmEntity>,
  ) {}

  async execute(): Promise<AccionOutput[]> {
    const acciones = await this.accionRepo.find({
      order: { clave: 'ASC' },
    });

    return acciones.map((a) => ({
      id: a.id,
      clave: a.clave,
      nombre: a.nombre,
      descripcion: a.descripcion,
    }));
  }
}