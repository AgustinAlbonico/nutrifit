import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoliticaOperativaOrmEntity } from './politica-operativa.entity';
import { PoliticaOperativaEntity } from 'src/domain/politicas/politica-operativa.entity';
import {
  IPoliticaOperativaRepository,
  POLITICA_OPERATIVA_REPOSITORY,
} from 'src/application/politicas/politica-operativa.repository';

// Default values when no policy exists for a gym
const DEFAULT_PLAZO_CANCELACION_HORAS = 24;
const DEFAULT_PLAZO_REPROGRAMACION_HORAS = 24;
const DEFAULT_UMBRAL_AUSENTE_MINUTOS = 15;

@Injectable()
export class PoliticaOperativaRepositoryImpl implements IPoliticaOperativaRepository {
  constructor(
    @InjectRepository(PoliticaOperativaOrmEntity)
    private readonly repository: Repository<PoliticaOperativaOrmEntity>,
  ) {}

  async findByGimnasioId(
    gimnasioId: number,
  ): Promise<PoliticaOperativaEntity | null> {
    const orm = await this.repository.findOne({
      where: { gimnasioId },
    });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async getPlazoCancelacion(gimnasioId: number): Promise<number> {
    const politica = await this.findByGimnasioId(gimnasioId);
    return politica?.plazoCancelacionHoras ?? DEFAULT_PLAZO_CANCELACION_HORAS;
  }

  async getPlazoReprogramacion(gimnasioId: number): Promise<number> {
    const politica = await this.findByGimnasioId(gimnasioId);
    return (
      politica?.plazoReprogramacionHoras ?? DEFAULT_PLAZO_REPROGRAMACION_HORAS
    );
  }

  async getUmbralAusente(gimnasioId: number): Promise<number> {
    const politica = await this.findByGimnasioId(gimnasioId);
    return politica?.umbralAusenteMinutos ?? DEFAULT_UMBRAL_AUSENTE_MINUTOS;
  }

  private toDomain(orm: PoliticaOperativaOrmEntity): PoliticaOperativaEntity {
    return new PoliticaOperativaEntity(
      orm.id,
      orm.gimnasioId,
      orm.plazoCancelacionHoras,
      orm.plazoReprogramacionHoras,
      orm.umbralAusenteMinutos,
    );
  }
}
