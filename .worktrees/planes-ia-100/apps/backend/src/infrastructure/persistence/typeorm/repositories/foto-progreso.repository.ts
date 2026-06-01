import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { FotoProgresoOrmEntity } from '../entities/foto-progreso.entity';

@Injectable()
export class FotoProgresoRepository {
  constructor(
    @InjectRepository(FotoProgresoOrmEntity)
    private readonly fotoProgresoOrmRepository: Repository<FotoProgresoOrmEntity>,
  ) {}

  async findBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]> {
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId } },
      relations: { socio: true },
      order: { fecha: 'DESC' },
    });
  }

  async findBySocioIdAndTipo(
    socioId: number,
    tipoFoto: TipoFoto,
  ): Promise<FotoProgresoOrmEntity[]> {
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId }, tipoFoto },
      relations: { socio: true },
      order: { fecha: 'DESC' },
    });
  }

  async findLatestBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]> {
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId } },
      relations: { socio: true },
      order: { fecha: 'DESC' },
      take: 10,
    });
  }

  async findByIdAndSocioId(
    idFoto: number,
    socioId: number,
  ): Promise<FotoProgresoOrmEntity | null> {
    return this.fotoProgresoOrmRepository.findOne({
      where: { idFoto, socio: { idPersona: socioId } },
      relations: { socio: true },
    });
  }

  async save(
    entity: Partial<FotoProgresoOrmEntity>,
  ): Promise<FotoProgresoOrmEntity> {
    const foto = this.fotoProgresoOrmRepository.create(entity);
    return this.fotoProgresoOrmRepository.save(foto);
  }

  async delete(idFoto: number): Promise<void> {
    await this.fotoProgresoOrmRepository.delete(idFoto);
  }
}
