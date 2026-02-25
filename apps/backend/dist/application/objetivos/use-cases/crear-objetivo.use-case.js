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
exports.CrearObjetivoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const objetivo_entity_1 = require("../../../domain/entities/Objetivo/objetivo.entity");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const objetivo_repository_1 = require("../../../infrastructure/persistence/typeorm/repositories/objetivo.repository");
const typeorm_2 = require("typeorm");
let CrearObjetivoUseCase = class CrearObjetivoUseCase {
    objetivoRepository;
    socioRepository;
    constructor(objetivoRepository, socioRepository) {
        this.objetivoRepository = objetivoRepository;
        this.socioRepository = socioRepository;
    }
    async execute(payload) {
        const socio = await this.socioRepository.findOne({
            where: { idPersona: payload.socioId },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(payload.socioId));
        }
        const objetivo = await this.objetivoRepository.save({
            socio,
            tipoMetrica: payload.tipoMetrica,
            valorInicial: payload.valorInicial,
            valorActual: payload.valorInicial,
            valorObjetivo: payload.valorObjetivo,
            estado: 'ACTIVO',
            fechaInicio: new Date(),
            fechaObjetivo: payload.fechaObjetivo ?? null,
        });
        return this.toResponse(objetivo);
    }
    toResponse(objetivo) {
        const socioId = objetivo.socio.idPersona ?? 0;
        const entity = new objetivo_entity_1.ObjetivoEntity(objetivo.idObjetivo, socioId, objetivo.tipoMetrica, Number(objetivo.valorInicial), Number(objetivo.valorObjetivo), Number(objetivo.valorActual), objetivo.estado, objetivo.fechaInicio, objetivo.fechaObjetivo, objetivo.createdAt, objetivo.updatedAt);
        return {
            idObjetivo: objetivo.idObjetivo,
            socioId,
            tipoMetrica: objetivo.tipoMetrica,
            valorInicial: Number(objetivo.valorInicial),
            valorActual: Number(objetivo.valorActual),
            valorObjetivo: Number(objetivo.valorObjetivo),
            estado: objetivo.estado,
            fechaInicio: objetivo.fechaInicio,
            fechaObjetivo: objetivo.fechaObjetivo,
            createdAt: objetivo.createdAt,
            updatedAt: objetivo.updatedAt,
            progreso: entity.calcularProgreso(),
        };
    }
};
exports.CrearObjetivoUseCase = CrearObjetivoUseCase;
exports.CrearObjetivoUseCase = CrearObjetivoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [objetivo_repository_1.ObjetivoRepository,
        typeorm_2.Repository])
], CrearObjetivoUseCase);
//# sourceMappingURL=crear-objetivo.use-case.js.map