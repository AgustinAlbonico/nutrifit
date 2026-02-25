import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EstadoObjetivo,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';
import { In, Repository } from 'typeorm';
import { ObjetivoOrmEntity } from '../entities/objetivo.entity';

const ESTADO_ACTIVO: EstadoObjetivo = 'ACTIVO';
const ESTADOS_CERRADOS: EstadoObjetivo[] = ['COMPLETADO', 'ABANDONADO'];

@Injectable()
export class ObjetivoRepository {
  constructor(
    @InjectRepository(ObjetivoOrmEntity)
    private readonly objetivoRepository: Repository<ObjetivoOrmEntity>,
  ) {}

  async findById(idObjetivo: number): Promise<ObjetivoOrmEntity | null> {
    return this.objetivoRepository.findOne({
      where: { idObjetivo },
      relations: { socio: true },
    });
  }

  async findActivosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]> {
    return this.objetivoRepository.find({
      where: {
        socio: { idPersona: socioId },
        estado: ESTADO_ACTIVO,
      },
      relations: { socio: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findCompletadosBySocioId(
    socioId: number,
  ): Promise<ObjetivoOrmEntity[]> {
    return this.objetivoRepository.find({
      where: {
        socio: { idPersona: socioId },
        estado: In(ESTADOS_CERRADOS),
      },
      relations: { socio: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findActivoByTipo(
    socioId: number,
    tipoMetrica: TipoMetrica,
  ): Promise<ObjetivoOrmEntity | null> {
    return this.objetivoRepository.findOne({
      where: {
        socio: { idPersona: socioId },
        tipoMetrica,
        estado: ESTADO_ACTIVO,
      },
      relations: { socio: true },
    });
  }

  async save(entity: Partial<ObjetivoOrmEntity>): Promise<ObjetivoOrmEntity> {
    const objetivo = this.objetivoRepository.create(entity);
    return this.objetivoRepository.save(objetivo);
  }

  async updateEstado(
    idObjetivo: number,
    estado: EstadoObjetivo,
  ): Promise<void> {
    await this.objetivoRepository.update(idObjetivo, {
      estado,
      updatedAt: new Date(),
    });
  }
}
