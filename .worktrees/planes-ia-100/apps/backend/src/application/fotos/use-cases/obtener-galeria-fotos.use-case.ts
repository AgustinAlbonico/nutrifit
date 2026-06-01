import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FotoProgresoResponseDto,
  FotosPorTipoResponseDto,
  GaleriaFotosResponseDto,
} from 'src/application/fotos/dtos/subir-foto.dto';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';

@Injectable()
export class ObtenerGaleriaFotosUseCase implements BaseUseCase {
  constructor(
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
    private readonly fotoProgresoRepository: FotoProgresoRepository,
  ) {}

  async execute(socioId: number): Promise<GaleriaFotosResponseDto> {
    const fotos = await this.fotoProgresoRepository.findBySocioId(socioId);

    const fotosConUrl = await Promise.all(
      fotos.map(async (foto) => {
        const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(
          foto.objectKey,
          3600,
        );
        return this.toResponseDto(foto, urlFirmada);
      }),
    );

    const grupos = new Map<string, FotoProgresoResponseDto[]>();

    fotosConUrl.forEach((foto) => {
      const key = foto.tipoFoto;
      const existentes = grupos.get(key) ?? [];
      existentes.push(foto);
      grupos.set(key, existentes);
    });

    const fotosAgrupadas: FotosPorTipoResponseDto[] = Array.from(
      grupos.entries(),
    ).map(([tipoFoto, fotosTipo]) => ({
      tipoFoto: tipoFoto as FotoProgresoResponseDto['tipoFoto'],
      fotos: fotosTipo.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    }));

    return { fotos: fotosAgrupadas };
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
