"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObtenerGaleriaFotosUseCase = void 0;
const common_1 = require("@nestjs/common");
const object_storage_service_1 = require("../../../domain/services/object-storage.service");
const foto_progreso_repository_1 = require("../../../infrastructure/persistence/typeorm/repositories/foto-progreso.repository");
let ObtenerGaleriaFotosUseCase = class ObtenerGaleriaFotosUseCase {
    objectStorageService;
    fotoProgresoRepository;
    constructor(objectStorageService, fotoProgresoRepository) {
        this.objectStorageService = objectStorageService;
        this.fotoProgresoRepository = fotoProgresoRepository;
    }
    async execute(socioId) {
        const fotos = await this.fotoProgresoRepository.findBySocioId(socioId);
        const fotosConUrl = await Promise.all(fotos.map(async (foto) => {
            const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(foto.objectKey, 3600);
            return this.toResponseDto(foto, urlFirmada);
        }));
        const grupos = new Map();
        fotosConUrl.forEach((foto) => {
            const key = foto.tipoFoto;
            const existentes = grupos.get(key) ?? [];
            existentes.push(foto);
            grupos.set(key, existentes);
        });
        const fotosAgrupadas = Array.from(grupos.entries()).map(([tipoFoto, fotosTipo]) => ({
            tipoFoto: tipoFoto,
            fotos: fotosTipo.sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
        }));
        return { fotos: fotosAgrupadas };
    }
    toResponseDto(foto, urlFirmada) {
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
};
exports.ObtenerGaleriaFotosUseCase = ObtenerGaleriaFotosUseCase;
exports.ObtenerGaleriaFotosUseCase = ObtenerGaleriaFotosUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(object_storage_service_1.OBJECT_STORAGE_SERVICE)),
    __metadata("design:paramtypes", [Object, foto_progreso_repository_1.FotoProgresoRepository])
], ObtenerGaleriaFotosUseCase);
//# sourceMappingURL=obtener-galeria-fotos.use-case.js.map