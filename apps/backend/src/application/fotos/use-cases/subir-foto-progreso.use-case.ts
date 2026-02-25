import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FotoProgresoResponseDto,
  SubirFotoProgresoDto,
} from 'src/application/fotos/dtos/subir-foto.dto';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';

@Injectable()
export class SubirFotoProgresoUseCase implements BaseUseCase {
  constructor(
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly fotoProgresoRepository: FotoProgresoRepository,
  ) {}

  async execute(
    payload: SubirFotoProgresoDto,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<FotoProgresoResponseDto> {
    const fecha = new Date();
    const objectKey = this.buildObjectKey(
      payload.socioId,
      payload.tipoFoto,
      fecha,
    );

    await this.objectStorageService.subirArchivo(
      objectKey,
      fileBuffer,
      mimeType,
    );

    const fotoGuardada = await this.fotoProgresoRepository.save({
      socio: { idPersona: payload.socioId } as SocioOrmEntity,
      tipoFoto: payload.tipoFoto,
      notas: payload.notas ?? null,
      objectKey,
      mimeType,
    });

    const urlFirmada =
      await this.objectStorageService.obtenerUrlFirmada(objectKey);
    return this.toResponseDto(fotoGuardada, urlFirmada);
  }

  private buildObjectKey(
    socioId: number,
    tipoFoto: string,
    fecha: Date,
  ): string {
    const fechaISO = fecha.toISOString().slice(0, 10);
    return `progreso/${socioId}/${tipoFoto}/${fechaISO}_${fecha.getTime()}.jpg`;
  }

  private toResponseDto(
    foto: FotoProgresoOrmEntity,
    urlFirmada: string,
  ): FotoProgresoResponseDto {
    return {
      idFoto: foto.idFoto,
      socioId: foto.socio.idPersona ?? 0,
      tipoFoto: foto.tipoFoto,
      objectKey: foto.objectKey,
      mimeType: foto.mimeType,
      notas: foto.notas,
      fecha: foto.fecha,
      urlFirmada,
    };
  }
}
