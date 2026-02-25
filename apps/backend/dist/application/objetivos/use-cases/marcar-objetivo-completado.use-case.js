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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarcarObjetivoCompletadoUseCase = void 0;
const common_1 = require("@nestjs/common");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const objetivo_entity_1 = require("../../../domain/entities/Objetivo/objetivo.entity");
const objetivo_repository_1 = require("../../../infrastructure/persistence/typeorm/repositories/objetivo.repository");
let MarcarObjetivoCompletadoUseCase = class MarcarObjetivoCompletadoUseCase {
    objetivoRepository;
    constructor(objetivoRepository) {
        this.objetivoRepository = objetivoRepository;
    }
    async execute(objetivoId, nuevoEstado) {
        const objetivo = await this.objetivoRepository.findById(objetivoId);
        if (!objetivo) {
            throw new custom_exceptions_1.NotFoundError('Objetivo', String(objetivoId));
        }
        if (objetivo.estado !== 'ACTIVO') {
            throw new custom_exceptions_1.BadRequestError('Solo se pueden marcar objetivos en estado ACTIVO.');
        }
        const actualizado = await this.objetivoRepository.save({
            ...objetivo,
            estado: nuevoEstado,
            updatedAt: new Date(),
        });
        return this.toResponse(actualizado);
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
exports.MarcarObjetivoCompletadoUseCase = MarcarObjetivoCompletadoUseCase;
exports.MarcarObjetivoCompletadoUseCase = MarcarObjetivoCompletadoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [objetivo_repository_1.ObjetivoRepository])
], MarcarObjetivoCompletadoUseCase);
//# sourceMappingURL=marcar-objetivo-completado.use-case.js.map