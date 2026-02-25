import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
export declare class SubirFotoProgresoDto {
    socioId: number;
    tipoFoto: TipoFoto;
    notas?: string;
}
export declare class FotoProgresoResponseDto {
    idFoto: number;
    socioId: number;
    tipoFoto: TipoFoto;
    objectKey: string;
    mimeType: string;
    notas: string | null;
    fecha: Date;
    urlFirmada: string;
}
export declare class FotosPorTipoResponseDto {
    tipoFoto: TipoFoto;
    fotos: FotoProgresoResponseDto[];
}
export declare class GaleriaFotosResponseDto {
    fotos: FotosPorTipoResponseDto[];
}
