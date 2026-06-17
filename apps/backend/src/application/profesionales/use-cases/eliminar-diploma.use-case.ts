import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  DIPLOMA_REPOSITORY,
  DiplomaRepository,
} from 'src/domain/entities/Diploma/diploma.repository';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class EliminarDiplomaUseCase implements BaseUseCase {
  constructor(
    @Inject(DIPLOMA_REPOSITORY)
    private readonly diplomaRepository: DiplomaRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async execute(idDiploma: number): Promise<void> {
    const diploma = await this.diplomaRepository.findById(idDiploma);
    if (!diploma) {
      throw new NotFoundError('Diploma', String(idDiploma));
    }

    try {
      await this.objectStorage.eliminarArchivo(diploma.documentKey);
    } catch (error) {
      // Si falla la eliminación del archivo, igual eliminamos el registro
    }

    await this.diplomaRepository.delete(idDiploma);
  }
}
