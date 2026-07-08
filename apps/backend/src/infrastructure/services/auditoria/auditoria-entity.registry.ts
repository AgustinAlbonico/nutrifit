import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';

type EntidadAuditable = TurnoOrmEntity;

interface ConfiguracionEntidadAuditable<T extends EntidadAuditable> {
  repository: Repository<T>;
  pk: keyof T;
}

@Injectable()
export class AuditoriaEntityRegistry {
  private readonly entidades: Record<string, ConfiguracionEntidadAuditable<EntidadAuditable>>;

  constructor(
    @InjectRepository(TurnoOrmEntity)
    private readonly turnoRepository: Repository<TurnoOrmEntity>,
  ) {
    this.entidades = {
      Turno: { repository: this.turnoRepository, pk: 'idTurno' },
    };
  }

  async cargar(entidad: string, entidadId: number | string | null): Promise<Record<string, unknown> | null> {
    if (entidadId == null) {
      return null;
    }

    const configuracion = this.entidades[entidad];
    if (!configuracion) {
      return null;
    }

    const registro = await configuracion.repository.findOne({
      where: { [configuracion.pk]: entidadId } as never,
    });

    return registro ? this.serializarEntidad(registro) : null;
  }

  private serializarEntidad(entidad: EntidadAuditable): Record<string, unknown> {
    return Object.entries(entidad).reduce<Record<string, unknown>>((acumulado, [campo, valor]) => {
      if (this.esValorSerializable(valor)) {
        acumulado[campo] = valor;
      }
      return acumulado;
    }, {});
  }

  private esValorSerializable(valor: unknown): boolean {
    return (
      valor == null ||
      typeof valor === 'string' ||
      typeof valor === 'number' ||
      typeof valor === 'boolean' ||
      valor instanceof Date
    );
  }
}
