"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GaleriaFotosResponseDto = exports.FotosPorTipoResponseDto = exports.FotoProgresoResponseDto = exports.SubirFotoProgresoDto = void 0;
class SubirFotoProgresoDto {
    socioId;
    tipoFoto;
    notas;
}
exports.SubirFotoProgresoDto = SubirFotoProgresoDto;
class FotoProgresoResponseDto {
    idFoto;
    socioId;
    tipoFoto;
    objectKey;
    mimeType;
    notas;
    fecha;
    urlFirmada;
}
exports.FotoProgresoResponseDto = FotoProgresoResponseDto;
class FotosPorTipoResponseDto {
    tipoFoto;
    fotos;
}
exports.FotosPorTipoResponseDto = FotosPorTipoResponseDto;
class GaleriaFotosResponseDto {
    fotos;
}
exports.GaleriaFotosResponseDto = GaleriaFotosResponseDto;
//# sourceMappingURL=subir-foto.dto.js.map