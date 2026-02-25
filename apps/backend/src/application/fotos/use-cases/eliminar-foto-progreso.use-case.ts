import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';

@Injectable()
export class EliminarFotoProgresoUseCase implements BaseUseCase {
  constructor(
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly fotoProgresoRepository: FotoProgresoRepository,
  ) {}

  async execute(fotoId: number, socioId: number): Promise<void> {
    const foto = await this.fotoProgresoRepository.findByIdAndSocioId(
      fotoId,
      socioId,
    );

    if (!foto) {
      throw new NotFoundError('Foto de progreso', String(fotoId));
    }

    await this.objectStorageService.eliminarArchivo(foto.objectKey);
    await this.fotoProgresoRepository.delete(foto.idFoto);
  }
}
