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
exports.SubirFotoProgresoUseCase = void 0;
const common_1 = require("@nestjs/common");
const object_storage_service_1 = require("../../../domain/services/object-storage.service");
const foto_progreso_repository_1 = require("../../../infrastructure/persistence/typeorm/repositories/foto-progreso.repository");
let SubirFotoProgresoUseCase = class SubirFotoProgresoUseCase {
    objectStorageService;
    fotoProgresoRepository;
    constructor(objectStorageService, fotoProgresoRepository) {
        this.objectStorageService = objectStorageService;
        this.fotoProgresoRepository = fotoProgresoRepository;
    }
    async execute(payload, fileBuffer, mimeType) {
        const fecha = new Date();
        const objectKey = this.buildObjectKey(payload.socioId, payload.tipoFoto, fecha);
        await this.objectStorageService.subirArchivo(objectKey, fileBuffer, mimeType);
        const fotoGuardada = await this.fotoProgresoRepository.save({
            socio: { idPersona: payload.socioId },
            tipoFoto: payload.tipoFoto,
            notas: payload.notas ?? null,
            objectKey,
            mimeType,
        });
        const urlFirmada = await this.objectStorageService.obtenerUrlFirmada(objectKey);
        return this.toResponseDto(fotoGuardada, urlFirmada);
    }
    buildObjectKey(socioId, tipoFoto, fecha) {
        const fechaISO = fecha.toISOString().slice(0, 10);
        return `progreso/${socioId}/${tipoFoto}/${fechaISO}_${fecha.getTime()}.jpg`;
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
exports.SubirFotoProgresoUseCase = SubirFotoProgresoUseCase;
exports.SubirFotoProgresoUseCase = SubirFotoProgresoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(object_storage_service_1.OBJECT_STORAGE_SERVICE)),
    __metadata("design:paramtypes", [Object, foto_progreso_repository_1.FotoProgresoRepository])
], SubirFotoProgresoUseCase);
//# sourceMappingURL=subir-foto-progreso.use-case.js.map