import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

export class SubirFotoProgresoDto {
  socioId: number;
  tipoFoto: TipoFoto;
  notas?: string;
}

export class FotoProgresoResponseDto {
  idFoto: number;
  socioId: number;
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

export class GaleriaFotosResponseDto {
  fotos: FotosPorTipoResponseDto[];
}
