import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

export class SubirFotoProgresoDto {
  socioId: number;
  tipoFoto: TipoFoto;
  notas?: string;
  turnoId?: number;
}

export class FotoProgresoResponseDto {
  idFoto: number;
  socioId: number;
  turnoId: number | null;
  tipoFoto: TipoFoto;
  objectKey: string;
  mimeType: string;
  notas: string | null;
  fecha: Date;
  urlFirmada: string;
}

export class FotosPorTipoResponseDto {
  tipoFoto: TipoFoto;
  fotos: FotoProgresoResponseDto[];
}

export class FotosSesionResponseDto {
  turnoId: number | null;
  fechaTurno: string | null;
  horaTurno: string | null;
  fotos: FotosPorTipoResponseDto[];
}

export class GaleriaFotosResponseDto {
  fotos: FotosPorTipoResponseDto[];
  sesiones: FotosSesionResponseDto[];
  fotosHistoricasSinSesion: FotosPorTipoResponseDto[];
}
