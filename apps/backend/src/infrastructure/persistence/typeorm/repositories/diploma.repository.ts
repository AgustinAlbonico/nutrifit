import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiplomaOrmEntity } from '../entities/diploma.entity';
import { DiplomaEntity } from 'src/domain/entities/Diploma/diploma.entity';
import { DiplomaRepository } from 'src/domain/entities/Diploma/diploma.repository';

@Injectable()
export class DiplomaRepositoryImplementation implements DiplomaRepository {
  constructor(
    @InjectRepository(DiplomaOrmEntity)
    private readonly ormRepo: Repository<DiplomaOrmEntity>,
  ) {}

  async findById(id: number): Promise<DiplomaEntity | null> {
    const orm = await this.ormRepo.findOne({ where: { idDiploma: id } });
    if (!orm) return null;
    return this.toDomain(orm);
  }

  async findByIdNutricionista(
    idNutricionista: number,
  ): Promise<DiplomaEntity[]> {
    const orms = await this.ormRepo.find({
      where: { idNutricionista },
      order: { creadoEn: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async save(diploma: DiplomaEntity): Promise<DiplomaEntity> {
    const orm = this.ormRepo.create({
      idNutricionista: diploma.idNutricionista,
      documentKey: diploma.documentKey,
      nombreOriginal: diploma.nombreOriginal,
      mimeType: diploma.mimeType,
    });
    const saved = await this.ormRepo.save(orm);
    return this.toDomain(saved);
  }

  async delete(id: number): Promise<void> {
    await this.ormRepo.delete(id);
  }

  private toDomain(orm: DiplomaOrmEntity): DiplomaEntity {
    return new DiplomaEntity(
      orm.idDiploma,
      orm.idNutricionista,
      orm.documentKey,
      orm.nombreOriginal,
      orm.mimeType,
      orm.creadoEn,
    );
  }
}
