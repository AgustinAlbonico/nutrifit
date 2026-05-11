import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GimnasioOrmEntity } from '../entities/gimnasio.entity';
import {
  ConfiguracionGimnasioDto,
  UpdateConfiguracionGimnasioDto,
} from 'src/application/reportes/dtos/configuracion-gimnasio.dto';

@Injectable()
export class GimnasioRepository {
  constructor(
    @InjectRepository(GimnasioOrmEntity)
    private readonly gimnasioRepository: Repository<GimnasioOrmEntity>,
  ) {}

  async findFirst(): Promise<GimnasioOrmEntity | null> {
    return this.gimnasioRepository.findOne({ where: {} });
  }

  async update(
    id: number,
    data: UpdateConfiguracionGimnasioDto,
  ): Promise<GimnasioOrmEntity> {
    await this.gimnasioRepository.update(id, data);
    const updated = await this.gimnasioRepository.findOneBy({ idGimnasio: id });
    if (!updated) {
      throw new Error(`Gimnasio with id ${id} not found`);
    }
    return updated;
  }

  toDto(entity: GimnasioOrmEntity): ConfiguracionGimnasioDto {
    const dto = new ConfiguracionGimnasioDto();
    dto.idGimnasio = entity.idGimnasio;
    dto.nombre = entity.nombre;
    dto.direccion = entity.direccion;
    dto.telefono = entity.telefono;
    dto.ciudad = entity.ciudad;
    dto.logoUrl = entity.logoUrl;
    dto.colorPrimario = entity.colorPrimario;
    dto.colorSecundario = entity.colorSecundario;
    dto.plazoCancelacionHoras = entity.plazoCancelacionHoras;
    dto.plazoReprogramacionHoras = entity.plazoReprogramacionHoras;
    dto.antelacionMinimaReservaHoras = entity.antelacionMinimaReservaHoras;
    dto.umbralAusenteMinutos = entity.umbralAusenteMinutos;
    dto.emailNotificaciones = entity.emailNotificaciones;
    dto.emailHabilitado = entity.emailHabilitado;
    return dto;
  }
}
