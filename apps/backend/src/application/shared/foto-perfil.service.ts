import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';

export type TipoFotoPerfil = 'socios' | 'nutricionistas' | 'recepcionistas';

@Injectable()
export class FotoPerfilService {
  constructor(
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorage: IObjectStorageService,
  ) {}

  async subir(
    tipo: TipoFotoPerfil,
    file: Express.Multer.File,
  ): Promise<string> {
    const extension = file.originalname.split('.').pop();
    const key = `perfiles/${tipo}/${Date.now()}-${randomUUID()}.${extension}`;
    await this.objectStorage.subirArchivo(key, file.buffer, file.mimetype);
    return key;
  }
}