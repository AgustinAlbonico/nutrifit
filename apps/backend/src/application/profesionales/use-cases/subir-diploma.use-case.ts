import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  DIPLOMA_REPOSITORY,
  DiplomaRepository,
} from 'src/domain/entities/Diploma/diploma.repository';
import { DiplomaEntity } from 'src/domain/entities/Diploma/diploma.entity';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

@Injectable()
export class SubirDiplomaUseCase implements BaseUseCase {
  constructor(
    @Inject(DIPLOMA_REPOSITORY)
    private readonly diplomaRepository: DiplomaRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(
    idNutricionista: number,
    archivo: Express.Multer.File,
  ): Promise<DiplomaEntity> {
    const extension = archivo.originalname.split('.').pop();
    const diplomaKey = `perfiles/nutricionistas/diplomas/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    await this.objectStorage.subirArchivo(
      diplomaKey,
      archivo.buffer,
      archivo.mimetype,
    );

    const diploma = new DiplomaEntity(
      0,
      idNutricionista,
      diplomaKey,
      archivo.originalname,
      archivo.mimetype,
    );

    return this.diplomaRepository.save(diploma);
  }
}
