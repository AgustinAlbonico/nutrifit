import { DiplomaEntity } from './diploma.entity';

export interface DiplomaRepository {
  findById(id: number): Promise<DiplomaEntity | null>;
  findByIdNutricionista(idNutricionista: number): Promise<DiplomaEntity[]>;
  save(diploma: DiplomaEntity): Promise<DiplomaEntity>;
  delete(id: number): Promise<void>;
}

export const DIPLOMA_REPOSITORY = 'DIPLOMA_REPOSITORY';
