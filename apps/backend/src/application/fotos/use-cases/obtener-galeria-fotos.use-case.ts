import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  FotoProgresoResponseDto,
  FotosSesionResponseDto,
  FotosPorTipoResponseDto,
  GaleriaFotosResponseDto,
} from 'src/application/fotos/dtos/subir-foto.dto';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { formatArgentinaDate } from 'src/common/utils/argentina-datetime.util';

type FotoProgresoConSesionDto = FotoProgresoResponseDto & {
  fechaTurno: string | null;
  horaTurno: string | null;
};

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

    return {
      fotos: this.agruparPorTipo(fotosConUrl),
      sesiones: this.agruparPorSesion(fotosConUrl),
      fotosHistoricasSinSesion: this.agruparPorTipo(
        fotosConUrl.filter((foto) => foto.turnoId == null),
      ),
    };
  }

  private agruparPorTipo(
    fotos: FotoProgresoResponseDto[],
  ): FotosPorTipoResponseDto[] {
    const grupos = new Map<string, FotoProgresoResponseDto[]>();

    fotos.forEach((foto) => {
      const existentes = grupos.get(foto.tipoFoto) ?? [];
      existentes.push(foto);
      grupos.set(foto.tipoFoto, existentes);
    });

    return Array.from(grupos.entries()).map(([tipoFoto, fotosTipo]) => ({
      tipoFoto: tipoFoto as FotoProgresoResponseDto['tipoFoto'],
      fotos: fotosTipo.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
    }));
  }

  private agruparPorSesion(
    fotos: FotoProgresoConSesionDto[],
  ): FotosSesionResponseDto[] {
    const grupos = new Map<number, FotoProgresoConSesionDto[]>();

    fotos
      .filter((foto) => foto.turnoId != null)
      .forEach((foto) => {
        const turnoId = foto.turnoId as number;
        const existentes = grupos.get(turnoId) ?? [];
        existentes.push(foto);
        grupos.set(turnoId, existentes);
      });

    return Array.from(grupos.entries()).map(([turnoId, fotosSesion]) => ({
      turnoId,
      fechaTurno: fotosSesion[0]?.fechaTurno ?? null,
      horaTurno: fotosSesion[0]?.horaTurno ?? null,
      fotos: this.agruparPorTipo(fotosSesion),
    }));
  }

  private toResponseDto(
    foto: FotoProgresoOrmEntity,
    urlFirmada: string,
  ): FotoProgresoConSesionDto {
    return {
      idFoto: foto.idFoto,
      socioId: foto.socio.idPersona ?? 0,
      turnoId: foto.turno?.idTurno ?? null,
      tipoFoto: foto.tipoFoto,
      objectKey: foto.objectKey,
      mimeType: foto.mimeType,
      notas: foto.notas,
      fecha: foto.fecha,
      urlFirmada,
      fechaTurno: this.formatearFechaTurno(foto.turno?.fechaTurno),
      horaTurno: foto.turno?.horaTurno ?? null,
    };
  }

  private formatearFechaTurno(fecha: Date | string | undefined): string | null {
    if (!fecha) {
      return null;
    }

    if (fecha instanceof Date) {
      return formatArgentinaDate(fecha);
    }

    return fecha.slice(0, 10);
  }
}
